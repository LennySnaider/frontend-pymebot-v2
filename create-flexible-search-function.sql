-- Función para búsqueda flexible de leads por cualquier ID
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION find_lead_by_any_id(search_id TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    stage TEXT,
    tenant_id UUID,
    metadata JSONB,
    found_by TEXT
) AS $$
BEGIN
    -- Primero intentar conversión a UUID si es posible
    BEGIN
        -- Buscar por ID directo
        RETURN QUERY
        SELECT 
            l.id,
            l.full_name,
            l.stage,
            l.tenant_id,
            l.metadata,
            'direct_id'::TEXT as found_by
        FROM leads l
        WHERE l.id = search_id::UUID
        LIMIT 1;
        
        IF FOUND THEN
            RETURN;
        END IF;
    EXCEPTION
        WHEN invalid_text_representation THEN
            -- El search_id no es un UUID válido, continuar con otras búsquedas
            NULL;
    END;
    
    -- Buscar en metadata->original_lead_id
    RETURN QUERY
    SELECT 
        l.id,
        l.full_name,
        l.stage,
        l.tenant_id,
        l.metadata,
        'metadata_original_id'::TEXT as found_by
    FROM leads l
    WHERE l.metadata->>'original_lead_id' = search_id
    LIMIT 1;
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Buscar en metadata->db_id
    RETURN QUERY
    SELECT 
        l.id,
        l.full_name,
        l.stage,
        l.tenant_id,
        l.metadata,
        'metadata_db_id'::TEXT as found_by
    FROM leads l
    WHERE l.metadata->>'db_id' = search_id
    LIMIT 1;
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Buscar en metadata->real_id
    RETURN QUERY
    SELECT 
        l.id,
        l.full_name,
        l.stage,
        l.tenant_id,
        l.metadata,
        'metadata_real_id'::TEXT as found_by
    FROM leads l
    WHERE l.metadata->>'real_id' = search_id
    LIMIT 1;
    
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Buscar con LIKE en todo el metadata
    RETURN QUERY
    SELECT 
        l.id,
        l.full_name,
        l.stage,
        l.tenant_id,
        l.metadata,
        'metadata_like'::TEXT as found_by
    FROM leads l
    WHERE l.metadata::TEXT LIKE '%' || search_id || '%'
    LIMIT 1;
    
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM find_lead_by_any_id('605ff65b-0920-480c-aace-0a3ca33b53ca');

-- Función para actualizar stage con búsqueda flexible
CREATE OR REPLACE FUNCTION update_lead_stage_flexible(
    search_id TEXT,
    new_stage TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    lead_id UUID,
    old_stage TEXT,
    new_stage TEXT,
    message TEXT
) AS $$
DECLARE
    found_lead RECORD;
BEGIN
    -- Buscar el lead usando la función flexible
    SELECT * INTO found_lead 
    FROM find_lead_by_any_id(search_id)
    LIMIT 1;
    
    -- Si no se encontró el lead
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            FALSE,
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            'Lead no encontrado con ID: ' || search_id;
        RETURN;
    END IF;
    
    -- Actualizar el stage del lead encontrado
    UPDATE leads
    SET 
        stage = new_stage,
        updated_at = NOW()
    WHERE id = found_lead.id;
    
    -- Retornar resultado exitoso
    RETURN QUERY
    SELECT 
        TRUE,
        found_lead.id,
        found_lead.stage,
        new_stage,
        'Lead actualizado exitosamente (encontrado por: ' || found_lead.found_by || ')';
END;
$$ LANGUAGE plpgsql;

-- Ejemplo de uso:
-- SELECT * FROM update_lead_stage_flexible('605ff65b-0920-480c-aace-0a3ca33b53ca', 'qualification');