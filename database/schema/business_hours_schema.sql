-- agentprop/database/schema/business_hours_schema.sql
-- Esquema para la gestión de horarios de negocio y citas
-- @version 1.0.0
-- @created 2025-06-05

-- Tabla para horarios de negocio por tenant
CREATE TABLE tenant_business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL, -- 0 (domingo) a 6 (sábado)
    open_time TIME NOT NULL, -- Hora de apertura en formato 24h
    close_time TIME NOT NULL, -- Hora de cierre en formato 24h
    is_closed BOOLEAN DEFAULT false, -- Si está cerrado ese día
    location_id UUID NULL, -- Referencia a ubicación específica (opcional)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_hours CHECK (open_time < close_time),
    UNIQUE(tenant_id, day_of_week, location_id)
);

-- Tabla para excepciones en horarios (días festivos, vacaciones, etc.)
CREATE TABLE tenant_business_hours_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL, -- Fecha específica de la excepción
    open_time TIME NULL, -- Hora de apertura (NULL si está cerrado)
    close_time TIME NULL, -- Hora de cierre (NULL si está cerrado)
    is_closed BOOLEAN DEFAULT true, -- Si el negocio está cerrado ese día
    reason VARCHAR(255), -- Razón de la excepción (ej. "Día festivo")
    location_id UUID NULL, -- Referencia a ubicación específica (opcional)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_exception_hours CHECK (is_closed = true OR (open_time < close_time)),
    UNIQUE(tenant_id, exception_date, location_id)
);

-- Tabla para configuración de citas
CREATE TABLE tenant_appointment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_duration INTEGER NOT NULL DEFAULT 30, -- Duración predeterminada en minutos
    buffer_time INTEGER NOT NULL DEFAULT 0, -- Tiempo entre citas en minutos
    max_daily_appointments INTEGER NULL, -- Límite de citas diarias (NULL = sin límite)
    min_notice_minutes INTEGER DEFAULT 60, -- Tiempo mínimo de antelación en minutos
    max_future_days INTEGER DEFAULT 30, -- Cuántos días en el futuro se pueden programar citas
    require_approval BOOLEAN DEFAULT false, -- Si las citas requieren aprobación manual
    confirmation_email_template TEXT, -- Plantilla para correo de confirmación
    reminder_email_template TEXT, -- Plantilla para correo de recordatorio
    reminder_time_hours INTEGER DEFAULT 24, -- Horas antes para enviar recordatorio
    notification_email VARCHAR(255), -- Email para notificar nuevas citas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- Tabla para localizaciones de negocio
CREATE TABLE tenant_business_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Tabla para tipos de cita
CREATE TABLE tenant_appointment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- Duración en minutos
    color VARCHAR(20), -- Color para mostrar en el calendario
    buffer_time INTEGER DEFAULT 0, -- Tiempo adicional entre citas de este tipo
    is_active BOOLEAN DEFAULT true,
    booking_url_suffix VARCHAR(100), -- Sufijo para la URL de reserva
    max_daily_appointments INTEGER NULL, -- Límite específico por tipo
    requires_payment BOOLEAN DEFAULT false,
    payment_amount DECIMAL(10, 2) NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Tabla para disponibilidad de horarios generada
CREATE TABLE tenant_available_time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    agent_id UUID NULL, -- Agente asignado a este slot (si aplica)
    location_id UUID NULL, -- Ubicación (si aplica)
    appointment_type_id UUID NULL, -- Tipo de cita (si aplica)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_slot_time CHECK (start_time < end_time)
);

-- Tabla para citas
CREATE TABLE tenant_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_type_id UUID REFERENCES tenant_appointment_types(id) ON DELETE SET NULL,
    location_id UUID NULL REFERENCES tenant_business_locations(id) ON DELETE SET NULL,
    customer_id UUID NULL, -- Cliente existente (si está registrado)
    agent_id UUID NULL, -- Agente o empleado asignado
    lead_id UUID NULL, -- Referencia a un lead (si proviene del sales funnel)
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    notes TEXT,
    customer_name VARCHAR(255), -- Nombre del cliente (para clientes no registrados)
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    reminder_sent BOOLEAN DEFAULT false,
    qr_code TEXT, -- URL o datos del código QR
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_appointment_time CHECK (start_time < end_time)
);

-- Habilitamos RLS para todas las tablas
ALTER TABLE tenant_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_business_hours_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_appointment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_available_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_appointments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para horarios de negocio
CREATE POLICY "Administradores pueden gestionar horarios de su tenant"
ON tenant_business_hours
FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
);

CREATE POLICY "Usuarios pueden ver horarios de su tenant"
ON tenant_business_hours
FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas RLS para excepciones de horarios
CREATE POLICY "Administradores pueden gestionar excepciones de su tenant"
ON tenant_business_hours_exceptions
FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
);

CREATE POLICY "Usuarios pueden ver excepciones de su tenant"
ON tenant_business_hours_exceptions
FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas RLS para configuración de citas
CREATE POLICY "Administradores pueden gestionar configuración de citas de su tenant"
ON tenant_appointment_settings
FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
);

CREATE POLICY "Usuarios pueden ver configuración de citas de su tenant"
ON tenant_appointment_settings
FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas RLS para localizaciones
CREATE POLICY "Administradores pueden gestionar localizaciones de su tenant"
ON tenant_business_locations
FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
);

CREATE POLICY "Usuarios pueden ver localizaciones de su tenant"
ON tenant_business_locations
FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas RLS para tipos de cita
CREATE POLICY "Administradores pueden gestionar tipos de cita de su tenant"
ON tenant_appointment_types
FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
);

CREATE POLICY "Usuarios pueden ver tipos de cita de su tenant"
ON tenant_appointment_types
FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas RLS para slots disponibles
CREATE POLICY "Administradores pueden gestionar slots disponibles de su tenant"
ON tenant_available_time_slots
FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
);

CREATE POLICY "Usuarios pueden ver slots disponibles de su tenant"
ON tenant_available_time_slots
FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
);

-- Políticas RLS para citas
CREATE POLICY "Administradores pueden gestionar citas de su tenant"
ON tenant_appointments
FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
);

CREATE POLICY "Agentes pueden ver y actualizar sus citas asignadas"
ON tenant_appointments
FOR SELECT USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND (
        agent_id = auth.uid() 
        OR 
        auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
    )
);

CREATE POLICY "Agentes pueden actualizar sus citas asignadas"
ON tenant_appointments
FOR UPDATE USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND (
        agent_id = auth.uid() 
        OR 
        auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'manager')
    )
);

-- Triggers para actualizar el campo updated_at
CREATE TRIGGER update_tenant_business_hours_modtime
BEFORE UPDATE ON tenant_business_hours
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_business_hours_exceptions_modtime
BEFORE UPDATE ON tenant_business_hours_exceptions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_appointment_settings_modtime
BEFORE UPDATE ON tenant_appointment_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_business_locations_modtime
BEFORE UPDATE ON tenant_business_locations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_appointment_types_modtime
BEFORE UPDATE ON tenant_appointment_types
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_available_time_slots_modtime
BEFORE UPDATE ON tenant_available_time_slots
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tenant_appointments_modtime
BEFORE UPDATE ON tenant_appointments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Crear datos iniciales de ejemplo
INSERT INTO tenant_business_hours (
    tenant_id,
    day_of_week,
    open_time,
    close_time,
    is_closed
) VALUES (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    1, -- Lunes
    '09:00', -- 9 AM
    '18:00', -- 6 PM
    false
), (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    2, -- Martes
    '09:00', -- 9 AM
    '18:00', -- 6 PM
    false
), (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    3, -- Miércoles
    '09:00', -- 9 AM
    '18:00', -- 6 PM
    false
), (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    4, -- Jueves
    '09:00', -- 9 AM
    '18:00', -- 6 PM
    false
), (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    5, -- Viernes
    '09:00', -- 9 AM
    '17:00', -- 5 PM
    false
), (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    6, -- Sábado
    '10:00', -- 10 AM
    '14:00', -- 2 PM
    false
), (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    0, -- Domingo
    '00:00', -- No importa la hora si está cerrado
    '00:00',
    true -- Cerrado
);

-- Crear configuración de citas para el tenant de demo
INSERT INTO tenant_appointment_settings (
    tenant_id,
    appointment_duration,
    buffer_time,
    max_daily_appointments,
    min_notice_minutes,
    max_future_days,
    require_approval,
    reminder_time_hours
) VALUES (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    45, -- Duración predeterminada: 45 minutos
    15, -- Buffer entre citas: 15 minutos
    10, -- Máximo 10 citas por día
    120, -- Mínimo 2 horas de antelación
    30, -- Reservas hasta 30 días en el futuro
    false, -- No requiere aprobación manual
    24 -- Recordatorio 24h antes
);

-- Crear tipos de cita para el tenant de demo
INSERT INTO tenant_appointment_types (
    tenant_id,
    name,
    description,
    duration,
    color,
    buffer_time,
    is_active,
    booking_url_suffix
) VALUES (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    'Consulta Inicial',
    'Primera consulta para evaluar necesidades del cliente',
    60, -- 60 minutos
    '#4caf50', -- Verde
    15, -- 15 minutos de buffer
    true,
    'consulta-inicial'
), (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    'Seguimiento',
    'Cita de seguimiento para clientes existentes',
    30, -- 30 minutos
    '#2196f3', -- Azul
    10, -- 10 minutos de buffer
    true,
    'seguimiento'
), (
    (SELECT id FROM tenants WHERE code = 'pymebot_demo' LIMIT 1),
    'Demo de Producto',
    'Demostración detallada de productos',
    45, -- 45 minutos
    '#ff9800', -- Naranja
    15, -- 15 minutos de buffer
    true,
    'demo-producto'
);