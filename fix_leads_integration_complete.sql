-- Script completo para corregir la integración entre chatbot y sales funnel
-- Ejecutar en el SQL Editor de Supabase

----------------------------
-- PARTE 1: DIAGNÓSTICO
----------------------------

-- Verificar políticas RLS actuales para leads
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    permissive, 
    qual
FROM 
    pg_policies 
WHERE 
    tablename = 'leads' 
ORDER BY 
    policyname;

-- Verificar si RLS está habilitado
SELECT 
    relname as table_name, 
    relrowsecurity as rls_enabled 
FROM 
    pg_class 
WHERE 
    relname = 'leads';

-- Identificar duplicados existentes
SELECT 
    full_name, 
    email, 
    phone, 
    tenant_id, 
    COUNT(*) as duplicates, 
    array_agg(id) as duplicate_ids
FROM 
    leads
WHERE 
    email IS NOT NULL 
    AND full_name IS NOT NULL
GROUP BY 
    full_name, email, phone, tenant_id
HAVING 
    COUNT(*) > 1
ORDER BY 
    duplicates DESC;

-- Verificar discrepancias de conteo en leads
WITH 
lead_counts_by_tenant AS (
    SELECT 
        tenant_id, 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_leads,
        COUNT(CASE WHEN stage = 'nuevos' THEN 1 END) as nuevos,
        COUNT(CASE WHEN stage = 'prospectando' THEN 1 END) as prospectando,
        COUNT(CASE WHEN stage = 'calificacion' THEN 1 END) as calificacion,
        COUNT(CASE WHEN stage = 'oportunidad' THEN 1 END) as oportunidad,
        COUNT(CASE WHEN stage = 'confirmado' THEN 1 END) as confirmado,
        COUNT(CASE WHEN stage = 'cerrado' THEN 1 END) as cerrado
    FROM 
        leads
    GROUP BY 
        tenant_id
)
SELECT * FROM lead_counts_by_tenant
ORDER BY total_leads DESC;

----------------------------
-- PARTE 2: LIMPIEZA
----------------------------

-- Eliminar políticas RLS existentes
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

-- Eliminar funciones existentes que pueden estar causando conflictos
DROP FUNCTION IF EXISTS create_or_update_lead(jsonb);
DROP FUNCTION IF EXISTS insert_lead_with_elevated_permissions(jsonb);
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS belongs_to_tenant(uuid);
DROP FUNCTION IF EXISTS cleanup_duplicate_leads();
DROP FUNCTION IF EXISTS admin_insert_lead(jsonb);
DROP FUNCTION IF EXISTS admin_upsert_lead(jsonb);

----------------------------
-- PARTE 3: RECONSTRUCCIÓN
----------------------------

-- Asegurar que RLS está habilitado
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Funciones auxiliares
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION belongs_to_tenant(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN 
        is_super_admin() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND tenant_id = tenant_uuid
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para leads
-- 1. Política para SELECT
CREATE POLICY "Select leads from same tenant" 
ON leads FOR SELECT 
USING (
    auth.uid() IS NOT NULL AND (
        belongs_to_tenant(tenant_id) OR
        is_super_admin()
    )
);

-- 2. Política para INSERT
CREATE POLICY "Insert leads into same tenant" 
ON leads FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        belongs_to_tenant(tenant_id) OR
        is_super_admin()
    )
);

-- 3. Política para UPDATE
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

-- 4. Política para DELETE
CREATE POLICY "Delete leads from same tenant" 
ON leads FOR DELETE 
USING (
    auth.uid() IS NOT NULL AND (
        belongs_to_tenant(tenant_id) OR
        is_super_admin()
    )
);

-- 5. Política especial para chatbot
CREATE POLICY "Allow anonymous chatbot access" 
ON leads FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM chatbot_templates 
        WHERE chatbot_templates.tenant_id = leads.tenant_id
        AND chatbot_templates.is_active = true
    )
);

----------------------------
-- PARTE 4: FUNCIONES AUXILIARES
----------------------------

-- Función para insertar leads con permisos elevados
CREATE OR REPLACE FUNCTION admin_insert_lead(lead_data JSONB)
RETURNS JSONB AS $$
DECLARE
    new_lead JSONB;
    lead_id UUID;
BEGIN
    -- Validar permisos
    IF NOT (is_super_admin() OR belongs_to_tenant(lead_data->>'tenant_id')) THEN
        RAISE EXCEPTION 'Permisos insuficientes para crear lead';
    END IF;
    
    -- Generar ID si no existe
    IF lead_data->>'id' IS NULL THEN
        lead_id := gen_random_uuid();
        lead_data := jsonb_set(lead_data, '{id}', to_jsonb(lead_id));
    ELSE
        lead_id := (lead_data->>'id')::UUID;
    END IF;
    
    -- Insertar lead
    INSERT INTO leads 
    SELECT * FROM jsonb_populate_record(NULL::leads, lead_data)
    RETURNING to_jsonb(leads.*) INTO new_lead;
    
    RETURN new_lead;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al insertar lead: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función mejorada para crear o actualizar leads (upsert)
CREATE OR REPLACE FUNCTION admin_upsert_lead(lead_data JSONB)
RETURNS JSONB AS $$
DECLARE
    existing_lead_id UUID;
    tenant_uuid UUID;
    result_lead JSONB;
BEGIN
    -- Obtener tenant_id
    tenant_uuid := (lead_data->>'tenant_id')::UUID;
    IF tenant_uuid IS NULL THEN
        RAISE EXCEPTION 'tenant_id es requerido';
    END IF;
    
    -- Validar permisos
    IF NOT (is_super_admin() OR belongs_to_tenant(tenant_uuid)) THEN
        RAISE EXCEPTION 'Permisos insuficientes para esta operación';
    END IF;
    
    -- Verificar si existe lead
    IF lead_data->>'id' IS NOT NULL THEN
        SELECT id INTO existing_lead_id 
        FROM leads 
        WHERE id = (lead_data->>'id')::UUID;
    ELSIF lead_data->>'email' IS NOT NULL AND lead_data->>'phone' IS NOT NULL THEN
        -- Buscar por email y teléfono como fallback
        SELECT id INTO existing_lead_id 
        FROM leads 
        WHERE 
            email = lead_data->>'email' 
            AND phone = lead_data->>'phone'
            AND tenant_id = tenant_uuid
        LIMIT 1;
    END IF;
    
    -- Actualizar o insertar según corresponda
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
            updated_at = CURRENT_TIMESTAMP,
            is_deleted = COALESCE((lead_data->>'is_deleted')::BOOLEAN, is_deleted),
            has_appointment = COALESCE((lead_data->>'has_appointment')::BOOLEAN, has_appointment)
        WHERE id = existing_lead_id
        RETURNING to_jsonb(leads.*) INTO result_lead;
    ELSE
        -- Insertar nuevo lead
        IF lead_data->>'id' IS NULL THEN
            lead_data = jsonb_set(lead_data, '{id}', to_jsonb(gen_random_uuid()));
        END IF;
        
        -- Asegurar timestamps
        IF lead_data->>'created_at' IS NULL THEN
            lead_data = jsonb_set(lead_data, '{created_at}', to_jsonb(CURRENT_TIMESTAMP));
        END IF;
        
        IF lead_data->>'updated_at' IS NULL THEN
            lead_data = jsonb_set(lead_data, '{updated_at}', to_jsonb(CURRENT_TIMESTAMP));
        END IF;
        
        -- Insertar
        INSERT INTO leads 
        SELECT * FROM jsonb_populate_record(NULL::leads, lead_data)
        RETURNING to_jsonb(leads.*) INTO result_lead;
    END IF;
    
    RETURN result_lead;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error en admin_upsert_lead: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función corregida para limpiar duplicados (usa TEXT para agreggación en lugar de MIN(UUID))
CREATE OR REPLACE FUNCTION cleanup_duplicate_leads()
RETURNS TABLE(cleaned_count INTEGER, kept_id TEXT, removed_ids TEXT[]) AS $$
DECLARE
    lead_group RECORD;
    duplicate_ids UUID[];
    keep_id UUID;
    total_removed INTEGER := 0;
BEGIN
    -- Iterar por grupos de duplicados
    FOR lead_group IN 
        SELECT 
            full_name, 
            email, 
            phone, 
            tenant_id,
            array_agg(id) as ids 
        FROM leads
        WHERE 
            full_name IS NOT NULL 
            AND email IS NOT NULL
            AND phone IS NOT NULL
        GROUP BY 
            full_name, email, phone, tenant_id
        HAVING 
            COUNT(*) > 1
    LOOP
        -- Seleccionar el primer ID como el que se conservará
        keep_id := lead_group.ids[1];
        
        -- Guardar todos los demás IDs para eliminarlos
        SELECT array_agg(id)
        INTO duplicate_ids
        FROM unnest(lead_group.ids) id
        WHERE id != keep_id;
        
        -- Eliminar duplicados
        DELETE FROM leads 
        WHERE id = ANY(duplicate_ids);
        
        -- Actualizar contador y devolver resultados
        total_removed := total_removed + array_length(duplicate_ids, 1);
        cleaned_count := total_removed;
        kept_id := keep_id::TEXT;
        removed_ids := array_agg(duplicate_ids::TEXT);
        
        RETURN NEXT;
    END LOOP;
    
    -- Si no se encontraron duplicados
    IF total_removed = 0 THEN
        cleaned_count := 0;
        kept_id := NULL;
        removed_ids := NULL;
        RETURN NEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

----------------------------
-- PARTE 5: FUNCIÓN DE ACTUALIZACIÓN DE STAGE
----------------------------

-- Función para actualizar etapa de lead con integración a chatbot
CREATE OR REPLACE FUNCTION update_lead_stage(
    p_lead_id UUID,
    p_stage TEXT,
    p_notify_chatbot BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
    lead_data JSONB;
    tenant_id UUID;
BEGIN
    -- Verificar que el lead existe
    SELECT to_jsonb(leads.*) INTO lead_data
    FROM leads
    WHERE id = p_lead_id;
    
    IF lead_data IS NULL THEN
        RAISE EXCEPTION 'Lead no encontrado: %', p_lead_id;
    END IF;
    
    -- Verificar permisos
    tenant_id := (lead_data->>'tenant_id')::UUID;
    IF NOT (is_super_admin() OR belongs_to_tenant(tenant_id)) THEN
        RAISE EXCEPTION 'Permisos insuficientes para actualizar el lead';
    END IF;
    
    -- Actualizar la etapa y timestamp
    UPDATE leads
    SET 
        stage = p_stage,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_lead_id
    RETURNING to_jsonb(leads.*) INTO lead_data;
    
    -- Almacenar historial de cambios de etapa
    INSERT INTO lead_stage_history (
        lead_id,
        previous_stage,
        new_stage,
        changed_by,
        changed_at
    ) VALUES (
        p_lead_id,
        lead_data->>'stage',
        p_stage,
        auth.uid(),
        CURRENT_TIMESTAMP
    );
    
    -- TODO: Notificar al chatbot sobre el cambio (implementación pendiente)
    -- Esta sección se implementará cuando se desarrolle la API de notificaciones
    
    RETURN lead_data;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al actualizar etapa: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

----------------------------
-- PARTE 6: TABLA DE HISTORIAL DE ETAPAS
----------------------------

-- Crear tabla de historial si no existe
CREATE TABLE IF NOT EXISTS lead_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    previous_stage TEXT,
    new_stage TEXT NOT NULL,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_lead_id ON lead_stage_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_changed_at ON lead_stage_history(changed_at);

-- Aplicar RLS a la tabla de historial
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;

-- Políticas para historial
CREATE POLICY "Select lead stage history from same tenant" 
ON lead_stage_history FOR SELECT 
USING (
    auth.uid() IS NOT NULL AND (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = lead_stage_history.lead_id
            AND (
                belongs_to_tenant(leads.tenant_id) OR
                is_super_admin()
            )
        )
    )
);

CREATE POLICY "Insert lead stage history from same tenant" 
ON lead_stage_history FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL AND (
        EXISTS (
            SELECT 1 FROM leads
            WHERE leads.id = lead_stage_history.lead_id
            AND (
                belongs_to_tenant(leads.tenant_id) OR
                is_super_admin()
            )
        )
    )
);

----------------------------
-- PARTE 7: VERIFICACIÓN Y LIMPIEZA
----------------------------

-- Verificar políticas creadas
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
    tablename IN ('leads', 'lead_stage_history')
ORDER BY 
    tablename, policyname;

-- Ejecutar limpieza de duplicados
SELECT * FROM cleanup_duplicate_leads();

-- Verificar conteos finales
WITH 
lead_counts_by_tenant AS (
    SELECT 
        tenant_id, 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_leads,
        COUNT(CASE WHEN stage = 'nuevos' THEN 1 END) as nuevos,
        COUNT(CASE WHEN stage = 'prospectando' THEN 1 END) as prospectando,
        COUNT(CASE WHEN stage = 'calificacion' THEN 1 END) as calificacion,
        COUNT(CASE WHEN stage = 'oportunidad' THEN 1 END) as oportunidad,
        COUNT(CASE WHEN stage = 'confirmado' THEN 1 END) as confirmado,
        COUNT(CASE WHEN stage = 'cerrado' THEN 1 END) as cerrado
    FROM 
        leads
    GROUP BY 
        tenant_id
)
SELECT * FROM lead_counts_by_tenant
ORDER BY total_leads DESC;

-- Verificar que no existan duplicados
SELECT 
    full_name, 
    email, 
    phone, 
    tenant_id, 
    COUNT(*) as duplicates
FROM 
    leads
WHERE 
    email IS NOT NULL 
    AND full_name IS NOT NULL
GROUP BY 
    full_name, email, phone, tenant_id
HAVING 
    COUNT(*) > 1
ORDER BY 
    duplicates DESC;