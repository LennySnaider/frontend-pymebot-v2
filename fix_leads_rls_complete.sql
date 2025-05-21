-- Script completo para diagnosticar y corregir políticas RLS en la tabla leads
-- Ejecutar en el SQL Editor de Supabase (panel de administración)

-- PARTE 1: DIAGNÓSTICO
-- Mostrar todas las políticas RLS existentes para la tabla leads
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    permissive, 
    qual, 
    with_check
FROM 
    pg_policies 
WHERE 
    tablename = 'leads' 
ORDER BY 
    policyname;

-- Verificar si RLS está habilitado en la tabla leads
SELECT 
    relname as table_name, 
    relrowsecurity as rls_enabled 
FROM 
    pg_class 
WHERE 
    relname = 'leads';

-- Verificar funciones existentes relacionadas con leads
SELECT 
    proname AS function_name, 
    prosrc AS source_code 
FROM 
    pg_proc 
WHERE 
    proname LIKE '%lead%';

-- PARTE 2: LIMPIEZA
-- Eliminar todas las políticas existentes en la tabla leads
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'leads'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON leads', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Eliminar funciones existentes relacionadas con leads que podrían estar causando conflictos
DROP FUNCTION IF EXISTS create_or_update_lead(jsonb);
DROP FUNCTION IF EXISTS insert_lead_with_elevated_permissions(jsonb);
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS cleanup_duplicate_leads();

-- PARTE 3: RECONSTRUCCIÓN
-- Asegurarse que RLS está habilitado en la tabla leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Crear función auxiliar para verificar si un usuario es superadmin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función auxiliar para verificar si un usuario pertenece a un tenant
CREATE OR REPLACE FUNCTION belongs_to_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 
        -- El usuario es super_admin
        is_super_admin() OR 
        -- O el usuario pertenece al tenant especificado
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tenant_id = tenant_uuid
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear políticas RLS para la tabla leads
-- 1. Política para SELECT: Usuarios pueden ver leads de su tenant
CREATE POLICY "Select leads from same tenant" 
ON leads FOR SELECT 
USING (
    auth.uid() IS NOT NULL AND (
        belongs_to_tenant(tenant_id) OR
        is_super_admin()
    )
);

-- 2. Política para INSERT: Usuarios pueden crear leads en su tenant
CREATE POLICY "Insert leads into same tenant" 
ON leads FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        belongs_to_tenant(tenant_id) OR
        is_super_admin()
    )
);

-- 3. Política para UPDATE: Usuarios pueden actualizar leads de su tenant
CREATE POLICY "Update leads from same tenant" 
ON leads FOR UPDATE 
USING (
    auth.uid() IS NOT NULL AND (
        belongs_to_tenant(tenant_id) OR
        is_super_admin()
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        belongs_to_tenant(tenant_id) OR
        is_super_admin()
    )
);

-- 4. Política para DELETE: Usuarios pueden eliminar leads de su tenant
CREATE POLICY "Delete leads from same tenant" 
ON leads FOR DELETE 
USING (
    auth.uid() IS NOT NULL AND (
        belongs_to_tenant(tenant_id) OR
        is_super_admin()
    )
);

-- PARTE 4: FUNCIONES DE AYUDA
-- Crear función para insertar leads con permisos elevados
CREATE OR REPLACE FUNCTION admin_insert_lead(lead_data JSONB)
RETURNS JSONB AS $$
DECLARE
    new_lead JSONB;
    lead_id UUID;
BEGIN
    -- Validar que el cliente tenga privilegios de administrador
    IF NOT (is_super_admin() OR belongs_to_tenant(lead_data->>'tenant_id')) THEN
        RAISE EXCEPTION 'Permisos insuficientes para crear lead';
    END IF;
    
    -- Generar un nuevo ID si no se proporciona uno
    IF lead_data->>'id' IS NULL THEN
        lead_id := gen_random_uuid();
        lead_data := jsonb_set(lead_data, '{id}', to_jsonb(lead_id));
    ELSE
        lead_id := (lead_data->>'id')::UUID;
    END IF;
    
    -- Insertar el nuevo lead
    INSERT INTO leads 
    SELECT * FROM jsonb_populate_record(NULL::leads, lead_data)
    RETURNING to_jsonb(leads.*) INTO new_lead;
    
    RETURN new_lead;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al insertar lead: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para actualizar o crear leads (upsert)
CREATE OR REPLACE FUNCTION admin_upsert_lead(lead_data JSONB)
RETURNS JSONB AS $$
DECLARE
    existing_lead_id UUID;
    tenant_uuid UUID;
    result_lead JSONB;
BEGIN
    -- Obtener o verificar tenant_id
    tenant_uuid := (lead_data->>'tenant_id')::UUID;
    IF tenant_uuid IS NULL THEN
        RAISE EXCEPTION 'tenant_id es requerido';
    END IF;
    
    -- Validar permisos
    IF NOT (is_super_admin() OR belongs_to_tenant(tenant_uuid)) THEN
        RAISE EXCEPTION 'Permisos insuficientes para esta operación';
    END IF;
    
    -- Verificar si el lead existe
    IF lead_data->>'id' IS NOT NULL THEN
        SELECT id INTO existing_lead_id 
        FROM leads 
        WHERE id = (lead_data->>'id')::UUID;
    ELSE
        existing_lead_id := NULL;
    END IF;
    
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
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error en admin_upsert_lead: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar leads duplicados
CREATE OR REPLACE FUNCTION cleanup_duplicate_leads()
RETURNS TABLE(removed_count INTEGER, kept_id UUID, duplicate_id UUID) AS $$
DECLARE
    duplicate_record RECORD;
    deleted_count INTEGER := 0;
BEGIN
    -- Encontrar leads con el mismo nombre, email y teléfono dentro del mismo tenant
    FOR duplicate_record IN (
        SELECT 
            MIN(id) AS keep_id, 
            id AS duplicate_id,
            full_name,
            email,
            phone,
            tenant_id
        FROM leads
        WHERE full_name IS NOT NULL AND email IS NOT NULL
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
    
    IF deleted_count = 0 THEN
        removed_count := 0;
        kept_id := NULL;
        duplicate_id := NULL;
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTE 5: VERIFICACIÓN FINAL
-- Mostrar políticas activas después de la reconstrucción
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    permissive
FROM 
    pg_policies 
WHERE 
    tablename = 'leads' 
ORDER BY 
    policyname;

-- Ejecutar una prueba de limpieza de duplicados
SELECT * FROM cleanup_duplicate_leads();

-- Mostrar recuento de leads por tenant para verificar
SELECT 
    tenant_id, 
    COUNT(*) as lead_count 
FROM 
    leads 
GROUP BY 
    tenant_id 
ORDER BY 
    lead_count DESC;