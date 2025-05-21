/**
 * Script para ejecutar la creación de leads reales
 * Este script lee el archivo SQL y lo ejecuta en Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://djcphfcvxdimotbfvbyy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY no está configurada');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createLeads() {
    try {
        console.log('Iniciando creación de leads reales...');
        
        // Leer el archivo SQL
        const sqlFile = path.join(__dirname, '25_create_real_leads_seed.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Ejecutar el SQL
        const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
        
        if (error) {
            console.error('Error ejecutando SQL:', error);
            
            // Si RPC no existe, intentar ejecutar las queries individualmente
            console.log('Intentando método alternativo...');
            
            // Primero, obtener agentes existentes
            const { data: agents, error: agentsError } = await supabase
                .from('agents')
                .select('id, name')
                .eq('tenant_id', 'afa60b0a-3046-4607-9c48-266af6e1d322')
                .limit(3);
                
            if (agentsError) {
                throw agentsError;
            }
            
            if (!agents || agents.length === 0) {
                throw new Error('No se encontraron agentes. Asegúrate de crear agentes primero.');
            }
            
            console.log(`Encontrados ${agents.length} agentes`);
            
            // Crear los leads
            const leads = [
                {
                    full_name: 'Roberto Martínez García',
                    email: 'roberto.martinez@gmail.com',
                    phone: '+52 55 1234 5678',
                    status: 'active',
                    stage: 'new',
                    source: 'website',
                    interest_level: 'high',
                    budget_min: 2000000,
                    budget_max: 3000000,
                    property_type: 'house',
                    preferred_zones: ['Polanco', 'Condesa', 'Roma Norte'],
                    bedrooms_needed: 3,
                    bathrooms_needed: 2,
                    features_needed: ['Jardín', 'Estacionamiento', 'Seguridad 24h'],
                    notes: 'Cliente potencial, busca casa para su familia',
                    agent_id: agents[0].id,
                    last_contact_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    next_contact_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    contact_count: 1,
                    tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322',
                    metadata: { campaign: 'google_ads', utm_source: 'google', utm_medium: 'cpc' },
                    description: 'Busca casa familiar en zonas premium de CDMX'
                },
                {
                    full_name: 'María Fernández López',
                    email: 'maria.fernandez@outlook.com',
                    phone: '+52 55 2345 6789',
                    status: 'active',
                    stage: 'prospecting',
                    source: 'facebook',
                    interest_level: 'medium',
                    budget_min: 1500000,
                    budget_max: 2000000,
                    property_type: 'apartment',
                    preferred_zones: ['Del Valle', 'Narvarte', 'Benito Juárez'],
                    bedrooms_needed: 2,
                    bathrooms_needed: 1,
                    features_needed: ['Balcón', 'Gimnasio', 'Pet Friendly'],
                    notes: 'Joven profesional, primera compra',
                    agent_id: agents[1]?.id || agents[0].id,
                    last_contact_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    next_contact_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    contact_count: 3,
                    tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322',
                    metadata: { campaign: 'fb_leads', interests: ['real_estate', 'first_home'] },
                    description: 'Millennial buscando su primer departamento'
                },
                {
                    full_name: 'Carlos Mendoza Ruiz',
                    email: 'carlos.mendoza@empresa.mx',
                    phone: '+52 55 3456 7890',
                    status: 'active',
                    stage: 'qualification',
                    source: 'referral',
                    interest_level: 'high',
                    budget_min: 5000000,
                    budget_max: 8000000,
                    property_type: 'house',
                    preferred_zones: ['Lomas de Chapultepec', 'Santa Fe', 'Interlomas'],
                    bedrooms_needed: 4,
                    bathrooms_needed: 3,
                    features_needed: ['Alberca', 'Jardín grande', 'Vista panorámica', 'Home office'],
                    notes: 'Empresario, busca upgrade de vivienda',
                    agent_id: agents[2]?.id || agents[0].id,
                    last_contact_date: new Date(Date.now() - 6 * 60 * 60 * 1000),
                    next_contact_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    contact_count: 5,
                    tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322',
                    metadata: { referrer: 'existing_client', pre_approved_credit: true },
                    description: 'Cliente con pre-aprobación crediticia lista'
                },
                {
                    full_name: 'Ana Sofía Torres Vargas',
                    email: 'ana.torres@gmail.com',
                    phone: '+52 55 4567 8901',
                    status: 'active',
                    stage: 'opportunity',
                    source: 'direct',
                    interest_level: 'high',
                    budget_min: 3500000,
                    budget_max: 4500000,
                    property_type: 'apartment',
                    preferred_zones: ['Polanco', 'Anzures', 'Condesa'],
                    bedrooms_needed: 3,
                    bathrooms_needed: 2.5,
                    features_needed: ['Terraza', 'Dos estacionamientos', 'Amenidades de lujo'],
                    notes: 'Ya vendió su propiedad anterior, urgencia de compra',
                    agent_id: agents[0].id,
                    last_contact_date: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    next_contact_date: new Date(Date.now() + 12 * 60 * 60 * 1000),
                    contact_count: 8,
                    tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322',
                    metadata: { urgency: 'high', viewing_scheduled: true, properties_viewed: 3 },
                    description: 'Cliente con alta intención de compra inmediata'
                },
                {
                    full_name: 'Patricia Ramírez Soto',
                    email: 'patricia.ramirez@gmail.com',
                    phone: '+52 55 6789 0123',
                    status: 'active',
                    stage: 'confirmed',
                    source: 'website',
                    interest_level: 'high',
                    budget_min: 4000000,
                    budget_max: 4500000,
                    property_type: 'house',
                    preferred_zones: ['Coyoacán', 'San Ángel', 'Pedregal'],
                    bedrooms_needed: 3,
                    bathrooms_needed: 2,
                    features_needed: ['Estudio', 'Jardín', 'Cocina integral'],
                    notes: 'Aprobación crediticia completa, eligiendo entre 2 propiedades',
                    agent_id: agents[2]?.id || agents[0].id,
                    last_contact_date: new Date(Date.now() - 60 * 60 * 1000),
                    next_contact_date: new Date(Date.now() + 3 * 60 * 60 * 1000),
                    contact_count: 12,
                    tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322',
                    metadata: { credit_approved: true, properties_shortlist: ['prop_123', 'prop_456'] },
                    description: 'Cliente en fase final de decisión'
                }
            ];
            
            // Insertar leads en lotes
            const { data: insertedLeads, error: insertError } = await supabase
                .from('leads')
                .insert(leads);
                
            if (insertError) {
                throw insertError;
            }
            
            console.log(`${leads.length} leads creados exitosamente`);
            
            // Actualizar estadísticas de agentes
            for (const agent of agents) {
                const { count } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('agent_id', agent.id)
                    .eq('status', 'active');
                    
                await supabase
                    .from('agents')
                    .update({ leads_count: count })
                    .eq('id', agent.id);
            }
            
            console.log('Estadísticas de agentes actualizadas');
            
        } else {
            console.log('Leads creados exitosamente mediante SQL');
        }
        
        // Mostrar resumen
        const { data: summary, error: summaryError } = await supabase
            .from('leads')
            .select('stage')
            .eq('tenant_id', 'afa60b0a-3046-4607-9c48-266af6e1d322');
            
        if (summary) {
            const stageCounts = summary.reduce((acc, lead) => {
                acc[lead.stage] = (acc[lead.stage] || 0) + 1;
                return acc;
            }, {});
            
            console.log('\nResumen de leads por etapa:');
            Object.entries(stageCounts).forEach(([stage, count]) => {
                console.log(`${stage}: ${count} leads`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message || error);
        process.exit(1);
    }
}

// Ejecutar el script
createLeads();