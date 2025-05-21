-- Script para verificar y diagnosticar problemas con números de teléfono en leads

-- 1. Mostrar leads donde el teléfono es igual al ID
SELECT 
    id,
    full_name,
    phone,
    email,
    created_at,
    metadata
FROM leads
WHERE phone = id::text
ORDER BY created_at DESC;

-- 2. Mostrar el lead específico mencionado en el problema
SELECT 
    id,
    full_name,
    phone,
    email,
    stage,
    metadata
FROM leads
WHERE id = 'a160b432-02b9-42dd-b6fa-679161b0dd85';

-- 3. Contar cuántos leads tienen problemas de teléfono (vacío, igual al ID, o valores inválidos)
SELECT 
    COUNT(*) FILTER (WHERE phone IS NULL OR phone = '') as empty_phones,
    COUNT(*) FILTER (WHERE phone = id::text) as phone_equals_id,
    COUNT(*) FILTER (WHERE phone NOT LIKE '+%' AND phone NOT LIKE '5%') as invalid_format,
    COUNT(*) as total_leads
FROM leads;

-- 4. Ver muestra de leads con diferentes problemas de teléfono
SELECT 
    CASE 
        WHEN phone IS NULL OR phone = '' THEN 'empty'
        WHEN phone = id::text THEN 'equals_id'
        WHEN phone NOT LIKE '+%' AND phone NOT LIKE '5%' THEN 'invalid_format'
        ELSE 'ok'
    END as phone_status,
    COUNT(*) as count,
    array_agg(id ORDER BY created_at DESC LIMIT 5) as sample_ids
FROM leads
GROUP BY phone_status;