/**
 * frontend/src/server/actions/getSalesFunnelData.ts
 * Acción del servidor para obtener los datos de leads del embudo de ventas inmobiliario.
 * Implementa las etapas específicas del embudo de ventas: Nuevos, Prospectando, Calificación, 
 * y Oportunidad. Los leads en estado Confirmado o Cerrado se mostrarán en otra vista especializada.
 * Mejorada con mejor manejo de datos y detección de etapa.
 * 
 * @version 1.2.0
 * @updated 2025-06-30
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { Lead } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'

const getSalesFunnelData = async () => {
    // Verificamos que tenemos las variables de entorno configuradas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    // Si no están configuradas, lanzamos un error o devolvemos un objeto vacío
    if (!supabaseUrl || !supabaseKey) {
        console.error('Error: Variables de entorno de Supabase no configuradas.')
        // Devolvemos un objeto vacío para evitar romper la UI, pero registramos el error
        return {
            'new': [],
            'prospecting': [],
            'qualification': [],
            'opportunity': []
        }
    }
    
    // Intentamos obtener datos reales de Supabase
    try {
        // Obtenemos el cliente Supabase
        const supabase = SupabaseClient.getInstance()
        
        // Verificamos que el cliente exista
        if (!supabase) {
            console.error('Error: No se pudo obtener el cliente Supabase.')
            // Devolvemos un objeto vacío
            return {
                'new': [],
                'prospecting': [],
                'qualification': [],
                'opportunity': []
            }
        }
        
        console.log('Obteniendo datos de Supabase...')
        
        // Consulta completa que incluye todos los campos relevantes del lead
        console.log('Ejecutando consulta a Supabase para obtener leads con todos los campos...');
        const { data, error } = await supabase
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
            .not('status', 'eq', 'closed') // Filtrar los leads con status "closed"
            .order('created_at', { ascending: false });

        if (error) {
            // Mejoramos el log de errores
            console.error('--- INICIO ERROR SUPABASE ---')
            console.error('Mensaje:', error.message)
            console.error('Código:', error.code)
            console.error('Detalles:', error.details)
            console.error('Hint:', error.hint)
            console.error('Error Completo (string):', JSON.stringify(error, null, 2))
            console.error('--- FIN ERROR SUPABASE ---')
            // Lanzamos una excepción para detener la ejecución y ver el error
            throw new Error(`Error al obtener leads desde Supabase: ${error.message || 'Error desconocido'}`)
        }
        
        console.log('Datos obtenidos de Supabase:', data?.length || 0, 'leads encontrados')
        
        // Eliminamos el fallback a datos mock si no hay datos
        if (!data) {
             console.warn('La consulta a Supabase no devolvió datos (data es null o undefined).')
             // Devolvemos un objeto vacío en lugar de datos mock
             return {
                 'new': [],
                 'prospecting': [],
                 'qualification': [],
                 'opportunity': []
             }
        }
        
        if (data.length === 0) {
            console.log('No se encontraron leads en la base de datos.')
            // Devolvemos un objeto vacío en lugar de datos mock
             return {
                 'new': [],
                 'prospecting': [],
                 'qualification': [],
                 'opportunity': []
             }
        }
        
        // Filtrar manualmente cualquier lead que tenga metadata.removed_from_funnel = true o stage="closed"
        const filteredData = data.filter(lead => {
            // Si el lead tiene stage="closed", lo filtramos sin importar el status
            if (lead.stage === 'closed') {
                console.log(`Lead ${lead.id} filtrado por tener stage="closed"`);
                return false;
            }
            
            // Si el lead tiene metadata.removed_from_funnel = true, lo filtramos
            if (lead.metadata && lead.metadata.removed_from_funnel === true) {
                console.log(`Lead ${lead.id} filtrado por tener metadata.removed_from_funnel = true`);
                return false;
            }
            
            // Si llegamos aquí, el lead pasa el filtro
            return true;
        });
        
        console.log('Después de filtrado:', filteredData.length, 'leads (se excluyeron', data.length - filteredData.length, 'leads)');
        
        // Lista de etapas válidas para validación
        const validStages = ['first_contact', 'new', 'prospecting', 'qualification', 'opportunity', 'confirmed', 'closed'];
        
        // Agregar un mensaje de debug para verificar qué etapas se consideran válidas
        console.log('[DEBUG] VALIDACIONES DE ETAPAS EN getSalesFunnelData');
        console.log('validStages =', validStages);
        
        // Etapas que se muestran en el SalesFunnel (usadas para inicializar formattedData)
        // Mantenemos 'new' como una etapa de display, pero internamente sabemos que es 'first_contact'
        const displayStages = ['new', 'prospecting', 'qualification', 'opportunity'];
        console.log('displayStages =', displayStages);
        
        // Inicializar formattedData solo con las etapas que se mostrarán
        const formattedData: Record<string, Lead[]> = {};
        displayStages.forEach(stage => {
            formattedData[stage] = [];
        });
        
        // Lista de etapas para debugging
        const leadStages = new Set<string>();
        
        // Procesar cada lead y organizarlo por etapa
        filteredData.forEach((lead: any) => {
            // Registrar todas las etapas encontradas para debugging
            leadStages.add(lead.stage || 'null');
            
            // Determinar presupuesto a partir de budget_min y budget_max
            let budget: number | undefined = undefined;
            if (lead.budget_min !== null && lead.budget_min !== undefined) {
                budget = lead.budget_min;
                // Si también hay budget_max, podríamos calcular un promedio o mostrar un rango
                if (lead.budget_max !== null && lead.budget_max !== undefined) {
                    budget = Math.round((lead.budget_min + lead.budget_max) / 2);
                }
            } else if (lead.budget_max !== null && lead.budget_max !== undefined) {
                budget = lead.budget_max;
            }
            
            // Construir preferredZones como array
            let preferredZones: string[] = [];
            if (lead.preferred_zones && Array.isArray(lead.preferred_zones)) {
                preferredZones = lead.preferred_zones;
            }
            
            // Construir metadata para asegurar que tiene toda la información
            const metadata = {
                ...(lead.metadata || {}),
                email: lead.email,
                phone: lead.phone,
                interest: lead.interest_level || 'medio',
                source: lead.source || 'web',
                budget: budget,
                propertyType: lead.property_type || 'Apartamento',
                preferredZones: preferredZones,
                bedroomsNeeded: lead.bedrooms_needed || 1,
                bathroomsNeeded: lead.bathrooms_needed || 1,
                leadStatus: lead.status || 'new',
                lastContactDate: lead.last_contact_date ? new Date(lead.last_contact_date).getTime() : null,
                nextContactDate: lead.next_contact_date ? new Date(lead.next_contact_date).getTime() : null,
                agentNotes: lead.notes || ''
            };
            
            // Mapeo para compatibilidad entre nombres de etapas de frontend y backend
            const stageDisplayMap: Record<string, string> = {
                'first_contact': 'new',  // En DB es 'first_contact', en UI es 'new'
                'new': 'new',
                'prospecting': 'prospecting',
                'qualification': 'qualification',
                'opportunity': 'opportunity',
                'confirmed': 'confirmed',
                'closed': 'closed'
            };
            
            // Normalizar la etapa del lead para la visualización en frontend
            const dbStage = lead.stage || 'first_contact'; // Valor por defecto en la BD
            const displayStage = stageDisplayMap[dbStage] || dbStage;
            
            // Mapear el lead al formato esperado por el frontend
            const formattedLead: Lead = {
                id: lead.id,
                name: lead.full_name, // Usamos full_name
                description: lead.description || '',
                email: lead.email || '',
                phone: lead.phone || '',
                cover: lead.cover || '',
                stage: displayStage, // Usamos la etapa mapeada para frontend
                // Dejamos members vacío ya que no estamos consultando agentes
                members: [], 
                labels: ['Nuevo contacto'],
                attachments: [],
                comments: [],
                dueDate: lead.next_contact_date ? new Date(lead.next_contact_date).getTime() : null,
                metadata: metadata,
                contactCount: lead.contact_count || 0,
                createdAt: lead.created_at ? new Date(lead.created_at).getTime() : Date.now(),
                budget: budget
            }
            
            // Log detallado para debugging de leads importantes
            console.log(`Procesando lead: ${lead.id}, nombre: ${lead.full_name}, etapa: ${lead.stage || 'new'}`);
            
            // Validamos que la etapa sea una etapa válida
            let dbStage = lead.stage || 'first_contact';
            if (!validStages.includes(dbStage)) {
                console.log(`[ERROR DE VALIDACIÓN] Etapa "${dbStage}" no válida para el lead ${lead.id}, estableciendo como "first_contact"`);
                console.log('validStages =', validStages);
                console.log('dbStage =', dbStage);
                console.log('typeof dbStage =', typeof dbStage);
                console.log('lead completo =', JSON.stringify(lead, null, 2));
                
                dbStage = 'first_contact';
                // Actualizamos el stage en el lead formateado
                formattedLead.stage = 'new'; // En UI es 'new'
                
                // También intentamos actualizar la base de datos
                (async () => {
                    try {
                        const updateResult = await supabase
                            .from('leads')
                            .update({ stage: 'first_contact' })
                            .eq('id', lead.id);
                            
                        if (updateResult.error) {
                            console.error(`Error al corregir etapa en la base de datos para lead ${lead.id}:`, updateResult.error);
                        } else {
                            console.log(`Se corrigió la etapa en la base de datos para lead ${lead.id} de "${lead.stage}" a "first_contact"`);
                        }
                    } catch (err) {
                        console.error(`Error al intentar corregir la etapa en la base de datos para lead ${lead.id}:`, err);
                    }
                })();
            }
            
            // Obtenemos el nombre de la etapa para visualización
            const displayStage = stageDisplayMap[dbStage] || dbStage;
            
            // Añadir a la etapa correspondiente solo si es una etapa que se muestra en el SalesFunnel
            if (displayStages.includes(displayStage) && formattedData[displayStage]) {
                formattedData[displayStage].push(formattedLead);
            } else {
                console.log(`Lead ${lead.id} con etapa "${dbStage}" (display: "${displayStage}") no se muestra en el SalesFunnel`);
            }
        });
        
        // Log de todas las etapas encontradas para debugging
        console.log('Etapas encontradas en los leads:', Array.from(leadStages));
        
        return formattedData
        
    } catch (err: any) { // Especificamos el tipo 'any' para err
        console.error('Error al cargar datos del funnel:', err)
        // En caso de error general, devolvemos un objeto vacío
        // Podríamos también lanzar el error si preferimos que la página falle
        // throw err; 
        return {
            'new': [],
            'prospecting': [],
            'qualification': [],
            'opportunity': []
        }
    }
}

export default getSalesFunnelData
