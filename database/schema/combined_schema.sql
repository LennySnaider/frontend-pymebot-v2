-- Script combinado que crea todas las tablas en el orden correcto
-- @version 1.0.0
-- @created 2025-04-14

-- ============================
-- PARTE 1: MÓDULOS Y PLANES
-- ============================

-- Función trigger para actualización de timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabla de Módulos del Sistema
CREATE TABLE IF NOT EXISTS modules (
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
CREATE TABLE IF NOT EXISTS subscription_plans (
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
CREATE TABLE IF NOT EXISTS plan_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    limits JSONB, -- Ej: {"max_users": 5, "max_storage_gb": 10}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_id, module_id)
);

-- Triggers para actualizar el campo updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_modules_modtime') THEN
        CREATE TRIGGER update_modules_modtime
        BEFORE UPDATE ON modules
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscription_plans_modtime') THEN
        CREATE TRIGGER update_subscription_plans_modtime
        BEFORE UPDATE ON subscription_plans
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- ============================
-- PARTE 2: TENANTS
-- ============================

-- Tabla de Tenants (Clientes del SaaS)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    custom_domain TEXT,
    subdomain VARCHAR(50) NOT NULL UNIQUE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    country VARCHAR(50),
    city VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(20) DEFAULT 'es-MX',
    settings JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de usuarios asociados a tenants
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Triggers para actualizar el campo updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_modtime') THEN
        CREATE TRIGGER update_tenants_modtime
        BEFORE UPDATE ON tenants
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenant_users_modtime') THEN
        CREATE TRIGGER update_tenant_users_modtime
        BEFORE UPDATE ON tenant_users
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- ============================
-- PARTE 3: VERTICALES
-- ============================

-- Tabla de Verticales de Negocio
CREATE TABLE IF NOT EXISTS verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    brand_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de relación entre Verticales y Módulos
CREATE TABLE IF NOT EXISTS vertical_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vertical_id, module_id)
);

-- Tabla para categorías dentro de cada vertical
CREATE TABLE IF NOT EXISTS vertical_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vertical_id, code)
);

-- Tabla que relaciona tenants con verticales
CREATE TABLE IF NOT EXISTS tenant_verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
    category_id UUID REFERENCES vertical_categories(id) ON DELETE SET NULL,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    custom_settings JSONB,
    UNIQUE(tenant_id, vertical_id)
);

-- Triggers para actualizar el campo updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_verticals_modtime') THEN
        CREATE TRIGGER update_verticals_modtime
        BEFORE UPDATE ON verticals
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_vertical_categories_modtime') THEN
        CREATE TRIGGER update_vertical_categories_modtime
        BEFORE UPDATE ON vertical_categories
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- ============================
-- PARTE 4: CHATBOT
-- ============================

-- Tabla para plantillas de chatbot creadas por SUPERADMIN
CREATE TABLE IF NOT EXISTS chatbot_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vertical_id UUID REFERENCES verticals(id) ON DELETE SET NULL,
    react_flow_json JSONB,
    status VARCHAR(20) DEFAULT 'draft',
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla que registra qué tenant ha activado qué plantilla
CREATE TABLE IF NOT EXISTS tenant_chatbot_activations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES chatbot_templates(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, template_id)
);

-- Tabla para configuraciones específicas del tenant para una plantilla activa
CREATE TABLE IF NOT EXISTS tenant_chatbot_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activation_id UUID NOT NULL REFERENCES tenant_chatbot_activations(id) ON DELETE CASCADE,
    config_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla para canales de comunicación de chatbot de cada tenant
CREATE TABLE IF NOT EXISTS tenant_chatbot_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_type VARCHAR(20) NOT NULL,
    channel_identifier VARCHAR(100) NOT NULL,
    channel_config JSONB DEFAULT '{}'::JSONB,
    default_activation_id UUID REFERENCES tenant_chatbot_activations(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_type, channel_identifier)
);

-- TABLA CLAVE: Almacena el estado activo de cada conversación
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_channel_id TEXT NOT NULL,
    channel_type TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    active_chatbot_activation_id UUID REFERENCES tenant_chatbot_activations(id) ON DELETE SET NULL,
    current_node_id TEXT,
    state_data JSONB DEFAULT '{}'::JSONB,
    status TEXT DEFAULT 'active',
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, user_channel_id, channel_type)
);

-- Tabla para historial de mensajes
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    is_from_user BOOLEAN NOT NULL,
    message_text TEXT,
    message_type VARCHAR(20) DEFAULT 'text',
    media_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para el historial de cambios de nodo en una conversación
CREATE TABLE IF NOT EXISTS node_transition_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    from_node_id TEXT,
    to_node_id TEXT NOT NULL,
    transition_time TIMESTAMPTZ DEFAULT NOW(),
    trigger_type VARCHAR(50),
    metadata JSONB
);

-- Tabla para almacenar el consumo de tokens de IA por tenant
CREATE TABLE IF NOT EXISTS ai_token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
    service_type VARCHAR(20) NOT NULL,
    model_used VARCHAR(50),
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT NOT NULL,
    cost_usd NUMERIC(10, 8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers para actualizar el campo updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chatbot_templates_modtime') THEN
        CREATE TRIGGER update_chatbot_templates_modtime
        BEFORE UPDATE ON chatbot_templates
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenant_chatbot_configurations_modtime') THEN
        CREATE TRIGGER update_tenant_chatbot_configurations_modtime
        BEFORE UPDATE ON tenant_chatbot_configurations
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenant_chatbot_channels_modtime') THEN
        CREATE TRIGGER update_tenant_chatbot_channels_modtime
        BEFORE UPDATE ON tenant_chatbot_channels
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_tenant_id ON conversation_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_status ON conversation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_last_interaction ON conversation_sessions(last_interaction_at);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_node_transition_history_session_id ON node_transition_history(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_tenant_id_date ON ai_token_usage(tenant_id, created_at);

-- ============================
-- PARTE 5: DATOS INICIALES
-- ============================

-- Crear un tenant inicial para desarrollo si no existe
INSERT INTO tenants (
    name, 
    code, 
    description, 
    subdomain, 
    contact_email, 
    status, 
    subscription_status
) 
SELECT 
    'PymeBot Demo', 
    'pymebot_demo', 
    'Tenant de demostración para desarrollo', 
    'demo', 
    'demo@pymebot.com', 
    'active', 
    'trial'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE code = 'pymebot_demo');

-- Insertar verticales si no existen
INSERT INTO verticals (name, code, description, icon, brand_name, is_active) 
SELECT 'Belleza', 'belleza', 'Salones de belleza, barberías y servicios estéticos', 'beauty', 'AgentBeauty by PymeBot', true
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE code = 'belleza');

INSERT INTO verticals (name, code, description, icon, brand_name, is_active) 
SELECT 'Bienestar y Relajación', 'bienestar_y_relajación', 'Spas, saunas y servicios de masajes', 'spa', 'AgentZen by PymeBot', true
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE code = 'bienestar_y_relajación');

INSERT INTO verticals (name, code, description, icon, brand_name, is_active) 
SELECT 'Salud y Recuperación', 'salud_y_recuperación', 'Fisioterapia y servicios de recuperación física', 'health', 'AgentVital by PymeBot', true
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE code = 'salud_y_recuperación');

INSERT INTO verticals (name, code, description, icon, brand_name, is_active) 
SELECT 'Arte Corporal', 'arte_corporal', 'Estudios de tatuajes y piercings', 'tattoo', 'AgentInk by PymeBot', true
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE code = 'arte_corporal');

INSERT INTO verticals (name, code, description, icon, brand_name, is_active) 
SELECT 'Mascotas', 'mascotas', 'Veterinarias y servicios para mascotas', 'pet', 'AgentPet by PymeBot', true
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE code = 'mascotas');

INSERT INTO verticals (name, code, description, icon, brand_name, is_active) 
SELECT 'Bienes Raíces', 'bienes_raices', 'Inmobiliarias, constructoras y servicios inmobiliarios', 'building', 'AgentProp by PymeBot', true
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE code = 'bienes_raices');

INSERT INTO verticals (name, code, description, icon, brand_name, is_active) 
SELECT 'Restaurantes', 'restaurantes', 'Restaurantes, cafeterías y servicios de comida', 'food', 'AgentChef by PymeBot', true
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE code = 'restaurantes');

INSERT INTO verticals (name, code, description, icon, brand_name, is_active) 
SELECT 'Medicina', 'medicina', 'Consultorios médicos, dentistas y servicios de salud', 'medical', 'AgentMedic by PymeBot', true
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE code = 'medicina');

-- Configuración de Row-Level Security (RLS)
-- ============================
-- PARTE 6: ROW LEVEL SECURITY
-- ============================

-- Módulos y Planes
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;

-- Tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Verticales
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_verticals ENABLE ROW LEVEL SECURITY;

-- Chatbot
ALTER TABLE chatbot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_chatbot_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_chatbot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_chatbot_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_transition_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para Módulos y Planes
DROP POLICY IF EXISTS "Solo SUPERADMIN puede acceder a módulos" ON modules;
CREATE POLICY "Solo SUPERADMIN puede acceder a módulos" 
ON modules 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "Solo SUPERADMIN puede acceder a planes" ON subscription_plans;
CREATE POLICY "Solo SUPERADMIN puede acceder a planes" 
ON subscription_plans 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "Solo SUPERADMIN puede acceder a relación plan-módulo" ON plan_modules;
CREATE POLICY "Solo SUPERADMIN puede acceder a relación plan-módulo" 
ON plan_modules 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

-- Políticas para Tenants
DROP POLICY IF EXISTS "SUPERADMIN puede gestionar todos los tenants" ON tenants;
CREATE POLICY "SUPERADMIN puede gestionar todos los tenants" 
ON tenants 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN solo puede ver su propio tenant" ON tenants;
CREATE POLICY "ADMIN solo puede ver su propio tenant" 
ON tenants 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

DROP POLICY IF EXISTS "SUPERADMIN puede gestionar todos los usuarios de tenants" ON tenant_users;
CREATE POLICY "SUPERADMIN puede gestionar todos los usuarios de tenants" 
ON tenant_users 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede gestionar usuarios de su tenant" ON tenant_users;
CREATE POLICY "ADMIN puede gestionar usuarios de su tenant" 
ON tenant_users 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas para Verticales
DROP POLICY IF EXISTS "Solo SUPERADMIN puede gestionar verticales" ON verticals;
CREATE POLICY "Solo SUPERADMIN puede gestionar verticales" 
ON verticals 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "Solo SUPERADMIN puede gestionar relación vertical-módulo" ON vertical_modules;
CREATE POLICY "Solo SUPERADMIN puede gestionar relación vertical-módulo" 
ON vertical_modules 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "Solo SUPERADMIN puede gestionar categorías de verticales" ON vertical_categories;
CREATE POLICY "Solo SUPERADMIN puede gestionar categorías de verticales" 
ON vertical_categories 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "SUPERADMIN puede gestionar todas las relaciones tenant-vertical" ON tenant_verticals;
CREATE POLICY "SUPERADMIN puede gestionar todas las relaciones tenant-vertical" 
ON tenant_verticals 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede ver solo sus propias verticales" ON tenant_verticals;
CREATE POLICY "ADMIN puede ver solo sus propias verticales" 
ON tenant_verticals 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas para Chatbot
DROP POLICY IF EXISTS "SUPERADMIN puede gestionar plantillas" ON chatbot_templates;
CREATE POLICY "SUPERADMIN puede gestionar plantillas" 
ON chatbot_templates 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "SUPERADMIN puede gestionar todas las activaciones" ON tenant_chatbot_activations;
CREATE POLICY "SUPERADMIN puede gestionar todas las activaciones" 
ON tenant_chatbot_activations 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede ver y gestionar sus propias activaciones" ON tenant_chatbot_activations;
CREATE POLICY "ADMIN puede ver y gestionar sus propias activaciones" 
ON tenant_chatbot_activations 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

DROP POLICY IF EXISTS "SUPERADMIN puede gestionar todas las configuraciones" ON tenant_chatbot_configurations;
CREATE POLICY "SUPERADMIN puede gestionar todas las configuraciones" 
ON tenant_chatbot_configurations 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede gestionar sus propias configuraciones" ON tenant_chatbot_configurations;
CREATE POLICY "ADMIN puede gestionar sus propias configuraciones" 
ON tenant_chatbot_configurations 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    EXISTS (
        SELECT 1 FROM tenant_chatbot_activations tca
        WHERE tca.id = activation_id AND
        tca.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    )
);

DROP POLICY IF EXISTS "SUPERADMIN puede gestionar todos los canales" ON tenant_chatbot_channels;
CREATE POLICY "SUPERADMIN puede gestionar todos los canales" 
ON tenant_chatbot_channels 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede gestionar sus propios canales" ON tenant_chatbot_channels;
CREATE POLICY "ADMIN puede gestionar sus propios canales" 
ON tenant_chatbot_channels 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

DROP POLICY IF EXISTS "SUPERADMIN puede ver todas las sesiones" ON conversation_sessions;
CREATE POLICY "SUPERADMIN puede ver todas las sesiones" 
ON conversation_sessions 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede ver sus propias sesiones" ON conversation_sessions;
CREATE POLICY "ADMIN puede ver sus propias sesiones" 
ON conversation_sessions 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

DROP POLICY IF EXISTS "Service account can manage all sessions" ON conversation_sessions;
CREATE POLICY "Service account can manage all sessions" 
ON conversation_sessions 
FOR ALL USING (
    true
);

DROP POLICY IF EXISTS "SUPERADMIN puede ver todos los mensajes" ON conversation_messages;
CREATE POLICY "SUPERADMIN puede ver todos los mensajes" 
ON conversation_messages 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede ver sus propios mensajes" ON conversation_messages;
CREATE POLICY "ADMIN puede ver sus propios mensajes" 
ON conversation_messages 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    EXISTS (
        SELECT 1 FROM conversation_sessions cs
        WHERE cs.id = session_id AND
        cs.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    )
);

DROP POLICY IF EXISTS "Service account can manage all messages" ON conversation_messages;
CREATE POLICY "Service account can manage all messages" 
ON conversation_messages 
FOR ALL USING (
    true
);

DROP POLICY IF EXISTS "SUPERADMIN puede ver todo el historial de transiciones" ON node_transition_history;
CREATE POLICY "SUPERADMIN puede ver todo el historial de transiciones" 
ON node_transition_history 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede ver su propio historial de transiciones" ON node_transition_history;
CREATE POLICY "ADMIN puede ver su propio historial de transiciones" 
ON node_transition_history 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    EXISTS (
        SELECT 1 FROM conversation_sessions cs
        WHERE cs.id = session_id AND
        cs.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    )
);

DROP POLICY IF EXISTS "Service account can manage all transitions" ON node_transition_history;
CREATE POLICY "Service account can manage all transitions" 
ON node_transition_history 
FOR ALL USING (
    true
);

DROP POLICY IF EXISTS "SUPERADMIN puede ver todo el uso de tokens" ON ai_token_usage;
CREATE POLICY "SUPERADMIN puede ver todo el uso de tokens" 
ON ai_token_usage 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

DROP POLICY IF EXISTS "ADMIN puede ver su propio uso de tokens" ON ai_token_usage;
CREATE POLICY "ADMIN puede ver su propio uso de tokens" 
ON ai_token_usage 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

DROP POLICY IF EXISTS "Service account can manage all token usage" ON ai_token_usage;
CREATE POLICY "Service account can manage all token usage" 
ON ai_token_usage 
FOR ALL USING (
    true
);
