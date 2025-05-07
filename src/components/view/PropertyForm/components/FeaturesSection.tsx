/**
 * frontend/src/components/view/PropertyForm/components/FeaturesSection.tsx
 * Sección de características del formulario de propiedades.
 * Maneja la entrada y validación de características numéricas y booleanas.
 *
 * Mejoras:
 * - Permite valores decimales en baños (ej. 2.5)
 * - Utiliza YearInput para el campo de año de construcción
 * - Corrige la validación de valores numéricos
 *
 * @version 1.5.0
 * @updated 2025-04-04
 */

'use client'

import Card from '@/components/ui/Card'
import { FormItem } from '@/components/ui/Form'
import Switcher from '@/components/ui/Switcher'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'
import NumericInput from '@/components/shared/NumericInput'
import YearInput from '@/components/shared/YearInput'
import { useEffect, useState } from 'react'

type FeaturesSectionProps = FormSectionBaseProps

/**
 * Función auxiliar para convertir valores de entrada en números válidos.
 * @param val - Valor a convertir
 * @param allowDecimals - Si se permiten decimales
 * @returns Número convertido
 */
const toValidNumber = (val: any, allowDecimals = false): number => {
    // Si el valor es vacío o no definido, devolver 0
    if (val === undefined || val === null || val === '') {
        return 0
    }

    // Convertir a número
    const num = typeof val === 'number' ? val : Number(val)

    // Verificar si es un número válido
    if (isNaN(num)) {
        return 0
    }

    // Si se permiten decimales, aseguramos que sean múltiplos de 0.5 para baños
    if (allowDecimals) {
        // Redondear al 0.5 más cercano (ej: 2.3 -> 2.5, 2.7 -> 2.5)
        return Math.round(num * 2) / 2;
    }
    
    // Si no se permiten decimales, redondear a entero
    return Math.floor(num);
}

const FeaturesSection = ({ control, errors }: FeaturesSectionProps) => {
    const [currentYear] = useState(() => new Date().getFullYear())

    // Efecto para garantizar que los valores numéricos sean correctos después del montaje
    useEffect(() => {
        const fields = [
            'features.bedrooms',
            'features.bathrooms',
            'features.area',
            'features.parkingSpots',
            'features.yearBuilt',
        ]

        // Solo intentar hacer la validación si control tiene los métodos necesarios
        if (control && typeof control.getValues === 'function') {
            fields.forEach((field) => {
                const value = control.getValues(field)
                if (value !== undefined && value !== null) {
                    // Solo actualizar si es necesario
                    if (typeof value !== 'number') {
                        // Determinar si permitimos decimales (solo para baños)
                        const allowDecimals = field === 'features.bathrooms'
                        const numValue = toValidNumber(value, allowDecimals)
                        if (control.setValue) {
                            control.setValue(field, numValue, {
                                shouldValidate: false,
                            })
                        }
                    }
                }
            })
        }
    }, [control])

    return (
        <Card>
            <h4 className="mb-6">Características</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem
                    label="Habitaciones"
                    invalid={Boolean(errors.features?.bedrooms)}
                    errorMessage={errors.features?.bedrooms?.message}
                >
                    <Controller
                        name="features.bedrooms"
                        control={control}
                        render={({ field }) => (
                            <NumericInput
                                type="tel"
                                autoComplete="off"
                                placeholder="0"
                                value={field.value || 0}
                                onValueChange={(values) => {
                                    field.onChange(toValidNumber(values.value))
                                }}
                                thousandSeparator={false}
                                decimalScale={0}
                                allowNegative={false}
                                isAllowed={(values) => {
                                    const { value } = values
                                    return Number(value) >= 0
                                }}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Baños"
                    invalid={Boolean(errors.features?.bathrooms)}
                    errorMessage={errors.features?.bathrooms?.message}
                    extra={
                        <span className="text-xs text-gray-400">
                            &nbsp;Acepta (ej: 2.5, 3.5)
                        </span>
                    }
                >
                    <Controller
                        name="features.bathrooms"
                        control={control}
                        render={({ field }) => (
                            <NumericInput
                                type="tel"
                                autoComplete="off"
                                placeholder="0"
                                value={field.value || 0}
                                onValueChange={(values) => {
                                    // Permitir valores decimales para baños
                                    field.onChange(
                                        toValidNumber(values.value, true),
                                    )
                                }}
                                thousandSeparator={false}
                                decimalScale={1} // Permitir un decimal (0.5, 2.5, etc.)
                                allowNegative={false}
                                decimalSeparator="."
                                isAllowed={(values) => {
                                    const { value } = values
                                    return Number(value) >= 0
                                }}
                            />
                        )}
                    />
                </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem
                    label="Superficie (m²)"
                    invalid={Boolean(errors.features?.area)}
                    errorMessage={errors.features?.area?.message}
                >
                    <Controller
                        name="features.area"
                        control={control}
                        render={({ field }) => (
                            <NumericInput
                                type="tel"
                                autoComplete="off"
                                placeholder="0"
                                value={field.value || 0}
                                onValueChange={(values) => {
                                    field.onChange(toValidNumber(values.value))
                                }}
                                thousandSeparator={false}
                                decimalScale={0}
                                allowNegative={false}
                                isAllowed={(values) => {
                                    const { value } = values
                                    return Number(value) >= 0
                                }}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Estacionamientos"
                    invalid={Boolean(errors.features?.parkingSpots)}
                    errorMessage={errors.features?.parkingSpots?.message}
                >
                    <Controller
                        name="features.parkingSpots"
                        control={control}
                        render={({ field }) => (
                            <NumericInput
                                type="tel"
                                autoComplete="off"
                                placeholder="0"
                                value={field.value || 0}
                                onValueChange={(values) => {
                                    field.onChange(toValidNumber(values.value))
                                }}
                                thousandSeparator={false}
                                decimalScale={0}
                                allowNegative={false}
                                isAllowed={(values) => {
                                    const { value } = values
                                    return Number(value) >= 0
                                }}
                            />
                        )}
                    />
                </FormItem>
            </div>

            <FormItem
                label="Año de construcción"
                invalid={Boolean(errors.features?.yearBuilt)}
                errorMessage={errors.features?.yearBuilt?.message}
                extra={
                    <span className="text-xs text-gray-500">
                        Año entre 1900 y {currentYear}
                    </span>
                }
            >
                <Controller
                    name="features.yearBuilt"
                    control={control}
                    defaultValue={currentYear}
                    render={({ field }) => (
                        <YearInput
                            value={field.value || currentYear}
                            onChange={field.onChange}
                            min={1900}
                            max={currentYear}
                            placeholder={currentYear.toString()}
                            invalid={Boolean(errors.features?.yearBuilt)}
                        />
                    )}
                />
            </FormItem>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormItem label="Piscina">
                    <Controller
                        name="features.hasPool"
                        control={control}
                        render={({ field }) => (
                            <Switcher
                                checked={Boolean(field.value)}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormItem>

                <FormItem label="Jardín">
                    <Controller
                        name="features.hasGarden"
                        control={control}
                        render={({ field }) => (
                            <Switcher
                                checked={Boolean(field.value)}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem label="Garaje">
                    <Controller
                        name="features.hasGarage"
                        control={control}
                        render={({ field }) => (
                            <Switcher
                                checked={Boolean(field.value)}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormItem>

                <FormItem label="Seguridad">
                    <Controller
                        name="features.hasSecurity"
                        control={control}
                        render={({ field }) => (
                            <Switcher
                                checked={Boolean(field.value)}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default FeaturesSection
