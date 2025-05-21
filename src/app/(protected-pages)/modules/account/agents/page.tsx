/**
 * Página de gestión de agentes
 * Permite crear, editar y eliminar agentes del sistema
 */

import { getTranslations } from 'next-intl/server'
import Container from '@/components/shared/Container'
import AgentList from './_components/AgentList'
import AgentHeader from './_components/AgentHeader'
import CreateAgentDialog from './_components/CreateAgentDialog'
import AgentProvider from './_components/AgentProvider'
import getAgents from '@/server/actions/agents/getAgents'
import type { PageProps } from '@/@types/common'

export default async function AgentsPage({ searchParams }: PageProps) {
    const params = await searchParams
    const t = await getTranslations()
    
    // Obtener lista de agentes
    const agentsData = await getAgents(params)
    
    return (
        <AgentProvider 
            initialAgents={agentsData.list}
            totalAgents={agentsData.total}
        >
            <Container>
                <div className="mb-6">
                    <AgentHeader />
                </div>
                
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                    <AgentList
                        pageIndex={parseInt(params.pageIndex as string) || 1}
                        pageSize={parseInt(params.pageSize as string) || 10}
                    />
                </div>
            </Container>
            
            <CreateAgentDialog />
        </AgentProvider>
    )
}