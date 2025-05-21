-- Script para diagnosticar leads duplicados
-- Ejecutar en Supabase SQL Editor

-- 1. Buscar IDs duplicados
SELECT 
    id,
    COUNT(*) as count,
    STRING_AGG(full_name, ', ') as names,
    STRING_AGG(email, ', ') as emails,
    STRING_AGG(stage, ', ') as stages,
    STRING_AGG(tenant_id::text, ', ') as tenants
FROM leads
GROUP BY id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Ver detalles de un ID específico duplicado
-- Reemplazar 'ID_AQUI' con el ID que aparezca duplicado
/*
SELECT 
    id,
    full_name,
    email,
    phone,
    stage,
    tenant_id,
    created_at,
    updated_at
FROM leads
WHERE id = 'ID_AQUI'
ORDER BY created_at;
*/

-- 3. Buscar por email duplicado
SELECT 
    email,
    COUNT(*) as count,
    STRING_AGG(id, ', ') as ids,
    STRING_AGG(full_name, ', ') as names,
    STRING_AGG(stage, ', ') as stages
FROM leads
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 4. Verificar constraints únicos
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'leads'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- 5. Ver índices en la tabla leads
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads';

-- 6. Contar total de leads por tenant
SELECT 
    tenant_id,
    COUNT(*) as total_leads,
    COUNT(DISTINCT id) as unique_ids,
    COUNT(*) - COUNT(DISTINCT id) as duplicates
FROM leads
GROUP BY tenant_id
ORDER BY duplicates DESC;

-- 7. Buscar leads con metadata que contenga original_lead_id
SELECT 
    id,
    full_name,
    email,
    stage,
    metadata->>'original_lead_id' as original_lead_id
FROM leads
WHERE metadata ? 'original_lead_id'
ORDER BY created_at DESC
LIMIT 20;