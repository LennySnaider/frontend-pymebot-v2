const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSalesFunnel() {
  const tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322';
  
  console.log('=== DEBUGGING SALES FUNNEL ===\n');
  
  try {
    // 1. Verificar agentes activos
    console.log('1. Verificando agentes activos:');
    const { data: agents, error: agentsError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, tenant_id')
      .eq('role', 'agent')
      .eq('tenant_id', tenant_id);
    
    if (agentsError) {
      console.error('Error obteniendo agentes:', agentsError);
    } else {
      console.log(`Agentes encontrados: ${agents?.length}`);
      agents?.forEach(agent => {
        console.log(`- ${agent.full_name} (${agent.email}) - Status: ${agent.status || 'null'}`);
      });
    }
    
    // 2. Verificar agentes activos específicamente
    console.log('\n2. Verificando agentes ACTIVOS:');
    const { data: activeAgents, error: activeError } = await supabase
      .from('users')
      .select('id, email, full_name, role, status')
      .eq('role', 'agent')
      .eq('status', 'active')
      .eq('tenant_id', tenant_id);
    
    if (activeError) {
      console.error('Error obteniendo agentes activos:', activeError);
    } else {
      console.log(`Agentes activos encontrados: ${activeAgents?.length}`);
      activeAgents?.forEach(agent => {
        console.log(`- ${agent.full_name} (${agent.email})`);
      });
    }
    
    // 3. Verificar leads
    console.log('\n3. Verificando leads:');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, full_name, stage, agent_id')
      .eq('tenant_id', tenant_id);
    
    if (leadsError) {
      console.error('Error obteniendo leads:', leadsError);
    } else {
      console.log(`Leads encontrados: ${leads?.length}`);
      const stageCount = {};
      leads?.forEach(lead => {
        stageCount[lead.stage] = (stageCount[lead.stage] || 0) + 1;
      });
      console.log('Por etapa:', stageCount);
    }
    
    // 4. Verificar columna status en users
    console.log('\n4. Verificando columna status:');
    const { data: sampleUser } = await supabase
      .from('users')
      .select('id, status')
      .limit(1);
    
    console.log('Sample user:', sampleUser);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugSalesFunnel();