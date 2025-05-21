-- Script para buscar el lead que no se encuentra
-- Ejecutar en Supabase SQL Editor

-- 1. Buscar por ID directo
SELECT 
    id,
    full_name,
    stage,
    tenant_id,
    metadata,
    created_at
FROM leads
WHERE id = '605ff65b-0920-480c-aace-0a3ca33b53ca';

-- 2. Buscar en todos los campos JSON de metadata
SELECT 
    id,
    full_name,
    stage,
    tenant_id,
    metadata,
    metadata->>'original_lead_id' as original_lead_id,
    metadata->>'db_id' as db_id,
    metadata->>'real_id' as real_id,
    created_at
FROM leads
WHERE 
    metadata->>'original_lead_id' = '605ff65b-0920-480c-aace-0a3ca33b53ca'
    OR metadata->>'db_id' = '605ff65b-0920-480c-aace-0a3ca33b53ca'
    OR metadata->>'real_id' = '605ff65b-0920-480c-aace-0a3ca33b53ca';

-- 3. Buscar con LIKE para encontrar el ID en cualquier parte del JSON
SELECT 
    id,
    full_name,
    stage,
    metadata
FROM leads
WHERE metadata::text LIKE '%605ff65b-0920-480c-aace-0a3ca33b53ca%';

-- 4. Ver los últimos 10 leads creados para verificar estructura
SELECT 
    id,
    full_name,
    stage,
    metadata,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- 5. Buscar por nombre parcial si conocemos el nombre del lead
-- Reemplazar 'NOMBRE_AQUI' con el nombre del lead si lo conoces
/*
SELECT 
    id,
    full_name,
    stage,
    metadata
FROM leads
WHERE full_name ILIKE '%NOMBRE_AQUI%'
ORDER BY created_at DESC;
*/

-- 6. Contar total de leads por etapa para ver distribución
SELECT 
    stage,
    COUNT(*) as total,
    COUNT(CASE WHEN metadata IS NOT NULL THEN 1 END) as con_metadata,
    COUNT(CASE WHEN metadata->>'original_lead_id' IS NOT NULL THEN 1 END) as con_original_id,
    COUNT(CASE WHEN metadata->>'db_id' IS NOT NULL THEN 1 END) as con_db_id
FROM leads
GROUP BY stage
ORDER BY total DESC;