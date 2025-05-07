-- Migración para agregar tipos de canal y configuraciones específicas para WhatsApp
-- @version 1.0.0
-- @created 2025-07-05

-- Actualizar o insertar tipos de canal
DO $$
BEGIN
    -- Crear tipo enum para tipos de canales si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type_enum') THEN
        CREATE TYPE channel_type_enum AS ENUM (
            'whatsapp',
            'webchat',
            'telegram',
            'messenger',
            'email',
            'sms'
        );
        
        -- Actualizar la tabla tenant_chatbot_channels para usar el tipo enum
        ALTER TABLE tenant_chatbot_channels 
            ALTER COLUMN channel_type TYPE channel_type_enum USING channel_type::channel_type_enum;
    ELSE
        -- Añadir nuevos valores al enum si no existen
        BEGIN
            ALTER TYPE channel_type_enum ADD VALUE 'whatsapp' IF NOT EXISTS;
            ALTER TYPE channel_type_enum ADD VALUE 'webchat' IF NOT EXISTS;
            ALTER TYPE channel_type_enum ADD VALUE 'telegram' IF NOT EXISTS;
            ALTER TYPE channel_type_enum ADD VALUE 'messenger' IF NOT EXISTS;
            ALTER TYPE channel_type_enum ADD VALUE 'email' IF NOT EXISTS;
            ALTER TYPE channel_type_enum ADD VALUE 'sms' IF NOT EXISTS;
        EXCEPTION
            WHEN duplicate_object THEN
                -- Ignora error si ya existe
        END;
    END IF;
END
$$;

-- Añadir campos de configuración para WhatsApp si no existen
DO $$
BEGIN
    -- Añadir columna para nombre de display del canal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenant_chatbot_channels' 
                   AND column_name = 'display_name') THEN
        ALTER TABLE tenant_chatbot_channels
        ADD COLUMN display_name VARCHAR(100);
    END IF;
    
    -- Añadir columna para descripción del canal
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenant_chatbot_channels' 
                   AND column_name = 'description') THEN
        ALTER TABLE tenant_chatbot_channels
        ADD COLUMN description TEXT;
    END IF;
    
    -- Añadir columna para webhook_verified
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenant_chatbot_channels' 
                   AND column_name = 'webhook_verified') THEN
        ALTER TABLE tenant_chatbot_channels
        ADD COLUMN webhook_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Añadir columna para verificación de webhook
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenant_chatbot_channels' 
                   AND column_name = 'webhook_verified_at') THEN
        ALTER TABLE tenant_chatbot_channels
        ADD COLUMN webhook_verified_at TIMESTAMPTZ;
    END IF;
    
    -- Añadir índices para mejorar rendimiento
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'tenant_chatbot_channels' 
                   AND indexname = 'idx_tenant_chatbot_channels_active') THEN
        CREATE INDEX idx_tenant_chatbot_channels_active
        ON tenant_chatbot_channels(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'tenant_chatbot_channels' 
                   AND indexname = 'idx_tenant_chatbot_channels_tenant_type') THEN
        CREATE INDEX idx_tenant_chatbot_channels_tenant_type
        ON tenant_chatbot_channels(tenant_id, channel_type);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'tenant_chatbot_channels' 
                   AND indexname = 'idx_tenant_chatbot_channels_identifier') THEN
        CREATE INDEX idx_tenant_chatbot_channels_identifier
        ON tenant_chatbot_channels(channel_identifier);
    END IF;
END
$$;

-- Comentarios para documentar la estructura de JSON en channel_config
COMMENT ON COLUMN tenant_chatbot_channels.channel_config IS 
'Estructura JSON para configuración específica por tipo de canal:
- Para WhatsApp: {
    "welcome_message": "Mensaje de bienvenida",
    "farewell_message": "Mensaje de despedida",
    "business_hours_enabled": true,
    "business_hours_message": "Mensaje fuera de horario",
    "enable_templates": true,
    "templates": {
      "appointment": "appointment_template_name",
      "order": "order_template_name"
    }
  }
- Para webchat: {
    "theme": "light",
    "logo_url": "https://...",
    "primary_color": "#FF0000"
  }
';