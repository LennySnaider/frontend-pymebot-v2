-- Script para corregir las políticas RLS de la tabla leads
-- Este script ajusta las políticas para permitir operaciones CRUD basadas en tenant_id
-- y añade permisos especiales para super_admin

-- 1. Primero eliminamos las políticas actuales que puedan estar causando problemas
DROP POLICY IF EXISTS "Leads are viewable by users in the same tenant" ON leads;
DROP POLICY IF EXISTS "Leads are insertable by users in the same tenant" ON leads;
DROP POLICY IF EXISTS "Leads are updatable by users in the same tenant" ON leads;
DROP POLICY IF EXISTS "Leads are deletable by users in the same tenant" ON leads;
DROP POLICY IF EXISTS "Super admin can view all leads" ON leads;
DROP POLICY IF EXISTS "Super admin can insert leads" ON leads;
DROP POLICY IF EXISTS "Super admin can update leads" ON leads;
DROP POLICY IF EXISTS "Super admin can delete leads" ON leads;

-- 2. Nos aseguramos que RLS esté habilitado en la tabla
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 3. Creamos nuevas políticas más permisivas para todos los usuarios autenticados
-- Política para SELECT: usuarios pueden ver leads de su tenant_id
CREATE POLICY "Leads are viewable by users in the same tenant" 
ON leads FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
);

-- Política para INSERT: usuarios pueden insertar en su tenant_id
CREATE POLICY "Leads are insertable by users in the same tenant" 
ON leads FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
);

-- Política para UPDATE: usuarios pueden actualizar en su tenant_id
CREATE POLICY "Leads are updatable by users in the same tenant" 
ON leads FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
);

-- Política para DELETE: usuarios pueden eliminar en su tenant_id
CREATE POLICY "Leads are deletable by users in the same tenant" 
ON leads FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND (
    tenant_id = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
);

-- 4. Creamos una función de ayuda para verificar superadmin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Creamos una función para insertar leads con permisos elevados
-- Esta función se puede llamar desde el backend para casos especiales
CREATE OR REPLACE FUNCTION insert_lead_with_elevated_permissions(lead_data JSONB)
RETURNS JSONB AS $$
DECLARE
  new_lead JSONB;
BEGIN
  -- Verificar permisos
  IF NOT (is_super_admin() OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND 
                 tenant_id = (lead_data->>'tenant_id')::UUID)) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Insertar el lead
  INSERT INTO leads 
  SELECT * FROM jsonb_populate_record(NULL::leads, lead_data)
  RETURNING to_jsonb(leads.*) INTO new_lead;
  
  RETURN new_lead;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear una función para actualizar leads existentes o crear nuevos si no existen
CREATE OR REPLACE FUNCTION create_or_update_lead(lead_data JSONB)
RETURNS JSONB AS $$
DECLARE
  existing_lead_id UUID;
  result_lead JSONB;
BEGIN
  -- Verificar permisos
  IF NOT (is_super_admin() OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND 
                 tenant_id = (lead_data->>'tenant_id')::UUID)) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Verificar si el lead existe
  SELECT id INTO existing_lead_id 
  FROM leads 
  WHERE id = (lead_data->>'id')::UUID;
  
  -- Si existe, actualizar
  IF existing_lead_id IS NOT NULL THEN
    UPDATE leads
    SET
      full_name = COALESCE(lead_data->>'full_name', full_name),
      email = COALESCE(lead_data->>'email', email),
      phone = COALESCE(lead_data->>'phone', phone),
      status = COALESCE(lead_data->>'status', status),
      stage = COALESCE(lead_data->>'stage', stage),
      source = COALESCE(lead_data->>'source', source),
      interest_level = COALESCE(lead_data->>'interest_level', interest_level),
      budget_min = COALESCE((lead_data->>'budget_min')::NUMERIC, budget_min),
      budget_max = COALESCE((lead_data->>'budget_max')::NUMERIC, budget_max),
      property_type = COALESCE(lead_data->>'property_type', property_type),
      preferred_zones = COALESCE(lead_data->'preferred_zones', preferred_zones),
      bedrooms_needed = COALESCE(lead_data->>'bedrooms_needed', bedrooms_needed),
      bathrooms_needed = COALESCE(lead_data->>'bathrooms_needed', bathrooms_needed),
      features_needed = COALESCE(lead_data->'features_needed', features_needed),
      notes = COALESCE(lead_data->>'notes', notes),
      agent_id = COALESCE(lead_data->>'agent_id', agent_id),
      next_contact_date = COALESCE((lead_data->>'next_contact_date')::TIMESTAMP WITH TIME ZONE, next_contact_date),
      metadata = COALESCE(lead_data->'metadata', metadata),
      description = COALESCE(lead_data->>'description', description),
      selected_property_id = COALESCE(lead_data->>'selected_property_id', selected_property_id),
      property_ids = COALESCE(lead_data->'property_ids', property_ids),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = existing_lead_id
    RETURNING to_jsonb(leads.*) INTO result_lead;
  -- Si no existe, insertar
  ELSE
    -- Generar un nuevo ID si no se proporcionó uno
    IF lead_data->>'id' IS NULL THEN
      lead_data = jsonb_set(lead_data, '{id}', to_jsonb(gen_random_uuid()));
    END IF;
    
    -- Asegurar que siempre tengamos timestamps
    IF lead_data->>'created_at' IS NULL THEN
      lead_data = jsonb_set(lead_data, '{created_at}', to_jsonb(CURRENT_TIMESTAMP));
    END IF;
    IF lead_data->>'updated_at' IS NULL THEN
      lead_data = jsonb_set(lead_data, '{updated_at}', to_jsonb(CURRENT_TIMESTAMP));
    END IF;
    
    -- Insertar el nuevo lead
    INSERT INTO leads 
    SELECT * FROM jsonb_populate_record(NULL::leads, lead_data)
    RETURNING to_jsonb(leads.*) INTO result_lead;
  END IF;
  
  RETURN result_lead;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Crear una función para limpiar leads duplicados
CREATE OR REPLACE FUNCTION cleanup_duplicate_leads()
RETURNS TABLE(removed_count INTEGER, kept_id UUID, duplicate_id UUID) AS $$
DECLARE
  duplicate_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  -- Encontrar leads con el mismo nombre, email y teléfono
  FOR duplicate_record IN (
    SELECT 
      MIN(id) AS keep_id, 
      id AS duplicate_id,
      full_name,
      email,
      phone,
      tenant_id
    FROM leads
    GROUP BY full_name, email, phone, tenant_id
    HAVING COUNT(*) > 1
  )
  LOOP
    IF duplicate_record.keep_id <> duplicate_record.duplicate_id THEN
      kept_id := duplicate_record.keep_id;
      duplicate_id := duplicate_record.duplicate_id;
      
      -- Borrar el duplicado
      DELETE FROM leads 
      WHERE id = duplicate_record.duplicate_id;
      
      deleted_count := deleted_count + 1;
      removed_count := deleted_count;
      
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;