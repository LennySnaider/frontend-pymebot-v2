import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno del archivo .env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== VERIFICANDO CONEXIÓN A SUPABASE ===');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseAnonKey ? '[CONFIGURADA]' : '[NO CONFIGURADA]'}`);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Las variables de entorno no están configuradas correctamente');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
    try {
        // 1. Verificar si podemos conectarnos a la base de datos
        console.log('\n1. Probando conexión...');
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error al conectar:', error);
            return;
        }

        console.log('Conexión exitosa!');

        // 2. Contar registros en la tabla leads
        console.log('\n2. Contando registros en tabla leads...');
        const { count, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error al contar:', countError);
            return;
        }

        console.log(`Total de leads en la base de datos: ${count}`);

        // 3. Si hay leads, mostrar algunos ejemplos
        if (count > 0) {
            console.log('\n3. Mostrando algunos leads de ejemplo...');
            const { data: sampleLeads, error: sampleError } = await supabase
                .from('leads')
                .select('id, full_name, stage, status')
                .limit(5);

            if (sampleError) {
                console.error('Error al obtener ejemplos:', sampleError);
                return;
            }

            console.log('Leads de ejemplo:');
            sampleLeads.forEach((lead, index) => {
                console.log(`${index + 1}. ${lead.full_name} - Stage: ${lead.stage}, Status: ${lead.status}`);
            });
        }

        // 4. Verificar las tablas existentes
        console.log('\n4. Verificando tablas en la base de datos...');
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_tables_list', {});

        if (tablesError) {
            console.log('No se pudo obtener la lista de tablas (función RPC no existe)');
            // Intentar con una consulta diferente
            const { data: schemaData, error: schemaError } = await supabase
                .from('_prisma_migrations')
                .select('migration_name')
                .limit(1);

            if (!schemaError) {
                console.log('La base de datos está funcionando correctamente');
            }
        } else {
            console.log('Tablas encontradas:', tables);
        }

    } catch (error) {
        console.error('Error general:', error);
    }
}

checkDatabase();