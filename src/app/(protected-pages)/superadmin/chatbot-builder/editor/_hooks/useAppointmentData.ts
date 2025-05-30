/**
 * Hook para cargar datos relacionados con citas para los nodos del chatbot
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase/SupabaseClient'

interface AppointmentType {
  id: string
  name: string
  description?: string
}

interface Location {
  id: string
  name: string
  address?: string
}

interface Agent {
  id: string
  full_name: string
  email: string
  role: string
}

export function useAppointmentTypes(tenantId?: string) {
  const [types, setTypes] = useState<AppointmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    const fetchTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('tenant_appointment_types')
          .select('id, name, description')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        setTypes(data || [])
      } catch (err) {
        console.error('Error loading appointment types:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTypes()
  }, [tenantId])

  return { types, loading, error }
}

export function useLocations(tenantId?: string) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    const fetchLocations = async () => {
      try {
        // Por ahora, vamos a simular las ubicaciones hasta que tengamos la tabla real
        // TODO: Cambiar esto cuando tengamos tabla de ubicaciones
        const mockLocations = [
          { id: 'main', name: 'Oficina Principal', address: 'Centro' },
          { id: 'north', name: 'Sucursal Norte', address: 'Zona Norte' },
          { id: 'south', name: 'Sucursal Sur', address: 'Zona Sur' }
        ]
        setLocations(mockLocations)
      } catch (err) {
        console.error('Error loading locations:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [tenantId])

  return { locations, loading, error }
}

export function useAgents(tenantId?: string) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, email, role')
          .eq('tenant_id', tenantId)
          .eq('role', 'agent')
          .eq('status', 'active')
          .order('full_name')

        if (error) throw error
        setAgents(data || [])
      } catch (err) {
        console.error('Error loading agents:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [tenantId])

  return { agents, loading, error }
}