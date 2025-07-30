/**
 * frontend/src/app/(protected-pages)/modules/appointments/calendar-view/_components/AgentColorLegend.tsx
 * Componente que muestra una leyenda con los colores asignados a cada agente.
 *
 * @version 1.0.0
 * @updated 2025-04-20
 */

'use client'
import { useState, useEffect } from 'react'
import { useAppointmentStore } from '../../_store/appointmentStore'
import { getAllAgentColors, resetAgentColors } from '../_store/agentColors'
import { useCalendar } from '../_store/calendarStore'

interface Agent {
  id: string
  name: string
  color: string
}

const AgentColorLegend = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isOpen, setIsOpen] = useState(true)

  // Seleccionar eventos del calendario para detectar cambios
  const events = useCalendar(state => state.data)

  // Efecto para cargar colores de agentes
  useEffect(() => {
    // Obtener los colores actuales de los agentes
    const agentColors = getAllAgentColors()
    
    // Buscar información de los agentes para cada color
    const appointments = useAppointmentStore.getState().appointments
    
    // Crear un mapa de agentes con sus IDs y nombres
    const agentMap: Record<string, { id: string; name: string }> = {}
    
    // Rellenar el mapa de agentes desde las citas
    appointments.forEach(appointment => {
      if (appointment.agent_id && (appointment as any).agentName) {
        agentMap[appointment.agent_id] = {
          id: appointment.agent_id,
          name: (appointment as any).agentName
        }
      }
    })
    
    // Crear el array de agentes con colores
    const agentsWithColors: Agent[] = Object.entries(agentColors)
      .map(([agentId, color]) => ({
        id: agentId,
        name: agentMap[agentId]?.name || 'Agente desconocido',
        color
      }))
      .filter(agent => agent.name !== 'Agente desconocido') // Filtrar agentes desconocidos
    
    setAgents(agentsWithColors)
  }, [events])

  // Si no hay agentes con colores, no mostrar el componente
  if (agents.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div 
        className="p-2 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-sm font-medium text-gray-700">Colores de Agentes</h3>
        <span className="text-gray-500">
          {isOpen ? '▲' : '▼'}
        </span>
      </div>
      
      {isOpen && (
        <div className="p-2 pt-0 border-t border-gray-100">
          <ul className="space-y-1">
            {agents.map(agent => (
              <li key={agent.id} className="flex items-center gap-2 py-1">
                <span 
                  className="w-4 h-4 flex-shrink-0 rounded" 
                  style={{ backgroundColor: agent.color }}
                ></span>
                <span className="text-xs text-gray-700 truncate">{agent.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AgentColorLegend