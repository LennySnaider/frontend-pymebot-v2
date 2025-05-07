/**
 * frontend/src/components/shared/YearInput/index.tsx
 * Componente especializado para la entrada de años con controles mejorados.
 * Resuelve el problema del input de año de construcción con las flechas.
 *
 * @version 1.0.0
 * @updated 2025-04-04
 */

'use client'

import React, { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import { HiChevronUp, HiChevronDown } from 'react-icons/hi'

interface YearInputProps {
    value: number | string
    onChange: (value: number) => void
    min?: number
    max?: number
    placeholder?: string
    className?: string
    invalid?: boolean
    disabled?: boolean
}

const YearInput: React.FC<YearInputProps> = ({
    value,
    onChange,
    min = 1900,
    max = new Date().getFullYear(),
    placeholder = 'Año',
    className = '',
    invalid = false,
    disabled = false,
}) => {
    // Convertir a número para manipulación interna
    const [internalValue, setInternalValue] = useState<number>(() => {
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value
        return isNaN(numValue) ? min : numValue
    })

    // Actualizar valor interno cuando cambia el prop
    useEffect(() => {
        const numValue = typeof value === 'string' ? parseInt(value, 10) : value
        if (!isNaN(numValue) && numValue !== internalValue) {
            setInternalValue(numValue)
        }
    }, [value, internalValue])

    // Validar y actualizar el valor
    const updateValue = (newValue: number) => {
        let validValue = newValue
        
        // Aplicar límites
        if (validValue < min) validValue = min
        if (validValue > max) validValue = max
        
        setInternalValue(validValue)
        onChange(validValue)
    }

    // Manejar cambios en el input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        
        // Si está vacío, no actualizar
        if (newValue === '') {
            return
        }
        
        const numValue = parseInt(newValue, 10)
        if (!isNaN(numValue)) {
            updateValue(numValue)
        }
    }

    // Incrementar año
    const incrementYear = () => {
        if (internalValue < max) {
            updateValue(internalValue + 1)
        }
    }

    // Decrementar año
    const decrementYear = () => {
        if (internalValue > min) {
            updateValue(internalValue - 1)
        }
    }

    // Manejar teclas de flecha
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault()
            incrementYear()
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            decrementYear()
        }
    }

    return (
        <div className={`relative flex items-center ${className}`}>
            <Input
                type="text"
                value={internalValue.toString()}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                min={min}
                max={max}
                disabled={disabled}
                invalid={invalid}
                className="pr-10" // Espacio para los botones
                inputMode="numeric" // Mostrar teclado numérico en dispositivos móviles
            />
            <div className="absolute right-2 h-full flex flex-col justify-center">
                <button
                    type="button"
                    onClick={incrementYear}
                    disabled={disabled || internalValue >= max}
                    className={`p-0.5 text-gray-500 ${
                        !disabled && internalValue < max
                            ? 'hover:text-primary'
                            : 'opacity-50 cursor-not-allowed'
                    } focus:outline-none transition-colors`}
                    aria-label="Incrementar año"
                >
                    <HiChevronUp size={16} />
                </button>
                <button
                    type="button"
                    onClick={decrementYear}
                    disabled={disabled || internalValue <= min}
                    className={`p-0.5 text-gray-500 ${
                        !disabled && internalValue > min
                            ? 'hover:text-primary'
                            : 'opacity-50 cursor-not-allowed'
                    } focus:outline-none transition-colors`}
                    aria-label="Decrementar año"
                >
                    <HiChevronDown size={16} />
                </button>
            </div>
        </div>
    )
}

export default YearInput