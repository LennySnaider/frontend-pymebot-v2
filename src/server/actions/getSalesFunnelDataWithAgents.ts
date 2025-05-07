/**
 * frontend/src/server/actions/getSalesFunnelDataWithAgents.ts
 * Acción del servidor para obtener los datos completos de leads con información de agentes.
 * Versión mejorada que incluye la carga de agentes asignados para cada lead.
 * 
 * @version 1.2.0
 * @updated 2025-04-28
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { Lead, Member } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'

const getSalesFunnelDataWithAgents = async () => {
    try {
        // Obtenemos el cliente Supabase
        const supabase = SupabaseClient.getInstance()
        
        if (!supabase) {
            console.error('Error: No se pudo obtener el cliente Supabase.')
            return {
                'new': [],
                'prospecting': [],
                'qualification': [],
                'opportunity': []
            }
        }
        
        // 1. Primero obtenemos todos los leads
        const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select(`
                id, 
                full_name, 
                description, 
                email, 
                phone, 
                stage, 
                status,
                cover, 
                metadata, 
                created_at,
                updated_at,
                tenant_id, 
                agent_id,
                source,
                interest_level,
                budget_min,
                budget_max,
                property_type,
                preferred_zones,
                bedrooms_needed,
                bathrooms_needed,
                features_needed,
                notes,
                last_contact_date,
                next_contact_date,
                contact_count
            `)
            .order('created_at', { ascending: false })

        if (leadsError) {
            console.error('Error al obtener leads:', leadsError)
            return {
                'new': [],
                'prospecting': [],
                'qualification': [],
                'opportunity': []
            }
        }
        
        if (!leadsData || leadsData.length === 0) {
            console.log('No se encontraron leads.')
            return {
                'new': [],
                'prospecting': [],
                'qualification': [],
                'opportunity': []
            }
        }
        
        console.log(`Obtenidos ${leadsData.length} leads.`)
        
        // 2. Recopilamos todos los IDs de agentes para hacer una única consulta
        const agentIds = leadsData
            .map(lead => lead.agent_id)
            .filter(id => id) // Filtrar nulls o undefined
        
        // Array para mantener los agentes únicos
        const uniqueAgentIds = [...new Set(agentIds)]
        
        console.log(`Encontrados ${uniqueAgentIds.length} agentes únicos asignados.`)
        
        // 3. Obtenemos datos de todos los agentes de una sola vez
        let agentsMap: Record<string, Member> = {}
        
        if (uniqueAgentIds.length > 0) {
            const { data: agentsData, error: agentsError } = await supabase
                .from('agents')
                .select(`
                    id,
                    name,
                    email,
                    profile_image
                `)
                .in('id', uniqueAgentIds)
            
            if (agentsError) {
                console.error('Error al obtener datos de agentes:', agentsError)
            } else if (agentsData) {
                // Creamos un mapa de agentes por ID para acceso rápido
                agentsMap = agentsData.reduce((map, agent) => {
                    map[agent.id] = {
                        id: agent.id,
                        name: agent.name || agent.email || 'Agente',
                        email: agent.email || '',
                        img: agent.profile_image || ''
                    }
                    return map
                }, {} as Record<string, Member>)
                
                console.log(`Cargados ${Object.keys(agentsMap).length} agentes con datos completos.`)
            }
        }
        
        // 4. Organizamos los leads por etapa y añadimos los datos de sus agentes
        // IMPORTANTE: Solo incluimos las etapas del flujo normal de trabajo, no las columnas especiales
        const formattedData: Record<string, Lead[]> = {
            'new': [],
            'prospecting': [],
            'qualification': [],
            'opportunity': []
        }
        
        // Lista de etapas válidas - TODAS son válidas para validación, pero solo algunas se muestran como columnas
        const validStages = ['new', 'prospecting', 'qualification', 'opportunity', 'confirmed', 'closed']
        
        // Etapas que se muestran como columnas en el tablero kanban
        const displayedStages = ['new', 'prospecting', 'qualification', 'opportunity']
        
        // Procesamos cada lead
        leadsData.forEach(lead => {
            // Determinar presupuesto
            let budget: number | undefined = undefined
            if (lead.budget_min !== null && lead.budget_min !== undefined) {
                budget = lead.budget_min
                if (lead.budget_max !== null && lead.budget_max !== undefined) {
                    budget = Math.round((lead.budget_min + lead.budget_max) / 2)
                }
            } else if (lead.budget_max !== null && lead.budget_max !== undefined) {
                budget = lead.budget_max
            }
            
            // Zonas preferidas
            let preferredZones: string[] = []
            if (lead.preferred_zones && Array.isArray(lead.preferred_zones)) {
                preferredZones = lead.preferred_zones
            }
            
            // Determinar el nivel de interés y convertirlo a etiqueta
            const interest = lead.interest_level || 'medio'
            const interestLabel = (() => {
                switch(interest) {
                    case 'alto': return 'Alta prioridad'
                    case 'medio': return 'Media prioridad'
                    case 'bajo': return 'Baja prioridad'
                    default: return 'Media prioridad'
                }
            })()
            
            // Construir etiquetas iniciales
            const initialLabels = ['Nuevo contacto']
            if (!initialLabels.includes(interestLabel)) {
                initialLabels.push(interestLabel)
            }
            
            // Metadata mejorada
            const metadata = {
                ...(lead.metadata || {}),
                email: lead.email,
                phone: lead.phone,
                interest: interest,
                source: lead.source || 'web',
                budget: budget,
                propertyType: lead.property_type || 'Apartamento',
                preferredZones: preferredZones,
                bedroomsNeeded: lead.bedrooms_needed || 1,
                bathroomsNeeded: lead.bathrooms_needed || 1,
                leadStatus: lead.status || 'new',
                lastContactDate: lead.last_contact_date ? new Date(lead.last_contact_date).getTime() : null,
                nextContactDate: lead.next_contact_date ? new Date(lead.next_contact_date).getTime() : null,
                agentNotes: lead.notes || '',
                // Importante: Guardamos el ID del agente en metadata para recuperarlo si es necesario
                agentId: lead.agent_id
            }
            
            // Obtener el miembro asignado si existe
            let members: Member[] = []
            if (lead.agent_id && agentsMap[lead.agent_id]) {
                members = [agentsMap[lead.agent_id]]
            }
            
            // Crear el objeto lead con todos los datos
            const formattedLead: Lead = {
                id: lead.id,
                name: lead.full_name || 'Lead sin nombre',
                description: lead.description || '',
                email: lead.email || '',
                phone: lead.phone || '',
                cover: lead.cover || '',
                stage: lead.stage || 'new',
                status: lead.status, // Añadimos el campo status explícitamente
                members: members, // Ahora incluimos los miembros asignados
                labels: initialLabels,
                attachments: [],
                comments: [],
                dueDate: lead.next_contact_date ? new Date(lead.next_contact_date).getTime() : null,
                metadata: metadata,
                contactCount: lead.contact_count || 0,
                createdAt: lead.created_at ? new Date(lead.created_at).getTime() : Date.now(),
                budget: budget
            }
            
            // Validar y asignar a la etapa correcta
            let stage = lead.stage || 'new'
            
            // Verificamos si la etapa es válida
            if (!validStages.includes(stage)) {
                // Si es una etapa no reconocida, asignamos a 'new'
                console.log(`Etapa "${stage}" no válida para el lead ${lead.id}, asignando a "new"`)
                stage = 'new'
                formattedLead.stage = 'new'
            } else {
                // Si es una etapa válida, aseguramos que esté configurada
                formattedLead.stage = stage
            }
            
            // Si el status es 'closed', aseguramos que la etapa también lo sea
            if (lead.status === 'closed' && stage !== 'closed') {
                console.log(`Lead ${lead.id} tiene status=closed pero stage=${stage}, corrigiendo a etapa 'closed'`)
                stage = 'closed'
                formattedLead.stage = 'closed'
            }
            
            // IMPORTANTE: Solo añadimos leads a las columnas que deben mostrarse
            // Si el lead está en 'closed' o 'confirmed', no lo mostramos en el tablero kanban regular
            if (displayedStages.includes(stage)) {
                // Aseguramos que la columna existe
                if (!formattedData[stage]) {
                    formattedData[stage] = []
                }
                // Añadir a la etapa correspondiente
                formattedData[stage].push(formattedLead)
            } else {
                console.log(`Lead ${lead.id} en etapa ${stage} no se muestra en el tablero regular`)
            }
        })
        
        return formattedData
        
    } catch (err: any) {
        console.error('Error en getSalesFunnelDataWithAgents:', err)
        return {
            'new': [],
            'prospecting': [],
            'qualification': [],
            'opportunity': []
        }
    }
}

export default getSalesFunnelDataWithAgents