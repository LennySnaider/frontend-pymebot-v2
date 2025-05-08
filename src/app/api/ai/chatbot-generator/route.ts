import { NextRequest, NextResponse } from 'next/server'
import uniqueId from 'lodash/uniqueId'
import { v4 as uuidv4 } from 'uuid'

/**
 * API para generar flujos de chatbot usando IA
 * Esta función crea estructuras de nodos y conexiones para ReactFlow
 * basadas en las opciones proporcionadas por el usuario
 */
export async function POST(req: NextRequest) {
    try {
        const options = await req.json()
        
        // Extraer opciones para generar el flujo
        const {
            vertical = 'general',
            industry = 'servicios',
            description = '',
            features = [],
            complexity = 'medium',
            language = 'es',
            includeAI = true,
            tenant_id = ''
        } = options
        
        // En un entorno real, aquí enviaríamos estos parámetros a un modelo de IA
        // Para la demostración, generamos un flujo predefinido basado en la industria y complejidad
        
        // Obtener un flujo base según la complejidad
        let flowTemplate = getFlowTemplate(complexity, includeAI)
        
        // Personalizar el flujo según la industria
        customizeFlowForIndustry(flowTemplate, industry, vertical)
        
        // Añadir nodos específicos basados en características solicitadas
        addFeatureNodes(flowTemplate, features)
        
        // Construir respuesta con el flujo generado
        const response = {
            id: uniqueId('flow-'),
            name: `Chatbot ${capitalizeFirstLetter(industry)} ${complexity === 'complex' ? 'Avanzado' : complexity === 'medium' ? 'Intermedio' : 'Básico'}`,
            description: description || `Chatbot automático para ${industry} generado con IA. Vertical: ${vertical}`,
            status: 'draft',
            react_flow_json: flowTemplate,
            version: 1
        }
        
        return NextResponse.json(response)
    } catch (error) {
        console.error('Error al generar flujo de chatbot:', error)
        return NextResponse.json(
            { error: 'Error al generar el flujo de chatbot' },
            { status: 500 }
        )
    }
}

/**
 * Obtiene una plantilla de flujo base según la complejidad solicitada
 */
function getFlowTemplate(complexity: string, includeAI: boolean) {
    // Nodo inicial que estará en todas las plantillas
    const startNode = {
        id: 'start-node',
        type: 'startNode',
        position: { x: 50, y: 150 },
        data: { label: 'Inicio' }
    }
    
    // Nodo de bienvenida presente en todas las plantillas
    const welcomeNode = {
        id: 'messageNode-welcome',
        type: 'messageNode',
        position: { x: 300, y: 150 },
        data: {
            label: 'Bienvenida',
            message: 'Hola, gracias por contactarnos. ¿En qué podemos ayudarte hoy?',
            delay: 0
        }
    }
    
    // Configurar edges básicos
    const baseEdges = [
        {
            id: 'edge-start-welcome',
            source: 'start-node',
            target: 'messageNode-welcome',
            animated: true
        }
    ]
    
    // Flujo básico
    if (complexity === 'simple') {
        const inputNode = {
            id: 'inputNode-query',
            type: 'inputNode',
            position: { x: 550, y: 150 },
            data: {
                label: 'Consulta',
                question: '¿Cuál es tu consulta?',
                variableName: 'consulta_usuario',
                inputType: 'text'
            }
        }
        
        const responseNode = includeAI ? {
            id: 'aiNode-response',
            type: 'aiNode',
            position: { x: 800, y: 150 },
            data: {
                label: 'Respuesta',
                prompt: 'Responde amablemente a la consulta del usuario: {{consulta_usuario}}',
                model: 'gpt-4o',
                temperature: 0.7,
                maxTokens: 300
            }
        } : {
            id: 'messageNode-response',
            type: 'messageNode',
            position: { x: 800, y: 150 },
            data: {
                label: 'Respuesta',
                message: 'Gracias por tu consulta. Un asesor se pondrá en contacto contigo pronto.',
                delay: 0
            }
        }
        
        const endNode = {
            id: 'endNode-1',
            type: 'endNode',
            position: { x: 1050, y: 150 },
            data: {
                label: 'Fin',
                message: 'Gracias por contactarnos. ¿Hay algo más en lo que podamos ayudarte?'
            }
        }
        
        // Conexiones adicionales
        const edges = [
            ...baseEdges,
            {
                id: 'edge-welcome-input',
                source: 'messageNode-welcome',
                target: 'inputNode-query',
                animated: true
            },
            {
                id: 'edge-input-response',
                source: 'inputNode-query',
                target: includeAI ? 'aiNode-response' : 'messageNode-response',
                animated: true
            },
            {
                id: 'edge-response-end',
                source: includeAI ? 'aiNode-response' : 'messageNode-response',
                target: 'endNode-1',
                animated: true
            }
        ]
        
        return {
            nodes: [startNode, welcomeNode, inputNode, responseNode, endNode],
            edges
        }
    }
    
    // Flujo medio (con opciones)
    if (complexity === 'medium') {
        const optionsNode = {
            id: 'conditionNode-options',
            type: 'conditionNode',
            position: { x: 550, y: 150 },
            data: {
                label: 'Opciones',
                condition: 'Selecciona una opción',
                options: [
                    { value: 'info', label: 'Información' },
                    { value: 'cita', label: 'Agendar cita' },
                    { value: 'otra', label: 'Otra consulta' }
                ]
            }
        }
        
        const infoNode = {
            id: 'messageNode-info',
            type: 'messageNode',
            position: { x: 800, y: 50 },
            data: {
                label: 'Información',
                message: 'Aquí te proporcionamos la información más relevante sobre nuestros servicios...',
                delay: 0
            }
        }
        
        const appointmentNode = {
            id: 'book-appointment-1',
            type: 'bookAppointment',
            position: { x: 800, y: 150 },
            data: {
                label: 'Agendar Cita',
                tenant_id: '{{tenant_id}}',
                appointment_type_id: '',
                location_id: '',
                agent_id: ''
            }
        }
        
        const queryNode = {
            id: 'inputNode-query',
            type: 'inputNode',
            position: { x: 800, y: 250 },
            data: {
                label: 'Consulta',
                question: '¿En qué podemos ayudarte?',
                variableName: 'consulta_usuario',
                inputType: 'text'
            }
        }
        
        const aiResponseNode = includeAI ? {
            id: 'aiNode-response',
            type: 'aiNode',
            position: { x: 1050, y: 250 },
            data: {
                label: 'Respuesta IA',
                prompt: 'Responde de manera amable y profesional a la consulta: {{consulta_usuario}}',
                model: 'gpt-4o',
                temperature: 0.7,
                maxTokens: 300
            }
        } : {
            id: 'messageNode-response',
            type: 'messageNode',
            position: { x: 1050, y: 250 },
            data: {
                label: 'Respuesta',
                message: 'Gracias por tu consulta. Un asesor se pondrá en contacto contigo pronto.',
                delay: 0
            }
        }
        
        const endNode = {
            id: 'endNode-1',
            type: 'endNode',
            position: { x: 1300, y: 150 },
            data: {
                label: 'Fin',
                message: 'Gracias por contactarnos. ¿Hay algo más en lo que podamos ayudarte?'
            }
        }
        
        // Conexiones
        const edges = [
            ...baseEdges,
            {
                id: 'edge-welcome-options',
                source: 'messageNode-welcome',
                target: 'conditionNode-options',
                animated: true
            },
            {
                id: 'edge-options-info',
                source: 'conditionNode-options',
                target: 'messageNode-info',
                sourceHandle: 'info',
                animated: true
            },
            {
                id: 'edge-options-appointment',
                source: 'conditionNode-options',
                target: 'book-appointment-1',
                sourceHandle: 'cita',
                animated: true
            },
            {
                id: 'edge-options-query',
                source: 'conditionNode-options',
                target: 'inputNode-query',
                sourceHandle: 'otra',
                animated: true
            },
            {
                id: 'edge-info-end',
                source: 'messageNode-info',
                target: 'endNode-1',
                animated: true
            },
            {
                id: 'edge-appointment-end',
                source: 'book-appointment-1',
                target: 'endNode-1',
                animated: true
            },
            {
                id: 'edge-query-ai',
                source: 'inputNode-query',
                target: includeAI ? 'aiNode-response' : 'messageNode-response',
                animated: true
            },
            {
                id: 'edge-ai-end',
                source: includeAI ? 'aiNode-response' : 'messageNode-response',
                target: 'endNode-1',
                animated: true
            }
        ]
        
        return {
            nodes: [
                startNode, 
                welcomeNode, 
                optionsNode, 
                infoNode, 
                appointmentNode, 
                queryNode, 
                includeAI ? aiResponseNode : aiResponseNode, 
                endNode
            ],
            edges
        }
    }
    
    // Flujo complejo (con múltiples ramas y nodos avanzados)
    if (complexity === 'complex') {
        const optionsNode = {
            id: 'conditionNode-options',
            type: 'conditionNode',
            position: { x: 550, y: 150 },
            data: {
                label: 'Opciones',
                condition: 'Selecciona una opción',
                options: [
                    { value: 'info', label: 'Información' },
                    { value: 'cita', label: 'Agendar cita' },
                    { value: 'servicios', label: 'Servicios' },
                    { value: 'contacto', label: 'Contactar asesor' },
                    { value: 'otra', label: 'Otra consulta' }
                ]
            }
        }
        
        const infoNode = {
            id: 'messageNode-info',
            type: 'messageNode',
            position: { x: 800, y: 0 },
            data: {
                label: 'Información',
                message: 'Aquí te proporcionamos la información más relevante sobre nuestros servicios...',
                delay: 0
            }
        }
        
        const checkAvailabilityNode = {
            id: 'check-availability-1',
            type: 'check-availability',
            position: { x: 800, y: 100 },
            data: {
                label: 'Verificar disponibilidad',
                tenant_id: '{{tenant_id}}',
                appointment_type_id: '',
                location_id: '',
                agent_id: ''
            }
        }
        
        const appointmentNode = {
            id: 'book-appointment-1',
            type: 'bookAppointment',
            position: { x: 1050, y: 100 },
            data: {
                label: 'Agendar Cita',
                tenant_id: '{{tenant_id}}',
                appointment_type_id: '',
                location_id: '',
                agent_id: ''
            }
        }
        
        const servicesNode = {
            id: 'services-list-1',
            type: 'services',
            position: { x: 800, y: 200 },
            data: {
                label: 'Mostrar Servicios',
                tenant_id: '{{tenant_id}}',
                category_id: '',
                limit: 5,
                sort_by: 'name',
                sort_direction: 'asc',
                message_template: 'Estos son nuestros servicios disponibles:\n{{services}}\n¿En cuál estás interesado?'
            }
        }
        
        const contactInputNode = {
            id: 'inputNode-contact',
            type: 'inputNode',
            position: { x: 800, y: 300 },
            data: {
                label: 'Datos de contacto',
                question: 'Por favor, déjanos tus datos de contacto (nombre y teléfono) para que un asesor se comunique contigo.',
                variableName: 'datos_contacto',
                inputType: 'text'
            }
        }
        
        const leadQualificationNode = {
            id: 'lead-qualification-1',
            type: 'leadQualification',
            position: { x: 1050, y: 300 },
            data: {
                label: 'Calificar Lead',
                tenant_id: '{{tenant_id}}',
                lead_source: 'chatbot',
                qualification_questions: [
                    {
                        question: '¿En qué servicio está interesado?',
                        variable_name: 'servicio_interes'
                    },
                    {
                        question: '¿Para cuándo necesita el servicio?',
                        variable_name: 'fecha_interes'
                    }
                ]
            }
        }
        
        const queryNode = {
            id: 'inputNode-query',
            type: 'inputNode',
            position: { x: 800, y: 400 },
            data: {
                label: 'Consulta',
                question: '¿En qué podemos ayudarte?',
                variableName: 'consulta_usuario',
                inputType: 'text'
            }
        }
        
        const aiResponseNode = includeAI ? {
            id: 'aiNode-response',
            type: 'aiNode',
            position: { x: 1050, y: 400 },
            data: {
                label: 'Respuesta IA',
                prompt: 'Eres un asistente virtual especializado en {{industry}}. Responde de manera amable y profesional a la consulta: {{consulta_usuario}}',
                model: 'gpt-4o',
                temperature: 0.7,
                maxTokens: 300
            }
        } : {
            id: 'messageNode-response',
            type: 'messageNode',
            position: { x: 1050, y: 400 },
            data: {
                label: 'Respuesta',
                message: 'Gracias por tu consulta. Un asesor se pondrá en contacto contigo pronto.',
                delay: 0
            }
        }
        
        const endNode = {
            id: 'endNode-1',
            type: 'endNode',
            position: { x: 1300, y: 200 },
            data: {
                label: 'Fin',
                message: 'Gracias por contactarnos. ¿Hay algo más en lo que podamos ayudarte?'
            }
        }
        
        // Conexiones para flujo complejo
        const edges = [
            ...baseEdges,
            {
                id: 'edge-welcome-options',
                source: 'messageNode-welcome',
                target: 'conditionNode-options',
                animated: true
            },
            {
                id: 'edge-options-info',
                source: 'conditionNode-options',
                target: 'messageNode-info',
                sourceHandle: 'info',
                animated: true
            },
            {
                id: 'edge-options-availability',
                source: 'conditionNode-options',
                target: 'check-availability-1',
                sourceHandle: 'cita',
                animated: true
            },
            {
                id: 'edge-availability-appointment',
                source: 'check-availability-1',
                target: 'book-appointment-1',
                animated: true
            },
            {
                id: 'edge-options-services',
                source: 'conditionNode-options',
                target: 'services-list-1',
                sourceHandle: 'servicios',
                animated: true
            },
            {
                id: 'edge-options-contact',
                source: 'conditionNode-options',
                target: 'inputNode-contact',
                sourceHandle: 'contacto',
                animated: true
            },
            {
                id: 'edge-contact-lead',
                source: 'inputNode-contact',
                target: 'lead-qualification-1',
                animated: true
            },
            {
                id: 'edge-options-query',
                source: 'conditionNode-options',
                target: 'inputNode-query',
                sourceHandle: 'otra',
                animated: true
            },
            {
                id: 'edge-query-ai',
                source: 'inputNode-query',
                target: includeAI ? 'aiNode-response' : 'messageNode-response',
                animated: true
            },
            {
                id: 'edge-info-end',
                source: 'messageNode-info',
                target: 'endNode-1',
                animated: true
            },
            {
                id: 'edge-appointment-end',
                source: 'book-appointment-1',
                target: 'endNode-1',
                animated: true
            },
            {
                id: 'edge-services-end',
                source: 'services-list-1',
                target: 'endNode-1',
                animated: true
            },
            {
                id: 'edge-lead-end',
                source: 'lead-qualification-1',
                target: 'endNode-1',
                animated: true
            },
            {
                id: 'edge-ai-end',
                source: includeAI ? 'aiNode-response' : 'messageNode-response',
                target: 'endNode-1',
                animated: true
            }
        ]
        
        return {
            nodes: [
                startNode,
                welcomeNode,
                optionsNode,
                infoNode,
                checkAvailabilityNode,
                appointmentNode,
                servicesNode,
                contactInputNode,
                leadQualificationNode,
                queryNode,
                includeAI ? aiResponseNode : aiResponseNode,
                endNode
            ],
            edges
        }
    }
    
    // Por defecto, devolver el flujo simple
    return getFlowTemplate('simple', includeAI)
}

/**
 * Personaliza el flujo según la industria y vertical seleccionados
 */
function customizeFlowForIndustry(flowTemplate: any, industry: string, vertical: string) {
    // Personalizar mensajes según la industria
    flowTemplate.nodes.forEach((node: any) => {
        if (node.type === 'messageNode' && node.data.label === 'Bienvenida') {
            node.data.message = getWelcomeMessageByIndustry(industry, vertical)
        }
        
        // Personalizar prompts de IA según la industria
        if (node.type === 'aiNode') {
            node.data.prompt = node.data.prompt.replace('{{industry}}', industry)
        }
        
        // Personalizar mensajes de fin
        if (node.type === 'endNode') {
            node.data.message = getEndMessageByIndustry(industry, vertical)
        }
    })
    
    return flowTemplate
}

/**
 * Obtiene un mensaje de bienvenida personalizado según la industria y vertical
 */
function getWelcomeMessageByIndustry(industry: string, vertical: string) {
    const messages: Record<string, string> = {
        inmobiliaria: '¡Bienvenido a nuestra inmobiliaria! ¿En qué podemos ayudarte hoy? ¿Buscas propiedades, información sobre ventas o rentas?',
        salud: '¡Hola! Bienvenido al asistente virtual de nuestra clínica. ¿En qué podemos ayudarte hoy? ¿Deseas agendar una cita, conocer nuestros servicios o hacer una consulta?',
        restaurante: '¡Bienvenido a nuestro restaurante! ¿Te gustaría conocer nuestro menú, hacer una reserva o consultar nuestros horarios?',
        gimnasio: '¡Hola! Bienvenido al asistente virtual de nuestro gimnasio. ¿Quieres información sobre membresías, horarios de clases o agendar una sesión de entrenamiento?',
        belleza: '¡Bienvenido a nuestro salón de belleza! ¿Te gustaría agendar una cita, conocer nuestros servicios o consultar precios?',
        educacion: '¡Hola! Bienvenido al asistente virtual de nuestra institución educativa. ¿En qué podemos ayudarte hoy? ¿Información sobre programas, costos o proceso de inscripción?',
        legal: '¡Bienvenido a nuestro despacho de abogados! ¿En qué podemos asesorarte hoy? ¿Necesitas información sobre nuestros servicios legales o deseas agendar una consulta?',
        automotriz: '¡Bienvenido a nuestro concesionario/taller! ¿Buscas información sobre vehículos, servicios de mantenimiento o quieres agendar una cita?',
        // Por defecto
        default: '¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte hoy?'
    }
    
    return messages[industry] || messages.default
}

/**
 * Obtiene un mensaje de despedida personalizado según la industria y vertical
 */
function getEndMessageByIndustry(industry: string, vertical: string) {
    const messages: Record<string, string> = {
        inmobiliaria: 'Gracias por tu interés en nuestras propiedades. Si necesitas más información, no dudes en contactarnos nuevamente.',
        salud: 'Gracias por contactar con nuestra clínica. Tu salud es nuestra prioridad, no dudes en volver si tienes más consultas.',
        restaurante: 'Gracias por tu interés en nuestro restaurante. ¡Esperamos servirte pronto!',
        gimnasio: 'Gracias por tu interés en nuestro gimnasio. ¡Esperamos verte pronto para comenzar tu camino hacia un estilo de vida más saludable!',
        belleza: 'Gracias por contactar con nuestro salón de belleza. ¡Esperamos verte pronto para consentirte como mereces!',
        educacion: 'Gracias por tu interés en nuestra institución educativa. Estamos a tu disposición para cualquier otra consulta que tengas.',
        legal: 'Gracias por contactar con nuestro despacho de abogados. Estamos a tu disposición para asistirte en tus necesidades legales.',
        automotriz: 'Gracias por tu interés en nuestros servicios automotrices. Estamos a tu disposición para cualquier otra consulta que tengas.',
        // Por defecto
        default: 'Gracias por contactarnos. Si necesitas más información, estamos aquí para ayudarte.'
    }
    
    return messages[industry] || messages.default
}

/**
 * Añade nodos específicos basados en características solicitadas
 */
function addFeatureNodes(flowTemplate: any, features: string[]) {
    if (!features || features.length === 0) return flowTemplate
    
    // Mapeo de características a tipos de nodos
    const featureNodeMap: Record<string, any> = {
        voice: {
            id: `aiVoiceAgentNode-${uuidv4().slice(0, 8)}`,
            type: 'aiVoiceAgentNode',
            position: { x: 0, y: 0 }, // Se ajustará después
            data: {
                label: 'Asistente de Voz',
                prompt: 'Eres un asistente virtual amable y servicial. Responde cordialmente y de forma concisa para que sea fácil de escuchar.',
                model: 'gpt-4o',
                temperature: 0.7,
                maxTokens: 500,
                voice: 'Female',
                rate: 1.0,
                responseVariableName: 'respuesta_ia',
                outputVariableName: 'audio_respuesta',
                provider: 'voice_ai',
                delay: 0,
            }
        },
        products: {
            id: `products-list-${uuidv4().slice(0, 8)}`,
            type: 'products',
            position: { x: 0, y: 0 }, // Se ajustará después
            data: {
                label: 'Catálogo de Productos',
                tenant_id: '{{tenant_id}}',
                category_id: '',
                limit: 5,
                include_images: true,
                sort_by: 'name',
                sort_direction: 'asc',
                message_template: 'Estos son nuestros productos disponibles:\n{{products}}\n¿En cuál estás interesado?'
            }
        },
        faq: {
            id: `aiNode-faq-${uuidv4().slice(0, 8)}`,
            type: 'aiNode',
            position: { x: 0, y: 0 }, // Se ajustará después
            data: {
                label: 'Preguntas Frecuentes',
                prompt: 'Eres un asistente especializado en responder preguntas frecuentes sobre nuestra empresa. Responde de manera concisa y precisa la siguiente pregunta: {{pregunta_usuario}}',
                model: 'gpt-4o',
                temperature: 0.5,
                maxTokens: 400
            }
        },
        // Añadir más tipos de nodos según sea necesario
    }
    
    // Verificar si ya existe un nodo final para conectar con él
    const endNode = flowTemplate.nodes.find((node: any) => node.type === 'endNode')
    let endNodeId = endNode ? endNode.id : null
    
    // Si no hay nodo final, crear uno
    if (!endNodeId) {
        const newEndNode = {
            id: `endNode-${uuidv4().slice(0, 8)}`,
            type: 'endNode',
            position: { x: 1200, y: 300 },
            data: {
                label: 'Fin',
                message: 'Gracias por contactarnos. ¿Hay algo más en lo que podamos ayudarte?'
            }
        }
        flowTemplate.nodes.push(newEndNode)
        endNodeId = newEndNode.id
    }
    
    // Posición base para los nuevos nodos
    let baseX = 800
    let baseY = 500
    
    // Añadir nodos de características
    features.forEach((feature, index) => {
        if (featureNodeMap[feature]) {
            // Clonar nodo para evitar referencias
            const featureNode = JSON.parse(JSON.stringify(featureNodeMap[feature]))
            
            // Ajustar posición
            featureNode.position = { x: baseX, y: baseY + (index * 100) }
            
            // Añadir nodo y conexión con el nodo final
            flowTemplate.nodes.push(featureNode)
            
            // Para simplificar, conectamos todos los nodos de características con un nodo condicional
            // Primero verificamos si ya existe un nodo condicional para opciones
            let optionsNodeId = null
            const optionsNode = flowTemplate.nodes.find((node: any) => 
                node.type === 'conditionNode' && node.data.label === 'Opciones'
            )
            
            if (optionsNode) {
                // Añadir opción al nodo existente
                optionsNode.data.options.push({
                    value: feature,
                    label: capitalizeFirstLetter(feature)
                })
                optionsNodeId = optionsNode.id
                
                // Añadir conexión desde el nodo de opciones al nodo de característica
                flowTemplate.edges.push({
                    id: `edge-options-${feature}-${uuidv4().slice(0, 8)}`,
                    source: optionsNodeId,
                    target: featureNode.id,
                    sourceHandle: feature,
                    animated: true
                })
            }
            
            // Conectar con el nodo final
            flowTemplate.edges.push({
                id: `edge-${feature}-end-${uuidv4().slice(0, 8)}`,
                source: featureNode.id,
                target: endNodeId,
                animated: true
            })
        }
    })
    
    return flowTemplate
}

/**
 * Utilitario para capitalizar la primera letra de una cadena
 */
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}