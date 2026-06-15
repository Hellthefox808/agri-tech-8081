#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_log.h"
#include "ai_inference_task.h"

static const char *TAG = "MAIN_APP";

// Define the global queues declared in the header
QueueHandle_t xSensorDataQueue = NULL;
QueueHandle_t xInferenceResultQueue = NULL;

// Mock task to simulate acquiring raw sensor readings & images (perception layer)
void mock_perception_task(void *pvParameters) {
    ESP_LOGI(TAG, "Starting Mock Perception Task...");
    
    MultimodalSensorData_t sensor_packet;
    int mock_crop_counter = 0;

    while (true) {
        // 1. Mock sensor data acquisition
        sensor_packet.temp = 24.3f + ((float)rand() / RAND_MAX - 0.5f);
        sensor_packet.rh = 63.8f + ((float)rand() / RAND_MAX - 0.5f) * 2.0f;
        sensor_packet.soil_ph = 6.4f + ((float)rand() / RAND_MAX - 0.5f) * 0.2f;
        sensor_packet.crop_id = mock_crop_counter % 3; // 0, 1, 2
        sensor_packet.coast_dist_norm = 0.185f; // Normalized 18.5km
        sensor_packet.co2 = 450.0f + (rand() % 50);

        // 2. Mock image capture (all pixels set to green/yellow/red tones)
        for (int i = 0; i < 224 * 224 * 3; i++) {
            sensor_packet.image_data[i] = (uint8_t)(rand() % 256);
        }

        ESP_LOGI(TAG, "Perception: Telemetry acquired. Sending to Queue (Temp: %.1f, RH: %.1f)...", 
                 sensor_packet.temp, sensor_packet.rh);

        // 3. Send data to Core 1 AI Inference loop (non-blocking, wait 100ms max)
        if (xQueueSend(xSensorDataQueue, &sensor_packet, pdMS_TO_TICKS(100)) != pdTRUE) {
            ESP_LOGW(TAG, "Sensor queue full! Dropping packet.");
        }

        mock_crop_counter++;
        vTaskDelay(pdMS_TO_TICKS(5000)); // Sample every 5 seconds
    }
}

// Mock task to simulate actuator control and sync (control layer)
void mock_control_task(void *pvParameters) {
    ESP_LOGI(TAG, "Starting Mock Control Task...");
    
    InferenceResult_t result;

    while (true) {
        // Block until Core 1 AI Inference task returns a graded output
        if (xQueueReceive(xInferenceResultQueue, &result, portMAX_DELAY) == pdTRUE) {
            ESP_LOGI(TAG, "Control Layer received AI Grade: %d (Confidence: %.1f%%) | Spoilage Risk: %.2f",
                     result.grade, result.confidence * 100.0f, result.spoilage_risk);

            // Execute deterministic FSM or actuation adjustments
            if (result.spoilage_risk > 0.75f) {
                ESP_LOGE(TAG, "CRITICAL: Activating emergency exhaust fans and coolers!");
            } else if (result.grade == 3) {
                ESP_LOGW(TAG, "REJECT Grade: Actuating sorter gate to REJECT lane.");
            } else {
                ESP_LOGI(TAG, "Optimal conditions. Actuators in STABLE mode.");
            }
        }
    }
}

extern "C" void app_main(void) {
    ESP_LOGI(TAG, "Initializing Agri-Guardian Application...");

    // Create FreeRTOS Queues
    // Queue size = 2 to buffer data without wasting heap memory
    xSensorDataQueue = xQueueCreate(2, sizeof(MultimodalSensorData_t));
    xInferenceResultQueue = xQueueCreate(2, sizeof(InferenceResult_t));

    if (xSensorDataQueue == NULL || xInferenceResultQueue == NULL) {
        ESP_LOGE(TAG, "Failed to create FreeRTOS Queues!");
        return;
    }

    // Start tasks
    // 1. Start AI Inference Task pinned to Core 1
    start_ai_inference_task();

    // 2. Start Perception Task on Core 1 (same core as AI, lower priority)
    xTaskCreatePinnedToCore(
        mock_perception_task,
        "PerceptionTask",
        8192,
        NULL,
        4,
        NULL,
        1
    );

    // 3. Start Control Task on Core 0 (pinned with MQTT comms)
    xTaskCreatePinnedToCore(
        mock_control_task,
        "ControlTask",
        4096,
        NULL,
        6,
        NULL,
        0
    );

    ESP_LOGI(TAG, "All tasks spawned successfully.");
}
