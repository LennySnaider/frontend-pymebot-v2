-- agentprop/database/schema/tenants_schema.sql
-- Esquema para la gestión de tenants (multi-tenancy)
-- @version 1.0.0
-- @created 2025-04-14

-- Tabla de Tenants (Clientes del SaaS)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE, -- Identificador único para el tenant
    description TEXT,
    logo_url TEXT, -- URL al logo del tenant
    primary_color VARCHAR(20), -- Color principal para branding
    secondary_color VARCHAR(20), -- Color secundario para branding
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
    subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'trial', 'expired', 'cancelled'
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    custom_domain TEXT, -- Dominio personalizado del tenant
    subdomain VARCHAR(50) NOT NULL UNIQUE, -- Subdominio para acceso (tenant.pymebot.com)
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    country VARCHAR(50),
    city VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(20) DEFAULT 'es-MX',
    settings JSONB DEFAULT '{}'::JSONB, -- Configuraciones personalizadas
    max_tokens INTEGER DEFAULT 100000, -- Límite de tokens mensuales (NULL para ilimitado)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de usuarios asociados a tenants
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'admin', 'member', 'viewer', etc.
    is_active BOOLEAN DEFAULT true,
    permissions JSONB, -- Permisos específicos para el usuario
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Políticas RLS para tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Políticas para tenants
CREATE POLICY "SUPERADMIN puede gestionar todos los tenants" 
ON tenants 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "ADMIN solo puede ver su propio tenant" 
ON tenants 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas para tenant_users
CREATE POLICY "SUPERADMIN puede gestionar todos los usuarios de tenants" 
ON tenant_users 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "ADMIN puede gestionar usuarios de su tenant" 
ON tenant_users 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Triggers para actualizar el campo updated_at
CREATE TRIGGER update_tenants_modtime
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_users_modtime
BEFORE UPDATE ON tenant_users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Crear un tenant inicial para desarrollo
INSERT INTO tenants (
    name, 
    code, 
    description, 
    subdomain, 
    contact_email, 
    status, 
    subscription_status
) VALUES (
    'PymeBot Demo', 
    'pymebot_demo', 
    'Tenant de demostración para desarrollo', 
    'demo', 
    'demo@pymebot.com', 
    'active', 
    'trial'
);
