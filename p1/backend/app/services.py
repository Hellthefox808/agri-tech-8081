import hashlib
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from .database import Farm, Device, Batch, TelemetryLog
from . import schemas

def compute_batch_hash(payload: schemas.BatchOnboardPayload, prev_hash: str) -> str:
    content = (
        f"{payload.device_id}-{payload.crop_type}-{payload.cultivar}-"
        f"{payload.quantity_kg}-{payload.harvest_date}-{prev_hash}"
    )
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

def onboard_batch_service(payload: schemas.BatchOnboardPayload, db: Session):
    device = db.query(Device).filter(Device.id == payload.device_id).first()
    if not device:
        device = Device(
            id=payload.device_id,
            farm_id=None,
            hardware_version="ESP32-S3-WROOM-1",
            firmware_version="2.4.0",
            status="ACTIVE"
        )
        db.add(device)
        db.commit()
        db.refresh(device)

    farm_id = device.farm_id
    if not farm_id:
        farm = db.query(Farm).first()
        if not farm:
            farm = Farm(
                id=str(uuid.uuid4()),
                name="Green Valley Organic Farm",
                fpo_id=str(uuid.uuid4()),
                soil_type="Clay Loam",
                irrigation_zone="Zone A",
                elevation_m=45.0,
                latitude=payload.coordinates.lat,
                longitude=payload.coordinates.lng,
                coast_distance_km=18.5
            )
            db.add(farm)
            db.commit()
            db.refresh(farm)
        farm_id = farm.id

    trace_hash = compute_batch_hash(payload, payload.prev_batch_hash)

    batch_id = str(uuid.uuid4())
    db_batch = Batch(
        id=batch_id,
        device_id=payload.device_id,
        farm_id=farm_id,
        crop_type=payload.crop_type,
        cultivar=payload.cultivar,
        harvest_stage=payload.harvest_stage,
        sowing_date=payload.sowing_date,
        harvest_date=payload.harvest_date,
        quantity_kg=payload.quantity_kg,
        grade_distribution=json.dumps(payload.grade_distribution.model_dump()),
        spoilage_risk_score=payload.spoilage_risk_score,
        trace_hash=trace_hash,
        prev_batch_hash=payload.prev_batch_hash,
        latitude=payload.coordinates.lat,
        longitude=payload.coordinates.lng
    )
    
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)

    return schemas.BatchResponse(
        batch_id=batch_id,
        trace_hash=trace_hash,
        created_at=datetime.utcnow(),
        status="RECORDED"
    )

def reconcile_telemetry_service(device_id: str, payload: schemas.ReconcilePayload, db: Session):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not registered")

    if not payload.records:
        return schemas.ReconcileResponse(
            device_id=device_id,
            records_imported=0,
            status="SUCCESS"
        )

    # Bulk query existing timestamps to avoid N+1 queries
    incoming_timestamps = [rec.recorded_at for rec in payload.records]
    existing_logs = db.query(TelemetryLog.recorded_at).filter(
        TelemetryLog.device_id == device_id,
        TelemetryLog.recorded_at.in_(incoming_timestamps)
    ).all()
    existing_timestamps = {log[0] for log in existing_logs}

    new_logs = []
    for rec in payload.records:
        if rec.recorded_at not in existing_timestamps:
            new_logs.append(TelemetryLog(
                device_id=device_id,
                recorded_at=rec.recorded_at,
                temperature=rec.temperature,
                humidity=rec.humidity,
                co2_ppm=rec.co2_ppm,
                soil_moisture=rec.soil_moisture,
                soil_ph=rec.soil_ph,
                soil_ec=rec.soil_ec
            ))

    records_imported = len(new_logs)
    if new_logs:
        db.add_all(new_logs)
            
    device.last_ping = datetime.utcnow()
    db.commit()

    return schemas.ReconcileResponse(
        device_id=device_id,
        records_imported=records_imported,
        status="SUCCESS"
    )

def get_spatial_analytics_service(fpo_id: str, db: Session):
    from sqlalchemy.sql import func
    
    query = db.query(Farm, func.avg(Batch.spoilage_risk_score).label("avg_risk")) \
              .outerjoin(Batch, Farm.id == Batch.farm_id)
              
    if fpo_id:
        query = query.filter(Farm.fpo_id == fpo_id)
        
    query = query.group_by(Farm.id)
    results = query.all()
    
    features = []
    for farm, avg_risk in results:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [farm.longitude, farm.latitude]
            },
            "properties": {
                "farm_id": farm.id,
                "farm_name": farm.name,
                "soil_type": farm.soil_type,
                "coast_distance_km": farm.coast_distance_km,
                "active_spoilage_risk": round(avg_risk or 0.0, 2)
            }
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }
