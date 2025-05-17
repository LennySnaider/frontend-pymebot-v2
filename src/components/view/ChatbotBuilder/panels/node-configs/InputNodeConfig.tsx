'use client'

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
            {/* Selector de modo: Auto o Estático */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modo de funcionamiento
                </label>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => onChange('mode', 'static')}
                        className={`flex-1 py-2 px-3 rounded-md border ${
                            data.mode !== 'auto'
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                                : 'bg-white border-gray-300 text-gray-700'
                        }`}
                    >
                        Estático
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('mode', 'auto')}
                        className={`flex-1 py-2 px-3 rounded-md border ${
                            data.mode === 'auto'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                                : 'bg-white border-gray-300 text-gray-700'
                        }`}
                    >
                        Auto (Dinámico)
                    </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    {data.mode === 'auto'
                        ? 'Modo Auto: La pregunta y validación se generan dinámicamente según el contexto de la conversación.'
                        : 'Modo Estático: Usa el texto y validación exactamente como están definidos.'}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {data.mode === 'auto' ? 'Plantilla de pregunta' : 'Mensaje de solicitud'}
                </label>
                <textarea
                    className={`w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 ${
                        data.mode === 'auto' ? 'border-2 border-emerald-200' : ''
                    }`}
                    value={data.prompt || ''}
                    onChange={(e) => onChange('prompt', e.target.value)}
                    placeholder={data.mode === 'auto'
                        ? 'Ingresa tu {tipo_dato} para {proposito}...'
                        : '¿Qué le preguntarás al usuario?'}
                    rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                    {data.mode === 'auto'
                        ? 'Puedes incluir variables con formato {variable} que se sustituirán automáticamente.'
                        : 'El mensaje que se mostrará al usuario para solicitar la información.'}
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
                        className={`flex-grow border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 ${
                            data.mode === 'auto' ? 'border-2 border-emerald-200' : ''
                        }`}
                        value={data.variableName || ''}
                        onChange={(e) => onChange('variableName', e.target.value)}
                        placeholder={data.mode === 'auto' ? 'variable_dinamica' : 'nombre_variable'}
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
                <div className="flex flex-wrap gap-2 mb-2">
                    {[
                        { value: 'text', label: 'Texto' },
                        { value: 'number', label: 'Número' },
                        { value: 'email', label: 'Email' },
                        { value: 'phone', label: 'Teléfono' },
                        { value: 'date', label: 'Fecha' },
                        { value: 'option', label: 'Opciones' }
                    ].map(option => (
                        <label
                            key={option.value}
                            className={`mt-1 flex items-center cursor-pointer p-2 rounded-md border ${
                                data.inputType === option.value
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-700'
                            }`}
                        >
                            <input
                                type="radio"
                                name="inputType"
                                value={option.value}
                                checked={data.inputType === option.value}
                                onChange={() => onChange('inputType', option.value)}
                                className="hidden"
                            />
                            <span className="text-sm">{option.label}</span>
                        </label>
                    ))}
                </div>
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

            {/* IMPORTANTE: Checkbox para controlar el flujo - TODOS los nodos deben tenerlo */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.waitForResponse !== false}  // Por defecto true para nodos de entrada
                        onChange={(e) => onChange('waitForResponse', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Esperar respuesta</span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                    Si está activado, el flujo se pausará y esperará la respuesta del usuario.
                    Si está desactivado, el flujo continuará automáticamente al siguiente nodo.
                </p>
            </div>

            {data.mode === 'auto' ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3">
                    <h4 className="font-medium text-emerald-800 text-sm mb-1 flex items-center">
                        <span className="mr-1">⚡</span> Modo Auto activado
                    </h4>
                    <p className="text-xs text-emerald-700">
                        En modo auto, este nodo genera dinámicamente la pregunta reemplazando las variables
                        con valores del contexto. La validación también será más flexible, adaptándose
                        según el contexto actual de la conversación.
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                        La respuesta seguirá almacenándose en la variable especificada
                        {data.waitForResponse !== false ? ' y pausará el flujo hasta que el usuario responda' : ' pero el flujo continuará sin esperar respuesta'}.
                    </p>
                </div>
            ) : (
                <div className="bg-green-50 rounded-md p-3">
                    <h4 className="font-medium text-green-800 text-sm mb-1">Información</h4>
                    <p className="text-xs text-green-700">
                        {data.waitForResponse !== false 
                            ? 'Este nodo pausará el flujo y esperará la entrada del usuario.'
                            : 'Este nodo NO pausará el flujo, continuará automáticamente al siguiente nodo.'}
                        La respuesta se guardará en la variable especificada y podrá ser utilizada
                        en nodos posteriores.
                    </p>
                </div>
            )}
        </div>
    )
}

export default InputNodeConfig
