-- Script seguro para corregir leads que tienen su ID como número de teléfono
-- Este script incluye mejores validaciones y manejo de casos especiales

-- Primero, mostrar qué se va a actualizar
SELECT 
    id,
    full_name,
    phone as phone_actual,
    '+52 ' || substring(id::text, 1, 3) || ' ' || substring(id::text, 4, 3) || ' ' || substring(id::text, 7, 4) as phone_nuevo
FROM leads
WHERE phone = id::text;

-- Actualizar solo el lead específico mencionado en el reporte
UPDATE leads
SET 
    phone = CASE 
        WHEN phone = id::text THEN '+52 ' || substring(id::text, 1, 3) || ' ' || substring(id::text, 4, 3) || ' ' || substring(id::text, 7, 4)
        ELSE phone
    END,
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{phone_fixed}',
        jsonb_build_object(
            'original_value', phone,
            'fixed_at', now()::text,
            'reason', 'phone_was_id'
        )
    ),
    updated_at = now()
WHERE id = 'a160b432-02b9-42dd-b6fa-679161b0dd85'
AND phone = id::text;

-- Verificar el resultado
SELECT 
    id,
    full_name,
    phone,
    metadata->'phone_fixed' as fix_details
FROM leads
WHERE id = 'a160b432-02b9-42dd-b6fa-679161b0dd85';

-- Para actualizar TODOS los leads con este problema (usar con precaución):
/*
UPDATE leads
SET 
    phone = '+52 ' || substring(id::text, 1, 3) || ' ' || substring(id::text, 4, 3) || ' ' || substring(id::text, 7, 4),
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{phone_fixed}',
        jsonb_build_object(
            'original_value', phone,
            'fixed_at', now()::text,
            'reason', 'phone_was_id'
        )
    ),
    updated_at = now()
WHERE phone = id::text
RETURNING id, full_name, phone;
*/