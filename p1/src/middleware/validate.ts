export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

// Helper to check if an object has unknown fields
function hasUnknownFields(obj: any, allowedKeys: string[]): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const keys = Object.keys(obj);
  return keys.some(key => !allowedKeys.includes(key));
}

// 1. Batch Onboard Validation
export function validateBatchOnboard(payload: any): ValidationResult<any> {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: "Invalid payload format. Expected JSON object." };
  }

  const allowedRootKeys = [
    'device_id', 'crop_type', 'cultivar', 'harvest_stage', 'quantity_kg',
    'sowing_date', 'harvest_date', 'grade_distribution', 'spoilage_risk_score',
    'prev_batch_hash', 'coordinates'
  ];

  if (hasUnknownFields(payload, allowedRootKeys)) {
    return { isValid: false, error: "Payload contains unknown/disallowed fields." };
  }

  // Required root fields
  const requiredFields = ['device_id', 'crop_type', 'quantity_kg', 'harvest_date', 'prev_batch_hash'];
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }

  // Type & Length constraints
  if (typeof payload.device_id !== 'string' || payload.device_id.length > 50) {
    return { isValid: false, error: "device_id must be a string (max 50 chars)." };
  }
  if (typeof payload.crop_type !== 'string' || payload.crop_type.length > 100) {
    return { isValid: false, error: "crop_type must be a string (max 100 chars)." };
  }
  if (payload.cultivar && (typeof payload.cultivar !== 'string' || payload.cultivar.length > 100)) {
    return { isValid: false, error: "cultivar must be a string (max 100 chars)." };
  }
  if (payload.harvest_stage && (typeof payload.harvest_stage !== 'string' || payload.harvest_stage.length > 50)) {
    return { isValid: false, error: "harvest_stage must be a string (max 50 chars)." };
  }
  if (typeof payload.quantity_kg !== 'number' || payload.quantity_kg <= 0) {
    return { isValid: false, error: "quantity_kg must be a positive number." };
  }
  if (typeof payload.prev_batch_hash !== 'string' || payload.prev_batch_hash.length > 64) {
    return { isValid: false, error: "prev_batch_hash must be a string (max 64 chars)." };
  }
  if (payload.spoilage_risk_score !== undefined && (typeof payload.spoilage_risk_score !== 'number' || payload.spoilage_risk_score < 0 || payload.spoilage_risk_score > 100)) {
    return { isValid: false, error: "spoilage_risk_score must be a number between 0 and 100." };
  }

  // Validate dates
  if (isNaN(Date.parse(payload.harvest_date))) {
    return { isValid: false, error: "harvest_date is not a valid date format." };
  }
  if (payload.sowing_date && isNaN(Date.parse(payload.sowing_date))) {
    return { isValid: false, error: "sowing_date is not a valid date format." };
  }

  // Validate coordinates
  if (payload.coordinates) {
    if (typeof payload.coordinates !== 'object') {
      return { isValid: false, error: "coordinates must be an object containing lat and lng." };
    }
    if (hasUnknownFields(payload.coordinates, ['lat', 'lng'])) {
      return { isValid: false, error: "coordinates object contains unknown fields." };
    }
    const { lat, lng } = payload.coordinates;
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      return { isValid: false, error: "coordinates.lat must be a number between -90 and 90." };
    }
    if (typeof lng !== 'number' || lng < -180 || lng > 180) {
      return { isValid: false, error: "coordinates.lng must be a number between -180 and 180." };
    }
  }

  // Validate grade_distribution
  if (payload.grade_distribution) {
    if (typeof payload.grade_distribution !== 'object') {
      return { isValid: false, error: "grade_distribution must be an object containing A_pct, B_pct, C_pct, R_pct." };
    }
    const gradeKeys = ['A_pct', 'B_pct', 'C_pct', 'R_pct'];
    if (hasUnknownFields(payload.grade_distribution, gradeKeys)) {
      return { isValid: false, error: "grade_distribution contains unknown fields." };
    }
    for (const key of gradeKeys) {
      const val = payload.grade_distribution[key];
      if (val !== undefined && (typeof val !== 'number' || val < 0 || val > 100)) {
        return { isValid: false, error: `grade_distribution.${key} must be a percentage number between 0 and 100.` };
      }
    }
  }

  return { isValid: true, data: payload };
}

// 2. Reconcile Payload Validation
export function validateReconcile(payload: any): ValidationResult<any> {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: "Invalid payload format. Expected JSON object." };
  }

  if (hasUnknownFields(payload, ['device_id', 'records'])) {
    return { isValid: false, error: "Payload contains unknown/disallowed fields." };
  }

  if (payload.records === undefined || !Array.isArray(payload.records)) {
    return { isValid: false, error: "records must be a list of telemetry logs." };
  }

  if (payload.records.length > 1000) {
    return { isValid: false, error: "LDoS Protection: records list exceeds maximum length of 1000 items." };
  }

  const recordKeys = [
    'recorded_at', 'timestamp', 'temperature', 'temperature_c',
    'humidity', 'humidity_rh', 'co2_ppm', 'soil_moisture',
    'soil_moisture_pct', 'soil_ph', 'soil_ec'
  ];

  for (let idx = 0; idx < payload.records.length; idx++) {
    const rec = payload.records[idx];
    if (!rec || typeof rec !== 'object') {
      return { isValid: false, error: `records[${idx}] is not an object.` };
    }

    if (hasUnknownFields(rec, recordKeys)) {
      return { isValid: false, error: `records[${idx}] contains unknown fields.` };
    }

    // Required properties validation
    const dateStr = rec.recorded_at || rec.timestamp;
    if (!dateStr || isNaN(Date.parse(dateStr))) {
      return { isValid: false, error: `records[${idx}] has an missing or invalid timestamp.` };
    }

    // Number type checks
    const numberFields = [
      { name: 'temperature', val: rec.temperature ?? rec.temperature_c, min: -50, max: 100 },
      { name: 'humidity', val: rec.humidity ?? rec.humidity_rh, min: 0, max: 100 },
      { name: 'co2_ppm', val: rec.co2_ppm, min: 0, max: 10000 },
      { name: 'soil_moisture', val: rec.soil_moisture ?? rec.soil_moisture_pct, min: 0, max: 100 },
      { name: 'soil_ph', val: rec.soil_ph, min: 0, max: 14 },
      { name: 'soil_ec', val: rec.soil_ec, min: 0, max: 5000 }
    ];

    for (const f of numberFields) {
      if (f.val === undefined || f.val === null) {
        return { isValid: false, error: `records[${idx}] is missing field: ${f.name}` };
      }
      if (typeof f.val !== 'number' || isNaN(f.val)) {
        return { isValid: false, error: `records[${idx}].${f.name} must be a valid number.` };
      }
      if (f.val < f.min || f.val > f.max) {
        return { isValid: false, error: `records[${idx}].${f.name} value out of safe boundaries (${f.min} to ${f.max}).` };
      }
    }
  }

  return { isValid: true, data: payload };
}

// 3. Farm Analytics Parameter Validation
export function validateSpatialAnalyticsQuery(searchParams: URLSearchParams): ValidationResult<any> {
  const fpoId = searchParams.get('fpo_id');
  if (fpoId && (typeof fpoId !== 'string' || fpoId.length > 50)) {
    return { isValid: false, error: "Invalid fpo_id value." };
  }
  return { isValid: true, data: { fpo_id: fpoId } };
}
