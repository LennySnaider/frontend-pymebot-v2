-- Script para verificar las políticas RLS actuales

-- 1. Verificar si RLS está habilitado en las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'leads', 'tenants')
ORDER BY tablename;

-- 2. Ver todas las políticas RLS existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'leads', 'tenants')
ORDER BY tablename, policyname;

-- 3. Verificar la función helper
SELECT 
    proname,
    prorettype::regtype,
    prosrc
FROM pg_proc
WHERE proname = 'get_user_tenant_id';

-- 4. Verificar índices
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'leads', 'tenants')
ORDER BY tablename, indexname;

-- 5. Contar registros por tenant para verificar aislamiento
SELECT 
    'leads' as table_name,
    tenant_id,
    COUNT(*) as record_count
FROM leads
GROUP BY tenant_id

UNION ALL

SELECT 
    'users' as table_name,
    tenant_id,
    COUNT(*) as record_count
FROM users
GROUP BY tenant_id

ORDER BY table_name, tenant_id;