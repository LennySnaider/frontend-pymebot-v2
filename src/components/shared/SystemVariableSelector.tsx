'use client'

/**
 * agentprop/src/components/shared/SystemVariableSelector.tsx
 * Componente para seleccionar variables del sistema
 * @version 1.0.0
 * @created 2025-10-04
 */

import React, { useState, useEffect } from 'react'
import { Select, Button, Tooltip } from '@/components/ui'
import {
    getSystemVariables,
    formatVariableForSelector,
    formatVariableName,
} from '@/services/SystemVariablesService'
import { PiPlusBold } from 'react-icons/pi'

interface SystemVariableSelectorProps {
    onSelectVariable: (variableName: string) => void
    buttonLabel?: string
    tooltipText?: string
    className?: string
}

const SystemVariableSelector: React.FC<SystemVariableSelectorProps> = ({
    onSelectVariable,
    // buttonLabel = 'Insertar variable',
    tooltipText = 'Selecciona una variable del sistema para insertarla',
    className = '',
}) => {
    const [variables, setVariables] = useState<
        { value: string; label: string }[]
    >([])
    const [selectedVariable, setSelectedVariable] = useState<string | null>(
        null,
    )
    const [loading, setLoading] = useState(false)

    // Cargar las variables del sistema al montar el componente
    useEffect(() => {
        const loadVariables = async () => {
            setLoading(true)
            try {
                const systemVariables = await getSystemVariables()
                const formattedVariables = systemVariables.map(
                    formatVariableForSelector,
                )
                setVariables(formattedVariables)
            } catch (error) {
                console.error('Error al cargar variables del sistema:', error)
            } finally {
                setLoading(false)
            }
        }

        loadVariables()
    }, [])

    // Manejar la selección de una variable
    const handleSelectVariable = (value: string | null) => {
        setSelectedVariable(value)
    }

    // Manejar la inserción de una variable
    const handleInsertVariable = () => {
        if (selectedVariable) {
            const formattedVariable = formatVariableName(selectedVariable)
            onSelectVariable(formattedVariable)
            setSelectedVariable(null) // Resetear la selección después de insertar
        }
    }

    return (
        <div className={`flex w-full items-center gap-2 ${className}`}>
            <div className="flex-1">
                <Select
                    placeholder="Seleccionar variable"
                    options={variables}
                    size="sm"
                    value={
                        variables.find((v) => v.value === selectedVariable) ||
                        null
                    }
                    onChange={(option) =>
                        handleSelectVariable(option?.value || null)
                    }
                    isSearchable
                    isLoading={loading}
                />
            </div>
            <Tooltip title={tooltipText}>
                <Button
                    variant="solid"
                    size="xs"
                    icon={<PiPlusBold />}
                    onClick={handleInsertVariable}
                    disabled={!selectedVariable || loading}
                ></Button>
            </Tooltip>
        </div>
    )
}

export default SystemVariableSelector
