'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/ChatbotActivationConfig.tsx
 * Componente para configurar los parámetros específicos de una activación de chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

import React, { useState, useEffect } from 'react'
import Iconify from '@/components/shared/Iconify'
import { Tab } from '@headlessui/react'
import { classNames } from '@/utils/cssStyles'
import { ReactFlow, Background, Controls, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { nodeTypes } from './nodes'

interface ConfigField {
    id: string
    type: 'text' | 'textarea' | 'number' | 'select' | 'toggle' | 'image'
    label: string
    description?: string
    fieldName: string
    defaultValue: any
    options?: { label: string, value: string }[]
    section: string
    nodeId?: string
}

interface ChatbotActivationConfigProps {
    configFields: ConfigField[]
    initialConfig: Record<string, any>
    flowPreview: any // React Flow JSON structure
    onSave: (configData: Record<string, any>) => void
    onCancel: () => void
    isSaving: boolean
}

const ChatbotActivationConfig: React.FC<ChatbotActivationConfigProps> = ({
    configFields,
    initialConfig,
    flowPreview,
    onSave,
    onCancel,
    isSaving
}) => {
    const [config, setConfig] = useState<Record<string, any>>(initialConfig || {})
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
    const [highlightedNodes, setHighlightedNodes] = useState<string[]>([])
    
    // Organizar campos por secciones
    const sections = configFields.reduce((acc, field) => {
        if (!acc[field.section]) {
            acc[field.section] = []
        }
        acc[field.section].push(field)
        return acc
    }, {} as Record<string, ConfigField[]>)
    
    const sectionNames = Object.keys(sections).sort((a, b) => {
        // Ordenar secciones (General primero)
        if (a === 'General') return -1
        if (b === 'General') return 1
        return a.localeCompare(b)
    })
    
    // Manejar cambios en los campos
    const handleFieldChange = (fieldName: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [fieldName]: value
        }))
    }
    
    // Manejar clic en un nodo del flujo
    const handleNodeClick = (_: React.MouseEvent, node: Node) => {
        setSelectedNode(node.id)
        
        // Encontrar campos configurables asociados a este nodo
        const nodeFields = configFields.filter(field => field.nodeId === node.id)
        if (nodeFields.length > 0) {
            setHighlightedNodes([node.id])
        } else {
            setHighlightedNodes([])
        }
    }
    
    // Manejar clic en el panel del flujo
    const handlePaneClick = () => {
        setSelectedNode(null)
        setHighlightedNodes([])
    }
    
    // Resaltar nodo cuando se hace foco en un campo
    const handleFieldFocus = (field: ConfigField) => {
        if (field.nodeId) {
            setSelectedNode(field.nodeId)
            setHighlightedNodes([field.nodeId])
            
            // Centrar la vista en el nodo
            if (reactFlowInstance && field.nodeId) {
                const node = flowPreview.nodes.find((n: Node) => n.id === field.nodeId)
                if (node) {
                    reactFlowInstance.setCenter(node.position.x, node.position.y, { duration: 800 })
                }
            }
        }
    }
    
    // Procesar nodos para resaltarlos si es necesario
    const getNodes = () => {
        if (!flowPreview || !flowPreview.nodes) return []
        
        return flowPreview.nodes.map((node: Node) => ({
            ...node,
            style: {
                ...node.style,
                opacity: highlightedNodes.length > 0 && !highlightedNodes.includes(node.id) ? 0.3 : 1,
                border: selectedNode === node.id ? '2px solid #3B82F6' : undefined
            }
        }))
    }
    
    // Renderizar campo según su tipo
    const renderField = (field: ConfigField) => {
        const value = config[field.fieldName] !== undefined ? config[field.fieldName] : field.defaultValue
        
        switch (field.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        id={field.id}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={value || ''}
                        onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                        onFocus={() => handleFieldFocus(field)}
                    />
                )
            
            case 'textarea':
                return (
                    <textarea
                        id={field.id}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={value || ''}
                        onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                        onFocus={() => handleFieldFocus(field)}
                    />
                )
            
            case 'number':
                return (
                    <input
                        type="number"
                        id={field.id}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={value || 0}
                        onChange={(e) => handleFieldChange(field.fieldName, Number(e.target.value))}
                        onFocus={() => handleFieldFocus(field)}
                    />
                )
            
            case 'select':
                return (
                    <select
                        id={field.id}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={value || ''}
                        onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                        onFocus={() => handleFieldFocus(field)}
                    >
                        <option value="">Seleccionar</option>
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                )
            
            case 'toggle':
                return (
                    <div className="mt-1 flex items-center">
                        <button
                            type="button"
                            className={`${
                                value ? 'bg-blue-600' : 'bg-gray-200'
                            } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            aria-pressed={value}
                            onClick={() => handleFieldChange(field.fieldName, !value)}
                            onFocus={() => handleFieldFocus(field)}
                        >
                            <span className="sr-only">Activar {field.label}</span>
                            <span
                                className={`${
                                    value ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                            />
                        </button>
                        <span className="ml-2 text-sm text-gray-500">
                            {value ? 'Activado' : 'Desactivado'}
                        </span>
                    </div>
                )
            
            case 'image':
                // Este es un placeholder para un futuro selector de imágenes
                return (
                    <div className="mt-1">
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onFocus={() => handleFieldFocus(field)}
                            >
                                <Iconify icon="mdi:image" className="-ml-0.5 mr-2 h-4 w-4" />
                                Seleccionar imagen
                            </button>
                            {value && (
                                <span className="text-sm text-gray-500">
                                    {typeof value === 'string' ? value.split('/').pop() : 'Imagen seleccionada'}
                                </span>
                            )}
                        </div>
                    </div>
                )
            
            default:
                return <p className="text-sm text-red-500">Tipo de campo no soportado: {field.type}</p>
        }
    }
    
    return (
        <div className="bg-white rounded-lg shadow">
            <Tab.Group>
                <div className="flex border-b border-gray-200">
                    <div className="w-1/3 lg:w-1/4 pr-4 border-r border-gray-200">
                        <div className="p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Secciones</h3>
                            <Tab.List className="flex flex-col space-y-1">
                                {sectionNames.map((sectionName) => (
                                    <Tab
                                        key={sectionName}
                                        className={({ selected }) =>
                                            classNames(
                                                'w-full text-left py-2 px-3 text-sm font-medium rounded-md',
                                                selected
                                                    ? 'bg-primary text-white'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            )
                                        }
                                    >
                                        <span className="flex items-center">
                                            {sectionName === 'General' && (
                                                <Iconify icon="mdi:cog" className="mr-2 h-4 w-4" />
                                            )}
                                            {sectionName === 'Mensajes' && (
                                                <Iconify icon="mdi:message-text" className="mr-2 h-4 w-4" />
                                            )}
                                            {sectionName === 'Variables globales' && (
                                                <Iconify icon="mdi:variable" className="mr-2 h-4 w-4" />
                                            )}
                                            {sectionName}
                                        </span>
                                    </Tab>
                                ))}
                            </Tab.List>
                        </div>
                    </div>
                    
                    <div className="w-2/3 lg:w-3/4">
                        <Tab.Panels className="flex-1">
                            {sectionNames.map((sectionName) => (
                                <Tab.Panel key={sectionName} className="p-4">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4">{sectionName}</h3>
                                    <div className="space-y-6">
                                        {sections[sectionName].map((field) => (
                                            <div key={field.id} className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start">
                                                <label
                                                    htmlFor={field.id}
                                                    className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                                                >
                                                    {field.label}
                                                    {field.nodeId && (
                                                        <button
                                                            type="button"
                                                            className="ml-1 text-primary hover:text-primary-dark"
                                                            onClick={() => handleFieldFocus(field)}
                                                            title="Ver en el flujo"
                                                        >
                                                            <Iconify icon="mdi:eye" className="inline-block h-4 w-4" />
                                                        </button>
                                                    )}
                                                </label>
                                                <div className="mt-1 sm:mt-0 sm:col-span-2">
                                                    {renderField(field)}
                                                    {field.description && (
                                                        <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Tab.Panel>
                            ))}
                        </Tab.Panels>
                    </div>
                </div>
            </Tab.Group>
            
            <div className="p-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Vista previa del flujo</h3>
                
                <div className="h-64 sm:h-80 md:h-96 border border-gray-200 rounded-md mb-4">
                    {flowPreview ? (
                        <ReactFlow
                            nodes={getNodes()}
                            edges={flowPreview.edges || []}
                            onNodeClick={handleNodeClick}
                            onPaneClick={handlePaneClick}
                            nodeTypes={nodeTypes}
                            fitView
                            zoomOnScroll={false}
                            zoomOnPinch={true}
                            onInit={setReactFlowInstance}
                            attributionPosition="bottom-left"
                            maxZoom={1.5}
                            minZoom={0.5}
                            defaultZoom={0.8}
                            snapToGrid={true}
                            snapGrid={[15, 15]}
                            proOptions={{ hideAttribution: true }}
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={true}
                        >
                            <Controls showInteractive={false} />
                            <Background color="#aaa" gap={16} />
                        </ReactFlow>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                            <p className="text-gray-500">No hay datos de flujo disponibles</p>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(config)}
                        disabled={isSaving}
                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <span className="flex items-center">
                                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                                Guardando...
                            </span>
                        ) : (
                            'Guardar configuración'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChatbotActivationConfig
