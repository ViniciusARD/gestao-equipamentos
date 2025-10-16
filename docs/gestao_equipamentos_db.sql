-- Table for the institution's sectors
CREATE TABLE sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Table to store system user data
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'requester', 'manager', 'admin')),
    sector_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    otp_secret VARCHAR(32),
    otp_enabled BOOLEAN NOT NULL DEFAULT false,
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER NOT NULL DEFAULT 0, -- NOVA COLUNA
    CONSTRAINT fk_user_sector FOREIGN KEY(sector_id) REFERENCES sectors(id) ON DELETE SET NULL
);

-- Table for equipment TYPES
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT
);

-- Table for the PHYSICAL UNITS of each piece of equipment
CREATE TABLE equipment_units (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL,
    identifier_code VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'reserved', 'maintenance')),
    CONSTRAINT fk_equipment_type FOREIGN KEY(type_id) REFERENCES equipment_types(id) ON DELETE CASCADE
);

-- Reservations table
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    unit_id INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
    return_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_equipment_unit FOREIGN KEY(unit_id) REFERENCES equipment_units(id) ON DELETE CASCADE
);

-- Table to store Google OAuth 2.0 tokens
CREATE TABLE google_oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    token_json TEXT NOT NULL,
    CONSTRAINT fk_user_token FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table to store revoked JWT tokens (blacklist)
CREATE TABLE token_blacklist (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table to store application activity logs
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user_log FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Table for unit history
CREATE TABLE unit_history (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- Ex: 'returned_ok', 'sent_to_maintenance', 'created'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id INTEGER, -- Manager/Admin who registered the event
    reservation_id INTEGER, -- Optional, to link with the reservation
    CONSTRAINT fk_history_unit FOREIGN KEY(unit_id) REFERENCES equipment_units(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_history_reservation FOREIGN KEY(reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
);