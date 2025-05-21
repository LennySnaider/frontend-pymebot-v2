/**
 * Provider para el contexto de agentes
 * Maneja el estado global de la gestión de agentes
 */

'use client'

import React, { createContext, useContext, useState } from 'react'
import type { Agent } from '../types'

interface AgentContextType {
    agents: Agent[]
    totalAgents: number
    selectedAgent: Agent | null
    isCreateDialogOpen: boolean
    isEditDialogOpen: boolean
    setAgents: (agents: Agent[]) => void
    setSelectedAgent: (agent: Agent | null) => void
    openCreateDialog: () => void
    closeCreateDialog: () => void
    openEditDialog: (agent: Agent) => void
    closeEditDialog: () => void
    refreshAgents: () => Promise<void>
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export const useAgentContext = () => {
    const context = useContext(AgentContext)
    if (!context) {
        throw new Error('useAgentContext debe usarse dentro de AgentProvider')
    }
    return context
}

interface AgentProviderProps {
    children: React.ReactNode
    initialAgents: Agent[]
    totalAgents: number
}

export default function AgentProvider({ 
    children, 
    initialAgents,
    totalAgents: initialTotal 
}: AgentProviderProps) {
    const [agents, setAgents] = useState<Agent[]>(initialAgents)
    const [totalAgents, setTotalAgents] = useState(initialTotal)
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    
    const openCreateDialog = () => setIsCreateDialogOpen(true)
    const closeCreateDialog = () => setIsCreateDialogOpen(false)
    
    const openEditDialog = (agent: Agent) => {
        setSelectedAgent(agent)
        setIsEditDialogOpen(true)
    }
    
    const closeEditDialog = () => {
        setSelectedAgent(null)
        setIsEditDialogOpen(false)
    }
    
    const refreshAgents = async () => {
        // TODO: Implementar recarga de agentes desde la API
        try {
            const response = await fetch('/api/agents')
            const data = await response.json()
            setAgents(data.list)
            setTotalAgents(data.total)
        } catch (error) {
            console.error('Error al recargar agentes:', error)
        }
    }
    
    const value: AgentContextType = {
        agents,
        totalAgents,
        selectedAgent,
        isCreateDialogOpen,
        isEditDialogOpen,
        setAgents,
        setSelectedAgent,
        openCreateDialog,
        closeCreateDialog,
        openEditDialog,
        closeEditDialog,
        refreshAgents
    }
    
    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    )
}