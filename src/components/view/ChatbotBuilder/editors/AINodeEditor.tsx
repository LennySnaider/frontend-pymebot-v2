/**
 * agentprop/src/components/view/ChatbotBuilder/editors/AINodeEditor.tsx
 * Editor para nodos de IA con soporte para variables del sistema
 * @version 1.0.0
 * @created 2025-10-04
 */

import React from 'react'
import { Input, Button, Select, Checkbox } from '@/components/ui'
import VariableEnabledTextArea from './VariableEnabledTextArea'

interface AINodeEditorProps {
    data: {
        prompt: string
        responseVariableName?: string
        model?: string
        temperature?: number
        provider?: 'openai' | 'minimax'
        description?: string
        label?: string
        useKnowledgeBase?: boolean
        maxTokens?: number
        delayMs?: number
    }
    onChange: (data: {
        prompt: string
        responseVariableName?: string
        model?: string
        temperature?: number
        provider?: 'openai' | 'minimax'
        description?: string
        label?: string
        useKnowledgeBase?: boolean
        maxTokens?: number
        delayMs?: number
    }) => void
    onClose?: () => void
}

const AINodeEditor: React.FC<AINodeEditorProps> = ({
    data,
    onChange,
    onClose,
}) => {
    // Manejar cambios en los campos
    const handleChange = (
        field: string,
        value: string | number | boolean | undefined,
    ) => {
        onChange({
            ...data,
            [field]: value,
        })
    }

    // Opciones para el proveedor de IA
    const providerOptions = [
        { value: 'openai', label: 'OpenAI' },
        { value: 'minimax', label: 'Minimax' },
    ]

    // Opciones para el modelo (dependiendo del proveedor)
    const modelOptions =
        data.provider === 'openai'
            ? [
                  { value: 'gpt-4', label: 'GPT-4' },
                  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
              ]
            : [
                  { value: 'abab5.5', label: 'ABAB 5.5' },
                  { value: 'abab6', label: 'ABAB 6' },
              ]

    return (
        <div className="space-y-4 p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
                Editar nodo de IA
            </h3>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Etiqueta del nodo
                    </label>
                    <Input
                        placeholder="Ej: Respuesta de IA"
                        value={data.label || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Descripción (opcional)
                    </label>
                    <Input
                        placeholder="Descripción breve del propósito de este nodo"
                        value={data.description || ''}
                        onChange={(e) =>
                            handleChange('description', e.target.value)
                        }
                    />
                </div>

                <VariableEnabledTextArea
                    label="Prompt para la IA"
                    value={data.prompt || ''}
                    onChange={(value) => handleChange('prompt', value)}
                    placeholder="Escribe el prompt que se enviará a la IA..."
                    rows={5}
                    helpText="Puedes insertar variables del sistema usando el botón 'Insertar variable'"
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Proveedor de IA
                        </label>
                        <Select
                            options={providerOptions}
                            value={providerOptions.find(
                                (option) => option.value === data.provider,
                            )}
                            onChange={(option) =>
                                handleChange('provider', option?.value)
                            }
                            placeholder="Seleccionar proveedor"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Modelo
                        </label>
                        <Select
                            options={modelOptions}
                            value={modelOptions.find(
                                (option) => option.value === data.model,
                            )}
                            onChange={(option) =>
                                handleChange('model', option?.value)
                            }
                            placeholder="Seleccionar modelo"
                            isDisabled={!data.provider}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Temperatura
                        </label>
                        <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.1}
                            value={data.temperature?.toString() || '0.7'}
                            onChange={(e) =>
                                handleChange(
                                    'temperature',
                                    parseFloat(e.target.value),
                                )
                            }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Valores más altos = más creatividad, valores más
                            bajos = más precisión
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Guardar respuesta en variable
                        </label>
                        <Input
                            placeholder="Nombre de la variable"
                            value={data.responseVariableName || ''}
                            onChange={(e) =>
                                handleChange(
                                    'responseVariableName',
                                    e.target.value,
                                )
                            }
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">
                            Retraso (ms)
                        </label>
                        <Input
                            type="number"
                            min={0}
                            step={100}
                            placeholder="Retraso en milisegundos (0 = sin retraso)"
                            value={data.delayMs?.toString() || '0'}
                            onChange={(e) =>
                                handleChange(
                                    'delayMs',
                                    e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : 0,
                                )
                            }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tiempo de espera antes de generar la respuesta (en
                            milisegundos)
                        </p>
                    </div>

                    <div className="pt-2">
                        <Checkbox
                            checked={data.useKnowledgeBase || false}
                            onChange={(checked) =>
                                handleChange('useKnowledgeBase', checked)
                            }
                        >
                            <span className="text-sm text-gray-700">
                                Usar base de conocimiento
                            </span>
                        </Checkbox>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
                {onClose && (
                    <Button variant="plain" onClick={onClose}>
                        Cancelar
                    </Button>
                )}
                <Button variant="solid" color="blue" onClick={onClose}>
                    Guardar
                </Button>
            </div>
        </div>
    )
}

export default AINodeEditor
