/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/ChatbotFlowEditor.tsx
 * Componente de editor visual de flujos de chatbot usando ReactFlow
 * @version 1.2.0
 * @updated 2025-04-14
 */

'use client'

import React, {
    useCallback,
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react'
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Panel,
    ReactFlowProvider,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    NodeTypes,
    Node,
} from 'reactflow'
import useTheme from '@/utils/hooks/useTheme'
import { MODE_DARK } from '@/constants/theme.constant'
import 'reactflow/dist/style.css'
import NodesPanel from './NodesPanel'
import NodePropertiesPanel from './NodePropertiesPanel'
import MessageNode from './nodes/MessageNode'
import ConditionNode from './nodes/ConditionNode'
import AINode from './nodes/AINode'
import AIVoiceAgentNode from './nodes/AIVoiceAgentNode'
import StartNode from './nodes/StartNode'
import InputNode from './nodes/InputNode'
import EndNode from './nodes/EndNode'
import TTSNode from './nodes/TTSNode'
import STTNode from './nodes/STTNode'
import ChatbotPreview from './ChatbotPreview'
import { Button } from '@/components/ui'
import { notifications } from '@/utils/notifications'
import { supabase } from '@/services/supabase/SupabaseClient'
import { v4 as uuidv4 } from 'uuid'
import {
    PiEyeDuotone,
    PiSparkleLight,
    PiDownloadSimpleDuotone,
} from 'react-icons/pi'

// Tipos adicionales
interface TemplateData {
    id: string
    name: string
    description: string
    react_flow_json: any
    status: 'draft' | 'published'
    vertical_id?: string
    created_at?: string
    updated_at?: string
    version?: number
}

// Definición de tipos de nodos personalizados
const nodeTypes: NodeTypes = {
    startNode: StartNode,
    messageNode: MessageNode,
    aiNode: AINode,
    aiVoiceAgentNode: AIVoiceAgentNode,
    // Variantes de nombres para compatibilidad con la interfaz
    AgenteVozIA: AIVoiceAgentNode, // Variante con capitalización exacta como en la UI
    agenteVozIA: AIVoiceAgentNode,
    'agente-voz-ia': AIVoiceAgentNode,
    'ai-voice-agent': AIVoiceAgentNode,
    ai_voice_agent: AIVoiceAgentNode,
    conditionNode: ConditionNode,
    inputNode: InputNode,
    ttsNode: TTSNode,
    sttNode: STTNode,
    endNode: EndNode,
}

// Nodo inicial por defecto
const initialNodes: Node[] = [
    {
        id: 'start-node',
        type: 'startNode',
        position: { x: 50, y: 150 },
        data: { label: 'Inicio' },
    },
]

// Conexiones iniciales por defecto - array vacío ya que solo tenemos un nodo inicial
const initialEdges: Edge[] = []

// Props del componente
interface ChatbotFlowEditorProps {
    templateId?: string
}

// Componente principal
const ChatbotFlowEditor = forwardRef<any, ChatbotFlowEditorProps>(
    ({ templateId }, ref) => {
        // Referencias y estados
        const reactFlowWrapper = useRef<HTMLDivElement>(null)
        const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
        const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
        const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
        const [selectedNode, setSelectedNode] = useState<Node | null>(null)
        const [isPreviewMode, setIsPreviewMode] = useState(false)

        // Obtener el tema actual
        const mode = useTheme((state) => state.mode)

        // Estado de la plantilla
        const [templateData, setTemplateData] = useState<TemplateData>({
            id: templateId || uuidv4(),
            name: 'Nueva plantilla',
            description: 'Descripción de la plantilla',
            status: 'draft',
            react_flow_json: null,
            vertical_id: '',
        })

        // Estado de guardado
        const [isSaving, setIsSaving] = useState(false)
        const [unsavedChanges, setUnsavedChanges] = useState(false)

        // Efecto para marcar cambios sin guardar cuando hay modificaciones
        useEffect(() => {
            if (reactFlowInstance) {
                setUnsavedChanges(true)
            }
        }, [nodes, edges, reactFlowInstance])

        // Efecto para cargar datos si se proporciona un ID de plantilla
        useEffect(() => {
            if (templateId) {
                loadTemplate(templateId)
            }
        }, [templateId])

        // Cargar una plantilla desde Supabase
        const loadTemplate = async (id: string) => {
            try {
                console.log('Cargando plantilla con ID:', id)

                // Primero intentar cargar directamente usando eq
                const { data, error } = await supabase
                    .from('chatbot_templates')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error) {
                    console.warn(
                        'No se encontró la plantilla directamente:',
                        error.message,
                    )

                    // Si no se encuentra, creamos una nueva plantilla con este ID
                    const newTemplate = {
                        id: id,
                        name: 'Nueva plantilla',
                        description: 'Descripción de la plantilla',
                        status: 'draft',
                        vertical_id: '',
                        react_flow_json: {
                            nodes: initialNodes,
                            edges: initialEdges,
                        },
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }

                    setTemplateData(newTemplate)
                    console.log('Creando nueva plantilla con ID:', id)
                    return
                }

                // Si llegamos aquí, encontramos la plantilla
                const template = data

                console.log('Plantilla encontrada:', template.name)
                setTemplateData(template)

                if (template.react_flow_json) {
                    // Restaurar el estado del flujo desde el JSON guardado
                    if (
                        template.react_flow_json.nodes &&
                        template.react_flow_json.nodes.length > 0
                    ) {
                        setNodes(template.react_flow_json.nodes)
                    }
                    if (
                        template.react_flow_json.edges &&
                        template.react_flow_json.edges.length > 0
                    ) {
                        setEdges(template.react_flow_json.edges)
                    }
                }
            } catch (error) {
                console.error('Error loading template:', error)
                notifications.error(
                    `Error al cargar la plantilla: ${error instanceof Error ? error.message : 'Desconocido'}`,
                )
            }
        }

        // Guardar la plantilla en Supabase
        const saveTemplate = async (options?: {
            status?: 'draft' | 'published'
        }) => {
            // Mostrar los datos actuales de la plantilla para diagnóstico
            console.log('Datos de plantilla antes de guardar:', {
                id: templateData.id,
                name: templateData.name,
                description: templateData.description,
                vertical_id: templateData.vertical_id,
            })

            if (!reactFlowInstance) {
                notifications.error(
                    'No se puede guardar el flujo porque la instancia no está disponible',
                )
                return { success: false, error: 'Instancia no disponible' }
            }

            try {
                setIsSaving(true)

                // Capturar el estado actual del flujo
                const flowJson = reactFlowInstance.toObject()

                // Verificar que tenemos la estructura correcta para la base de datos
                if (!templateData.id) {
                    const error = new Error(
                        'No se pudo obtener el ID de la plantilla',
                    )
                    console.error(error)
                    return { success: false, error }
                }

                // Actualizar estado template con el flow actual
                const updatedTemplate = {
                    id: templateData.id,
                    name: templateData.name || 'Nueva plantilla',
                    description:
                        templateData.description ||
                        'Descripción de la plantilla',
                    // Usar el estado de las opciones si se proporciona, sino el estado actual, o 'draft' por defecto
                    status: options?.status || templateData.status || 'draft',
                    vertical_id: templateData.vertical_id || null,
                    react_flow_json: flowJson,
                    updated_at: new Date().toISOString(),
                }

                // Verificar si el nombre se está perdiendo
                if (
                    templateData.name &&
                    templateData.name !== 'Nueva plantilla' &&
                    updatedTemplate.name === 'Nueva plantilla'
                ) {
                    console.warn(
                        '¡Advertencia! El nombre se está perdiendo en el proceso de guardado',
                    )
                    updatedTemplate.name = templateData.name.trim()
                    console.log('Nombre restaurado:', updatedTemplate.name)
                }

                console.log('Guardando plantilla:', {
                    ...updatedTemplate,
                    react_flow_json: '(objeto grande omitido)',
                })

                // Verificar conexión con Supabase
                if (!supabase) {
                    const error = new Error(
                        'El cliente Supabase no está disponible',
                    )
                    console.error(error)
                    return { success: false, error }
                }

                try {
                    // Esta es la parte crítica: el upsert de la plantilla
                    console.log(
                        `Guardando plantilla en Supabase con ID: ${updatedTemplate.id}`,
                    )

                    // Intentar operación de upsert
                    const { data, error } = await supabase
                        .from('chatbot_templates')
                        .upsert(updatedTemplate)
                        .select()

                    if (error) {
                        console.error(
                            'Error detallado de Supabase:',
                            JSON.stringify(error, null, 2),
                        )
                        const formattedError = new Error(
                            `Error en la operación de Supabase: ${error.message || error.code || 'desconocido'}`,
                        )
                        return { success: false, error: formattedError }
                    }

                    // Verificar que obtuvimos datos de vuelta
                    if (!data || data.length === 0) {
                        console.warn(
                            'No se recibió respuesta de datos de Supabase',
                        )
                        const emptyDataError = new Error(
                            'No se pudo guardar la plantilla (sin datos de respuesta)',
                        )
                        return { success: false, error: emptyDataError }
                    }

                    console.log('Plantilla guardada correctamente:', data[0].id)
                    setTemplateData(data[0])
                    setUnsavedChanges(false)

                    // Mostrar notificación de éxito
                    notifications.success(
                        options?.status === 'published' // Usar el estado de las opciones para el mensaje
                            ? 'Plantilla publicada correctamente'
                            : 'Plantilla guardada correctamente',
                    )

                    return { success: true, data: data[0] }
                } catch (supabaseError) {
                    console.error(
                        'Error en la operación de Supabase:',
                        supabaseError,
                    )
                    return { success: false, error: supabaseError }
                }
            } catch (error) {
                console.error('Error al guardar la plantilla:', error)
                let errorMessage = 'Error al guardar la plantilla'

                // Obtener el mensaje de error más descriptivo posible
                if (error instanceof Error) {
                    errorMessage = `${errorMessage}: ${error.message}`
                } else if (typeof error === 'object' && error !== null) {
                    try {
                        errorMessage = `${errorMessage}: ${JSON.stringify(error)}`
                    } catch (e) {
                        errorMessage = `${errorMessage}: objeto de error no serializable`
                    }
                }

                notifications.error(errorMessage)
                return { success: false, error }
            } finally {
                setIsSaving(false)
            }
        }

        // Establecer ID de plantilla (usado al crear una nueva plantilla)
        const setTemplateId = (id: string) => {
            console.log(`Estableciendo ID de plantilla: ${id}`)
            if (id !== templateData.id) {
                setTemplateData((prev) => {
                    const updated = { ...prev, id }
                    console.log(
                        `ID de plantilla actualizado de ${prev.id} a ${updated.id}`,
                    )
                    return updated
                })
            } else {
                console.log(
                    `ID de plantilla ya establecido como ${id}, no se requiere actualización`,
                )
            }
        }

        // Establecer datos de plantilla (usado al crear una nueva plantilla)
        const updateTemplateData = (data: Partial<TemplateData>) => {
            console.log('Actualizando datos de plantilla:', {
                id: data.id,
                name: data.name,
                description: data.description,
                vertical_id: data.vertical_id,
            })

            setTemplateData((prev) => {
                const updated = {
                    ...prev,
                    ...data,
                }
                console.log('Datos de plantilla actualizados:', {
                    id: updated.id,
                    name: updated.name,
                    description: updated.description,
                    vertical_id: updated.vertical_id,
                })
                return updated
            })
        }

        // Exponer métodos a través de la ref
        useImperativeHandle(ref, () => ({
            saveTemplate,
            setTemplateId,
            setTemplateData: updateTemplateData, // Usamos el alias para evitar colisiones
        }))

        // Manejador para conexiones entre nodos
        const onConnect = useCallback(
            (params: Connection | Edge) =>
                setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
            [setEdges],
        )

        // Manejador para cuando se selecciona un nodo
        const onNodeClick = (_: React.MouseEvent, node: Node) => {
            setSelectedNode(node)
        }

        // Manejador para cuando se hace clic en el fondo (deselecciona nodos)
        const onPaneClick = () => {
            setSelectedNode(null)
        }

        // Manejador para arrastrar y soltar nuevos nodos desde el panel
        const onDragOver = useCallback((event: React.DragEvent) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
        }, [])

        // Manejador para soltar nuevos nodos desde el panel
        const onDrop = useCallback(
            (event: React.DragEvent) => {
                event.preventDefault()

                if (!reactFlowWrapper.current || !reactFlowInstance) return

                const reactFlowBounds =
                    reactFlowWrapper.current.getBoundingClientRect()
                const type = event.dataTransfer.getData('application/reactflow')

                // Verificar si el tipo es válido
                if (!type || !Object.keys(nodeTypes).includes(type)) return

                const position = reactFlowInstance.project({
                    x: event.clientX - reactFlowBounds.left,
                    y: event.clientY - reactFlowBounds.top,
                })

                // Crear un nuevo nodo según el tipo
                const newNode = {
                    id: `${type}-${Date.now()}`,
                    type,
                    position,
                    data: {
                        label: getDefaultLabelForType(type),
                        // Propiedades por defecto según el tipo de nodo
                        ...getDefaultPropertiesForType(type),
                    },
                }

                setNodes((nds) => nds.concat(newNode))
            },
            [reactFlowInstance, setNodes],
        )

        // Actualizar propiedades de un nodo seleccionado
        const updateNodeProperties = (properties: any) => {
            if (!selectedNode) return

            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === selectedNode.id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                ...properties,
                            },
                        }
                    }
                    return node
                }),
            )

            // Actualizar también el nodo seleccionado con las nuevas propiedades
            setSelectedNode({
                ...selectedNode,
                data: {
                    ...selectedNode.data,
                    ...properties,
                },
            })
        }

        // Eliminar un nodo seleccionado
        const deleteSelectedNode = () => {
            if (!selectedNode) return

            // No permitir eliminar el nodo inicial
            if (selectedNode.id === 'start-node') return

            setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
            setEdges((eds) =>
                eds.filter(
                    (edge) =>
                        edge.source !== selectedNode.id &&
                        edge.target !== selectedNode.id,
                ),
            )
            setSelectedNode(null)
        }

        // Helpers para obtener etiquetas y propiedades por defecto
        const getDefaultLabelForType = (type: string): string => {
            switch (type) {
                case 'messageNode':
                    return 'Mensaje'
                case 'aiNode':
                    return 'Respuesta AI'
                case 'conditionNode':
                    return 'Condición'
                case 'inputNode':
                    return 'Entrada Usuario'
                case 'ttsNode':
                    return 'Text-to-Speech'
                case 'sttNode':
                    return 'Speech-to-Text'
                case 'endNode':
                    return 'Fin Conversación'
                default:
                    return 'Nodo'
            }
        }

        const getDefaultPropertiesForType = (type: string): any => {
            switch (type) {
                case 'aiVoiceAgentNode':
                case 'ai-voice-agent':
                case 'ai_voice_agent':
                    return {
                        prompt: 'Eres un asistente virtual amable y servicial. Responde cordialmente y de forma concisa para que sea fácil de escuchar.',
                        model: 'gpt-4o',
                        temperature: 0.7,
                        maxTokens: 500,
                        voice: 'Female', // Voz femenina por defecto
                        rate: 1.0, // Velocidad normal
                        responseVariableName: 'respuesta_ia',
                        outputVariableName: 'audio_respuesta',
                        provider: 'voice_ai', // Marca especial para que el procesador lo detecte mejor
                        delay: 0,
                    }
                case 'messageNode':
                    return {
                        message: 'Escribe el mensaje aquí...',
                        delay: 0,
                    }
                case 'aiNode':
                    return {
                        prompt: 'Escribe el prompt para la IA...',
                        model: 'gpt-4o',
                        temperature: 0.7,
                        maxTokens: 500,
                    }
                case 'conditionNode':
                    return {
                        condition: 'Condición...',
                        options: [
                            { value: 'opción 1', label: 'Opción 1' },
                            { value: 'opción 2', label: 'Opción 2' },
                        ],
                    }
                case 'inputNode':
                    return {
                        question: '¿Qué pregunta quieres hacer?',
                        variableName: 'respuesta',
                        inputType: 'text',
                    }
                case 'ttsNode':
                    return {
                        text: 'Texto a convertir en voz...',
                        voice: 'Default',
                        rate: 1.0,
                        delay: 0,
                    }
                case 'sttNode':
                    return {
                        prompt: 'Por favor, habla ahora...',
                        variableName: 'transcripcion',
                        language: 'Español',
                        duration: 30,
                    }
                case 'endNode':
                    return {
                        message: 'Gracias por tu participación',
                    }
                default:
                    return {}
            }
        }

        // Generar una versión automática del flujo con IA
        const generateWithAI = () => {
            notifications.info('Función de generación con IA a implementar')
            // TODO: Implementar generación automática con IA
        }

        // Exportar la plantilla actual
        const exportTemplate = () => {
            if (!reactFlowInstance || !templateData) {
                notifications.error('No hay datos para exportar')
                return
            }

            try {
                // Obtener la estructura completa del flujo
                const flowJson = reactFlowInstance.toObject()

                // Crear el objeto de plantilla para exportar
                const templateToExport = {
                    name: templateData.name,
                    description: templateData.description,
                    status: templateData.status,
                    vertical_id: templateData.vertical_id,
                    react_flow_json: flowJson,
                    exported_at: new Date().toISOString(),
                    version: templateData.version || 1,
                }

                // Convertir a JSON
                const jsonString = JSON.stringify(templateToExport, null, 2)

                // Crear un Blob y un enlace de descarga
                const blob = new Blob([jsonString], {
                    type: 'application/json',
                })
                const url = URL.createObjectURL(blob)

                // Crear un enlace para descargar y simular clic
                const a = document.createElement('a')
                a.href = url
                a.download = `${templateData.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
                document.body.appendChild(a)
                a.click()

                // Limpiar
                setTimeout(() => {
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                }, 0)

                notifications.success('Plantilla exportada correctamente')
            } catch (error) {
                console.error('Error al exportar plantilla:', error)
                notifications.error('Error al exportar la plantilla')
            }
        }

        return (
            <div ref={reactFlowWrapper} className="w-full h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onInit={setReactFlowInstance}
                    fitView
                    fitViewOptions={{ padding: 0.5, maxZoom: 1 }}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
                    minZoom={0.2}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                    direction="LR"
                >
                    <Background
                        color={mode === MODE_DARK ? '#555' : '#aaa'}
                        gap={16}
                        className="dark:bg-gray-900"
                    />
                    <Controls className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 [&>button]:text-gray-600 [&>button]:dark:text-gray-300 [&>button]:border-gray-200 [&>button]:dark:border-gray-700 [&>button]:bg-white [&>button]:dark:bg-gray-800 [&>button:hover]:bg-gray-100 [&>button:hover]:dark:bg-gray-700" />
                    <MiniMap
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        nodeBorderRadius={2}
                        nodeColor={'#e5e7eb'}
                        nodeStrokeColor={'#9ca3af'}
                        maskColor={
                            mode === MODE_DARK
                                ? 'rgba(30, 41, 59, 0.7)'
                                : 'rgba(240, 240, 240, 0.6)'
                        }
                        nodeClassName={
                            'dark:!bg-gray-600 dark:!border-gray-500'
                        }
                    />

                    {/* Panel de herramientas */}
                    <Panel
                        position="top-left"
                        className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow"
                    >
                        <div className="flex gap-2 items-center">
                            <Button
                                size="sm"
                                variant={isPreviewMode ? 'plain' : 'solid'}
                                color={isPreviewMode ? 'blue' : 'gray'}
                                icon={<PiEyeDuotone className="mr-1" />}
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                            >
                                Vista previa
                            </Button>
                            {/* <Button
                            size="sm"
                            variant="default"
                            color="red"
                            icon={<PiShareNetworkDuotone className="mr-1" />}
                            onClick={() => saveTemplate()}
                            disabled={isSaving || !unsavedChanges}
                        >
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </Button> */}
                            <Button
                                size="sm"
                                variant="default"
                                color="purple"
                                icon={<PiSparkleLight className="mr-1" />}
                                onClick={generateWithAI}
                            >
                                Generar con IA
                            </Button>
                            <Button
                                size="sm"
                                variant="default"
                                color="indigo"
                                icon={
                                    <PiDownloadSimpleDuotone className="mr-1" />
                                }
                                onClick={exportTemplate}
                            >
                                Exportar
                            </Button>
                        </div>
                    </Panel>

                    {/* Panel de tipos de nodos */}
                    <Panel
                        position="top-right"
                        className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow"
                    >
                        <NodesPanel />
                    </Panel>

                    {/* Panel de propiedades */}
                    {selectedNode && (
                        <Panel
                            position="bottom-right"
                            className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow max-h-[50%] overflow-y-auto"
                            style={{ width: '350px' }}
                        >
                            <NodePropertiesPanel
                                node={selectedNode}
                                updateProperties={updateNodeProperties}
                                deleteNode={deleteSelectedNode}
                            />
                        </Panel>
                    )}

                    {/* Modo de vista previa */}
                    {isPreviewMode && (
                        <ChatbotPreview
                            nodes={nodes}
                            edges={edges}
                            onClose={() => setIsPreviewMode(false)}
                        />
                    )}
                </ReactFlow>
            </div>
        )
    },
)

// Envolvemos el componente en el proveedor de ReactFlow
const ChatbotFlowEditorWithProvider = forwardRef<any, ChatbotFlowEditorProps>(
    (props, ref) => (
        <ReactFlowProvider>
            <ChatbotFlowEditor {...props} ref={ref} />
        </ReactFlowProvider>
    ),
)

ChatbotFlowEditor.displayName = 'ChatbotFlowEditor'
ChatbotFlowEditorWithProvider.displayName = 'ChatbotFlowEditorWithProvider'

export default ChatbotFlowEditorWithProvider
