/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/InputNodeConfig.tsx
 * Configurador para nodos de captura de entrada del usuario
 * @version 1.0.0
 * @updated 2025-04-08
 */

import React, { useState } from 'react'
import { XCircleIcon, PlusIcon } from '@heroicons/react/24/outline'

interface InputNodeConfigProps {
    data: {
        prompt: string
        variableName: string
        inputType: string
        options?: string[]
        [key: string]: any
    }
    onChange: (field: string, value: any) => void
}

const InputNodeConfig: React.FC<InputNodeConfigProps> = ({ data, onChange }) => {
    const [newOption, setNewOption] = useState('')

    // Manejar la adición de una nueva opción
    const handleAddOption = () => {
        if (!newOption.trim()) return

        const currentOptions = data.options || []
        const updatedOptions = [...currentOptions, newOption.trim()]
        onChange('options', updatedOptions)
        setNewOption('')
    }

    // Manejar la eliminación de una opción
    const handleRemoveOption = (index: number) => {
        const currentOptions = data.options || []
        const updatedOptions = currentOptions.filter((_, i) => i !== index)
        onChange('options', updatedOptions)
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje de solicitud
                </label>
                <textarea
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.prompt || ''}
                    onChange={(e) => onChange('prompt', e.target.value)}
                    placeholder="¿Qué le preguntarás al usuario?"
                    rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                    El mensaje que se mostrará al usuario para solicitar la información.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de variable
                </label>
                <div className="flex items-center">
                    <span className="mr-1 text-gray-500">{'{}'}</span>
                    <input
                        type="text"
                        className="flex-grow border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={data.variableName || ''}
                        onChange={(e) => onChange('variableName', e.target.value)}
                        placeholder="nombre_variable"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Nombre de la variable donde se guardará la respuesta del usuario.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de entrada
                </label>
                <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                    value={data.inputType || 'text'}
                    onChange={(e) => onChange('inputType', e.target.value)}
                >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="email">Email</option>
                    <option value="phone">Teléfono</option>
                    <option value="date">Fecha</option>
                    <option value="option">Opciones</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                    El tipo de dato que se espera recibir. Esto afecta la validación.
                </p>
            </div>

            {data.inputType === 'option' && (
                <div className="bg-gray-50 p-3 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opciones disponibles
                    </label>
                    
                    <div className="space-y-2 mb-3">
                        {(data.options || []).map((option: string, index: number) => (
                            <div key={index} className="flex items-center">
                                <span className="flex-grow bg-white px-3 py-1 text-sm rounded-md border border-gray-300">
                                    {option}
                                </span>
                                <button
                                    type="button"
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    onClick={() => handleRemoveOption(index)}
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex items-center">
                        <input
                            type="text"
                            className="flex-grow border-gray-300 rounded-l-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            placeholder="Nueva opción"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                        />
                        <button
                            type="button"
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-r-md"
                            onClick={handleAddOption}
                        >
                            <PlusIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        El usuario deberá seleccionar una de estas opciones.
                    </p>
                </div>
            )}

            <div className="bg-green-50 rounded-md p-3">
                <h4 className="font-medium text-green-800 text-sm mb-1">Información</h4>
                <p className="text-xs text-green-700">
                    Este nodo pausará el flujo y esperará la entrada del usuario.
                    La respuesta se guardará en la variable especificada y podrá ser utilizada
                    en nodos posteriores.
                </p>
            </div>
        </div>
    )
}

export default InputNodeConfig
