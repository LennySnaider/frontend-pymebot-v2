-- Script para investigar la diferencia entre leads en chat vs sales funnel
-- El chat muestra 12 leads mientras que el sales funnel muestra 9

-- 1. Contar todos los leads
SELECT COUNT(*) as total_leads
FROM leads;

-- 2. Contar leads agrupados por stage
SELECT 
    stage, 
    COUNT(*) as count
FROM leads
GROUP BY stage
ORDER BY count DESC;

-- 3. Contar leads agrupados por status
SELECT 
    status, 
    COUNT(*) as count
FROM leads
GROUP BY status
ORDER BY count DESC;

-- 4. Verificar leads con status 'closed' (el sales funnel los excluye)
SELECT 
    id,
    full_name,
    stage,
    status,
    metadata
FROM leads
WHERE status = 'closed';

-- 5. Verificar leads con stage 'closed' (el sales funnel los excluye)
SELECT 
    id,
    full_name,
    stage,
    status,
    metadata
FROM leads
WHERE stage = 'closed';

-- 6. Verificar leads con metadata.removed_from_funnel = true
SELECT 
    id,
    full_name,
    stage,
    status,
    metadata,
    metadata->>'removed_from_funnel' as removed_from_funnel
FROM leads
WHERE metadata->>'removed_from_funnel' = 'true';

-- 7. Contar leads que SÍ aparecerían en el sales funnel
-- (excluyendo los que tienen status='closed' O stage='closed' O metadata.removed_from_funnel=true)
SELECT COUNT(*) as leads_en_funnel
FROM leads
WHERE 
    status != 'closed' 
    AND stage != 'closed'
    AND (metadata->>'removed_from_funnel' IS NULL OR metadata->>'removed_from_funnel' != 'true');

-- 8. Listar todos los leads que NO aparecerían en el sales funnel
SELECT 
    id,
    full_name,
    stage,
    status,
    metadata,
    CASE 
        WHEN status = 'closed' THEN 'Excluido por status=closed'
        WHEN stage = 'closed' THEN 'Excluido por stage=closed'
        WHEN metadata->>'removed_from_funnel' = 'true' THEN 'Excluido por metadata.removed_from_funnel=true'
        ELSE 'No excluido'
    END as razon_exclusion
FROM leads
WHERE 
    status = 'closed' 
    OR stage = 'closed'
    OR metadata->>'removed_from_funnel' = 'true';

-- 9. Verificar si el chat está contando todos los leads sin filtrar
-- Este sería el count que posiblemente use el chat
SELECT COUNT(*) as leads_total_sin_filtros
FROM leads;

-- 10. Verificar la diferencia exacta entre el total y los que aparecen en el funnel
WITH
leads_totales AS (
    SELECT COUNT(*) as total FROM leads
),
leads_funnel AS (
    SELECT COUNT(*) as en_funnel 
    FROM leads
    WHERE 
        status != 'closed' 
        AND stage != 'closed'
        AND (metadata->>'removed_from_funnel' IS NULL OR metadata->>'removed_from_funnel' != 'true')
)
SELECT 
    lt.total as leads_en_chat,
    lf.en_funnel as leads_en_funnel,
    lt.total - lf.en_funnel as diferencia
FROM leads_totales lt, leads_funnel lf;

-- 11. Debug completo de todos los leads para análisis manual
SELECT 
    id,
    full_name,
    stage,
    status,
    metadata,
    created_at,
    CASE 
        WHEN status = 'closed' OR stage = 'closed' OR metadata->>'removed_from_funnel' = 'true' 
        THEN 'NO aparece en funnel'
        ELSE 'SÍ aparece en funnel'
    END as en_funnel
FROM leads
ORDER BY created_at DESC;

-- 12. Verificar qué etapas están siendo mostradas en el sales funnel
-- Según el código, solo muestra: 'new', 'prospecting', 'qualification', 'opportunity'
SELECT 
    stage,
    COUNT(*) as count,
    CASE 
        WHEN stage IN ('new', 'first_contact', 'prospecting', 'qualification', 'opportunity') 
        THEN 'Mostrado en funnel'
        ELSE 'NO mostrado en funnel'
    END as visibilidad
FROM leads
WHERE 
    status != 'closed' 
    AND stage != 'closed'
    AND (metadata->>'removed_from_funnel' IS NULL OR metadata->>'removed_from_funnel' != 'true')
GROUP BY stage
ORDER BY count DESC;

-- 13. Verificar si hay leads con stage = null o vacío
SELECT 
    id,
    full_name,
    stage,
    status,
    metadata
FROM leads
WHERE stage IS NULL OR stage = '';

-- 14. Contar leads agrupados por chatType que podría usar el chat
-- Verificar si existe un campo o metadata que indique el tipo de chat
SELECT 
    metadata->>'chatType' as chat_type,
    COUNT(*) as count
FROM leads
GROUP BY metadata->>'chatType';

-- 15. Verificar qué filtros está aplicando específicamente el chat
-- Según el código del ChatList, filtra por selectedChatType === item.chatType
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN metadata->>'chatType' = 'personal' THEN 1 END) as personal_chat,
    COUNT(CASE WHEN stage IN ('new', 'first_contact', 'prospecting', 'qualification', 'opportunity') THEN 1 END) as leads_etapas_validas,
    COUNT(CASE WHEN 
        status != 'closed' 
        AND stage != 'closed'
        AND (metadata->>'removed_from_funnel' IS NULL OR metadata->>'removed_from_funnel' != 'true')
        AND stage IN ('new', 'first_contact', 'prospecting', 'qualification', 'opportunity')
    THEN 1 END) as leads_en_funnel_final
FROM leads;