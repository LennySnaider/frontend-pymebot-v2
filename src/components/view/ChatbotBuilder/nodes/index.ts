/**
 * nodes/index.ts
 * Exportar nodeTypes para compatibilidad con otros componentes
 */

// Importar solo los nodos que existen en el editor principal
import StartNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/StartNode'
import MessageNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/MessageNode'
import AINode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/AINode'
import AIVoiceAgentNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/AIVoiceAgentNode'
import ConditionNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/ConditionNode'
import InputNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/InputNode'
import TTSNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/TTSNode'
import STTNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/STTNode'
import EndNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/EndNode'
import ButtonsNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/ButtonsNode'
import ListNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/ListNode'
import CheckAvailabilityNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/CheckAvailabilityNode'
import BookAppointmentNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/BookAppointmentNode'
import CancelAppointmentNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/CancelAppointmentNode'
import RescheduleAppointmentNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/RescheduleAppointmentNode'
import CategoriesNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/CategoriesNode'
import ProductNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/ProductNode'
import ServicesNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/ServicesNode'
import LeadQualificationNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/LeadQualificationNode'
import ActionNode from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/ActionNode'

import type { NodeTypes } from 'reactflow'

// Definición de tipos de nodos para exportar (solo nodos existentes)
export const nodeTypes: NodeTypes = {
    startNode: StartNode,
    messageNode: MessageNode,
    aiNode: AINode,
    aiVoiceAgentNode: AIVoiceAgentNode,
    // Variantes de nombres para compatibilidad
    AgenteVozIA: AIVoiceAgentNode,
    agenteVozIA: AIVoiceAgentNode,
    'agente-voz-ia': AIVoiceAgentNode,
    'ai-voice-agent': AIVoiceAgentNode,
    ai_voice_agent: AIVoiceAgentNode,
    conditionNode: ConditionNode,
    inputNode: InputNode,
    ttsNode: TTSNode,
    sttNode: STTNode,
    endNode: EndNode,

    // Nuevos nodos interactivos
    buttonsNode: ButtonsNode,
    listNode: ListNode,

    // Nodos de negocio
    'check-availability': CheckAvailabilityNode,
    check_availability: CheckAvailabilityNode,
    checkAvailabilityNode: CheckAvailabilityNode,
    'book-appointment': BookAppointmentNode,
    book_appointment: BookAppointmentNode,
    bookAppointmentNode: BookAppointmentNode,
    'cancel-appointment': CancelAppointmentNode,
    cancel_appointment: CancelAppointmentNode,
    cancelAppointmentNode: CancelAppointmentNode,
    'reschedule-appointment': RescheduleAppointmentNode,
    reschedule_appointment: RescheduleAppointmentNode,
    rescheduleAppointmentNode: RescheduleAppointmentNode,

    // Nodos de catálogo
    categories: CategoriesNode,
    categoriesNode: CategoriesNode,
    products: ProductNode,
    productsNode: ProductNode,
    services: ServicesNode,
    servicesNode: ServicesNode,

    // Nodos de gestión de leads
    'lead-qualification': LeadQualificationNode,
    lead_qualification: LeadQualificationNode,
    leadQualificationNode: LeadQualificationNode,

    // Nodos de acción
    actionNode: ActionNode,
    action: ActionNode
}

export default nodeTypes