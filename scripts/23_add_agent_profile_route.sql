-- Script para actualizar las configuraciones necesarias para el perfil del agente
-- Este script solo agrega las rutas necesarias, no modifica configuraciones del menú

-- Verificar si existen las estadísticas en la tabla agents
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'agents'
ORDER BY ordinal_position;

-- Si es necesario, agregar columnas para estadísticas
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS leads_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS appointments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;

-- Crear vista para facilitar la consulta de datos del agente con sus estadísticas
CREATE OR REPLACE VIEW agent_profiles AS
SELECT 
    a.*,
    u.full_name,
    u.email,
    u.phone,
    u.avatar_url,
    u.last_login,
    u.status,
    -- Contar leads activos del agente
    COALESCE((
        SELECT COUNT(*) 
        FROM leads l 
        WHERE l.agent_id = a.id 
        AND l.status = 'active'
    ), 0) as active_leads_count,
    -- Contar citas del agente
    COALESCE((
        SELECT COUNT(*) 
        FROM appointments ap 
        WHERE ap.agent_id = a.id
    ), 0) as total_appointments_count,
    -- Contar citas completadas
    COALESCE((
        SELECT COUNT(*) 
        FROM appointments ap 
        WHERE ap.agent_id = a.id 
        AND ap.status = 'completed'
    ), 0) as completed_appointments_count
FROM agents a
INNER JOIN users u ON a.user_id = u.id;

-- Actualizar los permisos para que los agentes puedan ver su propio perfil
CREATE POLICY "agents_can_view_own_profile" 
ON agents
FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND (u.role = 'admin' OR u.role = 'super_admin')
    )
);

-- Permitir que los agentes actualicen su propio perfil
CREATE POLICY "agents_can_update_own_profile" 
ON agents
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Agregar comentario documentando la nueva ruta
COMMENT ON TABLE agents IS 'Tabla de agentes. Los agentes pueden ver su perfil en /modules/agent-profile';

-- Crear función auxiliar para calcular estadísticas del agente
CREATE OR REPLACE FUNCTION get_agent_statistics(agent_id UUID)
RETURNS TABLE(
    leads_count BIGINT,
    appointments_count BIGINT,
    sales_count BIGINT,
    rating DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT l.id) as leads_count,
        COUNT(DISTINCT ap.id) as appointments_count,
        COUNT(DISTINCT CASE WHEN l.stage = 'closed' THEN l.id END) as sales_count,
        COALESCE(AVG(r.rating), 0.00) as rating
    FROM agents a
    LEFT JOIN leads l ON l.agent_id = a.id
    LEFT JOIN appointments ap ON ap.agent_id = a.id  
    LEFT JOIN reviews r ON r.agent_id = a.id
    WHERE a.id = agent_id
    GROUP BY a.id;
END;
$$ LANGUAGE plpgsql;