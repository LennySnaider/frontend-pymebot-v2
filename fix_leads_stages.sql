-- Script para corregir las inconsistencias en las etapas de los leads
-- y explicar la diferencia entre el chat y el sales funnel

-- 1. Ver las etapas actuales y su distribución
SELECT 
    stage, 
    COUNT(*) as count,
    CASE 
        WHEN stage IN ('new', 'prospecting', 'qualification', 'opportunity') THEN 'Visible en funnel'
        ELSE 'NO visible en funnel'
    END as visibilidad
FROM leads
GROUP BY stage
ORDER BY count DESC;

-- 2. Identificar leads con etapa "nuevos" que deberían ser "new"
SELECT 
    id, 
    full_name, 
    stage, 
    status
FROM leads
WHERE stage = 'nuevos';

-- 3. Corregir las etapas "nuevos" a "new"
UPDATE leads
SET 
    stage = 'new',
    updated_at = CURRENT_TIMESTAMP
WHERE stage = 'nuevos';

-- 4. Verificar la corrección
SELECT 
    stage, 
    COUNT(*) as count,
    CASE 
        WHEN stage IN ('new', 'prospecting', 'qualification', 'opportunity') THEN 'Visible en funnel'
        ELSE 'NO visible en funnel'
    END as visibilidad
FROM leads
GROUP BY stage
ORDER BY count DESC;

-- 5. Para el chat: contar TODOS los leads
SELECT COUNT(*) as total_leads_in_chat
FROM leads;

-- 6. Para el sales funnel: contar solo los leads que pasarían los filtros
WITH funnel_leads AS (
    SELECT *
    FROM leads
    WHERE 
        status != 'closed' 
        AND stage != 'closed'
        AND (metadata->>'removed_from_funnel' IS NULL OR metadata->>'removed_from_funnel' != 'true')
        AND stage IN ('new', 'first_contact', 'prospecting', 'qualification', 'opportunity')
)
SELECT COUNT(*) as total_leads_in_funnel
FROM funnel_leads;

-- 7. Explicación detallada de la diferencia
WITH 
all_leads AS (SELECT COUNT(*) as total FROM leads),
funnel_visible AS (
    SELECT COUNT(*) as visible 
    FROM leads
    WHERE 
        status != 'closed' 
        AND stage != 'closed'
        AND (metadata->>'removed_from_funnel' IS NULL OR metadata->>'removed_from_funnel' != 'true')
        AND stage IN ('new', 'first_contact', 'prospecting', 'qualification', 'opportunity')
)
SELECT 
    al.total as "Total leads (Chat)",
    fv.visible as "Leads visibles (Sales Funnel)",
    al.total - fv.visible as "Diferencia",
    ROUND((fv.visible::numeric / al.total::numeric) * 100, 2) as "% Visible en Funnel"
FROM all_leads al, funnel_visible fv;

-- 8. Desglose detallado de leads excluidos
SELECT 
    full_name,
    stage,
    status,
    CASE
        WHEN status = 'closed' THEN 'Excluido: status=closed'
        WHEN stage = 'closed' THEN 'Excluido: stage=closed'
        WHEN metadata->>'removed_from_funnel' = 'true' THEN 'Excluido: removed_from_funnel=true'
        WHEN stage = 'confirmed' THEN 'Excluido: stage=confirmed (no visible)'
        WHEN stage NOT IN ('new', 'first_contact', 'prospecting', 'qualification', 'opportunity') THEN 'Excluido: stage no válido'
        ELSE 'Incluido en funnel'
    END as razon
FROM leads
WHERE 
    status = 'closed' 
    OR stage = 'closed'
    OR metadata->>'removed_from_funnel' = 'true'
    OR stage NOT IN ('new', 'first_contact', 'prospecting', 'qualification', 'opportunity')
ORDER BY razon, full_name;