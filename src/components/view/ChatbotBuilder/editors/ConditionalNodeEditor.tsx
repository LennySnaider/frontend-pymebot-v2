/**
 * agentprop/src/components/view/ChatbotBuilder/editors/ConditionalNodeEditor.tsx
 * Editor para nodos condicionales con soporte para variables del sistema
 * @version 1.0.0
 * @created 2025-10-04
 */

import React from 'react'
import { Input, Button } from '@/components/ui'
import VariableEnabledTextArea from './VariableEnabledTextArea'

interface ConditionalNodeEditorProps {
    data: {
        condition: string
        description?: string
        label?: string
        delayMs?: number
    }
    onChange: (data: {
        condition: string
        description?: string
        label?: string
        delayMs?: number
    }) => void
    onClose?: () => void
}

const ConditionalNodeEditor: React.FC<ConditionalNodeEditorProps> = ({
    data,
    onChange,
    onClose,
}) => {
    // Manejar cambios en los campos
    const handleChange = (
        field: string,
        value: string | number | undefined,
    ) => {
        onChange({
            ...data,
            [field]: value,
        })
    }

    return (
        <div className="space-y-4 p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
                Editar nodo condicional
            </h3>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Etiqueta del nodo
                    </label>
                    <Input
                        placeholder="Ej: Verificar respuesta"
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
                    label="Condición"
                    value={data.condition || ''}
                    onChange={(value) => handleChange('condition', value)}
                    placeholder="Escribe la condición a evaluar..."
                    rows={3}
                    helpText="Puedes insertar variables del sistema usando el botón 'Insertar variable'. Ejemplo: {{nombre_variable}} === 'valor'"
                />

                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Ejemplos de condiciones
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                        <li>
                            <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {"{{respuesta_usuario}} === 'sí'"}
                            </code>{' '}
                            - Verifica si la respuesta del usuario es
                            exactamente &apos;sí&apos;
                        </li>
                        <li>
                            <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {"{{respuesta_usuario}}.includes('gracias')"}
                            </code>{' '}
                            - Verifica si la respuesta contiene la palabra
                            &apos;gracias&apos;
                        </li>
                        <li>
                            <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {'{{edad}} > 18'}
                            </code>{' '}
                            - Verifica si la edad es mayor a 18
                        </li>
                        <li>
                            <code className="bg-gray-100 px-1 py-0.5 rounded">
                                {
                                    "{{opcion_seleccionada}} === 'opcion1' || {{opcion_seleccionada}} === 'opcion2'"
                                }
                            </code>{' '}
                            - Verifica múltiples condiciones
                        </li>
                    </ul>
                </div>

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
                        Tiempo de espera antes de evaluar esta condición (en
                        milisegundos)
                    </p>
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

export default ConditionalNodeEditor
