const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aizwrsjfjyfmutxgwfdd.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
    console.error('No se encontró SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAgentLeadsCount() {
    const tenant_id = 'afa60b0a-3046-4607-9c48-266af6e1d322'
    
    console.log('1. Obteniendo usuarios con rol agent...')
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('role', 'agent')
    
    if (usersError) {
        console.error('Error al obtener usuarios:', usersError)
        return
    }
    
    console.log(`   Encontrados ${users?.length || 0} usuarios con rol agent`)
    
    if (users && users.length > 0) {
        const userIds = users.map(u => u.id)
        
        console.log('\n2. Obteniendo relación con tabla agents...')
        const { data: agents, error: agentsError } = await supabase
            .from('agents')
            .select('id, user_id')
            .in('user_id', userIds)
            .eq('tenant_id', tenant_id)
        
        if (agentsError) {
            console.error('Error al obtener agents:', agentsError)
            return
        }
        
        console.log(`   Encontrados ${agents?.length || 0} registros en tabla agents`)
        
        if (agents && agents.length > 0) {
            const agentIds = agents.map(a => a.id)
            
            console.log('\n3. Obteniendo leads para cada agente...')
            const { data: leads, error: leadsError } = await supabase
                .from('leads')
                .select('id, agent_id, full_name')
                .in('agent_id', agentIds)
                .eq('tenant_id', tenant_id)
            
            if (leadsError) {
                console.error('Error al obtener leads:', leadsError)
                return
            }
            
            console.log(`   Encontrados ${leads?.length || 0} leads totales`)
            
            // Contar leads por agente
            const leadsPerAgent = {}
            leads?.forEach(lead => {
                if (lead.agent_id) {
                    leadsPerAgent[lead.agent_id] = (leadsPerAgent[lead.agent_id] || 0) + 1
                }
            })
            
            console.log('\n4. Resumen de leads por agente:')
            agents.forEach(agent => {
                const user = users.find(u => u.id === agent.user_id)
                const leadCount = leadsPerAgent[agent.id] || 0
                console.log(`   ${user?.full_name || user?.email}: ${leadCount} leads`)
            })
        }
    }
}

testAgentLeadsCount().catch(console.error)