from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Dict, Optional

class CoordinatesModel(BaseModel):
    model_config = {"extra": "forbid"}
    lat: float = Field(..., description="Latitude coordinate", ge=-90.0, le=90.0)
    lng: float = Field(..., description="Longitude coordinate", ge=-180.0, le=180.0)

class GPSModel(BaseModel):
    model_config = {"extra": "forbid"}
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    alt: float
    locked: bool

class SensorsModel(BaseModel):
    model_config = {"extra": "forbid"}
    temp: float
    rh: float
    co2: int
    soil_moisture: float
    soil_ph: float
    soil_ec: float

class TelemetryPayload(BaseModel):
    model_config = {"extra": "forbid"}
    device_id: str = Field(..., max_length=50)
    timestamp: datetime
    battery_v: float = Field(..., ge=0)
    gps: GPSModel
    sensors: SensorsModel
    fsm_state: str = Field(..., max_length=50)
    network_quality: int = Field(..., ge=0, le=100)

class GradeDistributionModel(BaseModel):
    model_config = {"extra": "forbid"}
    A_pct: float = Field(..., ge=0.0, le=100.0)
    B_pct: float = Field(..., ge=0.0, le=100.0)
    C_pct: float = Field(..., ge=0.0, le=100.0)
    R_pct: float = Field(..., ge=0.0, le=100.0)

class BatchOnboardPayload(BaseModel):
    model_config = {"extra": "forbid"}
    device_id: str = Field(..., max_length=50)
    crop_type: str = Field(..., max_length=100)
    cultivar: str = Field(..., max_length=100)
    harvest_stage: str = Field(..., max_length=50)
    quantity_kg: float = Field(..., gt=0.0)
    sowing_date: date
    harvest_date: date
    grade_distribution: GradeDistributionModel
    spoilage_risk_score: float = Field(..., ge=0.0, le=100.0)
    prev_batch_hash: str = Field(..., max_length=64)
    coordinates: CoordinatesModel

class BatchResponse(BaseModel):
    batch_id: str
    trace_hash: str
    created_at: datetime
    status: str

class TelemetryRecord(BaseModel):
    model_config = {"extra": "forbid"}
    recorded_at: datetime
    temperature: float
    humidity: float
    co2_ppm: int
    soil_moisture: float
    soil_ph: float
    soil_ec: float

class ReconcilePayload(BaseModel):
    model_config = {"extra": "forbid"}
    device_id: str = Field(..., max_length=50)
    records: List[TelemetryRecord] = Field(..., max_length=1000)

class ReconcileResponse(BaseModel):
    device_id: str
    records_imported: int
    status: str
