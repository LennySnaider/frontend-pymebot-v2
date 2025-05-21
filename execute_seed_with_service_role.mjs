import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno del archivo .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyslfajscteoqhxefudu.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Las variables de entorno no están configuradas correctamente');
    console.error('URL:', supabaseUrl ? 'Configurada' : 'NO configurada');
    console.error('Service Role Key:', supabaseServiceRoleKey ? 'Configurada' : 'NO configurada');
    process.exit(1);
}

// Crear cliente con service role key (que bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function seedDatabase() {
    console.log('=== INSERTANDO DATOS DE PRUEBA CON SERVICE ROLE ===\n');

    try {
        // Array de leads de ejemplo
        const leads = [
            {
                full_name: 'Juan Pérez',
                email: 'juan.perez@example.com',
                phone: '+525553212345',
                status: 'active',
                stage: 'qualification',
                source: 'referral',
                interest_level: 'high',
                budget_min: 2000000,
                budget_max: 3500000,
                property_type: 'house',
                preferred_zones: ['Polanco', 'Condesa', 'Roma Norte'],
                bedrooms_needed: 3,
                bathrooms_needed: 2,
                features_needed: ['garden', 'parking', 'security'],
                notes: 'Busca casa para su familia, con 2 niños pequeños. Preferentemente cerca de escuelas.',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'María González',
                email: 'maria.gonzalez@example.com',
                phone: '+525554323456',
                status: 'active',
                stage: 'opportunity',
                source: 'website',
                interest_level: 'medium',
                budget_min: 5000000,
                budget_max: 8000000,
                property_type: 'apartment',
                preferred_zones: ['Polanco', 'Lomas de Chapultepec'],
                bedrooms_needed: 2,
                bathrooms_needed: 2,
                features_needed: ['view', 'gym', 'doorman'],
                notes: 'Interesada en un departamento de lujo. Es ejecutiva y viaja frecuentemente.',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'Roberto Sánchez',
                email: 'roberto.sanchez@example.com',
                phone: '+525551234567',
                status: 'active',
                stage: 'prospecting',
                source: 'social_media',
                interest_level: 'low',
                budget_min: 1500000,
                budget_max: 2500000,
                property_type: 'apartment',
                preferred_zones: ['Del Valle', 'Narvarte', 'Escandón'],
                bedrooms_needed: 1,
                bathrooms_needed: 1,
                features_needed: ['parking', 'laundry'],
                notes: 'Busca su primer departamento. Trabaja en el centro de la ciudad.',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'Carolina López',
                email: 'carolina.lopez@example.com',
                phone: '+525559876543',
                status: 'active',
                stage: 'new',
                source: 'online_ad',
                interest_level: 'medium',
                budget_min: 10000000,
                budget_max: 15000000,
                property_type: 'house',
                preferred_zones: ['Interlomas', 'Santa Fe', 'Bosques de las Lomas'],
                bedrooms_needed: 4,
                bathrooms_needed: 3,
                features_needed: ['pool', 'garden', 'security'],
                notes: 'Busca una casa grande para su familia con espacio para oficina en casa.',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'Fernando Martínez',
                email: 'fernando.martinez@example.com',
                phone: '+525558765432',
                status: 'active',
                stage: 'qualification',
                source: 'event',
                interest_level: 'high',
                budget_min: 3000000,
                budget_max: 4500000,
                property_type: 'house',
                preferred_zones: ['Coyoacán', 'San Ángel', 'Del Carmen'],
                bedrooms_needed: 3,
                bathrooms_needed: 2,
                features_needed: ['garden', 'study', 'traditional'],
                notes: 'Interesado en casas con estilo colonial o tradicional mexicano.',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            // Agregar algunos leads que el sales funnel excluirá
            {
                full_name: 'Ana Torres (Cerrado)',
                email: 'ana.torres@example.com',
                phone: '+525559998877',
                status: 'closed',
                stage: 'opportunity',
                source: 'referral',
                interest_level: 'high',
                budget_min: 3000000,
                budget_max: 4000000,
                property_type: 'house',
                preferred_zones: ['Polanco'],
                bedrooms_needed: 2,
                bathrooms_needed: 2,
                notes: 'Lead cerrado - ya compró otra propiedad',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'Pedro Ramírez (Removido)',
                email: 'pedro.ramirez@example.com',
                phone: '+525559997766',
                status: 'active',
                stage: 'prospecting',
                source: 'website',
                interest_level: 'low',
                budget_min: 2000000,
                budget_max: 3000000,
                property_type: 'apartment',
                preferred_zones: ['Roma'],
                bedrooms_needed: 1,
                bathrooms_needed: 1,
                metadata: { removed_from_funnel: true },
                notes: 'Lead removido del funnel - no responde',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'Lucia Herrera (Stage Cerrado)',
                email: 'lucia.herrera@example.com',
                phone: '+525559996655',
                status: 'active',
                stage: 'closed',
                source: 'referral',
                interest_level: 'medium',
                budget_min: 4000000,
                budget_max: 5000000,
                property_type: 'house',
                preferred_zones: ['Coyoacán'],
                bedrooms_needed: 3,
                bathrooms_needed: 2,
                notes: 'Lead con stage cerrado',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            // Agregar más leads normales para totalizar 12
            {
                full_name: 'Diego Vargas',
                email: 'diego.vargas@example.com',
                phone: '+525559995544',
                status: 'active',
                stage: 'new',
                source: 'social_media',
                interest_level: 'high',
                budget_min: 2500000,
                budget_max: 3500000,
                property_type: 'apartment',
                preferred_zones: ['Condesa', 'Roma'],
                bedrooms_needed: 2,
                bathrooms_needed: 1,
                notes: 'Lead nuevo, muy interesado',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'Sofia Mendez',
                email: 'sofia.mendez@example.com',
                phone: '+525559994433',
                status: 'active',
                stage: 'prospecting',
                source: 'website',
                interest_level: 'medium',
                budget_min: 6000000,
                budget_max: 8000000,
                property_type: 'house',
                preferred_zones: ['San Ángel', 'Coyoacán'],
                bedrooms_needed: 4,
                bathrooms_needed: 3,
                notes: 'En búsqueda activa',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'Carlos Ruiz',
                email: 'carlos.ruiz@example.com',
                phone: '+525559993322',
                status: 'active',
                stage: 'qualification',
                source: 'event',
                interest_level: 'high',
                budget_min: 3500000,
                budget_max: 4500000,
                property_type: 'apartment',
                preferred_zones: ['Polanco', 'Lomas'],
                bedrooms_needed: 3,
                bathrooms_needed: 2,
                notes: 'Calificando financiamiento',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            },
            {
                full_name: 'Elena Castro',
                email: 'elena.castro@example.com',
                phone: '+525559992211',
                status: 'active',
                stage: 'opportunity',
                source: 'referral',
                interest_level: 'high',
                budget_min: 7000000,
                budget_max: 9000000,
                property_type: 'house',
                preferred_zones: ['Santa Fe', 'Interlomas'],
                bedrooms_needed: 5,
                bathrooms_needed: 4,
                notes: 'Lista para hacer oferta',
                tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
            }
        ];

        console.log('Insertando', leads.length, 'leads de ejemplo...');

        // Insertar todos los leads
        const { data: insertedLeads, error } = await supabase
            .from('leads')
            .insert(leads)
            .select();

        if (error) {
            console.error('Error al insertar leads:', error);
            return;
        }

        console.log(`\n${insertedLeads.length} leads insertados exitosamente!`);

        // Verificar conteo total
        const { count: totalCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        console.log(`\nTotal de leads en la base de datos: ${totalCount}`);

        // Verificar conteo por status
        const { data: statusCount } = await supabase
            .from('leads')
            .select('status');

        const statusDistribution = {};
        statusCount.forEach(lead => {
            statusDistribution[lead.status] = (statusDistribution[lead.status] || 0) + 1;
        });

        console.log('\nDistribución por status:');
        Object.entries(statusDistribution).forEach(([status, count]) => {
            console.log(`  ${status}: ${count}`);
        });

        // Verificar conteo por stage
        const { data: stageCount } = await supabase
            .from('leads')
            .select('stage');

        const stageDistribution = {};
        stageCount.forEach(lead => {
            stageDistribution[lead.stage] = (stageDistribution[lead.stage] || 0) + 1;
        });

        console.log('\nDistribución por stage:');
        Object.entries(stageDistribution).forEach(([stage, count]) => {
            console.log(`  ${stage}: ${count}`);
        });

        // Verificar cuántos aparecerían en el sales funnel
        const { data: funnelLeads } = await supabase
            .from('leads')
            .select('*')
            .not('status', 'eq', 'closed')
            .is('metadata->removed_from_funnel', null);

        const funnelFilteredLeads = funnelLeads.filter(lead => lead.stage !== 'closed');

        console.log(`\nLeads que aparecerían en el sales funnel: ${funnelFilteredLeads.length}`);
        console.log(`Leads excluidos del sales funnel: ${totalCount - funnelFilteredLeads.length}`);

    } catch (error) {
        console.error('Error general:', error);
    }
}

seedDatabase();