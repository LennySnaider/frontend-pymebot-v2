-- Query definitiva para buscar el lead problemático
-- Ejecutar en Supabase SQL Editor

-- 1. Buscar por ID directo (UUID)
SELECT 
    id,
    full_name,
    stage,
    tenant_id,
    metadata,
    created_at,
    updated_at
FROM leads
WHERE id = '605ff65b-0920-480c-aace-0a3ca33b53ca'::uuid;

-- 2. Buscar en el JSONB metadata usando operadores específicos de PostgreSQL
SELECT 
    id,
    full_name,
    stage,
    tenant_id,
    metadata,
    metadata->>'original_lead_id' as original_id,
    metadata->>'db_id' as db_id,
    metadata->>'real_id' as real_id,
    created_at
FROM leads
WHERE 
    metadata @> '{"original_lead_id": "605ff65b-0920-480c-aace-0a3ca33b53ca"}'::jsonb
    OR metadata @> '{"db_id": "605ff65b-0920-480c-aace-0a3ca33b53ca"}'::jsonb
    OR metadata @> '{"real_id": "605ff65b-0920-480c-aace-0a3ca33b53ca"}'::jsonb;

-- 3. Buscar con LIKE en el texto del JSONB (más lento pero más completo)
SELECT 
    id,
    full_name,
    stage,
    metadata
FROM leads
WHERE metadata::text LIKE '%605ff65b-0920-480c-aace-0a3ca33b53ca%';

-- 4. Ver los últimos 20 leads para entender la estructura
SELECT 
    id,
    full_name,
    stage,
    metadata,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 20;

-- 5. Analizar la estructura del metadata en leads recientes
SELECT 
    id,
    full_name,
    jsonb_pretty(metadata) as metadata_pretty,
    created_at
FROM leads
WHERE metadata IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 6. Buscar leads con estructura similar en metadata
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN metadata ? 'original_lead_id' THEN 1 END) as con_original_id,
    COUNT(CASE WHEN metadata ? 'db_id' THEN 1 END) as con_db_id,
    COUNT(CASE WHEN metadata ? 'real_id' THEN 1 END) as con_real_id
FROM leads;

-- 7. Buscar leads sin metadata o con metadata vacío
SELECT 
    id,
    full_name,
    stage,
    CASE 
        WHEN metadata IS NULL THEN 'NULL'
        WHEN metadata = '{}'::jsonb THEN 'EMPTY'
        ELSE 'HAS_DATA'
    END as metadata_status
FROM leads
WHERE metadata IS NULL OR metadata = '{}'::jsonb
LIMIT 10;