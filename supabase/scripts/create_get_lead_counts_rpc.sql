-- Función RPC para obtener conteo de leads por etapa
-- Esta función evita las limitaciones de RLS y ofrece un conteo consistente

CREATE OR REPLACE FUNCTION get_lead_counts_by_stage(
  p_tenant_id UUID,
  p_include_closed BOOLEAN DEFAULT false,
  p_include_deleted BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verificar permisos (sólo usuarios del tenant o superadmin)
  IF NOT (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND tenant_id = p_tenant_id
    ) OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    )
  ) THEN
    RAISE EXCEPTION 'Permisos insuficientes para ver leads del tenant %', p_tenant_id;
  END IF;

  -- Realizar conteo con criterios normalizados
  WITH stage_counts AS (
    SELECT
      CASE 
        WHEN stage = 'nuevos' THEN 'new'
        WHEN stage = 'prospectando' THEN 'prospecting'
        WHEN stage = 'calificacion' OR stage = 'calificación' THEN 'qualification'
        WHEN stage = 'oportunidad' THEN 'opportunity'
        WHEN stage = 'confirmado' THEN 'confirmed'
        WHEN stage = 'cerrado' THEN 'closed'
        WHEN stage IS NULL THEN 'undefined'
        ELSE stage
      END AS normalized_stage,
      COUNT(*) AS count
    FROM leads
    WHERE 
      tenant_id = p_tenant_id
      AND (p_include_deleted OR is_deleted = false)
      AND (p_include_closed OR NOT (status = 'closed' OR stage = 'cerrado' OR stage = 'closed'))
    GROUP BY normalized_stage
  ),
  -- Asegurar que todas las etapas estén representadas
  all_stages AS (
    SELECT 'new' AS stage
    UNION SELECT 'prospecting'
    UNION SELECT 'qualification'
    UNION SELECT 'opportunity'
    UNION SELECT 'confirmed'
    UNION SELECT 'closed'
  ),
  -- Combinar conteos reales con etapas predefinidas
  final_counts AS (
    SELECT
      all_stages.stage,
      COALESCE(stage_counts.count, 0) AS count
    FROM
      all_stages
      LEFT JOIN stage_counts ON all_stages.stage = stage_counts.normalized_stage
  ),
  -- Calcular total
  total_count AS (
    SELECT SUM(count) AS total FROM stage_counts
  )
  
  -- Construir JSON de resultado
  SELECT json_build_object(
    'new', (SELECT count FROM final_counts WHERE stage = 'new'),
    'prospecting', (SELECT count FROM final_counts WHERE stage = 'prospecting'),
    'qualification', (SELECT count FROM final_counts WHERE stage = 'qualification'),
    'opportunity', (SELECT count FROM final_counts WHERE stage = 'opportunity'),
    'confirmed', (SELECT count FROM final_counts WHERE stage = 'confirmed'),
    'closed', (SELECT count FROM final_counts WHERE stage = 'closed'),
    'total', (SELECT total FROM total_count)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejemplo de uso:
-- SELECT get_lead_counts_by_stage('tenant-uuid-aquí');
-- SELECT get_lead_counts_by_stage('tenant-uuid-aquí', true, false); -- incluir cerrados
-- SELECT get_lead_counts_by_stage('tenant-uuid-aquí', false, true); -- incluir eliminados