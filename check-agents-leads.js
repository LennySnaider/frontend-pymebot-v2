const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aizwrsjfjyfmutxgwfdd.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAgentsAndLeads() {
    const tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322'
    
    console.log('=== ANALIZANDO AGENTES Y LEADS ===\n')
    
    // 1. Verificar usuarios con rol agent
    console.log('1. Usuarios con rol agent:')
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .eq('tenant_id', tenant_id)
        .eq('role', 'agent')
    
    if (usersError) {
        console.error('Error:', usersError)
        return
    }
    
    console.log('Usuarios encontrados:', users)
    
    // 2. Verificar registros en tabla agents
    console.log('\n2. Registros en tabla agents:')
    const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('id, user_id, tenant_id, name')
        .eq('tenant_id', tenant_id)
    
    if (agentsError) {
        console.error('Error:', agentsError)
        return
    }
    
    console.log('Agents encontrados:', agents)
    
    // 3. Verificar todos los leads
    console.log('\n3. Todos los leads del tenant:')
    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, full_name, agent_id, stage, tenant_id')
        .eq('tenant_id', tenant_id)
    
    if (leadsError) {
        console.error('Error:', leadsError)
        return
    }
    
    console.log(`Total de leads: ${leads?.length || 0}`)
    leads?.forEach(lead => {
        console.log(`- ${lead.full_name} (stage: ${lead.stage}, agent_id: ${lead.agent_id})`)
    })
    
    // 4. Mapeo de leads por agente
    console.log('\n4. Mapeo de leads por agente:')
    const agentLeadsMap = {}
    leads?.forEach(lead => {
        if (lead.agent_id) {
            if (!agentLeadsMap[lead.agent_id]) {
                agentLeadsMap[lead.agent_id] = []
            }
            agentLeadsMap[lead.agent_id].push(lead)
        }
    })
    
    agents?.forEach(agent => {
        const agentLeads = agentLeadsMap[agent.id] || []
        const user = users.find(u => u.id === agent.user_id)
        console.log(`\nAgente: ${user?.full_name || agent.name || 'Unknown'}`)
        console.log(`Agent ID: ${agent.id}`)
        console.log(`User ID: ${agent.user_id}`)
        console.log(`Leads asignados: ${agentLeads.length}`)
        agentLeads.forEach(lead => {
            console.log(`  - ${lead.full_name} (${lead.stage})`)
        })
    })
    
    // 5. Leads sin agente asignado
    console.log('\n5. Leads sin agente asignado:')
    const unassignedLeads = leads?.filter(lead => !lead.agent_id) || []
    console.log(`Total: ${unassignedLeads.length}`)
    unassignedLeads.forEach(lead => {
        console.log(`- ${lead.full_name} (${lead.stage})`)
    })
}

checkAgentsAndLeads().catch(console.error)