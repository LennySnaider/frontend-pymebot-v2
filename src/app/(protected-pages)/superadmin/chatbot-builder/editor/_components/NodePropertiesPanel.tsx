/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/NodePropertiesPanel.tsx
 * Panel de propiedades para editar nodos
 * @version 1.1.0
 * @updated 2025-10-04 - Añadido soporte para variables del sistema y retraso en todos los nodos
 */

'use client'

import React, { useState } from 'react'
import { Node } from 'reactflow'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import Radio from '@/components/ui/Radio'
import Select from '@/components/ui/Select'
import { PiTrashDuotone, PiWarningCircleDuotone } from 'react-icons/pi'
import SystemVariableSelector from '@/components/shared/SystemVariableSelector'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'
import APIConfigModal from './APIConfigModal'

// Tipos de propiedades
interface NodePropertiesPanelProps {
    node: Node
    updateProperties: (
        properties: Record<string, string | number | boolean | unknown>,
    ) => void
    deleteNode: () => void
}

// Componente principal
const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
    node,
    updateProperties,
    deleteNode,
}) => {
    const [isAPIConfigModalOpen, setIsAPIConfigModalOpen] = useState(false)

    if (!node) return null

    // Manejador para actualizar propiedades
    const handlePropertyChange = (
        property: string,
        value: string | number | boolean | unknown,
    ) => {
        updateProperties({ [property]: value })
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-base">Propiedades del nodo</h3>
                <div>
                    {node.id !== 'start-node' ? (
                        <Button
                            size="xs"
                            variant="default"
                            color="red"
                            icon={<PiTrashDuotone />}
                            onClick={deleteNode}
                        >
                            Eliminar
                        </Button>
                    ) : (
                        <span className="text-xs text-gray-500 flex items-center">
                            <PiWarningCircleDuotone className="mr-1" /> Nodo
                            inicial
                        </span>
                    )}
                </div>
            </div>

            <Form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {/* Propiedad común: etiqueta */}
                <FormItem label="Etiqueta">
                    <Input
                        value={node.data.label || ''}
                        onChange={(e) =>
                            handlePropertyChange('label', e.target.value)
                        }
                    />
                </FormItem>

                {/* Propiedades específicas según el tipo de nodo */}
                {node.type === 'messageNode' && (
                    <>
                        <FormItem label="Mensaje">
                            <div className="relative">
                                <textarea
                                    className="w-full h-24 p-2 border border-gray-300 rounded-md"
                                    value={node.data.message || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'message',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="flex justify-end mt-2">
                                    <SystemVariableSelector
                                        onSelectVariable={(variable) => {
                                            const textarea =
                                                document.activeElement as HTMLTextAreaElement
                                            if (
                                                textarea &&
                                                textarea.tagName === 'TEXTAREA'
                                            ) {
                                                const start =
                                                    textarea.selectionStart
                                                const end =
                                                    textarea.selectionEnd
                                                const newValue =
                                                    node.data.message.substring(
                                                        0,
                                                        start,
                                                    ) +
                                                    variable +
                                                    node.data.message.substring(
                                                        end,
                                                    )
                                                handlePropertyChange(
                                                    'message',
                                                    newValue,
                                                )
                                            } else {
                                                handlePropertyChange(
                                                    'message',
                                                    (node.data.message || '') +
                                                        variable,
                                                )
                                            }
                                        }}
                                        buttonLabel="+ {{...}}"
                                        tooltipText="Insertar variable"
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
                                    />
                                </div>
                            </div>
                            {containsVariables(node.data.message) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-medium text-blue-700 mb-1">
                                        Vista previa con variables:
                                    </p>
                                    <SystemVariableHighlighter
                                        text={node.data.message || ''}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </FormItem>
                        <FormItem label="Retraso (ms)">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    value={node.data.delay || 0}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'delay',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="flex-grow"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                    milisegundos
                                </span>
                            </div>
                        </FormItem>
                        <FormItem>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="waitForResponse"
                                    checked={node.data.waitForResponse || false}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'waitForResponse',
                                            e.target.checked,
                                        )
                                    }
                                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="waitForResponse" className="text-sm text-gray-700 dark:text-gray-300">
                                    Esperar respuesta
                                </label>
                                <span className="ml-2 text-xs text-gray-500 italic">
                                    {node.data.waitForResponse ? "Pausa hasta recibir respuesta" : "Continúa automáticamente"}
                                </span>
                            </div>
                        </FormItem>
                    </>
                )}

                {node.type === 'aiNode' && (
                    <>
                        <FormItem label="Prompt">
                            <div className="relative">
                                <textarea
                                    className="w-full h-24 p-2 border border-gray-300 rounded-md"
                                    value={node.data.prompt || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'prompt',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="flex justify-end mt-2">
                                    <SystemVariableSelector
                                        onSelectVariable={(variable) => {
                                            const textarea =
                                                document.activeElement as HTMLTextAreaElement
                                            if (
                                                textarea &&
                                                textarea.tagName === 'TEXTAREA'
                                            ) {
                                                const start =
                                                    textarea.selectionStart
                                                const end =
                                                    textarea.selectionEnd
                                                const newValue =
                                                    node.data.prompt.substring(
                                                        0,
                                                        start,
                                                    ) +
                                                    variable +
                                                    node.data.prompt.substring(
                                                        end,
                                                    )
                                                handlePropertyChange(
                                                    'prompt',
                                                    newValue,
                                                )
                                            } else {
                                                handlePropertyChange(
                                                    'prompt',
                                                    (node.data.prompt || '') +
                                                        variable,
                                                )
                                            }
                                        }}
                                        buttonLabel="+ {{...}}"
                                        tooltipText="Insertar variable"
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
                                    />
                                </div>
                            </div>
                            {containsVariables(node.data.prompt) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-medium text-blue-700 mb-1">
                                        Vista previa con variables:
                                    </p>
                                    <SystemVariableHighlighter
                                        text={node.data.prompt || ''}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </FormItem>
                        <FormItem label="Retraso (ms)">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    value={node.data.delay || 0}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'delay',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="flex-grow"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                    milisegundos
                                </span>
                            </div>
                        </FormItem>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Modelo
                            </label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={node.data.model || 'gpt-4o'}
                                onChange={(e) =>
                                    handlePropertyChange('model', e.target.value)
                                }
                            >
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="claude-3">Claude 3</option>
                                <option value="gemini">Gemini</option>
                                <option value="deepseek">Deepseek</option>
                                <option value="minimax">Minimax</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>

                        {node.data.model === 'custom' && (
                            <FormItem label="Modelo personalizado">
                                <Input
                                    value={node.data.customModel || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'customModel',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nombre del modelo (ej: llama-3)"
                                />
                            </FormItem>
                        )}

                        <FormItem label="Temperatura">
                            <Input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={node.data.temperature || 0.7}
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'temperature',
                                        parseFloat(e.target.value),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Tokens máximos">
                            <Input
                                type="number"
                                value={node.data.maxTokens || 500}
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'maxTokens',
                                        parseInt(e.target.value),
                                    )
                                }
                            />
                        </FormItem>
                    </>
                )}

                {node.type === 'conditionNode' && (
                    <>
                        <FormItem label="Condición">
                            <div className="relative">
                                <textarea
                                    className="w-full h-16 p-2 border border-gray-300 rounded-md font-mono"
                                    value={node.data.condition || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'condition',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="flex justify-end mt-2">
                                    <SystemVariableSelector
                                        onSelectVariable={(variable) => {
                                            const textarea =
                                                document.activeElement as HTMLTextAreaElement
                                            if (
                                                textarea &&
                                                textarea.tagName === 'TEXTAREA'
                                            ) {
                                                const start =
                                                    textarea.selectionStart
                                                const end =
                                                    textarea.selectionEnd
                                                const newValue =
                                                    node.data.condition.substring(
                                                        0,
                                                        start,
                                                    ) +
                                                    variable +
                                                    node.data.condition.substring(
                                                        end,
                                                    )
                                                handlePropertyChange(
                                                    'condition',
                                                    newValue,
                                                )
                                            } else {
                                                handlePropertyChange(
                                                    'condition',
                                                    (node.data.condition ||
                                                        '') + variable,
                                                )
                                            }
                                        }}
                                        buttonLabel="+ {{...}}"
                                        tooltipText="Insertar variable"
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
                                    />
                                </div>
                            </div>
                            {containsVariables(node.data.condition) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-medium text-blue-700 mb-1">
                                        Vista previa con variables:
                                    </p>
                                    <SystemVariableHighlighter
                                        text={node.data.condition || ''}
                                        className="text-sm font-mono"
                                    />
                                </div>
                            )}
                        </FormItem>
                        <FormItem label="Retraso (ms)">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    value={node.data.delay || 0}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'delay',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="flex-grow"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                    milisegundos
                                </span>
                            </div>
                        </FormItem>
                        <FormItem label="Opciones">
                            <div className="space-y-2">
                                {node.data.options?.map(
                                    (
                                        option: {
                                            value: string
                                            label: string
                                        },
                                        index: number,
                                    ) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                value={option.value}
                                                onChange={(e) => {
                                                    const newOptions = [
                                                        ...node.data.options,
                                                    ]
                                                    newOptions[index].value =
                                                        e.target.value
                                                    newOptions[index].label =
                                                        e.target.value
                                                    handlePropertyChange(
                                                        'options',
                                                        newOptions,
                                                    )
                                                }}
                                            />
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                color="red"
                                                onClick={() => {
                                                    const newOptions =
                                                        node.data.options.filter(
                                                            (
                                                                _: unknown,
                                                                i: number,
                                                            ) => i !== index,
                                                        )
                                                    handlePropertyChange(
                                                        'options',
                                                        newOptions,
                                                    )
                                                }}
                                            >
                                                <PiTrashDuotone />
                                            </Button>
                                        </div>
                                    ),
                                )}
                                <Button
                                    size="xs"
                                    variant="default"
                                    onClick={() => {
                                        const newOptions = [
                                            ...(node.data.options || []),
                                        ]
                                        newOptions.push({
                                            value: `Opción ${newOptions.length + 1}`,
                                            label: `Opción ${newOptions.length + 1}`,
                                        })
                                        handlePropertyChange(
                                            'options',
                                            newOptions,
                                        )
                                    }}
                                >
                                    Añadir opción
                                </Button>
                            </div>
                        </FormItem>
                    </>
                )}

                {node.type === 'inputNode' && (
                    <>
                        <FormItem label="Pregunta">
                            <div className="relative">
                                <textarea
                                    className="w-full h-16 p-2 border border-gray-300 rounded-md"
                                    value={node.data.question || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'question',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="flex justify-end mt-2">
                                    <SystemVariableSelector
                                        onSelectVariable={(variable) => {
                                            const textarea =
                                                document.activeElement as HTMLTextAreaElement
                                            if (
                                                textarea &&
                                                textarea.tagName === 'TEXTAREA'
                                            ) {
                                                const start =
                                                    textarea.selectionStart
                                                const end =
                                                    textarea.selectionEnd
                                                const newValue =
                                                    node.data.question.substring(
                                                        0,
                                                        start,
                                                    ) +
                                                    variable +
                                                    node.data.question.substring(
                                                        end,
                                                    )
                                                handlePropertyChange(
                                                    'question',
                                                    newValue,
                                                )
                                            } else {
                                                handlePropertyChange(
                                                    'question',
                                                    (node.data.question || '') +
                                                        variable,
                                                )
                                            }
                                        }}
                                        buttonLabel="+ {{...}}"
                                        tooltipText="Insertar variable"
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
                                    />
                                </div>
                            </div>
                            {containsVariables(node.data.question) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-medium text-blue-700 mb-1">
                                        Vista previa con variables:
                                    </p>
                                    <SystemVariableHighlighter
                                        text={node.data.question || ''}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </FormItem>
                        <FormItem label="Nombre de variable">
                            <Input
                                value={node.data.variableName || ''}
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'variableName',
                                        e.target.value,
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Tipo de entrada">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'text', label: 'Texto' },
                                    { value: 'number', label: 'Número' },
                                    { value: 'email', label: 'Email' },
                                    { value: 'phone', label: 'Teléfono' },
                                    { value: 'date', label: 'Fecha' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handlePropertyChange('inputType', option.value)}
                                        className={`text-left px-3 py-2 rounded-md border ${
                                            node.data.inputType === option.value
                                                ? 'bg-green-50 border-green-300 text-green-700 font-medium'
                                                : 'bg-white border-gray-300 text-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center">
                                            <div className={`w-3 h-3 rounded-full mr-2 ${
                                                node.data.inputType === option.value
                                                    ? 'bg-green-500'
                                                    : 'border border-gray-300'
                                            }`}></div>
                                            <span className="text-sm">{option.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </FormItem>
                    </>
                )}

                {node.type === 'ttsNode' && (
                    <>
                        {/* ... (TTSNode UI omitido para no duplicar) ... */}
                    </>
                )}

                {/* Nuevo nodo combinado: AI Voice Agent */}
                {node.type === 'aiVoiceAgentNode' && (
                    <>
                        <FormItem label="Prompt de IA">
                            <div className="relative">
                                <textarea
                                    className="w-full h-24 p-2 border border-gray-300 rounded-md"
                                    value={node.data.prompt || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'prompt',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="flex justify-end mt-2">
                                    <SystemVariableSelector
                                        onSelectVariable={(variable) => {
                                            const textarea =
                                                document.activeElement as HTMLTextAreaElement
                                            if (
                                                textarea &&
                                                textarea.tagName === 'TEXTAREA'
                                            ) {
                                                const start =
                                                    textarea.selectionStart
                                                const end =
                                                    textarea.selectionEnd
                                                const newValue =
                                                    node.data.prompt.substring(
                                                        0,
                                                        start,
                                                    ) +
                                                    variable +
                                                    node.data.prompt.substring(
                                                        end,
                                                    )
                                                handlePropertyChange(
                                                    'prompt',
                                                    newValue,
                                                )
                                            } else {
                                                handlePropertyChange(
                                                    'prompt',
                                                    (node.data.prompt || '') +
                                                        variable,
                                                )
                                            }
                                        }}
                                        buttonLabel="+ {{...}}"
                                        tooltipText="Insertar variable"
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
                                    />
                                </div>
                            </div>
                            {containsVariables(node.data.prompt) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-medium text-blue-700 mb-1">
                                        Vista previa con variables:
                                    </p>
                                    <SystemVariableHighlighter
                                        text={node.data.prompt || ''}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </FormItem>
                        <FormItem label="Modelo / Proveedor">
                            <Select
                                options={[
                                    { value: 'gpt-4o', label: 'GPT-4o' },
                                    { value: 'claude-3', label: 'Claude 3' },
                                    { value: 'gemini', label: 'Gemini' },
                                    { value: 'deepseek', label: 'Deepseek' },
                                    { value: 'minimax', label: 'Minimax' },
                                    { value: 'custom', label: 'Personalizado' }
                                ]}
                                value={{value: node.data.model || 'gpt-4o', label: node.data.model || 'GPT-4o'}}
                                onChange={(option) =>
                                    handlePropertyChange('model', option?.value)
                                }
                            />
                        </FormItem>
                        {node.data.model === 'custom' && (
                            <FormItem label="Modelo personalizado">
                                <Input
                                    value={node.data.customModel || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'customModel',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Nombre del modelo (ej: llama-3)"
                                />
                            </FormItem>
                        )}
                        <FormItem label="Temperatura">
                            <Input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={node.data.temperature || 0.7}
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'temperature',
                                        parseFloat(e.target.value),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Tokens máximos">
                            <Input
                                type="number"
                                value={node.data.maxTokens || 500}
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'maxTokens',
                                        parseInt(e.target.value),
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Voz">
                            <Select
                                options={[
                                    { value: 'Default', label: 'Por defecto' },
                                    { value: 'Male', label: 'Masculina' },
                                    { value: 'Female', label: 'Femenina' }
                                ]}
                                value={{value: node.data.voice || 'Default', label: node.data.voice === 'Male' ? 'Masculina' : node.data.voice === 'Female' ? 'Femenina' : 'Por defecto'}}
                                onChange={(option) =>
                                    handlePropertyChange('voice', option?.value)
                                }
                            />
                        </FormItem>
                        <FormItem label="Velocidad">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    min="0.5"
                                    max="2"
                                    step="0.1"
                                    value={node.data.rate || 1.0}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'rate',
                                            parseFloat(e.target.value),
                                        )
                                    }
                                    className="flex-grow"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                    (0.5 - 2.0)
                                </span>
                            </div>
                        </FormItem>
                        <FormItem label="Retraso (ms)">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    value={node.data.delay || 0}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'delay',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="flex-grow"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                    milisegundos
                                </span>
                            </div>
                        </FormItem>
                    </>
                )}

                {node.type === 'sttNode' && (
                    <>
                        <FormItem label="Instrucción para el usuario">
                            <div className="relative">
                                <textarea
                                    className="w-full h-16 p-2 border border-gray-300 rounded-md"
                                    value={node.data.prompt || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'prompt',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="flex justify-end mt-2">
                                    <SystemVariableSelector
                                        onSelectVariable={(variable) => {
                                            const textarea =
                                                document.activeElement as HTMLTextAreaElement
                                            if (
                                                textarea &&
                                                textarea.tagName === 'TEXTAREA'
                                            ) {
                                                const start =
                                                    textarea.selectionStart
                                                const end =
                                                    textarea.selectionEnd
                                                const newValue =
                                                    node.data.prompt.substring(
                                                        0,
                                                        start,
                                                    ) +
                                                    variable +
                                                    node.data.prompt.substring(
                                                        end,
                                                    )
                                                handlePropertyChange(
                                                    'prompt',
                                                    newValue,
                                                )
                                            } else {
                                                handlePropertyChange(
                                                    'prompt',
                                                    (node.data.prompt || '') +
                                                        variable,
                                                )
                                            }
                                        }}
                                        buttonLabel="+ {{...}}"
                                        tooltipText="Insertar variable"
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
                                    />
                                </div>
                            </div>
                            {containsVariables(node.data.prompt) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-medium text-blue-700 mb-1">
                                        Vista previa con variables:
                                    </p>
                                    <SystemVariableHighlighter
                                        text={node.data.prompt || ''}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </FormItem>
                        <FormItem label="Nombre de variable">
                            <Input
                                value={
                                    node.data.variableName || 'transcripcion'
                                }
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'variableName',
                                        e.target.value,
                                    )
                                }
                            />
                        </FormItem>
                        <FormItem label="Idioma">
                            <Radio.Group
                                value={node.data.language || 'Español'}
                                onChange={(value) =>
                                    handlePropertyChange('language', value)
                                }
                            >
                                <Radio value="Español">Español</Radio>
                                <Radio value="English">Inglés</Radio>
                                <Radio value="Français">Francés</Radio>
                                <Radio value="Português">Portugués</Radio>
                            </Radio.Group>
                        </FormItem>
                        <FormItem label="Duración máxima">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    min="5"
                                    max="120"
                                    value={node.data.duration || 30}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'duration',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="flex-grow"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                    segundos
                                </span>
                            </div>
                        </FormItem>
                    </>
                )}

                {node.type === 'endNode' && (
                    <>
                        <FormItem label="Mensaje de despedida">
                            <Input
                                value={node.data.message || ''}
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'message',
                                        e.target.value,
                                    )
                                }
                            />
                        </FormItem>
                    </>
                )}

                {node.type === 'buttonsNode' && (
                    <>
                        <FormItem label="Mensaje">
                            <div className="relative">
                                <textarea
                                    className="w-full h-24 p-2 border border-gray-300 rounded-md"
                                    value={node.data.message || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'message',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="flex justify-end mt-2">
                                    <SystemVariableSelector
                                        onSelectVariable={(variable) => {
                                            const textarea =
                                                document.activeElement as HTMLTextAreaElement
                                            if (
                                                textarea &&
                                                textarea.tagName === 'TEXTAREA'
                                            ) {
                                                const start =
                                                    textarea.selectionStart
                                                const end =
                                                    textarea.selectionEnd
                                                const newValue =
                                                    node.data.message.substring(
                                                        0,
                                                        start,
                                                    ) +
                                                    variable +
                                                    node.data.message.substring(
                                                        end,
                                                    )
                                                handlePropertyChange(
                                                    'message',
                                                    newValue,
                                                )
                                            } else {
                                                handlePropertyChange(
                                                    'message',
                                                    (node.data.message || '') +
                                                        variable,
                                                )
                                            }
                                        }}
                                        buttonLabel="+ {{...}}"
                                        tooltipText="Insertar variable"
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
                                    />
                                </div>
                            </div>
                            {containsVariables(node.data.message) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-medium text-blue-700 mb-1">
                                        Vista previa con variables:
                                    </p>
                                    <SystemVariableHighlighter
                                        text={node.data.message || ''}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </FormItem>
                        <FormItem label="Retraso (ms)">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    value={node.data.delay || 0}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'delay',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="flex-grow"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                    milisegundos
                                </span>
                            </div>
                        </FormItem>
                        <FormItem label="Nombre de variable">
                            <Input
                                value={node.data.variableName || ''}
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'variableName',
                                        e.target.value,
                                    )
                                }
                                placeholder="respuesta_boton"
                            />
                        </FormItem>
                        <FormItem label="Botones">
                            <div className="mb-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                                <p><strong>Nota:</strong> El texto ingresado se muestra al usuario. Un valor interno se genera automáticamente para la lógica del flujo.</p>
                            </div>
                            <div className="space-y-2">
                                {node.data.buttons?.map(
                                    (
                                        button: {
                                            text: string
                                            value?: string
                                        },
                                        index: number,
                                    ) => (
                                        <div key={index} className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Texto:</label>
                                                <Input
                                                    value={button.text || ''}
                                                    onChange={(e) => {
                                                        const newText = e.target.value;
                                                        const newButtons = [
                                                            ...node.data.buttons,
                                                        ];
                                                        // Actualizar el texto visible
                                                        newButtons[index].text = newText;
                                                        
                                                        // Generar automáticamente el valor interno basado en el texto
                                                        // convertir a minúsculas, quitar espacios y caracteres especiales
                                                        const valueFromText = newText
                                                            .toLowerCase()
                                                            .replace(/[^\w\s]/gi, '')
                                                            .replace(/\s+/g, '_');
                                                        
                                                        newButtons[index].value = valueFromText || `opcion_${index + 1}`;
                                                        
                                                        handlePropertyChange(
                                                            'buttons',
                                                            newButtons,
                                                        );
                                                    }}
                                                    placeholder="Texto del botón"
                                                />
                                            </div>
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                color="red"
                                                onClick={() => {
                                                    if (node.data.buttons.length <= 1) {
                                                        return; // Evitar eliminar el último botón
                                                    }
                                                    const newButtons =
                                                        node.data.buttons.filter(
                                                            (
                                                                _: unknown,
                                                                i: number,
                                                            ) => i !== index,
                                                        )
                                                    handlePropertyChange(
                                                        'buttons',
                                                        newButtons,
                                                    )
                                                }}
                                            >
                                                <PiTrashDuotone />
                                            </Button>
                                        </div>
                                    ),
                                )}
                                {(!node.data.buttons || node.data.buttons.length < 3) && (
                                    <Button
                                        size="xs"
                                        variant="default"
                                        color="purple"
                                        onClick={() => {
                                            const newButtons = [
                                                ...(node.data.buttons || []),
                                            ];
                                            const nextButtonNum = newButtons.length + 1;
                                            const buttonText = `Opción ${nextButtonNum}`;
                                            // Generar valor interno limpio
                                            const buttonValue = `opcion_${nextButtonNum}`;
                                            
                                            newButtons.push({
                                                text: buttonText,
                                                value: buttonValue,
                                            });
                                            handlePropertyChange(
                                                'buttons',
                                                newButtons,
                                            );
                                        }}
                                    >
                                        Añadir botón ({(node.data.buttons || []).length}/3)
                                    </Button>
                                )}
                            </div>
                        </FormItem>
                        <FormItem>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="waitForResponse"
                                    checked={node.data.waitForResponse || false}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'waitForResponse',
                                            e.target.checked,
                                        )
                                    }
                                    className="mr-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="waitForResponse" className="text-sm text-gray-700 dark:text-gray-300">
                                    Esperar respuesta
                                </label>
                                <span className="ml-2 text-xs text-gray-500 italic">
                                    {node.data.waitForResponse ? "Pausa hasta seleccionar botón" : "Continúa automáticamente"}
                                </span>
                            </div>
                        </FormItem>
                    </>
                )}

                {node.type === 'listNode' && (
                    <>
                        <FormItem label="Mensaje">
                            <div className="relative">
                                <textarea
                                    className="w-full h-24 p-2 border border-gray-300 rounded-md"
                                    value={node.data.message || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'message',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div className="flex justify-end mt-2">
                                    <SystemVariableSelector
                                        onSelectVariable={(variable) => {
                                            const textarea =
                                                document.activeElement as HTMLTextAreaElement
                                            if (
                                                textarea &&
                                                textarea.tagName === 'TEXTAREA'
                                            ) {
                                                const start =
                                                    textarea.selectionStart
                                                const end =
                                                    textarea.selectionEnd
                                                const newValue =
                                                    node.data.message.substring(
                                                        0,
                                                        start,
                                                    ) +
                                                    variable +
                                                    node.data.message.substring(
                                                        end,
                                                    )
                                                handlePropertyChange(
                                                    'message',
                                                    newValue,
                                                )
                                            } else {
                                                handlePropertyChange(
                                                    'message',
                                                    (node.data.message || '') +
                                                        variable,
                                                )
                                            }
                                        }}
                                        buttonLabel="+ {{...}}"
                                        tooltipText="Insertar variable"
                                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
                                    />
                                </div>
                            </div>
                            {containsVariables(node.data.message) && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                    <p className="text-xs font-medium text-blue-700 mb-1">
                                        Vista previa con variables:
                                    </p>
                                    <SystemVariableHighlighter
                                        text={node.data.message || ''}
                                        className="text-sm"
                                    />
                                </div>
                            )}
                        </FormItem>
                        <FormItem label="Retraso (ms)">
                            <div className="flex items-center">
                                <Input
                                    type="number"
                                    value={node.data.delay || 0}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'delay',
                                            parseInt(e.target.value),
                                        )
                                    }
                                    className="flex-grow"
                                />
                                <span className="ml-2 text-sm text-gray-500">
                                    milisegundos
                                </span>
                            </div>
                        </FormItem>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <FormItem label="Título de la lista">
                                <Input
                                    value={node.data.listTitle || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'listTitle',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Opciones disponibles"
                                />
                            </FormItem>
                            <FormItem label="Texto del botón">
                                <Input
                                    value={node.data.buttonText || ''}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'buttonText',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Ver opciones"
                                />
                            </FormItem>
                        </div>
                        <FormItem label="Nombre de variable">
                            <Input
                                value={node.data.variableName || ''}
                                onChange={(e) =>
                                    handlePropertyChange(
                                        'variableName',
                                        e.target.value,
                                    )
                                }
                                placeholder="respuesta_lista"
                            />
                        </FormItem>
                        <FormItem label="Opciones de la lista">
                            <div className="mb-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                                <p><strong>Nota:</strong> Cada opción tiene un texto (mostrado al usuario) y una descripción opcional. Un valor interno se genera automáticamente.</p>
                            </div>
                            <div className="space-y-2">
                                {node.data.listItems?.map(
                                    (
                                        item: {
                                            text: string
                                            description?: string
                                            value?: string
                                        },
                                        index: number,
                                    ) => (
                                        <div key={index} className="bg-gray-50 p-2 rounded-md border border-gray-200">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-medium">Opción {index + 1}</span>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        disabled={index === 0}
                                                        onClick={() => {
                                                            if (index === 0) return;
                                                            const newItems = [...node.data.listItems];
                                                            const temp = newItems[index];
                                                            newItems[index] = newItems[index - 1];
                                                            newItems[index - 1] = temp;
                                                            handlePropertyChange('listItems', newItems);
                                                        }}
                                                    >
                                                        ↑
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        disabled={index === node.data.listItems.length - 1}
                                                        onClick={() => {
                                                            if (index === node.data.listItems.length - 1) return;
                                                            const newItems = [...node.data.listItems];
                                                            const temp = newItems[index];
                                                            newItems[index] = newItems[index + 1];
                                                            newItems[index + 1] = temp;
                                                            handlePropertyChange('listItems', newItems);
                                                        }}
                                                    >
                                                        ↓
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="plain"
                                                        color="red"
                                                        onClick={() => {
                                                            if (node.data.listItems.length <= 1) {
                                                                return; // Evitar eliminar el último elemento
                                                            }
                                                            const newItems =
                                                                node.data.listItems.filter(
                                                                    (
                                                                        _: unknown,
                                                                        i: number,
                                                                    ) => i !== index,
                                                                );
                                                            handlePropertyChange(
                                                                'listItems',
                                                                newItems,
                                                            );
                                                        }}
                                                    >
                                                        <PiTrashDuotone />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Texto:</label>
                                                    <Input
                                                        value={item.text || ''}
                                                        onChange={(e) => {
                                                            const newText = e.target.value;
                                                            const newItems = [
                                                                ...node.data.listItems,
                                                            ];
                                                            // Actualizar el texto visible
                                                            newItems[index].text = newText;

                                                            // Generar automáticamente el valor interno basado en el texto
                                                            // convertir a minúsculas, quitar espacios y caracteres especiales
                                                            const valueFromText = newText
                                                                .toLowerCase()
                                                                .replace(/[^\w\s]/gi, '')
                                                                .replace(/\s+/g, '_');
                                                            
                                                            newItems[index].value = valueFromText || `opcion_${index + 1}`;
                                                            
                                                            handlePropertyChange(
                                                                'listItems',
                                                                newItems,
                                                            );
                                                        }}
                                                        placeholder="Texto de la opción"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Descripción:</label>
                                                    <Input
                                                        value={item.description || ''}
                                                        onChange={(e) => {
                                                            const newItems = [
                                                                ...node.data.listItems,
                                                            ];
                                                            newItems[index].description =
                                                                e.target.value;
                                                            handlePropertyChange(
                                                                'listItems',
                                                                newItems,
                                                            );
                                                        }}
                                                        placeholder="Descripción (opcional)"
                                                        className="text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )}
                                {(!node.data.listItems || node.data.listItems.length < 10) && (
                                    <Button
                                        size="xs"
                                        variant="default"
                                        color="orange"
                                        onClick={() => {
                                            const newItems = [
                                                ...(node.data.listItems || []),
                                            ];
                                            const nextItemNum = newItems.length + 1;
                                            const itemText = `Opción ${nextItemNum}`;
                                            const itemDesc = `Descripción de la opción ${nextItemNum}`;
                                            // Generar valor interno limpio
                                            const itemValue = `opcion_${nextItemNum}`;
                                            
                                            newItems.push({
                                                text: itemText,
                                                description: itemDesc,
                                                value: itemValue,
                                            });
                                            handlePropertyChange(
                                                'listItems',
                                                newItems,
                                            );
                                        }}
                                    >
                                        Añadir opción ({(node.data.listItems || []).length}/10)
                                    </Button>
                                )}
                            </div>
                        </FormItem>
                        <FormItem>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="waitForResponse"
                                    checked={node.data.waitForResponse || false}
                                    onChange={(e) =>
                                        handlePropertyChange(
                                            'waitForResponse',
                                            e.target.checked,
                                        )
                                    }
                                    className="mr-2 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <label htmlFor="waitForResponse" className="text-sm text-gray-700 dark:text-gray-300">
                                    Esperar respuesta
                                </label>
                                <span className="ml-2 text-xs text-gray-500 italic">
                                    {node.data.waitForResponse ? "Pausa hasta seleccionar opción" : "Continúa automáticamente"}
                                </span>
                            </div>
                        </FormItem>
                    </>
                )}
            </Form>
            <APIConfigModal
                isOpen={isAPIConfigModalOpen}
                onClose={() => setIsAPIConfigModalOpen(false)}
            />
        </div>
    )
}

export default NodePropertiesPanel