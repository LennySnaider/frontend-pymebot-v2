'use client'

/**
 * agentprop/src/components/view/ChatbotBuilder/editors/VariableEnabledTextArea.tsx
 * Componente de textarea con soporte para variables del sistema
 * @version 1.0.0
 * @created 2025-10-04
 */

import React, { useState, useRef } from 'react'
import SystemVariableSelector from '@/components/shared/SystemVariableSelector'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

interface VariableEnabledTextAreaProps {
    value: string
    onChange: (value: string) => void
    label?: string
    placeholder?: string
    className?: string
    rows?: number
    helpText?: string
    error?: string
}

const VariableEnabledTextArea: React.FC<VariableEnabledTextAreaProps> = ({
    value,
    onChange,
    label,
    placeholder = 'Escribe aquí...',
    className = '',
    rows = 4,
    helpText,
    error,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [previewMode, setPreviewMode] = useState(false)
    const hasVariables = containsVariables(value)

    // Insertar una variable en la posición del cursor
    const handleInsertVariable = (variableName: string) => {
        if (!textareaRef.current) return

        const textarea = textareaRef.current
        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        // Insertar la variable en la posición del cursor
        const newValue =
            value.substring(0, start) + variableName + value.substring(end)
        onChange(newValue)

        // Establecer el cursor después de la variable insertada
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(
                start + variableName.length,
                start + variableName.length,
            )
        }, 0)
    }

    // Alternar entre modo edición y modo vista previa
    const togglePreviewMode = () => {
        setPreviewMode(!previewMode)
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                    {hasVariables && (
                        <button
                            type="button"
                            onClick={togglePreviewMode}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            {previewMode ? 'Editar' : 'Vista previa'}
                        </button>
                    )}
                </div>
            )}

            {previewMode ? (
                <div className="min-h-[100px] p-2 border rounded-md bg-gray-50">
                    <SystemVariableHighlighter
                        text={value}
                        className="whitespace-pre-wrap break-words"
                    />
                </div>
            ) : (
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        onChange(e.target.value)
                    }
                    placeholder={placeholder}
                    rows={rows}
                    className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            )}

            <div className="flex justify-between items-start">
                <div>
                    {helpText && (
                        <p className="text-xs text-gray-500 mt-1">{helpText}</p>
                    )}
                    {error && (
                        <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                </div>

                <SystemVariableSelector
                    onSelectVariable={handleInsertVariable}
                    buttonLabel="Insertar"
                    tooltipText="Insertar una variable del sistema"
                    className="mt-1"
                />
            </div>
        </div>
    )
}

export default VariableEnabledTextArea
