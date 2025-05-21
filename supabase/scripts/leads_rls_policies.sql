-- Políticas RLS para la tabla leads
-- Estas políticas aseguran que cada tenant solo vea sus propios leads

-- Primero, eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Tenants pueden ver sus propios leads" ON leads;
DROP POLICY IF EXISTS "Tenants pueden insertar leads con su tenant_id" ON leads;
DROP POLICY IF EXISTS "Tenants pueden actualizar sus propios leads" ON leads;
DROP POLICY IF EXISTS "Tenants pueden eliminar sus propios leads" ON leads;

-- Habilitar RLS en la tabla
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener el tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_tenant_id UUID;
BEGIN
    -- Obtener el tenant_id del usuario autenticado
    SELECT tenant_id INTO user_tenant_id
    FROM users
    WHERE id = auth.uid();
    
    RETURN user_tenant_id;
END;
$$;

-- Política SELECT: Los usuarios solo pueden ver leads de su tenant
CREATE POLICY "Tenants pueden ver sus propios leads"
ON leads
FOR SELECT
TO authenticated
USING (
    tenant_id = get_user_tenant_id()
    OR
    -- Los superadmins pueden ver todos los leads
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política INSERT: Los usuarios solo pueden crear leads con su tenant_id
CREATE POLICY "Tenants pueden insertar leads con su tenant_id"
ON leads
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = get_user_tenant_id()
    OR
    -- Los superadmins pueden crear leads para cualquier tenant
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política UPDATE: Los usuarios solo pueden actualizar leads de su tenant
CREATE POLICY "Tenants pueden actualizar sus propios leads"
ON leads
FOR UPDATE
TO authenticated
USING (
    tenant_id = get_user_tenant_id()
    OR
    -- Los superadmins pueden actualizar cualquier lead
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
)
WITH CHECK (
    tenant_id = get_user_tenant_id()
    OR
    -- Los superadmins pueden actualizar cualquier lead
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política DELETE: Los usuarios solo pueden eliminar leads de su tenant
CREATE POLICY "Tenants pueden eliminar sus propios leads"
ON leads
FOR DELETE
TO authenticated
USING (
    tenant_id = get_user_tenant_id()
    OR
    -- Los superadmins pueden eliminar cualquier lead
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Crear índice para mejorar el rendimiento de las consultas por tenant_id
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);

-- Comentarios
COMMENT ON FUNCTION get_user_tenant_id() IS 'Obtiene el tenant_id del usuario autenticado actual';
COMMENT ON POLICY "Tenants pueden ver sus propios leads" ON leads IS 'Permite a los usuarios ver solo los leads de su tenant';
COMMENT ON POLICY "Tenants pueden insertar leads con su tenant_id" ON leads IS 'Permite a los usuarios crear leads solo para su tenant';
COMMENT ON POLICY "Tenants pueden actualizar sus propios leads" ON leads IS 'Permite a los usuarios actualizar solo los leads de su tenant';
COMMENT ON POLICY "Tenants pueden eliminar sus propios leads" ON leads IS 'Permite a los usuarios eliminar solo los leads de su tenant';