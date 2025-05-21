import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno del archivo .env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Las variables de entorno no están configuradas correctamente');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeSeedScript() {
    console.log('=== EJECUTANDO SCRIPT DE SEED DATA ===\n');

    try {
        // Leer el archivo SQL
        const seedSQL = fs.readFileSync(path.join(__dirname, 'sql', 'seed_data.sql'), 'utf8');
        
        // Nota: Supabase JS no puede ejecutar SQL raw directamente
        // Necesitamos usar la API REST o ejecutar las operaciones una por una
        
        console.log('IMPORTANTE: Para ejecutar el script SQL completo, debes:');
        console.log('1. Ir al dashboard de Supabase (https://app.supabase.com)');
        console.log('2. Seleccionar tu proyecto');
        console.log('3. Ir a "SQL Editor"');
        console.log('4. Copiar y pegar el contenido del archivo sql/seed_data.sql');
        console.log('5. Ejecutar el script');
        
        console.log('\nAlternativamente, aquí está el código para insertar un lead de ejemplo:');

        // Insertar un lead de ejemplo para demostrar que funciona
        const { data: newLead, error } = await supabase
            .from('leads')
            .insert([
                {
                    full_name: 'Test Lead 1',
                    email: 'test1@example.com',
                    phone: '+525551234567',
                    status: 'active',
                    stage: 'new',
                    source: 'website',
                    interest_level: 'high',
                    budget_min: 2000000,
                    budget_max: 3000000,
                    property_type: 'house',
                    preferred_zones: ['Polanco', 'Condesa'],
                    bedrooms_needed: 3,
                    bathrooms_needed: 2,
                    features_needed: ['garden', 'parking'],
                    notes: 'Lead de prueba creado desde script',
                    tenant_id: 'afa60b0a-3046-4607-9c48-266af6e1d322'
                }
            ])
            .select();

        if (error) {
            console.error('Error al insertar lead:', error);
            return;
        }

        console.log('Lead de ejemplo insertado:', newLead);

        // Verificar el conteo total
        const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        console.log(`\nTotal de leads en la base de datos: ${count}`);

    } catch (error) {
        console.error('Error general:', error);
    }
}

executeSeedScript();