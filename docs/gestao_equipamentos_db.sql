-- Tabela para os setores da instituição
CREATE TABLE setores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela para armazenar os dados dos usuários do sistema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'requester', 'manager', 'admin')),
    setor_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    otp_secret VARCHAR(32),
    otp_enabled BOOLEAN NOT NULL DEFAULT false,
    -- <<-- NOVAS COLUNAS -->>
    terms_accepted BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_user_setor FOREIGN KEY(setor_id) REFERENCES setores(id) ON DELETE SET NULL
);

-- Tabela para os TIPOS de equipamento
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT
);

-- Tabela para as UNIDADES FÍSICAS de cada equipamento
CREATE TABLE equipment_units (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL,
    identifier_code VARCHAR(50) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'maintenance')),
    CONSTRAINT fk_equipment_type FOREIGN KEY(type_id) REFERENCES equipment_types(id) ON DELETE CASCADE
);

-- Tabela de reservas
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

-- Tabela para armazenar os tokens do Google OAuth 2.0
CREATE TABLE google_oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    token_json TEXT NOT NULL,
    CONSTRAINT fk_user_token FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela para armazenar tokens JWT revogados (blacklist)
CREATE TABLE token_blacklist (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabela para armazenar logs de atividade da aplicação
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user_log FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE unit_history (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- Ex: 'returned_ok', 'sent_to_maintenance', 'created'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id INTEGER, -- Manager/Admin que registrou o evento
    reservation_id INTEGER, -- Opcional, para linkar com a reserva
    CONSTRAINT fk_history_unit FOREIGN KEY(unit_id) REFERENCES equipment_units(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_history_reservation FOREIGN KEY(reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
);