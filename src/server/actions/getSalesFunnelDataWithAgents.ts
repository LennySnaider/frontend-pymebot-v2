/**
 * frontend/src/server/actions/getSalesFunnelDataWithAgents.ts
 * Acción del servidor para obtener los datos completos de leads con información de agentes.
 * Versión mejorada que incluye la carga de agentes asignados para cada lead.
 * 
 * @version 1.2.0
 * @updated 2025-04-28
 */

import { createClient as createServerClient, createServiceClient } from '@/services/supabase/server'
import { Lead, Member } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'
import { getTenantFromSession } from './tenant/getTenantFromSession'
import { getLeadsForSalesFunnel, UNIFIED_STAGE_MAPPING } from '@/services/leads/leadCountService'

const getSalesFunnelDataWithAgents = async () => {
    try {
        // En desarrollo usamos service role, en producción usamos el cliente con sesión
        const supabase = process.env.NODE_ENV === 'development' 
            ? createServiceClient()
            : createServerClient()
        
        if (!supabase) {
            console.error('Error: No se pudo crear el cliente Supabase.')
            // Retornar estructura vacía en lugar de {} para evitar problemas de renderizado
            const emptyResult = {
                'new': [],
                'prospecting': [],
                'qualification': [],
                'opportunity': []
            }
            console.log('Retornando estructura vacía por error de Supabase:', emptyResult)
            return emptyResult
        }
        
        // Obtener el tenant_id de la sesión
        const tenantId = await getTenantFromSession()
        console.log('Tenant ID en getSalesFunnelDataWithAgents:', tenantId)
        
        // Si no hay tenant_id, devolvemos estructura definida
        if (!tenantId) {
            console.error('No se encontró tenant_id en la sesión')
            const emptyResult = {
                'new': [],
                'prospecting': [],
                'qualification': [],
                'opportunity': []
            }
            console.log('Retornando estructura vacía por falta de tenant_id:', emptyResult)
            return emptyResult
        }
        
        // Usar el servicio centralizado para obtener leads
        console.log('Obteniendo leads con criterios unificados para tenant:', tenantId)
        
        const leadsData = await getLeadsForSalesFunnel(tenantId)
        console.log('Resultado de getLeadsForSalesFunnel:', {
            isArray: Array.isArray(leadsData),
            length: leadsData?.length,
            firstLead: leadsData?.[0]
        })
        
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
        console.log('Leads data sample:', leadsData.slice(0, 3)) // Mostrar los primeros 3 leads
        
        // 2. Recopilamos todos los IDs de agentes para hacer una única consulta
        const agentIds = leadsData
            .map(lead => lead.agent_id)
            .filter(id => id) // Filtrar nulls o undefined
        
        // Array para mantener los agentes únicos
        const uniqueAgentIds = [...new Set(agentIds)]
        
        console.log(`Encontrados ${uniqueAgentIds.length} agentes únicos asignados.`)
        
        // 3. Obtenemos datos de todos los usuarios agentes de una sola vez
        let agentsMap: Record<string, Member> = {}
        
        if (uniqueAgentIds.length > 0) {
            const { data: agentsData, error: agentsError } = await supabase
                .from('users')
                .select(`
                    id,
                    full_name,
                    email,
                    avatar_url,
                    metadata,
                    role
                `)
                .in('id', uniqueAgentIds)
                .eq('tenant_id', tenantId)
            
            if (agentsError) {
                console.error('Error al obtener datos de agentes:', agentsError)
            } else if (agentsData) {
                console.log(`Encontrados ${agentsData.length} usuarios para los IDs de agentes`)
                console.log('Roles de usuarios encontrados:', agentsData.map(a => ({ id: a.id, role: a.role })))
                
                // Creamos un mapa de agentes por ID para acceso rápido
                agentsMap = agentsData.reduce((map, agent) => {
                    map[agent.id] = {
                        id: agent.id,
                        name: agent.full_name || agent.email || 'Agente',
                        email: agent.email || '',
                        img: agent.avatar_url || agent.metadata?.profile_image || ''
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
        
        // Usar el mapeo unificado del servicio
        const stageMapping = UNIFIED_STAGE_MAPPING
        
        // Etapas que se muestran como columnas en el tablero kanban
        const displayedStages = ['new', 'prospecting', 'qualification', 'opportunity']
        
        // Definir las etapas válidas en español e inglés
        const validStagesSpanish = ['nuevos', 'prospectando', 'calificacion', 'calificación', 'oportunidad', 'confirmado', 'cerrado']
        const validStages = ['new', 'prospecting', 'qualification', 'opportunity', 'confirmed', 'closed']
        
        // Debug: Contar leads por etapa
        const stageCount: Record<string, number> = {}
        leadsData.forEach(lead => {
            const stage = lead.stage || 'unknown'
            stageCount[stage] = (stageCount[stage] || 0) + 1
        })
        console.log('Distribución de leads por etapa:', stageCount)
        
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
            
            // Metadata mejorada - USANDO LOS VALORES DE LA BASE DE DATOS
            const metadata = {
                ...(lead.metadata || {}),
                email: lead.email,
                phone: lead.phone,
                interest: interest,
                source: lead.source || 'web',
                budget: budget,
                propertyType: lead.property_type, // Usar valor original sin fallback
                preferredZones: preferredZones,
                bedroomsNeeded: lead.bedrooms_needed, // Usar valor original sin fallback
                bathroomsNeeded: lead.bathrooms_needed, // Usar valor original sin fallback
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
            
            // Si la etapa está en español, la mapeamos a inglés
            if (validStagesSpanish.includes(stage)) {
                const mappedStage = stageMapping[stage]
                console.log(`Etapa en español "${stage}" mapeada a inglés "${mappedStage}" para el lead ${lead.id}`)
                stage = mappedStage
            }
            
            // Verificamos si la etapa es válida (ahora en inglés)
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
                console.log(`Lead ${lead.id} (${lead.full_name}) en etapa "${stage}" no se muestra en el tablero regular`)
                
                // Si el stage no está en las etapas mostradas, lo agregamos a 'new' como fallback
                if (!validStages.includes(stage)) {
                    console.log(`Moviendo lead ${lead.id} de etapa desconocida "${stage}" a "new"`)
                    formattedLead.stage = 'new'
                    formattedData['new'].push(formattedLead)
                }
            }
        })
        
        // Mostrar resumen de datos
        console.log('Resumen de leads por etapa:')
        Object.entries(formattedData).forEach(([stage, leads]) => {
            console.log(`${stage}: ${leads.length} leads`)
        })
        
        return formattedData
        
    } catch (err: any) {
        console.error('Error en getSalesFunnelDataWithAgents:', err)
        // Asegurarnos de retornar una estructura bien definida
        const errorResult = {
            'new': [],
            'prospecting': [],
            'qualification': [],
            'opportunity': []
        }
        console.log('Retornando estructura vacía por error:', errorResult)
        return errorResult
    }
}

export default getSalesFunnelDataWithAgents