/**
 * frontend/src/components/view/ChatbotBuilder/panels/Toolbar.tsx
 * Barra de herramientas para el constructor de chatbot con nodos disponibles para arrastrar
 * @version 1.0.0
 * @updated 2025-04-08
 */

import React from 'react'
import Iconify from '@/components/shared/Iconify'

interface NodeType {
    type: string
    label: string
    description: string
    icon: string
    color: string
    initialData: any
}

interface ToolbarProps {
    nodeTypes: NodeType[]
    templateName: string
    templateStatus: string
    unsavedChanges: boolean
    onOpenTemplateInfo: () => void
    onSave?: (status?: 'draft' | 'published') => void
    onGenerateAI?: () => void
    onExport?: () => void
    readOnly?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({ 
    nodeTypes, 
    templateName, 
    templateStatus,
    unsavedChanges,
    onOpenTemplateInfo,
    onSave,
    onGenerateAI,
    onExport,
    readOnly = false
}) => {
    // Mapeado de iconos a nombres de Lucide/Hero icons
    const getIconName = (iconType: string): string => {
        switch (iconType) {
            case 'message': return 'lucide:message-circle'
            case 'input': return 'lucide:inbox'
            case 'condition': return 'lucide:arrow-left-right'
            case 'brain': return 'lucide:cpu'
            case 'router': return 'lucide:refresh-cw'
            case 'action': return 'lucide:bolt'
            case 'play': return 'lucide:play'
            default: return 'lucide:square'
        }
    }

    // Manejar el inicio del arrastre de un nodo
    const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, nodeData: any) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType)
        event.dataTransfer.setData('application/reactflow/data', JSON.stringify(nodeData))
        event.dataTransfer.effectAllowed = 'move'
    }

    return (
        <div className="bg-white p-3 rounded-md shadow-md w-80 chatbot-builder-toolbar">
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h2 className="text-sm font-semibold text-gray-800 flex items-center">
                        <span className="truncate max-w-[160px]">{templateName}</span>
                        {unsavedChanges && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                                Sin guardar
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-gray-500 flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            templateStatus === 'published' ? 'bg-green-500' : 'bg-amber-500'
                        }`}></span>
                        <span>{templateStatus === 'published' ? 'Publicada' : 'Borrador'}</span>
                    </p>
                </div>
                <div className="flex gap-1.5">
                    {onSave && !readOnly && (
                        <button
                            onClick={() => onSave()}
                            className="bg-primary hover:bg-primary-dark p-1.5 rounded-md"
                            title="Guardar plantilla"
                        >
                            <Iconify icon="lucide:save" className="h-5 w-5 text-white" data-testid="save-button" />
                        </button>
                    )}
                    {onGenerateAI && !readOnly && (
                        <button
                            onClick={onGenerateAI}
                            className="bg-purple-600 hover:bg-purple-700 p-1.5 rounded-md"
                            title="Generar con IA"
                        >
                            <Iconify icon="lucide:sparkles" className="h-5 w-5 text-white" data-testid="ai-button" />
                        </button>
                    )}
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="bg-gray-200 hover:bg-gray-300 p-1.5 rounded-md"
                            title="Exportar flujo"
                        >
                            <Iconify icon="lucide:download" className="h-5 w-5 text-gray-600" data-testid="export-button" />
                        </button>
                    )}
                    <button
                        onClick={onOpenTemplateInfo}
                        className="bg-gray-100 hover:bg-gray-200 p-1.5 rounded-md"
                        title="Editar información de la plantilla"
                    >
                        <Iconify icon="lucide:info" className="h-5 w-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="mb-2">
                <h3 className="text-xs font-medium text-gray-700 mb-1">Tipos de nodos</h3>
                <div className="grid grid-cols-2 gap-2">
                    {nodeTypes.map((nodeType) => (
                        <div
                            key={nodeType.type}
                            className={`p-2 bg-white border border-gray-200 rounded-md shadow-sm flex items-center hover:border-${nodeType.color}-300 hover:shadow cursor-grab`}
                            onDragStart={(event) => onDragStart(event, nodeType.type, nodeType.initialData)}
                            draggable
                            title={nodeType.description}
                        >
                            <div className={`h-6 w-6 rounded-full bg-${nodeType.color}-100 flex items-center justify-center mr-2`}>
                                <Iconify 
                                    icon={getIconName(nodeType.icon)} 
                                    className={`h-4 w-4 text-${nodeType.color}-500`} 
                                />
                            </div>
                            <span className="text-xs font-medium text-gray-700 truncate">
                                {nodeType.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-xs text-gray-500 p-1.5 bg-gray-50 rounded">
                <p>Arrastra los nodos al canvas y conecta los puntos para crear tu flujo.</p>
            </div>
        </div>
    )
}

export default Toolbar