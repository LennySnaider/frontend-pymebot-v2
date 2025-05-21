-- Script para verificar estructura de la tabla leads
-- y crear leads reales con datos seed

-- 1. Verificar estructura actual de la tabla leads
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 2. Ver las restricciones de la tabla
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    rc.update_rule,
    rc.delete_rule,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
    AND rc.unique_constraint_schema = ccu.constraint_schema
WHERE tc.table_name = 'leads'
ORDER BY tc.constraint_type, tc.constraint_name;