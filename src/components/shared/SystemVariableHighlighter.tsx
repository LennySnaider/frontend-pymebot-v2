/**
 * agentprop/src/components/shared/SystemVariableHighlighter.tsx
 * Componente para resaltar variables del sistema en un texto
 * @version 1.0.0
 * @created 2025-10-04
 */

import React from 'react'
import { Tooltip } from '@/components/ui'
import {
    containsVariables,
    extractVariableNames,
} from '@/services/SystemVariablesService'

interface SystemVariableHighlighterProps {
    text: string
    className?: string
}

const SystemVariableHighlighter: React.FC<SystemVariableHighlighterProps> = ({
    text,
    className = '',
}) => {
    if (!text || !containsVariables(text)) {
        return <span className={className}>{text}</span>
    }

    // Verificar que hay variables en el texto
    extractVariableNames(text)

    // Dividir el texto en partes (texto normal y variables)
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    // Expresión regular para encontrar variables en el formato {{variable_name}}
    const regex = /\{\{([^}]+)\}\}/g
    let match
    let index = 0

    // Iterar sobre todas las coincidencias
    while ((match = regex.exec(text)) !== null) {
        // Añadir el texto antes de la variable
        if (match.index > lastIndex) {
            parts.push(
                <span key={`text-${index}`}>
                    {text.substring(lastIndex, match.index)}
                </span>,
            )
        }

        // Añadir la variable resaltada
        const variableName = match[1]
        parts.push(
            <Tooltip key={`var-${index}`} title={`Variable: ${variableName}`}>
                <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono text-sm">
                    {match[0]}
                </span>
            </Tooltip>,
        )

        lastIndex = match.index + match[0].length
        index++
    }

    // Añadir el texto restante después de la última variable
    if (lastIndex < text.length) {
        parts.push(
            <span key={`text-${index}`}>{text.substring(lastIndex)}</span>,
        )
    }

    return <span className={className}>{parts}</span>
}

export default SystemVariableHighlighter
