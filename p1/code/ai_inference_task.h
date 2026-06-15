#ifndef AI_INFERENCE_TASK_H
#define AI_INFERENCE_TASK_H

#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Multimodal sensor structure passed from perception task
typedef struct {
    uint8_t image_data[224 * 224 * 3]; // 150KB RGB888 buffer (allocated in PSRAM)
    float temp;                         // SHT31 temperature (°C)
    float rh;                           // SHT31 relative humidity (%)
    float soil_ph;                      // Analog pH sensor value
    int crop_id;                        // Encoded crop index
    float coast_dist_norm;              // Normalized distance to coast (0.0 to 1.0)
    float co2;                          // MH-Z19B CO2 ppm
} MultimodalSensorData_t;

// Inference output structure dispatched to control / cloud sync tasks
typedef struct {
    int grade;              // 0: A, 1: B, 2: C, 3: REJECT
    float confidence;       // Confidence score (0.0 to 1.0)
    float spoilage_risk;    // Spoilage risk probability (0.0 to 1.0)
} InferenceResult_t;

// FreeRTOS Queues declared globally (to be defined in main application file)
extern QueueHandle_t xSensorDataQueue;
extern QueueHandle_t xInferenceResultQueue;

// Task entry point and startup helper
void ai_inference_task(void *pvParameters);
void start_ai_inference_task(void);

#ifdef __cplusplus
}
#endif

#endif // AI_INFERENCE_TASK_H
