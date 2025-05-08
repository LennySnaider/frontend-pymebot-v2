/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/NodesPanel.tsx
 * Panel de nodos disponibles para arrastrar al editor
 * @version 1.1.0
 * @updated 2025-05-07 - Añadidos nodos de negocio
 */

'use client'

import React from 'react'
import {
    PiChatCircleDuotone,
    PiRobotDuotone,
    PiArrowsSplitDuotone,
    PiKeyboardDuotone,
    PiDoorOpenDuotone,
    PiSpeakerHighDuotone,
    PiMicrophoneDuotone,
    PiSparkleDuotone,
    PiGearDuotone,
    PiCalendarDuotone,
    PiCalendarCheckDuotone,
    PiUserGearDuotone,
    PiCalendarPlusDuotone,
} from 'react-icons/pi'

// Importamos los tipos de nodos disponibles desde el registro
import { availableNodeTypes } from '@/components/view/ChatbotBuilder/nodes'

// Lista ampliada de nodos que incluye los nodos de negocio
const NODE_TYPES = [
    {
        type: 'messageNode',
        label: 'Mensaje',
        description: 'Enviar un mensaje de texto al usuario',
        icon: <PiChatCircleDuotone className="text-blue-500" />,
    },
    {
        type: 'aiNode',
        label: 'Respuesta AI',
        description: 'Generar una respuesta con IA',
        icon: <PiRobotDuotone className="text-purple-500" />,
    },
    {
        type: 'aiVoiceAgentNode',
        label: 'AI Voice Agent',
        description: 'Nodo combinado de IA y voz: genera respuesta y la lee',
        icon: <PiSparkleDuotone className="text-indigo-500" />,
    },
    {
        type: 'conditionNode',
        label: 'Condición',
        description: 'Bifurcar el flujo basado en condiciones',
        icon: <PiArrowsSplitDuotone className="text-yellow-500" />,
    },
    {
        type: 'inputNode',
        label: 'Entrada',
        description: 'Solicitar información al usuario',
        icon: <PiKeyboardDuotone className="text-green-500" />,
    },
    {
        type: 'ttsNode',
        label: 'Text-to-Speech',
        description: 'Convertir texto a voz para el usuario',
        icon: <PiSpeakerHighDuotone className="text-teal-500" />,
    },
    {
        type: 'sttNode',
        label: 'Speech-to-Text',
        description: 'Capturar voz del usuario y convertirla a texto',
        icon: <PiMicrophoneDuotone className="text-indigo-500" />,
    },
    {
        type: 'action',
        label: 'Acción',
        description: 'Ejecuta una acción en el backend',
        icon: <PiGearDuotone className="text-cyan-500" />,
    },
    {
        type: 'check-availability',
        label: 'Verificar Disponibilidad',
        description: 'Verifica disponibilidad de citas',
        icon: <PiCalendarDuotone className="text-blue-500" />,
    },
    {
        type: 'book-appointment',
        label: 'Agendar Cita',
        description: 'Programa una cita y actualiza el lead',
        icon: <PiCalendarPlusDuotone className="text-green-500" />,
    },
    {
        type: 'reschedule-appointment',
        label: 'Reprogramar Cita',
        description: 'Permite reprogramar una cita existente',
        icon: <PiCalendarCheckDuotone className="text-orange-500" />,
    },
    {
        type: 'lead-qualification',
        label: 'Calificar Lead',
        description: 'Califica leads basado en respuestas',
        icon: <PiUserGearDuotone className="text-purple-500" />,
    },
    {
        type: 'endNode',
        label: 'Fin',
        description: 'Finalizar la conversación',
        icon: <PiDoorOpenDuotone className="text-red-500" />,
    },
]

const NodesPanel = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType)
        event.dataTransfer.effectAllowed = 'move'
    }

    return (
        <div className="w-64">
            <h3 className="font-medium text-base mb-3">Tipos de nodos</h3>
            <div className="space-y-2">
                {NODE_TYPES.map((nodeType) => (
                    <div
                        key={nodeType.type}
                        className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md cursor-grab border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
                        onDragStart={(event) =>
                            onDragStart(event, nodeType.type)
                        }
                        draggable
                    >
                        <div className="w-8 h-8 flex items-center justify-center text-lg">
                            {nodeType.icon}
                        </div>
                        <div className="ml-2">
                            <div className="text-sm font-medium">
                                {nodeType.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {nodeType.description}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
                Arrastra los nodos al lienzo para crear tu flujo
            </div>
        </div>
    )
}

export default NodesPanel
