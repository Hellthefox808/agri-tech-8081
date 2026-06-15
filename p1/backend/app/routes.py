from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from .database import get_db
from . import schemas
from .services import onboard_batch_service, reconcile_telemetry_service, get_spatial_analytics_service

router = APIRouter(prefix="/api/v1")
limiter = Limiter(key_func=get_remote_address)

@router.post("/batches", response_model=schemas.BatchResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def onboard_batch(request: Request, payload: schemas.BatchOnboardPayload, db: Session = Depends(get_db)):
    """Endpoint to onboard a new produce batch with rate limiting."""
    return onboard_batch_service(payload, db)

@router.post("/devices/{device_id}/reconcile", response_model=schemas.ReconcileResponse)
@limiter.limit("60/minute")
def reconcile_telemetry(request: Request, device_id: str, payload: schemas.ReconcilePayload, db: Session = Depends(get_db)):
    """Endpoint to reconcile offline telemetry logs from edge devices."""
    return reconcile_telemetry_service(device_id, payload, db)

@router.get("/farms/spatial-analytics")
@limiter.limit("30/minute")
def get_spatial_analytics(request: Request, fpo_id: str = None, db: Session = Depends(get_db)):
    """Fetch spatial analytics for farms, optionally filtered by FPO."""
    return get_spatial_analytics_service(fpo_id, db)
