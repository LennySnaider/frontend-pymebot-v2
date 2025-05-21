-- Verificar lead específico con su tenant
SELECT 
    id,
    full_name,
    tenant_id,
    stage,
    created_at,
    agent_id
FROM leads
WHERE id = 'b107965d-910f-4ce3-9f46-7f6f92da2f0f';

-- Verificar si hay usuarios con el tenant correcto
SELECT 
    id,
    email,
    tenant_id,
    role
FROM users
WHERE tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322'
ORDER BY created_at DESC
LIMIT 5;

-- Verificar estructura de la tabla appointments
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;