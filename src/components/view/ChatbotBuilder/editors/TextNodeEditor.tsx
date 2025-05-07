/**
 * agentprop/src/components/view/ChatbotBuilder/editors/TextNodeEditor.tsx
 * Editor para nodos de texto con soporte para variables del sistema
 * @version 1.0.0
 * @created 2025-10-04
 */

import React from 'react'
import { Input, Button } from '@/components/ui'
import VariableEnabledTextArea from './VariableEnabledTextArea'

interface TextNodeEditorProps {
    data: {
        message: string
        label?: string
        description?: string
        delayMs?: number
    }
    onChange: (data: {
        message: string
        label?: string
        description?: string
        delayMs?: number
    }) => void
    onClose?: () => void
}

const TextNodeEditor: React.FC<TextNodeEditorProps> = ({
    data,
    onChange,
    onClose,
}) => {
    // Manejar cambios en los campos
    const handleChange = (field: string, value: string | number) => {
        onChange({
            ...data,
            [field]: value,
        })
    }

    return (
        <div className="space-y-4 p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
                Editar nodo de mensaje
            </h3>

            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                        Etiqueta del nodo
                    </label>
                    <Input
                        placeholder="Ej: Mensaje de bienvenida"
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
                    label="Mensaje"
                    value={data.message || ''}
                    onChange={(value) => handleChange('message', value)}
                    placeholder="Escribe el mensaje que se enviará al usuario..."
                    rows={5}
                    helpText="Puedes insertar variables del sistema usando el botón 'Insertar variable'"
                />

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
                        Tiempo de espera antes de mostrar este mensaje (en
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

export default TextNodeEditor
