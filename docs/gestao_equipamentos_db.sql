-- Tabela para armazenar os dados dos usuários do sistema (sem alterações)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- NOVO: Tabela para os TIPOS de equipamento (Ex: "Notebook Dell Vostro 15")
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT
);

-- NOVO: Tabela para as UNIDADES FÍSICAS de cada equipamento (Ex: "Notebook #001")
CREATE TABLE equipment_units (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL,
    identifier_code VARCHAR(50) UNIQUE, -- Código de patrimônio, por exemplo
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'maintenance')),
    
    CONSTRAINT fk_equipment_type FOREIGN KEY(type_id) REFERENCES equipment_types(id)
);

-- ATUALIZADO: Tabela de reservas agora aponta para uma UNIDADE específica
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    unit_id INTEGER NOT NULL, -- Alterado de equipment_id para unit_id
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'returned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id),
    CONSTRAINT fk_equipment_unit FOREIGN KEY(unit_id) REFERENCES equipment_units(id) -- Chave estrangeira atualizada
);

-- Tabela para armazenar os tokens do Google OAuth 2.0 (sem alterações)
CREATE TABLE google_oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    token_json TEXT NOT NULL,
    
    CONSTRAINT fk_user_token FOREIGN KEY(user_id) REFERENCES users(id)
);