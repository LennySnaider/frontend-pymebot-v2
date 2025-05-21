-- =====================================================
-- POLÍTICAS RLS COMPLETAS PARA EL SISTEMA MULTITENANCY
-- =====================================================

-- 1. TABLA USERS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users pueden ver miembros de su tenant" ON users;
DROP POLICY IF EXISTS "Users pueden actualizar su propio perfil" ON users;
DROP POLICY IF EXISTS "Admins pueden crear usuarios en su tenant" ON users;
DROP POLICY IF EXISTS "Superadmins tienen acceso total" ON users;

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Ver usuarios del mismo tenant
CREATE POLICY "Users pueden ver miembros de su tenant"
ON users
FOR SELECT
TO authenticated
USING (
    -- Los usuarios pueden ver usuarios de su mismo tenant
    tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    OR
    -- Los superadmins pueden ver todos los usuarios
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política UPDATE: Actualizar propio perfil
CREATE POLICY "Users pueden actualizar su propio perfil"
ON users
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
    OR
    -- Los admins pueden actualizar usuarios de su tenant
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND tenant_id = users.tenant_id
    )
    OR
    -- Los superadmins pueden actualizar cualquier usuario
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
)
WITH CHECK (
    -- Mantener el mismo tenant_id
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR
    -- Los superadmins pueden cambiar tenant_id
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política INSERT: Solo admins pueden crear usuarios
CREATE POLICY "Admins pueden crear usuarios en su tenant"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
    -- Los admins pueden crear usuarios en su tenant
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
    )
    AND
    -- El nuevo usuario debe pertenecer al mismo tenant
    (
        tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
        OR
        -- Los superadmins pueden crear usuarios en cualquier tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'superadmin'
        )
    )
);

-- 2. TABLA LEADS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Tenants pueden ver sus propios leads" ON leads;
DROP POLICY IF EXISTS "Tenants pueden insertar leads con su tenant_id" ON leads;
DROP POLICY IF EXISTS "Tenants pueden actualizar sus propios leads" ON leads;
DROP POLICY IF EXISTS "Tenants pueden eliminar sus propios leads" ON leads;

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener el tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- Política SELECT: Ver leads del tenant
CREATE POLICY "Tenants pueden ver sus propios leads"
ON leads
FOR SELECT
TO authenticated
USING (
    tenant_id = get_user_tenant_id()
    OR
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política INSERT: Crear leads en el tenant
CREATE POLICY "Tenants pueden insertar leads con su tenant_id"
ON leads
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = get_user_tenant_id()
    OR
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política UPDATE: Actualizar leads del tenant
CREATE POLICY "Tenants pueden actualizar sus propios leads"
ON leads
FOR UPDATE
TO authenticated
USING (
    tenant_id = get_user_tenant_id()
    OR
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
)
WITH CHECK (
    tenant_id = get_user_tenant_id()
    OR
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política DELETE: Eliminar leads del tenant
CREATE POLICY "Tenants pueden eliminar sus propios leads"
ON leads
FOR DELETE
TO authenticated
USING (
    tenant_id = get_user_tenant_id()
    OR
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- 3. TABLA TENANTS
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users pueden ver su propio tenant" ON tenants;
DROP POLICY IF EXISTS "Admins pueden actualizar su tenant" ON tenants;
DROP POLICY IF EXISTS "Solo superadmins pueden crear tenants" ON tenants;

-- Habilitar RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Ver propio tenant
CREATE POLICY "Users pueden ver su propio tenant"
ON tenants
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- Política UPDATE: Solo admins pueden actualizar
CREATE POLICY "Admins pueden actualizar su tenant"
ON tenants
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND tenant_id = tenants.id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND tenant_id = tenants.id
    )
);

-- Política INSERT: Solo superadmins
CREATE POLICY "Solo superadmins pueden crear tenants"
ON tenants
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'superadmin'
    )
);

-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_stage ON leads(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);

-- 5. COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION get_user_tenant_id() IS 'Obtiene el tenant_id del usuario autenticado actual';
COMMENT ON POLICY "Tenants pueden ver sus propios leads" ON leads IS 'Permite a los usuarios ver solo los leads de su tenant';
COMMENT ON POLICY "Users pueden ver miembros de su tenant" ON users IS 'Permite ver usuarios del mismo tenant';
COMMENT ON POLICY "Users pueden ver su propio tenant" ON tenants IS 'Permite ver información del propio tenant';