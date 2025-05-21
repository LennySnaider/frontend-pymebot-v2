const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  try {
    // Leer el archivo SQL
    const sqlScript = fs.readFileSync(
      '/Users/masi/Documents/chatbot-builderbot-supabase/scripts/29_safe_migrate_agents_to_users.sql',
      'utf8'
    );
    
    // Ejecutar el script SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlScript
    });
    
    if (error) {
      console.error('Error ejecutando migración:', error);
      return;
    }
    
    console.log('Migración completada exitosamente');
    
    // Verificar el resultado
    const { data: agentUsers } = await supabase
      .from('users')
      .select('id, email, full_name, metadata')
      .eq('role', 'agent');
    
    console.log('\nUsuarios con rol agent después de la migración:');
    agentUsers?.forEach(user => {
      console.log(`- ${user.full_name} (${user.email})`);
      if (user.metadata) {
        console.log(`  Metadata: ${JSON.stringify(user.metadata, null, 2)}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

executeMigration();