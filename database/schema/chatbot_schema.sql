-- agentprop/database/schema/chatbot_schema.sql
-- Esquema para el sistema de chatbot multi-tenant
-- @version 1.0.0
-- @created 2025-04-14

-- Tabla para plantillas de chatbot creadas por SUPERADMIN
CREATE TABLE chatbot_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vertical_id UUID REFERENCES verticals(id) ON DELETE SET NULL,
    react_flow_json JSONB NOT NULL, -- Estructura del flujo (nodos, conexiones, configuración)
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published'
    version INT DEFAULT 1, -- Control de versiones
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla que registra qué tenant ha activado qué plantilla
CREATE TABLE tenant_chatbot_activations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES chatbot_templates(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Si es la plantilla predeterminada para el tenant
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(tenant_id, template_id)
);

-- Tabla para configuraciones específicas del tenant para una plantilla activa
CREATE TABLE tenant_chatbot_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activation_id UUID NOT NULL REFERENCES tenant_chatbot_activations(id) ON DELETE CASCADE,
    config_data JSONB NOT NULL DEFAULT '{}'::JSONB, -- Configuraciones personalizadas (variables, mensajes, etc.)
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabla para canales de comunicación de chatbot de cada tenant
CREATE TABLE tenant_chatbot_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel_type VARCHAR(20) NOT NULL, -- 'whatsapp', 'webchat', 'telegram', etc.
    channel_identifier VARCHAR(100) NOT NULL, -- Número de WhatsApp, ID de widget, etc.
    channel_config JSONB DEFAULT '{}'::JSONB, -- Configuraciones específicas del canal
    default_activation_id UUID REFERENCES tenant_chatbot_activations(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_type, channel_identifier)
);

-- TABLA CLAVE: Almacena el estado activo de cada conversación
CREATE TABLE conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_channel_id TEXT NOT NULL, -- Identificador del usuario final (ej. número de WhatsApp)
    channel_type TEXT NOT NULL, -- 'whatsapp', 'webchat', etc.
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    active_chatbot_activation_id UUID REFERENCES tenant_chatbot_activations(id) ON DELETE SET NULL,
    current_node_id TEXT, -- ID del nodo actual en el React Flow JSON
    state_data JSONB DEFAULT '{}'::JSONB, -- Almacena variables de la conversación
    status TEXT DEFAULT 'active', -- 'active', 'waiting_input', 'completed', 'failed', 'expired'
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Índice compuesto para búsquedas por tenant + usuario
    UNIQUE(tenant_id, user_channel_id, channel_type)
);

-- Tabla para historial de mensajes
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    is_from_user BOOLEAN NOT NULL, -- true si es un mensaje del usuario, false si es del bot
    message_text TEXT, -- Contenido del mensaje (puede ser NULL si hay contenido multimedia)
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'audio', 'video', 'location', etc.
    media_url TEXT, -- URL al contenido multimedia si existe
    metadata JSONB, -- Metadatos adicionales (ej. coordenadas para location)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Índice para búsquedas por sesión
    CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES conversation_sessions(id) ON DELETE CASCADE
);

-- Tabla para el historial de cambios de nodo en una conversación
CREATE TABLE node_transition_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    from_node_id TEXT,
    to_node_id TEXT NOT NULL,
    transition_time TIMESTAMPTZ DEFAULT NOW(),
    trigger_type VARCHAR(50), -- 'user_input', 'system', 'timeout', etc.
    metadata JSONB -- Datos adicionales sobre la transición
);

-- Tabla para almacenar el consumo de tokens de IA por tenant
CREATE TABLE ai_token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE SET NULL,
    service_type VARCHAR(20) NOT NULL, -- 'llm', 'tts', 'stt', etc.
    model_used VARCHAR(50), -- Modelo específico usado
    prompt_tokens INT DEFAULT 0, -- Tokens en el prompt (para LLMs)
    completion_tokens INT DEFAULT 0, -- Tokens en la respuesta (para LLMs)
    total_tokens INT NOT NULL, -- Total de tokens consumidos
    cost_usd NUMERIC(10, 8), -- Costo estimado en USD
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) para cada tabla
ALTER TABLE chatbot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_chatbot_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_chatbot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_chatbot_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_transition_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;

-- Políticas para chatbot_templates (solo SUPERADMIN)
CREATE POLICY "SUPERADMIN puede gestionar plantillas" 
ON chatbot_templates 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

-- Políticas para tenant_chatbot_activations
CREATE POLICY "SUPERADMIN puede gestionar todas las activaciones" 
ON tenant_chatbot_activations 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "ADMIN puede ver y gestionar sus propias activaciones" 
ON tenant_chatbot_activations 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas para tenant_chatbot_configurations
CREATE POLICY "SUPERADMIN puede gestionar todas las configuraciones" 
ON tenant_chatbot_configurations 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

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

-- Políticas para tenant_chatbot_channels
CREATE POLICY "SUPERADMIN puede gestionar todos los canales" 
ON tenant_chatbot_channels 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "ADMIN puede gestionar sus propios canales" 
ON tenant_chatbot_channels 
FOR ALL USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas para conversation_sessions
CREATE POLICY "SUPERADMIN puede ver todas las sesiones" 
ON conversation_sessions 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "ADMIN puede ver sus propias sesiones" 
ON conversation_sessions 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- El backend del bot puede gestionar las sesiones (sin autenticación de usuario)
CREATE POLICY "Service account can manage all sessions" 
ON conversation_sessions 
FOR ALL USING (
    true
);

-- Políticas para conversation_messages (similares a conversation_sessions)
CREATE POLICY "SUPERADMIN puede ver todos los mensajes" 
ON conversation_messages 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

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

CREATE POLICY "Service account can manage all messages" 
ON conversation_messages 
FOR ALL USING (
    true
);

-- Políticas para node_transition_history
CREATE POLICY "SUPERADMIN puede ver todo el historial de transiciones" 
ON node_transition_history 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

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

CREATE POLICY "Service account can manage all transitions" 
ON node_transition_history 
FOR ALL USING (
    true
);

-- Políticas para ai_token_usage
CREATE POLICY "SUPERADMIN puede ver todo el uso de tokens" 
ON ai_token_usage 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin'
);

CREATE POLICY "ADMIN puede ver su propio uso de tokens" 
ON ai_token_usage 
FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

CREATE POLICY "Service account can manage all token usage" 
ON ai_token_usage 
FOR ALL USING (
    true
);

-- Triggers para actualizar el campo updated_at
CREATE TRIGGER update_chatbot_templates_modtime
BEFORE UPDATE ON chatbot_templates
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_chatbot_configurations_modtime
BEFORE UPDATE ON tenant_chatbot_configurations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_chatbot_channels_modtime
BEFORE UPDATE ON tenant_chatbot_channels
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Índices para mejorar el rendimiento
CREATE INDEX idx_conversation_sessions_tenant_id ON conversation_sessions(tenant_id);
CREATE INDEX idx_conversation_sessions_status ON conversation_sessions(status);
CREATE INDEX idx_conversation_sessions_last_interaction ON conversation_sessions(last_interaction_at);
CREATE INDEX idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX idx_node_transition_history_session_id ON node_transition_history(session_id);
CREATE INDEX idx_ai_token_usage_tenant_id_date ON ai_token_usage(tenant_id, created_at);
