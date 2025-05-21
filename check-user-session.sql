-- Verificar el usuario actual y sus permisos
SELECT 
    auth.uid() as user_id,
    auth.role() as user_role,
    current_user,
    session_user;

-- Verificar políticas RLS en la tabla leads
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;