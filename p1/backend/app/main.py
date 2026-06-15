import os
import uuid
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from .database import init_db, SessionLocal, Farm, Device
from .routes import router

app = FastAPI(
    title="AgriGuard API Gateway",
    description="Production-Grade Geo-Aware AIoT Agri-Health Backend Service",
    version="2.0.0"
)

# Setup Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Secure CORS Policy using environment variables
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Secure Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

app.include_router(router)

@app.get("/")
def read_root():
    return {
        "service": "AgriGuard API Gateway",
        "status": "HEALTHY",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

# Seed DB with initial farm and device coordinates matching data.js
def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(Farm).count() == 0:
            print("Seeding initial farm nodes to database...")
            
            # Map of farm nodes to insert
            seed_farms = [
                {"id": "FN-001", "name": "Green Valley Organic Farm", "fpo_id": "FPO-SYD", "soil": "Clay Loam", "zone": "Zone A", "elev": 45.0, "lat": 17.3850, "lng": 73.9500, "coast": 18.5, "dev": "ESP32-A1F3"},
                {"id": "FN-002", "name": "Sunrise Spice Plantation", "fpo_id": "FPO-SYD", "soil": "Alluvial", "zone": "Zone B", "elev": 120.0, "lat": 17.4200, "lng": 73.8800, "coast": 25.2, "dev": "ESP32-B2G4"},
                {"id": "FN-003", "name": "Golden Harvest Paddy Field", "fpo_id": "FPO-KKN", "soil": "Clayey", "zone": "Zone A", "elev": 12.0, "lat": 17.3500, "lng": 74.0200, "coast": 8.3, "dev": "JN-001"},
                {"id": "FN-004", "name": "Misty Hills Tea Estate", "fpo_id": "FPO-KKN", "soil": "Laterite", "zone": "Zone C", "elev": 580.0, "lat": 17.4800, "lng": 73.7500, "coast": 42.0, "dev": "ESP32-D4J6"},
                {"id": "FN-005", "name": "Coconut Grove Coastal Farm", "fpo_id": "FPO-CST", "soil": "Sandy", "zone": "Zone B", "elev": 5.0, "lat": 17.3100, "lng": 73.9900, "coast": 3.2, "dev": "ESP32-E5K7"},
                {"id": "FN-006", "name": "Mango Valley Orchard", "fpo_id": "FPO-CST", "soil": "Loamy", "zone": "Zone D", "elev": 75.0, "lat": 17.2700, "lng": 74.0800, "coast": 15.8, "dev": "ESP32-F6L8"},
                {"id": "FN-007", "name": "Cashew Coast Plantation", "fpo_id": "FPO-CST", "soil": "Gravelly", "zone": "Zone A", "elev": 18.0, "lat": 17.2400, "lng": 73.9600, "coast": 5.5, "dev": "ESP32-H8N0"}
            ]

            for item in seed_farms:
                # Add Farm
                farm = Farm(
                    id=item["id"],
                    name=item["name"],
                    fpo_id=item["fpo_id"],
                    soil_type=item["soil"],
                    irrigation_zone=item["zone"],
                    elevation_m=item["elev"],
                    latitude=item["lat"],
                    longitude=item["lng"],
                    coast_distance_km=item["coast"]
                )
                db.add(farm)
                
                # Add Device
                device = Device(
                    id=item["dev"],
                    farm_id=item["id"],
                    hardware_version="ESP32-S3-WROOM-1" if "ESP32" in item["dev"] else "Jetson Nano",
                    firmware_version="2.4.0",
                    status="ACTIVE"
                )
                db.add(device)
            
            db.commit()
            print("Database seeding completed.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

# Startup Event
@app.on_event("startup")
def startup_event():
    init_db()
    seed_initial_data()
