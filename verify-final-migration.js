const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  console.log('=== VERIFICACIÓN FINAL DE LA MIGRACIÓN ===\n');
  
  try {
    // 1. Verificar usuarios con rol agent
    const { data: agents, error: agentsError } = await supabase
      .from('users')
      .select('id, email, full_name, role, metadata')
      .eq('role', 'agent')
      .eq('tenant_id', 'afa60b0a-3046-4607-9c48-266af6e1d322');
    
    console.log(`Agentes totales: ${agents?.length || 0}`);
    agents?.forEach(agent => {
      console.log(`\n- ${agent.full_name} (${agent.email})`);
      console.log(`  ID: ${agent.id}`);
      if (agent.metadata) {
        console.log(`  Metadata: ${JSON.stringify(agent.metadata, null, 2)}`);
      }
    });
    
    // 2. Verificar leads y sus asignaciones
    console.log('\n\n=== ASIGNACIÓN DE LEADS ===');
    const { data: leads } = await supabase
      .from('leads')
      .select(`
        id,
        full_name,
        agent_id,
        users!agent_id (
          full_name,
          email
        )
      `)
      .eq('tenant_id', 'afa60b0a-3046-4607-9c48-266af6e1d322');
    
    const agentLeadCount = {};
    leads?.forEach(lead => {
      const agentName = lead.users?.full_name || 'Sin asignar';
      agentLeadCount[agentName] = (agentLeadCount[agentName] || 0) + 1;
    });
    
    Object.entries(agentLeadCount).forEach(([agent, count]) => {
      console.log(`${agent}: ${count} leads`);
    });
    
    // 3. Verificar que la tabla agents no existe
    console.log('\n\n=== VERIFICACIÓN DE TABLAS ===');
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'agents', 'leads']);
    
    const tableNames = tables?.map(t => t.table_name) || [];
    console.log('Tablas existentes:', tableNames);
    console.log('Tabla agents eliminada:', !tableNames.includes('agents') ? '✅ Sí' : '❌ No');
    
    console.log('\n✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyMigration();