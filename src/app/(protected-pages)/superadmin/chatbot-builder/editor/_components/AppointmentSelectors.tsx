/**
 * Componentes selectores para datos de citas
 */

import React from 'react'
import Select from '@/components/ui/Select'
import { useAppointmentTypes, useLocations, useAgents } from '../_hooks/useAppointmentData'
import { useAuth } from '@/hooks/useAuth'

interface AppointmentTypeSelectorProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export const AppointmentTypeSelector: React.FC<AppointmentTypeSelectorProps> = ({
  value,
  onChange,
  label = "Tipo de cita",
  placeholder = "Cualquier tipo"
}) => {
  const { tenantId } = useAuth()
  const { types, loading } = useAppointmentTypes(tenantId)

  const options = [
    { value: "", label: placeholder },
    ...types.map(type => ({
      value: type.id,
      label: type.name,
      description: type.description
    }))
  ]

  const selectedOption = options.find(opt => opt.value === (value || '')) || options[0]

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option?.value || '')}
        isDisabled={loading}
        placeholder={loading ? "Cargando..." : placeholder}
      />
    </div>
  )
}

interface LocationSelectorProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  label = "Ubicación",
  placeholder = "Cualquier ubicación"
}) => {
  const { tenantId } = useAuth()
  const { locations, loading } = useLocations(tenantId)

  const options = [
    { value: "", label: placeholder },
    ...locations.map(location => ({
      value: location.id,
      label: location.name,
      description: location.address
    }))
  ]

  const selectedOption = options.find(opt => opt.value === (value || '')) || options[0]

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option?.value || '')}
        isDisabled={loading}
        placeholder={loading ? "Cargando..." : placeholder}
      />
    </div>
  )
}

interface AgentSelectorProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  value,
  onChange,
  label = "Agente",
  placeholder = "Cualquier agente"
}) => {
  const { tenantId } = useAuth()
  const { agents, loading } = useAgents(tenantId)

  const options = [
    { value: "", label: placeholder },
    ...agents.map(agent => ({
      value: agent.id,
      label: agent.full_name,
      description: agent.email
    }))
  ]

  const selectedOption = options.find(opt => opt.value === (value || '')) || options[0]

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option?.value || '')}
        isDisabled={loading}
        placeholder={loading ? "Cargando..." : placeholder}
      />
    </div>
  )
}