-- Script para corregir leads que tienen su ID como número de teléfono
-- Este problema puede ocurrir cuando se crea un lead sin número de teléfono real

-- Primero, verificar cuántos leads tienen este problema
SELECT COUNT(*) as leads_with_id_as_phone,
       array_agg(id) as affected_lead_ids
FROM leads
WHERE phone = id::text;

-- Actualizar los leads afectados con un número de teléfono temporal más realista
-- Usamos un formato de teléfono temporal que indica que necesita ser actualizado
UPDATE leads
SET phone = '+52 ' || substring(id::text, 1, 3) || ' ' || substring(id::text, 4, 3) || ' ' || substring(id::text, 7, 4),
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{original_phone_was_id}',
        'true'::jsonb
    ),
    updated_at = now()
WHERE phone = id::text;

-- Verificar el resultado
SELECT id, full_name, phone, metadata->>'original_phone_was_id' as was_id_as_phone
FROM leads
WHERE metadata->>'original_phone_was_id' = 'true';