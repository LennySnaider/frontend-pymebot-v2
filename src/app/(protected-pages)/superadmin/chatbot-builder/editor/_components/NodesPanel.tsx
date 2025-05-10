/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/NodesPanel.tsx
 * Panel de nodos disponibles para arrastrar al editor
 * @version 1.3.0
 * @updated 2025-09-05 - Añadido Drawer con toggle
 * @updated 2025-09-05 - Implementadas categorías expandibles para hacerlo más compacto
 */

'use client'

import React, { useState } from 'react'
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
    PiListBold,
    PiCaretRightBold,
    PiCaretLeftBold,
    PiCaretDownBold,
    PiPackageDuotone,
    PiRulerDuotone
} from 'react-icons/pi'
import { Drawer, Button } from '@/components/ui'

// Importamos los tipos de nodos disponibles desde el registro
import { availableNodeTypes } from '@/components/view/ChatbotBuilder/nodes'

// Nodos organizados por categorías
const NODE_CATEGORIES = [
    {
        id: 'basic',
        label: 'Básicos',
        icon: <PiChatCircleDuotone className="text-blue-500" />,
        nodes: [
            {
                type: 'messageNode',
                label: 'Mensaje',
                description: 'Enviar un mensaje de texto al usuario',
                icon: <PiChatCircleDuotone className="text-blue-500" />,
            },
            {
                type: 'inputNode',
                label: 'Entrada',
                description: 'Solicitar información al usuario',
                icon: <PiKeyboardDuotone className="text-green-500" />,
            },
            {
                type: 'conditionNode',
                label: 'Condición',
                description: 'Bifurcar el flujo basado en condiciones',
                icon: <PiArrowsSplitDuotone className="text-yellow-500" />,
            },
            {
                type: 'action',
                label: 'Acción',
                description: 'Ejecuta una acción en el backend',
                icon: <PiGearDuotone className="text-cyan-500" />,
            },
            {
                type: 'endNode',
                label: 'Fin',
                description: 'Finalizar la conversación',
                icon: <PiDoorOpenDuotone className="text-red-500" />,
            }
        ]
    },
    {
        id: 'ai',
        label: 'Inteligencia Artificial',
        icon: <PiRobotDuotone className="text-purple-500" />,
        nodes: [
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
            }
        ]
    },
    {
        id: 'voice',
        label: 'Voz',
        icon: <PiSpeakerHighDuotone className="text-teal-500" />,
        nodes: [
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
            }
        ]
    },
    {
        id: 'appointments',
        label: 'Citas',
        icon: <PiCalendarDuotone className="text-blue-500" />,
        nodes: [
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
            }
        ]
    },
    {
        id: 'business',
        label: 'Negocios',
        icon: <PiUserGearDuotone className="text-purple-500" />,
        nodes: [
            {
                type: 'lead-qualification',
                label: 'Calificar Lead',
                description: 'Califica leads basado en respuestas',
                icon: <PiUserGearDuotone className="text-purple-500" />,
            },
            {
                type: 'services',
                label: 'Mostrar Servicios',
                description: 'Muestra una lista de servicios disponibles',
                icon: <PiRulerDuotone className="text-indigo-500" />,
            },
            {
                type: 'products',
                label: 'Mostrar Productos',
                description: 'Muestra un catálogo de productos disponibles',
                icon: <PiPackageDuotone className="text-blue-500" />,
            }
        ]
    }
]

// Lista plana de todos los nodos para compatibilidad
const NODE_TYPES = NODE_CATEGORIES.flatMap(category => category.nodes)

const NodesPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        basic: true, // La categoría básica siempre estará expandida por defecto
    });

    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType)
        event.dataTransfer.effectAllowed = 'move'
    }

    const toggleDrawer = () => {
        setIsOpen(!isOpen);
    }

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    }

    const NodeTypeItem = ({ nodeType }: { nodeType: typeof NODE_TYPES[0] }) => (
        <div
            className="flex items-center p-1 bg-gray-50 dark:bg-gray-700 rounded-md cursor-grab border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm ml-4"
            onDragStart={(event) => onDragStart(event, nodeType.type)}
            draggable
        >
            <div className="w-5 h-5 flex items-center justify-center text-base">
                {nodeType.icon}
            </div>
            <div className="ml-1.5 flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                    {nodeType.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate text-[9px] leading-tight">
                    {nodeType.description}
                </div>
            </div>
        </div>
    );

    const CategoryHeader = ({ category }: { category: typeof NODE_CATEGORIES[0] }) => (
        <div
            className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-1"
            onClick={() => toggleCategory(category.id)}
        >
            <div className="w-5 h-5 flex items-center justify-center text-base">
                {expandedCategories[category.id] ?
                    <PiCaretDownBold className="text-gray-600 dark:text-gray-400 text-xs" /> :
                    <PiCaretRightBold className="text-gray-600 dark:text-gray-400 text-xs" />
                }
            </div>
            <div className="w-5 h-5 flex items-center justify-center text-base ml-1">
                {category.icon}
            </div>
            <div className="ml-1.5 flex-1">
                <div className="text-xs font-medium">
                    {category.label} <span className="text-[9px] text-gray-500 dark:text-gray-400">({category.nodes.length})</span>
                </div>
            </div>
        </div>
    );

    const NodesList = () => (
        <div className="space-y-0.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {NODE_CATEGORIES.map((category) => (
                <div key={category.id} className="mb-1">
                    <CategoryHeader category={category} />
                    {expandedCategories[category.id] && (
                        <div className="space-y-0.5 mt-0.5">
                            {category.nodes.map((nodeType) => (
                                <NodeTypeItem key={nodeType.type} nodeType={nodeType} />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )

    return (
        <div className="relative">
            {/* Botón de toggle fuera del drawer */}
            <Button
                onClick={toggleDrawer}
                size="sm"
                shape="circle"
                variant="solid"
                color="blue"
                className="absolute top-0 left-0 z-50 shadow-lg transition-transform duration-300"
                style={{
                    transform: isOpen ? 'translateX(-30px)' : 'translateX(0)',
                    width: '30px',
                    height: '30px'
                }}
            >
                {isOpen ? <PiCaretRightBold /> : <PiListBold />}
            </Button>

            {/* Panel de nodos con animación */}
            <div
                className={`transition-all duration-300 ease-in-out ${
                    isOpen
                        ? 'opacity-100 w-64'
                        : 'opacity-0 w-0 overflow-hidden'
                }`}
            >
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-xs mb-1 flex items-center pb-1 border-b border-gray-200 dark:border-gray-700">
                        <PiListBold className="mr-1 text-blue-500" />
                        Biblioteca de nodos
                    </h3>
                    <NodesList />
                    <div className="mt-1 border-t border-gray-200 dark:border-gray-700 pt-1 text-[9px] text-gray-500 dark:text-gray-400 flex items-center">
                        <svg className="w-3 h-3 mr-1 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Arrastra los nodos al lienzo
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NodesPanel
