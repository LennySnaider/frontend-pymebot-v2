-- Script para crear leads reales sin actualizar estadísticas de agentes
-- Fecha: 2025-05-17

-- 1. Verificar si tenemos agentes disponibles
DO $$
DECLARE
    agent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO agent_count
    FROM agents 
    WHERE tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid;
    
    IF agent_count = 0 THEN
        RAISE EXCEPTION 'No hay agentes disponibles. Por favor crea agentes primero.';
    END IF;
END $$;

-- 2. Crear leads reales
WITH agent_ids AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM agents 
    WHERE tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid
    LIMIT 3
)
INSERT INTO leads (
    id, full_name, email, phone, status, stage, source, interest_level,
    budget_min, budget_max, property_type, preferred_zones, 
    bedrooms_needed, bathrooms_needed, features_needed, notes,
    agent_id, last_contact_date, next_contact_date, contact_count,
    created_at, updated_at, tenant_id, metadata, description
) VALUES
-- Lead etapa inicial (new)
(
    gen_random_uuid(),
    'Roberto Martínez García',
    'roberto.martinez@gmail.com',
    '+52 55 1234 5678',
    'active',
    'new',
    'website',
    'high',
    2000000,
    3000000,
    'house',
    ARRAY['Polanco', 'Condesa', 'Roma Norte'],
    3,
    2,
    ARRAY['Jardín', 'Estacionamiento', 'Seguridad 24h'],
    'Cliente potencial, busca casa para su familia',
    (SELECT id FROM agent_ids WHERE rn = 1),
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '2 days',
    1,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid,
    '{"campaign": "google_ads", "utm_source": "google", "utm_medium": "cpc"}'::jsonb,
    'Busca casa familiar en zonas premium de CDMX'
),
-- Lead en prospección
(
    gen_random_uuid(),
    'María Fernández López',
    'maria.fernandez@outlook.com',
    '+52 55 2345 6789',
    'active',
    'prospecting',
    'facebook',
    'medium',
    1500000,
    2000000,
    'apartment',
    ARRAY['Del Valle', 'Narvarte', 'Benito Juárez'],
    2,
    1,
    ARRAY['Balcón', 'Gimnasio', 'Pet Friendly'],
    'Joven profesional, primera compra',
    (SELECT id FROM agent_ids WHERE rn = 2),
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '1 day',
    3,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '3 days',
    'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid,
    '{"campaign": "fb_leads", "interests": ["real_estate", "first_home"]}'::jsonb,
    'Millennial buscando su primer departamento'
),
-- Lead calificado
(
    gen_random_uuid(),
    'Carlos Mendoza Ruiz',
    'carlos.mendoza@empresa.mx',
    '+52 55 3456 7890',
    'active',
    'qualification',
    'referral',
    'high',
    5000000,
    8000000,
    'house',
    ARRAY['Lomas de Chapultepec', 'Santa Fe', 'Interlomas'],
    4,
    3,
    ARRAY['Alberca', 'Jardín grande', 'Vista panorámica', 'Home office'],
    'Empresario, busca upgrade de vivienda',
    (SELECT id FROM agent_ids WHERE rn = 3),
    NOW() - INTERVAL '6 hours',
    NOW() + INTERVAL '1 day',
    5,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '6 hours',
    'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid,
    '{"referrer": "existing_client", "pre_approved_credit": true}'::jsonb,
    'Cliente con pre-aprobación crediticia lista'
),
-- Lead en oportunidad
(
    gen_random_uuid(),
    'Ana Sofía Torres Vargas',
    'ana.torres@gmail.com',
    '+52 55 4567 8901',
    'active',
    'opportunity',
    'direct',
    'high',
    3500000,
    4500000,
    'apartment',
    ARRAY['Polanco', 'Anzures', 'Condesa'],
    3,
    2.5,
    ARRAY['Terraza', 'Dos estacionamientos', 'Amenidades de lujo'],
    'Ya vendió su propiedad anterior, urgencia de compra',
    (SELECT id FROM agent_ids WHERE rn = 1),
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '12 hours',
    8,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '2 hours',
    'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid,
    '{"urgency": "high", "viewing_scheduled": true, "properties_viewed": 3}'::jsonb,
    'Cliente con alta intención de compra inmediata'
),
-- Lead confirmado (listo para cerrar)
(
    gen_random_uuid(),
    'Patricia Ramírez Soto',
    'patricia.ramirez@gmail.com',
    '+52 55 6789 0123',
    'active',
    'confirmed',
    'website',
    'high',
    4000000,
    4500000,
    'house',
    ARRAY['Coyoacán', 'San Ángel', 'Pedregal'],
    3,
    2,
    ARRAY['Estudio', 'Jardín', 'Cocina integral'],
    'Aprobación crediticia completa, eligiendo entre 2 propiedades',
    (SELECT id FROM agent_ids WHERE rn = 3),
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '3 hours',
    12,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '1 hour',
    'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid,
    '{"credit_approved": true, "properties_shortlist": ["prop_123", "prop_456"]}'::jsonb,
    'Cliente en fase final de decisión'
),
-- Lead para inversión
(
    gen_random_uuid(),
    'Grupo Inversiones MX',
    'contacto@inversionesmx.com',
    '+52 55 7890 1234',
    'active',
    'qualification',
    'partner',
    'high',
    10000000,
    20000000,
    'commercial',
    ARRAY['Polanco', 'Reforma', 'Santa Fe'],
    null,
    null,
    ARRAY['Alto ROI', 'Zona comercial', 'Fácil acceso'],
    'Fondo de inversión buscando propiedades comerciales',
    (SELECT id FROM agent_ids WHERE rn = 1),
    NOW() - INTERVAL '4 hours',
    NOW() + INTERVAL '1 day',
    4,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '4 hours',
    'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid,
    '{"company_type": "investment_fund", "annual_revenue": "100M+"}'::jsonb,
    'Cliente corporativo con alto poder adquisitivo'
),
-- Lead internacional
(
    gen_random_uuid(),
    'John Smith',
    'john.smith@email.com',
    '+1 555 123 4567',
    'active',
    'prospecting',
    'international',
    'medium',
    3000000,
    5000000,
    'house',
    ARRAY['Polanco', 'Lomas', 'La Herradura'],
    4,
    3,
    ARRAY['Seguridad privada', 'Cerca de escuelas internacionales'],
    'Expatriado mudándose a México por trabajo',
    (SELECT id FROM agent_ids WHERE rn = 2),
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '3 days',
    2,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '2 days',
    'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid,
    '{"nationality": "US", "visa_status": "work_visa", "arrival_date": "2024-03"}'::jsonb,
    'Cliente internacional con necesidades específicas'
),
-- Lead con urgencia
(
    gen_random_uuid(),
    'Daniela Herrera Quintero',
    'daniela.herrera@email.mx',
    '+52 55 8901 2345',
    'active',
    'opportunity',
    'phone',
    'high',
    2500000,
    3500000,
    'apartment',
    ARRAY['Napoles', 'Del Valle', 'Condesa'],
    2,
    2,
    ARRAY['Mascotas permitidas', 'Balcón grande'],
    'Desalojo en 30 días, necesita encontrar rápido',
    (SELECT id FROM agent_ids WHERE rn = 3),
    NOW() - INTERVAL '3 hours',
    NOW() + INTERVAL '6 hours',
    6,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 hours',
    'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid,
    '{"urgency_reason": "eviction", "move_date": "2024-02-15"}'::jsonb,
    'Cliente con urgencia real de mudanza'
);

-- 3. Verificar leads creados
SELECT 
    l.id,
    l.full_name,
    l.stage,
    l.interest_level,
    l.budget_min,
    l.budget_max,
    a.name as agent_name,
    l.created_at
FROM leads l
LEFT JOIN agents a ON l.agent_id = a.id
WHERE l.tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid
ORDER BY l.created_at DESC
LIMIT 10;

-- 4. Estadísticas de leads por etapa
SELECT 
    stage,
    COUNT(*) as total,
    AVG(budget_max) as avg_budget
FROM leads
WHERE tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid
GROUP BY stage
ORDER BY 
    CASE stage
        WHEN 'new' THEN 1
        WHEN 'prospecting' THEN 2
        WHEN 'qualification' THEN 3
        WHEN 'opportunity' THEN 4
        WHEN 'confirmed' THEN 5
        ELSE 6
    END;

-- 5. Leads por agente
SELECT 
    a.name as agent_name,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.stage IN ('opportunity', 'confirmed') THEN 1 END) as hot_leads
FROM agents a
LEFT JOIN leads l ON a.id = l.agent_id
WHERE a.tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322'::uuid
GROUP BY a.id, a.name
ORDER BY total_leads DESC;