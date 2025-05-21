const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addMetadataColumn() {
  try {
    // Esta consulta no funcionará directamente vía JS, 
    // necesitamos usar la consola de Supabase o un cliente SQL directo
    console.log('Para agregar la columna metadata, ejecuta este SQL en Supabase:');
    console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB;');
    
    // Verificar si la columna existe
    const { data: testUser, error } = await supabase
      .from('users')
      .select('id, metadata')
      .limit(1);
    
    if (error) {
      console.log('\nLa columna metadata NO existe:', error.message);
    } else {
      console.log('\nLa columna metadata existe:', testUser);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addMetadataColumn();