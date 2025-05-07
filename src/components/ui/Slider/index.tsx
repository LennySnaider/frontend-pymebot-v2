/**
 * frontend/src/components/ui/Slider/index.tsx
 * Componente Slider para controlar el zoom del recortador de imágenes.
 * Si no existe en el proyecto, debe ser creado.
 *
 * @version 1.0.0
 * @updated 2025-04-04
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import classNames from 'classnames'

interface SliderProps {
    className?: string
    defaultValue?: number
    disabled?: boolean
    max?: number
    min?: number
    onChange?: (value: number | number[]) => void
    step?: number
    value?: number
    size?: 'sm' | 'md' | 'lg'
}

const Slider = (props: SliderProps) => {
    const {
        className,
        defaultValue = 0,
        disabled = false,
        max = 100,
        min = 0,
        step = 1,
        size = 'md',
        value: controlledValue,
        onChange,
        ...rest
    } = props

    const [value, setValue] = useState(defaultValue)
    const [inputFocused, setInputFocused] = useState(false)
    const sliderRef = useRef<HTMLDivElement>(null)

    // Manejar valor controlado
    useEffect(() => {
        if (controlledValue !== undefined) {
            setValue(controlledValue)
        }
    }, [controlledValue])

    const handleSliderChange = (val: number) => {
        // Asegurar que el valor está dentro de los límites y sigue los pasos
        const newValue = Math.min(Math.max(val, min), max)
        const steppedValue = Math.round(newValue / step) * step

        setValue(steppedValue)
        onChange?.(steppedValue)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value)
        if (!isNaN(val)) {
            handleSliderChange(val)
        }
    }

    const getPercentage = () => {
        return ((value - min) / (max - min)) * 100
    }

    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    }

    const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || !sliderRef.current) return

        const rect = sliderRef.current.getBoundingClientRect()
        const percentage = (e.clientX - rect.left) / rect.width
        const newValue = min + percentage * (max - min)

        handleSliderChange(newValue)
    }

    return (
        <div className={classNames('relative', className)} {...rest}>
            <div
                ref={sliderRef}
                className={classNames(
                    'slider-rail bg-gray-200 dark:bg-gray-600 rounded-full cursor-pointer',
                    sizeClasses[size],
                    { 'opacity-50 cursor-not-allowed': disabled },
                )}
                onClick={handleSliderClick}
            >
                <div
                    className="slider-track bg-primary h-full rounded-full"
                    style={{ width: `${getPercentage()}%` }}
                />
                <div
                    className="slider-handle absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-white border-2 border-primary rounded-full shadow"
                    style={{
                        left: `${getPercentage()}%`,
                        width:
                            size === 'sm'
                                ? '14px'
                                : size === 'md'
                                  ? '18px'
                                  : '24px',
                        height:
                            size === 'sm'
                                ? '14px'
                                : size === 'md'
                                  ? '18px'
                                  : '24px',
                    }}
                />
            </div>

            {/* Input oculto para valor numérico exacto */}
            <input
                type="number"
                className="sr-only"
                value={value}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                onChange={handleInputChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
            />
        </div>
    )
}

export default Slider
