-- agentprop/database/schema/verticals_setup.sql
-- Script para crear y poblar la tabla de verticales y sus subtipos
-- @version 1.0.0
-- @created 2025-04-11

-- Crear la tabla de verticales si no existe
CREATE TABLE IF NOT EXISTS verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    brand_name VARCHAR(100), -- Nombre de marca para branding (AgentMedic, AgentBeauty, etc.)
    color_primary VARCHAR(20),
    color_secondary VARCHAR(20),
    icon_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear la tabla de sub-verticales si no existe
CREATE TABLE IF NOT EXISTS vertical_subtypes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vertical_id, name)
);

-- Habilitar RLS si no está activado
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_subtypes ENABLE ROW LEVEL SECURITY;

-- Aplicar políticas RLS
-- Solo SUPERADMIN puede modificar las verticales
DO $$ 
BEGIN
    -- Intentar eliminar la política si ya existe
    BEGIN
        DROP POLICY IF EXISTS "SUPERADMIN puede gestionar todas las verticales" ON verticals;
    EXCEPTION WHEN OTHERS THEN
        -- Ignorar error si la política no existe
    END;

    -- Crear la política
    CREATE POLICY "SUPERADMIN puede gestionar todas las verticales" 
    ON verticals 
    FOR ALL USING (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
    );
END $$;

-- Todos pueden ver las verticales
DO $$ 
BEGIN
    -- Intentar eliminar la política si ya existe
    BEGIN
        DROP POLICY IF EXISTS "Todos pueden ver las verticales" ON verticals;
    EXCEPTION WHEN OTHERS THEN
        -- Ignorar error si la política no existe
    END;

    -- Crear la política
    CREATE POLICY "Todos pueden ver las verticales" 
    ON verticals 
    FOR SELECT USING (
        true
    );
END $$;

-- Solo SUPERADMIN puede modificar los subtipos de verticales
DO $$ 
BEGIN
    -- Intentar eliminar la política si ya existe
    BEGIN
        DROP POLICY IF EXISTS "SUPERADMIN puede gestionar todos los subtipos" ON vertical_subtypes;
    EXCEPTION WHEN OTHERS THEN
        -- Ignorar error si la política no existe
    END;

    -- Crear la política
    CREATE POLICY "SUPERADMIN puede gestionar todos los subtipos" 
    ON vertical_subtypes 
    FOR ALL USING (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
    );
END $$;

-- Todos pueden ver los subtipos de verticales
DO $$ 
BEGIN
    -- Intentar eliminar la política si ya existe
    BEGIN
        DROP POLICY IF EXISTS "Todos pueden ver los subtipos" ON vertical_subtypes;
    EXCEPTION WHEN OTHERS THEN
        -- Ignorar error si la política no existe
    END;

    -- Crear la política
    CREATE POLICY "Todos pueden ver los subtipos" 
    ON vertical_subtypes 
    FOR SELECT USING (
        true
    );
END $$;

-- Crear trigger para updated_at si no existe
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas
DO $$ 
BEGIN
    -- Verificar si el trigger ya existe
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_verticals_modtime') THEN
        CREATE TRIGGER update_verticals_modtime
        BEFORE UPDATE ON verticals
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vertical_subtypes_modtime') THEN
        CREATE TRIGGER update_vertical_subtypes_modtime
        BEFORE UPDATE ON vertical_subtypes
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- Ingestar datos de verticales y subtipos
-- Insertar verticales si no existen
INSERT INTO verticals (code, name, description, brand_name)
VALUES
    ('medicina', 'Medicina', 'Servicios médicos y de salud', 'AgentMedic by PymeBot'),
    ('belleza', 'Belleza', 'Servicios de belleza y estética', 'AgentBeauty by PymeBot'),
    ('bienestar_y_relajacion', 'Bienestar y Relajación', 'Servicios de bienestar y relajación', 'AgentZen by PymeBot'),
    ('salud_y_recuperacion', 'Salud y Recuperación', 'Servicios de salud y recuperación física', 'AgentVital by PymeBot'),
    ('arte_corporal', 'Arte Corporal', 'Servicios de arte corporal y modificación', 'AgentInk by PymeBot'),
    ('mascotas', 'Mascotas', 'Servicios para mascotas', 'AgentPet by PymeBot'),
    ('bienes_raices', 'Bienes Raíces', 'Servicios inmobiliarios y de construcción', 'AgentProp by PymeBot'),
    ('restaurantes', 'Restaurantes', 'Servicios de alimentación y restauración', 'AgentChef by PymeBot')
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    brand_name = EXCLUDED.brand_name;

-- Función para insertar subtipos de verticales
CREATE OR REPLACE FUNCTION insert_vertical_subtypes()
RETURNS VOID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Medicina
    SELECT id INTO v_id FROM verticals WHERE code = 'medicina';
    IF FOUND THEN
        INSERT INTO vertical_subtypes (vertical_id, name)
        VALUES
            (v_id, 'Médicos'),
            (v_id, 'Cirujanos'),
            (v_id, 'Dentistas'),
            (v_id, 'Psicólogos'),
            (v_id, 'Nutriólogos'),
            (v_id, 'Oftalmólogos'),
            (v_id, 'Podólogos'),
            (v_id, 'Medicina estética')
        ON CONFLICT (vertical_id, name) DO NOTHING;
    END IF;

    -- Belleza
    SELECT id INTO v_id FROM verticals WHERE code = 'belleza';
    IF FOUND THEN
        INSERT INTO vertical_subtypes (vertical_id, name)
        VALUES
            (v_id, 'Salón'),
            (v_id, 'Barbería'),
            (v_id, 'Salón de uñas'),
            (v_id, 'Estudio de bronceado')
        ON CONFLICT (vertical_id, name) DO NOTHING;
    END IF;

    -- Bienestar y Relajación
    SELECT id INTO v_id FROM verticals WHERE code = 'bienestar_y_relajacion';
    IF FOUND THEN
        INSERT INTO vertical_subtypes (vertical_id, name)
        VALUES
            (v_id, 'Spa'),
            (v_id, 'Sauna'),
            (v_id, 'Masajes')
        ON CONFLICT (vertical_id, name) DO NOTHING;
    END IF;

    -- Salud y Recuperación
    SELECT id INTO v_id FROM verticals WHERE code = 'salud_y_recuperacion';
    IF FOUND THEN
        INSERT INTO vertical_subtypes (vertical_id, name)
        VALUES
            (v_id, 'Fisioterapia'),
            (v_id, 'Práctica sanitaria'),
            (v_id, 'Fitness y recuperación')
        ON CONFLICT (vertical_id, name) DO NOTHING;
    END IF;

    -- Arte Corporal
    SELECT id INTO v_id FROM verticals WHERE code = 'arte_corporal';
    IF FOUND THEN
        INSERT INTO vertical_subtypes (vertical_id, name)
        VALUES
            (v_id, 'Tatuajes'),
            (v_id, 'Piercing')
        ON CONFLICT (vertical_id, name) DO NOTHING;
    END IF;

    -- Mascotas
    SELECT id INTO v_id FROM verticals WHERE code = 'mascotas';
    IF FOUND THEN
        INSERT INTO vertical_subtypes (vertical_id, name)
        VALUES
            (v_id, 'Peluquería para mascotas'),
            (v_id, 'Veterinarias')
        ON CONFLICT (vertical_id, name) DO NOTHING;
    END IF;

    -- Bienes Raíces
    SELECT id INTO v_id FROM verticals WHERE code = 'bienes_raices';
    IF FOUND THEN
        INSERT INTO vertical_subtypes (vertical_id, name)
        VALUES
            (v_id, 'Inmobiliarias'),
            (v_id, 'Constructoras'),
            (v_id, 'Bienes raíces')
        ON CONFLICT (vertical_id, name) DO NOTHING;
    END IF;

    -- Restaurantes
    SELECT id INTO v_id FROM verticals WHERE code = 'restaurantes';
    IF FOUND THEN
        INSERT INTO vertical_subtypes (vertical_id, name)
        VALUES
            (v_id, 'Restaurantes'),
            (v_id, 'Comida rápida'),
            (v_id, 'Cafeterías'),
            (v_id, 'Repostería y pastelería')
        ON CONFLICT (vertical_id, name) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la función para insertar los subtipos
SELECT insert_vertical_subtypes();

-- Eliminar la función temporal
DROP FUNCTION insert_vertical_subtypes();
