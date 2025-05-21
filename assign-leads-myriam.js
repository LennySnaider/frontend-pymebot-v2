const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Obtener el agent_id de Myriam
async function assignLeadsToMyriam() {
  const { data: agentData } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', '65027cc5-c369-4298-8421-e227f2c72859')
    .single();
  
  if (!agentData) {
    console.log('No se encontró el agente de Myriam');
    return;
  }
  
  console.log('Agent ID de Myriam:', agentData.id);
  
  const { data, error } = await supabase
    .from('leads')
    .update({ agent_id: agentData.id })
    .eq('tenant_id', 'afa60b0a-3046-4607-9c48-266af6e1d322')
    .in('full_name', ['Roberto Martínez García', 'María Fernández López'])
    .select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Leads actualizados:', data);
  }
  
  // Verificar el resultado
  const { data: myriamLeads } = await supabase
    .from('leads')
    .select('full_name, stage')
    .eq('agent_id', agentData.id)
    .eq('tenant_id', 'afa60b0a-3046-4607-9c48-266af6e1d322');
  
  console.log('\nLeads asignados a Myriam:');
  myriamLeads?.forEach(lead => {
    console.log(`- ${lead.full_name} (${lead.stage})`);
  });
}

assignLeadsToMyriam().catch(console.error);