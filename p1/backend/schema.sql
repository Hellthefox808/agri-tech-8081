-- SQL Schema DDL: Enterprise Agri-Health Guardian Platform Database
-- Targets: PostgreSQL 15 + PostGIS 3.3

-- Enable Geospatial Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Countries Table
CREATE TABLE countries (
    id VARCHAR(3) PRIMARY KEY, -- ISO 3166-1 alpha-3 code (e.g. 'IND', 'USA', 'ESP')
    name VARCHAR(100) UNIQUE NOT NULL,
    default_lang VARCHAR(10) NOT NULL DEFAULT 'en',
    timezone VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. States Table
CREATE TABLE states (
    id VARCHAR(10) PRIMARY KEY, -- e.g. 'IND-MH', 'IND-KA', 'USA-CA'
    country_id VARCHAR(3) NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    bounding_geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(country_id, name)
);

CREATE INDEX states_geom_idx ON states USING GIST(bounding_geom);

-- 3. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    country_id VARCHAR(3) NOT NULL REFERENCES countries(id),
    state_id VARCHAR(10) NOT NULL REFERENCES states(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX users_state_idx ON users(state_id);

-- 4. Roles Table
CREATE TABLE roles (
    id INTEGER PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Seed Roles table
INSERT INTO roles (id, name, description) VALUES
(1, 'SUPER_ADMIN', 'Manages all countries, states, and global policies.'),
(2, 'COUNTRY_ADMIN', 'Manages assigned country and states.'),
(3, 'STATE_ADMIN', 'Manages regional operations (Max 10 per state).'),
(4, 'DISTRICT_ADMIN', 'Manages local user approvals and facilities.'),
(5, 'FARMER', 'Registers crop batches and views alerts.'),
(6, 'FPO_MANAGER', 'Manages sorting conveyor and traceability logs.'),
(7, 'INSPECTOR', 'Performs food safety inspections and audits.'),
(8, 'BUYER', 'Public access to QR batch traceability.'),
(9, 'ANALYST', 'Accesses data aggregates for modeling.');

-- 5. User Roles Mapping Table
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    PRIMARY KEY (user_id, role_id)
);

-- 6. User Invitations Table
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    country_id VARCHAR(3) NOT NULL REFERENCES countries(id),
    state_id VARCHAR(10) NOT NULL REFERENCES states(id),
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Farms Table
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    fpo_id UUID NOT NULL,
    soil_type VARCHAR(100) NOT NULL,
    irrigation_zone VARCHAR(100) NOT NULL,
    elevation_m DECIMAL(6, 2) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    coast_distance_km DECIMAL(8, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX farms_geom_idx ON farms USING GIST(geom);

-- 8. Devices Table
CREATE TABLE devices (
    id VARCHAR(50) PRIMARY KEY, -- Hardware Unique ID (e.g. MAC / Chip ID)
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    hardware_version VARCHAR(50) NOT NULL,
    firmware_version VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'OFFLINE')),
    last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Batches Table (Traceability & Cryptographic Hash Chain)
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) REFERENCES devices(id) ON DELETE SET NULL,
    farm_id UUID REFERENCES farms(id) ON DELETE RESTRICT,
    crop_type VARCHAR(100) NOT NULL,
    cultivar VARCHAR(100) NOT NULL,
    harvest_stage VARCHAR(50) NOT NULL,
    sowing_date DATE NOT NULL,
    harvest_date DATE NOT NULL,
    quantity_kg DECIMAL(10, 2) NOT NULL,
    grade_distribution JSONB NOT NULL, -- Format: {"A_pct": 72.5, "B_pct": 18.0, "C_pct": 9.5}
    spoilage_risk_score DECIMAL(5, 2) NOT NULL,
    trace_hash VARCHAR(64) UNIQUE NOT NULL,      -- SHA-256 of details + previous hash
    prev_batch_hash VARCHAR(64) NOT NULL,        -- Hash of the prior batch for chain integrity
    geom GEOMETRY(Point, 4326) NOT NULL,         -- Capture location
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX batches_geom_idx ON batches USING GIST(geom);
CREATE INDEX batches_trace_hash_idx ON batches(trace_hash);

-- 10. Telemetry Log Table (Timeseries Partitioned by Month)
CREATE TABLE telemetry_logs (
    id BIGSERIAL,
    device_id VARCHAR(50) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL,
    temperature DECIMAL(5, 2) NOT NULL,
    humidity DECIMAL(5, 2) NOT NULL,
    co2_ppm INTEGER NOT NULL,
    soil_moisture DECIMAL(5, 2) NOT NULL,
    soil_ph DECIMAL(4, 2) NOT NULL,
    soil_ec DECIMAL(6, 2) NOT NULL,
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Indexes for telemetry
CREATE INDEX telemetry_logs_device_time_idx ON telemetry_logs (device_id, recorded_at DESC);

-- 11. Control Events Table
CREATE TABLE control_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(50) NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    actuator_type VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    triggered_by VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- PL/pgSQL Triggers & Business Logic Rules
-- ==========================================

-- Trigger to enforce maximum 10 state admins per state
CREATE OR REPLACE FUNCTION verify_state_admin_quota()
RETURNS TRIGGER AS $$
DECLARE
    state_admin_role_id CONSTANT INTEGER := 3;
    current_admin_count INTEGER;
    target_user_state VARCHAR(10);
BEGIN
    -- Only evaluate if assigning STATE_ADMIN role (ID: 3)
    IF NEW.role_id = state_admin_role_id THEN
        -- Resolve target user's state_id
        SELECT state_id INTO target_user_state FROM users WHERE id = NEW.user_id;
        
        -- Count existing users in this state holding the state admin role
        SELECT COUNT(*)
        INTO current_admin_count
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        WHERE u.state_id = target_user_state
          AND ur.role_id = state_admin_role_id;
          
        IF current_admin_count >= 10 THEN
            RAISE EXCEPTION 'Constraint Violation: State % already has the maximum of 10 State Admins.', target_user_state;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_state_admin_limit_trigger
BEFORE INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION verify_state_admin_quota();
