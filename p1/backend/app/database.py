import os
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Date, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agri_guardian.db")

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    fpo_id = Column(String(36), nullable=False)
    soil_type = Column(String(100), nullable=False)
    irrigation_zone = Column(String(100), nullable=False)
    elevation_m = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    coast_distance_km = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    devices = relationship("Device", back_populates="farm")
    batches = relationship("Batch", back_populates="farm")

class Device(Base):
    __tablename__ = "devices"

    id = Column(String(50), primary_key=True, index=True)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="SET NULL"), nullable=True)
    hardware_version = Column(String(50), nullable=False)
    firmware_version = Column(String(20), nullable=False)
    status = Column(String(20), default="ACTIVE")
    last_ping = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="devices")
    telemetry_logs = relationship("TelemetryLog", back_populates="device")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(String(36), primary_key=True, index=True)
    device_id = Column(String(50), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True)
    farm_id = Column(String(36), ForeignKey("farms.id", ondelete="RESTRICT"), nullable=False)
    crop_type = Column(String(100), nullable=False)
    cultivar = Column(String(100), nullable=False)
    harvest_stage = Column(String(50), nullable=False)
    sowing_date = Column(Date, nullable=False)
    harvest_date = Column(Date, nullable=False)
    quantity_kg = Column(Float, nullable=False)
    grade_distribution = Column(Text, nullable=False) # JSON encoded string
    spoilage_risk_score = Column(Float, nullable=False)
    trace_hash = Column(String(64), unique=True, nullable=False)
    prev_batch_hash = Column(String(64), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="batches")

    def get_grade_distribution(self):
        return json.loads(self.grade_distribution)

    def set_grade_distribution(self, data):
        self.grade_distribution = json.dumps(data)

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(String(50), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False)
    recorded_at = Column(DateTime, nullable=False, index=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    co2_ppm = Column(Integer, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    soil_ph = Column(Float, nullable=False)
    soil_ec = Column(Float, nullable=False)

    device = relationship("Device", back_populates="telemetry_logs")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
