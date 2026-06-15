#include "ai_inference_task.h"

#include "esp_log.h"
#include "esp_timer.h"
#include "esp_heap_caps.h"

// TensorFlow Lite Micro Headers
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/system_setup.h"
#include "tensorflow/lite/schema/schema_generated.h"

// Hypothetical header generated via xxd containing the compiled .tflite model
// Represents our Fused MobileNetV2 + MLP Quantized INT8 model
#include "multimodal_model_data.h"

static const char *TAG = "EDGE_AI";

// Allocate Tensor Arena in PSRAM (Required for ESP32-S3 with 4MB+ model memory)
constexpr int kTensorArenaSize = 3 * 1024 * 1024; // 3MB Arena
EXT_RAM_BSS_ATTR static uint8_t tensor_arena[kTensorArenaSize];

// Utility functions for Asymmetric INT8 Quantization
static int8_t quantize_float(float x, float scale, int zero_point) {
    int32_t quantized = (int32_t)(x / scale) + zero_point;
    if (quantized < -128) return -128;
    if (quantized > 127) return 127;
    return (int8_t)quantized;
}

static float dequantize_int8(int8_t x, float scale, int zero_point) {
    return ((float)x - zero_point) * scale;
}

void ai_inference_task(void *pvParameters) {
    ESP_LOGI(TAG, "Initializing TensorFlow Lite Micro...");
    tflite::InitializeTarget();

    // 1. Map the model
    const tflite::Model* model = tflite::GetModel(g_multimodal_model_data);
    if (model->version() != TFLITE_SCHEMA_VERSION) {
        ESP_LOGE(TAG, "Schema mismatch! Expected %d, got %ld", TFLITE_SCHEMA_VERSION, model->version());
        vTaskDelete(NULL);
    }

    // 2. Pull in required operators for CNN and MLP Fusion
    // Using MutableOpResolver saves memory compared to AllOpsResolver
    tflite::MicroMutableOpResolver<10> resolver;
    resolver.AddConv2D();
    resolver.AddDepthwiseConv2D();
    resolver.AddFullyConnected();
    resolver.AddSoftmax();       // Multi-class Grade head
    resolver.AddLogistic();      // Spoilage Risk Sigmoid head
    resolver.AddConcatenation(); // Fusion node combining features
    resolver.AddReshape();
    resolver.AddAdd();
    resolver.AddMaxPool2D();
    resolver.AddAveragePool2D();

    // 3. Build the interpreter & allocate tensors
    tflite::MicroInterpreter interpreter(model, resolver, tensor_arena, kTensorArenaSize);
    TfLiteStatus allocate_status = interpreter.AllocateTensors();
    if (allocate_status != kTfLiteOk) {
        ESP_LOGE(TAG, "AllocateTensors() failed! Increase kTensorArenaSize.");
        vTaskDelete(NULL);
    }

    ESP_LOGI(TAG, "Arena used: %zu bytes", interpreter.arena_used_bytes());

    // 4. Retrieve input/output tensor pointers
    TfLiteTensor* input_img = interpreter.input(0); // Vision CNN branch
    TfLiteTensor* input_env = interpreter.input(1); // Telemetry MLP branch
    TfLiteTensor* output_grade = interpreter.output(0);
    TfLiteTensor* output_risk  = interpreter.output(1);

    MultimodalSensorData_t sensor_data;
    InferenceResult_t result;

    // 5. Infinite FreeRTOS Inference Loop
    while (true) {
        // Block until the perception spooler has new data aligned and ready
        if (xQueueReceive(xSensorDataQueue, &sensor_data, portMAX_DELAY) == pdTRUE) {
            int64_t start_time = esp_timer_get_time();

            // --- POPULATE VISION INPUT ---
            // TFLite quantization parameters for the image input layer
            float img_scale = input_img->params.scale;
            int img_zp = input_img->params.zero_point;
            
            // Map RGB888 pixel values to the INT8 model space
            for (int i = 0; i < 224 * 224 * 3; i++) {
                float pixel_val = (float)sensor_data.image_data[i] / 255.0f; // Normalize 0-1
                input_img->data.int8[i] = quantize_float(pixel_val, img_scale, img_zp);
            }

            // --- POPULATE TELEMETRY INPUT ---
            float env_scale = input_env->params.scale;
            int env_zp = input_env->params.zero_point;
            
            // Construct the 6-d vector required by the edge fusion engine
            input_env->data.int8[0] = quantize_float(sensor_data.temp, env_scale, env_zp);
            input_env->data.int8[1] = quantize_float(sensor_data.rh, env_scale, env_zp);
            input_env->data.int8[2] = quantize_float(sensor_data.soil_ph, env_scale, env_zp);
            input_env->data.int8[3] = quantize_float((float)sensor_data.crop_id, env_scale, env_zp);
            input_env->data.int8[4] = quantize_float(sensor_data.coast_dist_norm, env_scale, env_zp);
            input_env->data.int8[5] = quantize_float(sensor_data.co2, env_scale, env_zp);

            // --- EXECUTE FUSED INFERENCE ---
            if (interpreter.Invoke() != kTfLiteOk) {
                ESP_LOGE(TAG, "Invoke() failed on inference.");
                continue;
            }

            // --- PARSE MULTI-HEAD OUTPUTS ---
            // 1. Grade Prediction (Softmax)
            int best_grade = 0;
            float max_conf = 0.0f;
            for (int i = 0; i < 4; i++) {
                float conf = dequantize_int8(output_grade->data.int8[i], 
                                             output_grade->params.scale, 
                                             output_grade->params.zero_point);
                if (conf > max_conf) {
                    max_conf = conf;
                    best_grade = i;
                }
            }

            // 2. Spoilage Risk (Logistic / Sigmoid)
            float spoilage_risk = dequantize_int8(output_risk->data.int8[0], 
                                                  output_risk->params.scale, 
                                                  output_risk->params.zero_point);

            // Populate and dispatch result to the PID / Spooler
            result.grade = best_grade;
            result.confidence = max_conf;
            result.spoilage_risk = spoilage_risk;

            int64_t end_time = esp_timer_get_time();
            ESP_LOGI(TAG, "Inference OK | Latency: %lld ms | Grade: %d (%.1f%%) | Risk: %.2f", 
                     (end_time - start_time) / 1000, best_grade, max_conf * 100.0f, spoilage_risk);

            // Non-blocking send (timeout 0) to avoid locking Core 1
            xQueueSend(xInferenceResultQueue, &result, 0);
        }
    }
}

extern "C" void start_ai_inference_task(void) {
    // Pin inference to Core 1 (App Core) to prevent starving the WiFi/MQTT stack on Core 0
    xTaskCreatePinnedToCore(
        ai_inference_task,       // Function to implement the task
        "AI_Task",               // Name of the task
        16384,                   // Stack size in words (16KB)
        NULL,                    // Task input parameter
        5,                       // Priority of the task (High for deterministic PID)
        NULL,                    // Task handle
        1                        // Core where the task should run
    );
}
