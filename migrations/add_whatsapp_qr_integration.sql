-- Migración para añadir soporte de envío de códigos QR por WhatsApp
-- @version 1.0.0
-- @created 2025-09-05

-- Crear tabla para la configuración específica de WhatsApp
CREATE TABLE IF NOT EXISTS tenant_whatsapp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'twilio', 'messagebird', 'business_cloud_api'
  
  -- Campos comunes
  is_active BOOLEAN DEFAULT FALSE,
  from_number VARCHAR(20), -- Número de teléfono desde el que se envían los mensajes
  
  -- Configuración para Twilio
  account_sid VARCHAR(255),
  auth_token VARCHAR(255),
  
  -- Configuración para MessageBird
  api_key VARCHAR(255),
  channel_id VARCHAR(255),
  
  -- Configuración para WhatsApp Business Cloud API
  access_token VARCHAR(500),
  phone_number_id VARCHAR(255),
  business_account_id VARCHAR(255),
  
  -- Campos de auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Restricción para evitar configuraciones duplicadas por tenant
  CONSTRAINT unique_tenant_whatsapp_config UNIQUE (tenant_id)
);

-- Índice para mejorar consultas por tenant
CREATE INDEX IF NOT EXISTS idx_tenant_whatsapp_config_tenant_id ON tenant_whatsapp_config(tenant_id);

-- Tabla para el log de mensajes enviados
CREATE TABLE IF NOT EXISTS tenant_message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES tenant_appointments(id) ON DELETE SET NULL,
  message_type VARCHAR(50) NOT NULL, -- 'appointment_qr', 'appointment_reminder', etc.
  channel VARCHAR(20) NOT NULL, -- 'email', 'whatsapp', 'multiple'
  recipient VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'partial_success'
  error TEXT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas comunes en los logs
CREATE INDEX IF NOT EXISTS idx_tenant_message_logs_tenant_id ON tenant_message_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_message_logs_appointment_id ON tenant_message_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_tenant_message_logs_created_at ON tenant_message_logs(created_at);

-- Actualizar la estructura de appointment_qrcodes para incluir información de WhatsApp
ALTER TABLE tenant_appointment_qrcodes 
ADD COLUMN IF NOT EXISTS sent_by_whatsapp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_recipient VARCHAR(20);

-- Permisos de RLS para la configuración de WhatsApp
ALTER TABLE tenant_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso solo al tenant propietario y superadmins
DROP POLICY IF EXISTS tenant_whatsapp_config_tenant_access ON tenant_whatsapp_config;
CREATE POLICY tenant_whatsapp_config_tenant_access
  ON tenant_whatsapp_config
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_user_roles WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = TRUE
    )
  );

-- Permisos de RLS para los logs de mensajes
ALTER TABLE tenant_message_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso solo al tenant propietario y superadmins
DROP POLICY IF EXISTS tenant_message_logs_tenant_access ON tenant_message_logs;
CREATE POLICY tenant_message_logs_tenant_access
  ON tenant_message_logs
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_user_roles WHERE user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_superadmin = TRUE
    )
  );

-- Insertar configuración de ejemplo para el tenant de demostración
-- Solo insertar si el tenant de demostración existe y no tiene ya una configuración
DO $$
DECLARE
  demo_tenant_id UUID;
BEGIN
  -- Verificar si existe el tenant de demostración
  SELECT id INTO demo_tenant_id FROM tenants WHERE name = 'Demo Tenant' OR reference_id = 'demo' LIMIT 1;
  
  -- Si existe el tenant de demostración, insertar configuración de ejemplo
  IF demo_tenant_id IS NOT NULL THEN
    -- Verificar si ya existe una configuración para este tenant
    IF NOT EXISTS (SELECT 1 FROM tenant_whatsapp_config WHERE tenant_id = demo_tenant_id) THEN
      -- Insertar configuración de ejemplo para Twilio
      INSERT INTO tenant_whatsapp_config (
        tenant_id, 
        provider, 
        is_active, 
        from_number, 
        account_sid, 
        auth_token
      ) VALUES (
        demo_tenant_id,
        'twilio',
        TRUE,
        '+525512345678',
        'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
      );
    END IF;
  END IF;
END
$$;