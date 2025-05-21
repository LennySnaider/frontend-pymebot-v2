-- Funciones RPC para el sistema de propiedades inmobiliarias
-- Estas funciones permiten saltar las restricciones de RLS para operaciones críticas

-- Función para obtener una propiedad destacada para un tenant específico
CREATE OR REPLACE FUNCTION get_featured_property_for_tenant(
  p_tenant_id UUID,
  p_property_type TEXT DEFAULT NULL
)
RETURNS SETOF properties AS $$
DECLARE
  v_property properties;
  v_normalized_type TEXT;
  v_alternative_types TEXT[];
BEGIN
  -- Normalizar el tipo de propiedad para manejar variaciones
  IF p_property_type IS NOT NULL THEN
    -- Convertir a minúsculas para normalización
    v_normalized_type := LOWER(p_property_type);
    
    -- Crear array de tipos alternativos basados en el tipo proporcionado
    IF v_normalized_type IN ('casa', 'house') THEN
      v_alternative_types := ARRAY['house', 'casa', 'House', 'Casa'];
    ELSIF v_normalized_type IN ('apartamento', 'apartment', 'departamento') THEN
      v_alternative_types := ARRAY['apartment', 'apartamento', 'departamento', 'Apartment', 'Apartamento'];
    ELSIF v_normalized_type IN ('oficina', 'office') THEN
      v_alternative_types := ARRAY['office', 'oficina', 'Office', 'Oficina'];
    ELSIF v_normalized_type IN ('local', 'commercial', 'comercial', 'local comercial') THEN
      v_alternative_types := ARRAY['commercial', 'local', 'comercial', 'local comercial', 'Commercial', 'Local'];
    ELSE
      -- Si no coincide con categorías conocidas, usar el valor original
      v_alternative_types := ARRAY[p_property_type];
    END IF;
  END IF;
  
  -- 1. Primero intentar obtener una propiedad destacada con algún tipo alternativo
  IF p_property_type IS NOT NULL THEN
    SELECT *
    INTO v_property
    FROM properties
    WHERE tenant_id = p_tenant_id
      AND is_active = true
      AND is_featured = true
      AND property_type = ANY(v_alternative_types)
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_property.id IS NOT NULL THEN
      RETURN NEXT v_property;
      RETURN;
    END IF;
  END IF;
  
  -- 2. Si no se encontró por tipo, buscar cualquier propiedad destacada
  -- pero solo si no se especificó un tipo (respetamos el filtro por tipo)
  IF p_property_type IS NULL THEN
    SELECT *
    INTO v_property
    FROM properties
    WHERE tenant_id = p_tenant_id
      AND is_active = true
      AND is_featured = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_property.id IS NOT NULL THEN
      RETURN NEXT v_property;
      RETURN;
    END IF;
  END IF;
  
  -- 3. Buscar cualquier propiedad activa del tipo indicado
  IF p_property_type IS NOT NULL THEN
    SELECT *
    INTO v_property
    FROM properties
    WHERE tenant_id = p_tenant_id
      AND is_active = true
      AND property_type = ANY(v_alternative_types)
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_property.id IS NOT NULL THEN
      RETURN NEXT v_property;
      RETURN;
    END IF;
  END IF;
  
  -- 4. Solo si no se especificó un tipo, como último recurso,
  -- buscar cualquier propiedad activa del tenant
  IF p_property_type IS NULL THEN
    SELECT *
    INTO v_property
    FROM properties
    WHERE tenant_id = p_tenant_id
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_property.id IS NOT NULL THEN
      RETURN NEXT v_property;
      RETURN;
    END IF;
  END IF;
  
  -- Si no se encuentra ninguna propiedad, devolver NULL (vacío)
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener una propiedad específica por ID
-- Renombrada para evitar conflictos con funciones existentes
CREATE OR REPLACE FUNCTION get_property_by_id_safe(
  p_id UUID,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS SETOF properties AS $$
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN QUERY
      SELECT *
      FROM properties
      WHERE id = p_id;
  ELSE
    RETURN QUERY
      SELECT *
      FROM properties
      WHERE id = p_id
        AND tenant_id = p_tenant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener propiedades para un tenant específico
CREATE OR REPLACE FUNCTION get_properties_for_tenant(
  p_tenant_id UUID,
  p_type TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS SETOF properties AS $$
DECLARE
  v_normalized_type TEXT;
  v_alternative_types TEXT[];
BEGIN
  -- Si no se especificó un tipo, devolver todas las propiedades activas
  IF p_type IS NULL THEN
    RETURN QUERY
      SELECT *
      FROM properties 
      WHERE tenant_id = p_tenant_id 
        AND is_active = true
      ORDER BY is_featured DESC, created_at DESC
      LIMIT p_limit;
  ELSE
    -- Normalizar el tipo para buscar variaciones
    v_normalized_type := LOWER(p_type);
    
    -- Crear array de tipos alternativos
    IF v_normalized_type IN ('casa', 'house') THEN
      v_alternative_types := ARRAY['house', 'casa', 'House', 'Casa'];
    ELSIF v_normalized_type IN ('apartamento', 'apartment', 'departamento') THEN
      v_alternative_types := ARRAY['apartment', 'apartamento', 'departamento', 'Apartment', 'Apartamento'];
    ELSIF v_normalized_type IN ('oficina', 'office') THEN
      v_alternative_types := ARRAY['office', 'oficina', 'Office', 'Oficina'];
    ELSIF v_normalized_type IN ('local', 'commercial', 'comercial', 'local comercial') THEN
      v_alternative_types := ARRAY['commercial', 'local', 'comercial', 'local comercial', 'Commercial', 'Local'];
    ELSE
      -- Si no coincide con categorías conocidas, usar el valor original
      v_alternative_types := ARRAY[p_type];
    END IF;
    
    -- Buscar propiedades que coincidan con cualquiera de los tipos alternativos
    RETURN QUERY
      SELECT *
      FROM properties 
      WHERE tenant_id = p_tenant_id 
        AND property_type = ANY(v_alternative_types)
        AND is_active = true
      ORDER BY is_featured DESC, created_at DESC
      LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para buscar propiedades por criterios más específicos
-- Reescrita para evitar problemas con parámetros dinámicos y manejar tipos de propiedad
CREATE OR REPLACE FUNCTION search_properties(
  p_tenant_id UUID,
  p_property_type TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_bedrooms INT DEFAULT NULL,
  p_min_bathrooms NUMERIC DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_search_text TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS SETOF properties AS $$
DECLARE
  v_normalized_type TEXT;
  v_alternative_types TEXT[];
BEGIN
  -- Normalizar el tipo de propiedad si se proporciona
  IF p_property_type IS NOT NULL THEN
    -- Convertir a minúsculas
    v_normalized_type := LOWER(p_property_type);
    
    -- Mapear tipos conocidos y sus variaciones
    IF v_normalized_type IN ('casa', 'house') THEN
      v_alternative_types := ARRAY['house', 'casa', 'House', 'Casa'];
    ELSIF v_normalized_type IN ('apartamento', 'apartment', 'departamento') THEN
      v_alternative_types := ARRAY['apartment', 'apartamento', 'departamento', 'Apartment', 'Apartamento'];
    ELSIF v_normalized_type IN ('oficina', 'office') THEN
      v_alternative_types := ARRAY['office', 'oficina', 'Office', 'Oficina'];
    ELSIF v_normalized_type IN ('local', 'commercial', 'comercial', 'local comercial') THEN
      v_alternative_types := ARRAY['commercial', 'local', 'comercial', 'local comercial', 'Commercial', 'Local'];
    ELSE
      -- Tipo desconocido, usar el original
      v_alternative_types := ARRAY[p_property_type];
    END IF;
  END IF;
  
  -- Usamos directamente los parámetros en lugar de construir una consulta dinámica
  RETURN QUERY 
    SELECT * FROM properties 
    WHERE tenant_id = p_tenant_id 
      AND is_active = true
      -- Aplicamos los filtros opcionales con condiciones
      AND (
          p_property_type IS NULL 
          OR 
          (v_alternative_types IS NOT NULL AND property_type = ANY(v_alternative_types))
      )
      AND (p_min_price IS NULL OR price >= p_min_price)
      AND (p_max_price IS NULL OR price <= p_max_price)
      AND (p_min_bedrooms IS NULL OR bedrooms >= p_min_bedrooms)
      AND (p_min_bathrooms IS NULL OR bathrooms >= p_min_bathrooms)
      AND (p_city IS NULL OR city ILIKE ('%' || p_city || '%'))
      AND (p_search_text IS NULL OR 
          title ILIKE ('%' || p_search_text || '%') OR
          description ILIKE ('%' || p_search_text || '%') OR
          address ILIKE ('%' || p_search_text || '%')
      )
    ORDER BY is_featured DESC, created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para asegurar que las funciones tienen la configuración correcta
COMMENT ON FUNCTION get_featured_property_for_tenant IS 'Obtiene una propiedad destacada para un tenant específico, evitando restricciones de RLS';
COMMENT ON FUNCTION get_property_by_id_safe IS 'Obtiene una propiedad específica por ID, evitando restricciones de RLS';
COMMENT ON FUNCTION get_properties_for_tenant IS 'Obtiene propiedades para un tenant específico, evitando restricciones de RLS';
COMMENT ON FUNCTION search_properties IS 'Búsqueda avanzada de propiedades con múltiples criterios, evitando restricciones de RLS';