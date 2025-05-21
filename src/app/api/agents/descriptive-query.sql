-- Esta consulta ayuda a entender cómo está estructurada la tabla users
-- Ejecuta esta consulta en el SQL Editor de Supabase para entender la estructura de la tabla

-- Ver columnas de la tabla users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Ver algunos ejemplos de agentes
SELECT 
  id,
  CASE WHEN full_name IS NULL THEN 'NULL' ELSE 'present' END as has_full_name,
  CASE WHEN name IS NULL THEN 'NULL' ELSE 'present' END as has_name,
  email,
  role,
  tenant_id,
  created_at,
  status
FROM users 
WHERE role = 'agent' OR metadata->>'role' = 'agent'
LIMIT 5;

-- Contar usuarios por rol
SELECT 
  role,
  COUNT(*) as total
FROM users
GROUP BY role
ORDER BY total DESC;

-- Ver distribución de columnas para avatares/perfiles
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN profile_image IS NOT NULL THEN 1 ELSE 0 END) as with_profile_image,
  SUM(CASE WHEN img IS NOT NULL THEN 1 ELSE 0 END) as with_img,
  SUM(CASE WHEN avatar IS NOT NULL THEN 1 ELSE 0 END) as with_avatar
FROM users;