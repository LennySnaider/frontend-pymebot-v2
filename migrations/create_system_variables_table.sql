-- Create System Variables Table
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS system_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    default_value TEXT,
    is_tenant_configurable BOOLEAN NOT NULL DEFAULT TRUE,
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    category_id UUID,
    vertical_id UUID,
    options JSONB,
    validation JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE system_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can do anything with system variables" 
    ON system_variables 
    USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "All users can read non-sensitive system variables" 
    ON system_variables 
    FOR SELECT
    USING (NOT is_sensitive);

-- Add sample data for testing
INSERT INTO system_variables (name, display_name, description, type, default_value, is_tenant_configurable, is_sensitive)
VALUES 
    ('company_name', 'Nombre de la Empresa', 'Nombre de la empresa mostrado en todas las comunicaciones', 'text', 'PymeBot', true, false),
    ('support_email', 'Email de Soporte', 'Email de contacto para soporte técnico', 'text', 'soporte@pymebot.com', true, false),
    ('api_key', 'Clave API', 'Clave API para integraciones', 'text', '', true, true);

COMMENT ON TABLE system_variables IS 'Variables del sistema que pueden ser configuradas por administradores.';
