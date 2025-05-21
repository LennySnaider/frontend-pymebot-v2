import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkAuthStatus() {
  console.log('[AUTH] Verificando estado de autenticación');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Verificar sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[AUTH] Error al obtener sesión:', sessionError);
    } else if (session) {
      console.log('[AUTH] Sesión activa:');
      console.log('  - User ID:', session.user.id);
      console.log('  - Email:', session.user.email);
      console.log('  - Role:', session.user.role);
    } else {
      console.log('[AUTH] No hay sesión activa');
    }
    
    // Intentar obtener información del usuario actual
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[AUTH] Error al obtener usuario:', userError);
    } else if (user) {
      console.log('[AUTH] Usuario actual:', user);
    }
    
    // Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'leads');
    
    if (policiesError) {
      console.error('[AUTH] Error al obtener políticas:', policiesError);
    } else if (policies) {
      console.log('[AUTH] Políticas RLS para tabla leads:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.qual}`);
      });
    }
    
  } catch (error) {
    console.error('[AUTH] Error general:', error);
  }
}

checkAuthStatus();