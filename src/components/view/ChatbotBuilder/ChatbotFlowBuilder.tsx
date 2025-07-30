'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/ChatbotFlowBuilder.tsx
 * Componente principal para el constructor visual de flujos de chatbot basado en React Flow
 * @version 1.1.0
 * @updated 2025-06-05
 */

import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
    useReactFlow,
    Panel,
    Connection,
    Edge,
    Node,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes, availableNodeTypes } from './nodes';
import NodeConfigPanel from './panels/NodeConfigPanel';
import TemplateInfoPanel from './panels/TemplateInfoPanel';
import Toolbar from './panels/Toolbar';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/toast';

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos
interface ChatbotFlowBuilderProps {
    templateId?: string;
    initialTemplate?: any;
    onSave?: (templateData: any) => void;
    onCancel?: () => void;
    readOnly?: boolean;
}

interface TemplateData {
    id: string;
    name: string;
    description: string;
    react_flow_json: any;
    status: 'draft' | 'published';
    vertical_id?: string;
    created_at?: string;
    updated_at?: string;
}

// Nodos por defecto en formato horizontal
const defaultNodes = [
    {
        id: 'start-node',
        type: 'start',
        position: { x: 50, y: 150 },
        data: { label: 'Inicio del flujo' },
    },
    {
        id: 'message-node-1',
        type: 'text',
        position: { x: 250, y: 150 },
        data: {
            label: 'Mensaje de bienvenida',
            message: '¡Hola! Bienvenido al chatbot. ¿Cómo puedo ayudarte?',
        },
    },
    {
        id: 'input-node-1',
        type: 'input',
        position: { x: 500, y: 150 },
        data: {
            label: 'Captura respuesta',
            variableName: 'user_input',
        },
    },
];

// Conexiones por defecto
const defaultEdges = [
    {
        id: 'e1-2',
        source: 'start-node',
        target: 'message-node-1',
        animated: true,
        markerEnd: {
            type: MarkerType.ArrowClosed,
        },
    },
    {
        id: 'e2-3',
        source: 'message-node-1',
        target: 'input-node-1',
        animated: true,
        markerEnd: {
            type: MarkerType.ArrowClosed,
        },
    },
];

// Componente interno del flujo
const ReactFlowBuilder = forwardRef(({
    templateId,
    initialTemplate,
    onSave,
    onCancel,
    readOnly = false
}: ChatbotFlowBuilderProps, ref) => {
    // Referencias y estado de React Flow
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
    const [templateData, setTemplateData] = useState<TemplateData>({
        id: '',
        name: 'Nueva plantilla',
        description: 'Descripción de la plantilla',
        react_flow_json: null,
        status: 'draft',
    });
    
    // Estado de UI
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [isTemplatePanelOpen, setIsTemplatePanelOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Obtener instancia de React Flow
    const { project, getNodes, getEdges, setViewport } = useReactFlow();
    
    // Exponer métodos a través de ref
    useImperativeHandle(ref, () => ({
        saveTemplate: saveTemplate,
        getTemplateData: () => ({
            ...templateData,
            react_flow_json: {
                nodes: getNodes(),
                edges: getEdges(),
            },
        }),
    }));
    
    // Cargar datos iniciales o desde la base de datos
    useEffect(() => {
        if (initialTemplate) {
            loadTemplate(initialTemplate);
        } else if (templateId) {
            fetchTemplate(templateId);
        }
    }, [templateId, initialTemplate]);
    
    // Obtener la plantilla de la base de datos
    const fetchTemplate = async (id: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('chatbot_templates')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            
            if (data) {
                loadTemplate(data);
            }
        } catch (err) {
            console.error('Error al cargar la plantilla:', err);
            toast.push('Error al cargar la plantilla', { type: 'danger' });
        } finally {
            setLoading(false);
        }
    };
    
    // Cargar datos en el editor
    const loadTemplate = (template: any) => {
        setTemplateData({
            id: template.id || uuidv4(),
            name: template.name || 'Nueva plantilla',
            description: template.description || '',
            react_flow_json: template.react_flow_json,
            status: template.status || 'draft',
            vertical_id: template.vertical_id,
            created_at: template.created_at,
            updated_at: template.updated_at,
        });
        
        // Cargar nodos y conexiones si existen
        if (template.react_flow_json) {
            const { nodes: savedNodes, edges: savedEdges } = template.react_flow_json;
            if (savedNodes && savedEdges) {
                setNodes(savedNodes);
                setEdges(savedEdges);
            }
        }
    };
    
    // Guardar la plantilla
    const saveTemplate = async () => {
        try {
            if (!onSave) return; // Si no hay función de guardado, salir
            
            const flowData = {
                nodes: getNodes(),
                edges: getEdges(),
            };
            
            const template = {
                ...templateData,
                react_flow_json: flowData,
                updated_at: new Date().toISOString(),
            };
            
            onSave(template);
        } catch (err) {
            console.error('Error al guardar la plantilla:', err);
            toast.push('Error al guardar la plantilla', { type: 'danger' });
        }
    };
    
    // Manejar conexiones
    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        animated: true,
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                        },
                    },
                    eds
                )
            );
        },
        [setEdges]
    );
    
    // Manejar selección de nodo
    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            setSelectedNode(node);
            setIsConfigPanelOpen(true);
        },
        []
    );
    
    // Actualizar datos de un nodo
    const updateNodeData = useCallback(
        (id: string, data: any) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === id) {
                        return { ...node, data: { ...node.data, ...data } };
                    }
                    return node;
                })
            );
        },
        [setNodes]
    );
    
    // Agregar un nuevo nodo
    const addNode = useCallback(
        (type: string) => {
            const newNode = {
                id: `node-${uuidv4()}`,
                type,
                position: {
                    x: Math.random() * 300 + 50,
                    y: Math.random() * 300 + 50,
                },
                data: { label: `Nuevo ${type}` },
            };
            
            setNodes((nds) => [...nds, newNode]);
            
            // Seleccionar el nodo recién creado para configuración
            setSelectedNode(newNode);
            setIsConfigPanelOpen(true);
        },
        [setNodes]
    );
    
    // Manejar el arrastrar y soltar de nodos
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);
    
    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            
            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');
            
            if (!type || !reactFlowBounds) {
                return;
            }
            
            const position = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });
            
            const newNode = {
                id: `node-${uuidv4()}`,
                type,
                position,
                data: { label: `Nuevo ${type}` },
            };
            
            setNodes((nds) => [...nds, newNode]);
        },
        [project, setNodes]
    );
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow flex">
                <ReactFlowProvider>
                    <div className="h-full w-full" ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            nodeTypes={nodeTypes}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            proOptions={{ hideAttribution: true }}
                            fitView
                            attributionPosition="bottom-right"
                            minZoom={0.2}
                            maxZoom={4}
                            snapToGrid
                            snapGrid={[15, 15]}
                        >
                            <Background color="#aaa" gap={16} />
                            <Controls />
                            <MiniMap 
                                nodeStrokeWidth={3}
                                zoomable
                                pannable
                            />
                            
                            {!readOnly && (
                                <Panel position="top-left">
                                    <Toolbar 
                                        onAddNode={addNode} 
                                        onSaveTemplate={saveTemplate}
                                        onEditTemplate={() => setIsTemplatePanelOpen(true)}
                                        availableNodeTypes={availableNodeTypes}
                                    />
                                </Panel>
                            )}
                        </ReactFlow>
                    </div>

                    {isConfigPanelOpen && selectedNode && (
                        <NodeConfigPanel
                            node={selectedNode}
                            onUpdate={(newData) =>
                                updateNodeData(selectedNode.id, newData)
                            }
                            onClose={() => setIsConfigPanelOpen(false)}
                        />
                    )}

                    {isTemplatePanelOpen && (
                        <TemplateInfoPanel
                            templateData={templateData}
                            onUpdate={setTemplateData}
                            onClose={() => setIsTemplatePanelOpen(false)}
                        />
                    )}
                </ReactFlowProvider>
            </div>
        </div>
    );
});

// Wrapper con ReactFlowProvider
const ChatbotFlowBuilder = (props: ChatbotFlowBuilderProps) => {
    return (
        <ReactFlowProvider>
            <ReactFlowBuilder {...props} />
        </ReactFlowProvider>
    );
};

ReactFlowBuilder.displayName = 'ReactFlowBuilder';

export default ChatbotFlowBuilder;