-- agentprop/database/schema/modules_plans_schema.sql
-- Esquema para módulos y planes de suscripción
-- @version 1.0.0
-- @created 2025-04-10

-- Tabla de Módulos del Sistema
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    is_core BOOLEAN DEFAULT false,
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Planes de Suscripción
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    features JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Relación entre Planes y Módulos
CREATE TABLE plan_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    limits JSONB, -- Ej: {"max_users": 5, "max_storage_gb": 10}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_id, module_id)
);

-- Políticas RLS: Solo SUPERADMIN puede acceder
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo SUPERADMIN puede acceder a módulos" 
ON modules 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "Solo SUPERADMIN puede acceder a planes" 
ON subscription_plans 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "Solo SUPERADMIN puede acceder a relación plan-módulo" 
ON plan_modules 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

-- Triggers para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_modules_modtime
BEFORE UPDATE ON modules
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_subscription_plans_modtime
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
