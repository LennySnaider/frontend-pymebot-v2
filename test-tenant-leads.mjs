/**
 * Test para verificar leads con tenant_id
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testTenantLeads() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const tenantId = 'afa60b0a-3046-4607-9c48-266af6e1d322';
  
  console.log('\n=== BÚSQUEDA DE LEADS POR TENANT ===');
  console.log('Tenant ID:', tenantId);
  
  try {
    // Buscar todos los leads del tenant
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, full_name, stage, tenant_id')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error al buscar:', error);
      return;
    }
    
    console.log(`\nEncontrados ${leads?.length || 0} leads para el tenant:\n`);
    
    leads?.forEach(lead => {
      console.log('ID:', lead.id);
      console.log('Nombre:', lead.full_name);
      console.log('Stage:', lead.stage);
      console.log('Tenant:', lead.tenant_id);
      console.log('---');
    });
    
    // Buscar específicamente Carolina López en este tenant
    const { data: carolina, error: error2 } = await supabase
      .from('leads')
      .select('id, full_name, stage')
      .eq('tenant_id', tenantId)
      .ilike('full_name', '%Carolina%');
    
    console.log('\n=== LEADS CON NOMBRE CAROLINA ===');
    if (!error2 && carolina) {
      carolina.forEach(lead => {
        console.log('ID:', lead.id);
        console.log('Nombre:', lead.full_name);
        console.log('Stage:', lead.stage);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testTenantLeads();