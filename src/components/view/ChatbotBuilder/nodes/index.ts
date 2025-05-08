/**
 * frontend/src/components/view/ChatbotBuilder/nodes/index.ts
 * Exportación de todos los tipos de nodos disponibles para el constructor de chatbot
 * @version 1.4.0
 * @updated 2025-07-05 - Añadidos nodos para servicios y productos
 */

import TextNode from './TextNode'
import InputNode from './InputNode'
import ConditionalNode from './ConditionalNode'
import AINode from './AINode'
import RouterNode from './RouterNode'
import ActionNode from './ActionNode'
import StartNode from './StartNode'
import TTSNode from './TTSNode'
import STTNode from './STTNode'
import AIVoiceAgentNode from './AIVoiceAgentNode'
import CheckAvailabilityNode from './CheckAvailabilityNode'
import BookAppointmentNode from './BookAppointmentNode'
import LeadQualificationNode from './LeadQualificationNode'
import RescheduleAppointmentNode from './RescheduleAppointmentNode'
import ServicesNode from './ServicesNode'
import ProductNode from './ProductNode'

export {
    TextNode,
    InputNode,
    ConditionalNode, 
    AINode,
    RouterNode,
    ActionNode,
    StartNode,
    TTSNode,
    STTNode,
    AIVoiceAgentNode,
    CheckAvailabilityNode,
    BookAppointmentNode,
    LeadQualificationNode,
    RescheduleAppointmentNode,
    ServicesNode,
    ProductNode
}

// Mapping de tipos de nodos a componentes
export const nodeTypes = {
    text: TextNode,
    message: TextNode,
    input: InputNode,
    capture: InputNode,
    conditional: ConditionalNode,
    condition: ConditionalNode,
    ai: AINode,
    ai_response: AINode,
    router: RouterNode,
    action: ActionNode,
    start: StartNode,
    tts: TTSNode,
    'text-to-speech': TTSNode,
    stt: STTNode,
    'speech-to-text': STTNode,
    'ai-voice-agent': AIVoiceAgentNode,
    'ai_voice_agent': AIVoiceAgentNode,
    'check-availability': CheckAvailabilityNode,
    'check_availability': CheckAvailabilityNode,
    'book-appointment': BookAppointmentNode,
    'book_appointment': BookAppointmentNode,
    'lead-qualification': LeadQualificationNode,
    'lead_qualification': LeadQualificationNode,
    'reschedule-appointment': RescheduleAppointmentNode,
    'reschedule_appointment': RescheduleAppointmentNode,
    'services': ServicesNode,
    'services-list': ServicesNode,
    'services_list': ServicesNode,
    'products': ProductNode,
    'products-list': ProductNode,
    'products_list': ProductNode
}

// Tipos de nodos disponibles para agregar en el editor
export const availableNodeTypes = [
    {
        type: 'ai-voice-agent',
        label: 'Agente Voz IA',
        description: 'Genera una respuesta IA y la convierte a voz',
        icon: 'robot-voice',
        color: 'purple',
        initialData: {
            prompt: 'Escribe el prompt para la IA aquí',
            provider: 'minimax',
            model: 'abab5.5',
            temperature: 0.7,
            voice: 'female-tianmei-jingpin',
            emotion: 'neutral',
            speed: 1.0,
            vol: 1.0,
            pitch: 0,
            label: 'Agente Voz IA',
            delayMs: 0
        }
    },
    {
        type: 'text',
        label: 'Mensaje de texto',
        description: 'Envía un mensaje de texto al usuario',
        icon: 'message',
        color: 'blue',
        initialData: {
            message: 'Escribe tu mensaje aquí',
            label: 'Mensaje de texto',
            delayMs: 0
        }
    },
    {
        type: 'input',
        label: 'Captura datos',
        description: 'Solicita información al usuario',
        icon: 'input',
        color: 'green',
        initialData: {
            prompt: '¿Cuál es tu información?',
            variableName: 'respuesta_usuario',
            inputType: 'text',
            label: 'Captura de datos'
        }
    },
    {
        type: 'conditional',
        label: 'Condición',
        description: 'Evalúa una condición y toma un camino',
        icon: 'condition',
        color: 'purple',
        initialData: {
            condition: 'stateData.variable === "valor"',
            label: 'Condición'
        }
    },
    {
        type: 'ai',
        label: 'Respuesta IA',
        description: 'Genera una respuesta con IA',
        icon: 'brain',
        color: 'indigo',
        initialData: {
            prompt: 'Escribe el prompt para la IA aquí',
            provider: 'openai',
            temperature: 0.7,
            label: 'Respuesta IA',
            delayMs: 0
        }
    },
    {
        type: 'check-availability',
        label: 'Verificar Disponibilidad',
        description: 'Verifica disponibilidad de citas',
        icon: 'calendar',
        color: 'blue',
        initialData: {
            tenant_id: '',
            appointment_type_id: '',
            location_id: '',
            agent_id: '',
            label: 'Verificar Disponibilidad'
        }
    },
    {
        type: 'book-appointment',
        label: 'Agendar Cita',
        description: 'Programa una cita y actualiza el lead',
        icon: 'calendar-check',
        color: 'green',
        initialData: {
            tenant_id: '',
            update_lead_stage: true,
            new_lead_stage: 'confirmed',
            send_confirmation: true,
            create_follow_up_task: true,
            label: 'Agendar Cita'
        }
    },
    {
        type: 'lead-qualification',
        label: 'Calificar Lead',
        description: 'Califica leads basado en respuestas',
        icon: 'user-gear',
        color: 'purple',
        initialData: {
            tenant_id: '',
            questions: [],
            high_score_threshold: 70,
            medium_score_threshold: 40,
            update_lead_stage: true,
            high_score_stage: 'opportunity',
            medium_score_stage: 'qualification',
            low_score_stage: 'prospecting',
            label: 'Calificar Lead'
        }
    },
    {
        type: 'reschedule-appointment',
        label: 'Reprogramar Cita',
        description: 'Permite reprogramar una cita existente',
        icon: 'calendar-edit',
        color: 'orange',
        initialData: {
            update_lead_on_reschedule: true,
            require_reason: true,
            notify_agent: true,
            send_confirmation: true,
            max_reschedule_attempts: 3,
            success_message: 'Tu cita ha sido reprogramada correctamente. Te hemos enviado los detalles actualizados.',
            failure_message: 'Lo siento, no pudimos reprogramar tu cita. Por favor, intenta de nuevo más tarde.',
            label: 'Reprogramar Cita'
        }
    },
    {
        type: 'services',
        label: 'Mostrar Servicios',
        description: 'Muestra una lista de servicios disponibles',
        icon: 'ruler',
        color: 'indigo',
        initialData: {
            tenant_id: '',
            category_id: '',
            limit: 5,
            filter_by_price: false,
            sort_by: 'name',
            sort_direction: 'asc',
            message_template: 'Estos son nuestros servicios disponibles:\n{{services_list}}',
            label: 'Mostrar Servicios'
        }
    },
    {
        type: 'products',
        label: 'Mostrar Productos',
        description: 'Muestra un catálogo de productos disponibles',
        icon: 'package',
        color: 'blue',
        initialData: {
            tenant_id: '',
            category_id: '',
            limit: 5,
            filter_by_price: false,
            filter_by_stock: false,
            in_stock_only: true,
            sort_by: 'name',
            sort_direction: 'asc',
            include_images: false,
            message_template: 'Estos son nuestros productos disponibles:\n{{products_list}}',
            label: 'Mostrar Productos'
        }
    },
    {
        type: 'tts',
        label: 'Síntesis de voz',
        description: 'Convierte texto a voz (audio)',
        icon: 'volume-up',
        color: 'blue',
        initialData: {
            text: 'Texto a convertir en voz',
            voice: 'female_1',
            speed: 1.0,
            outputVariableName: 'audio_tts',
            label: 'Síntesis de voz'
        }
    },
    {
        type: 'stt',
        label: 'Reconocimiento de voz',
        description: 'Convierte voz a texto',
        icon: 'microphone',
        color: 'purple',
        initialData: {
            prompt: 'Por favor, habla ahora',
            language: 'es',
            timeoutSeconds: 10,
            outputVariableName: 'texto_transcrito',
            label: 'Reconocimiento de voz'
        }
    },
    {
        type: 'action',
        label: 'Acción',
        description: 'Ejecuta una acción en el backend',
        icon: 'action',
        color: 'cyan',
        initialData: {
            actionType: 'check_availability',
            label: 'Acción',
            delayMs: 0
        }
    },
    {
        type: 'router',
        label: 'Router',
        description: 'Cambia a otra plantilla',
        icon: 'router',
        color: 'amber',
        initialData: {
            label: 'Router a otra plantilla'
        }
    },
    {
        type: 'start',
        label: 'Inicio',
        description: 'Punto de inicio del flujo',
        icon: 'play',
        color: 'green',
        initialData: {
            label: 'Inicio del flujo'
        }
    }
]
