const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeAgentStructure() {
  const tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322';
  
  console.log('=== ANÁLISIS DE ESTRUCTURA AGENTS ===\n');
  
  // 1. Verificar usuarios con rol agent
  console.log('1. Usuarios con rol agent:');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('tenant_id', tenant_id)
    .eq('role', 'agent');
    
  console.log(users);
  
  // 2. Verificar tabla agents
  console.log('\n2. Registros en tabla agents:');
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .eq('tenant_id', tenant_id);
    
  console.log(agents);
  
  // 3. Verificar estructura de leads
  console.log('\n3. Estructura de leads (campos relevantes):');
  const { data: leadSample } = await supabase
    .from('leads')
    .select('id, agent_id')
    .limit(1);
    
  console.log(leadSample);
  
  // 4. Verificar si leads.agent_id apunta a agents.id o users.id
  console.log('\n4. Análisis de referencias:');
  const { data: leadWithAgent } = await supabase
    .from('leads')
    .select('full_name, agent_id')
    .eq('agent_id', agents[0]?.id)
    .limit(1);
    
  console.log('Lead con agent_id de tabla agents:', leadWithAgent);
  
  const { data: leadWithUser } = await supabase
    .from('leads')
    .select('full_name, agent_id')
    .eq('agent_id', users[0]?.id)
    .limit(1);
    
  console.log('Lead con agent_id de tabla users:', leadWithUser);
}

analyzeAgentStructure().catch(console.error);