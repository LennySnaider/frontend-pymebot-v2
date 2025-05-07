/**
 * frontend/src/components/view/PropertyForm/components/PricingSection.tsx
 * Sección de precios del formulario de propiedades.
 * Implementa ClientSelect para evitar errores de hidratación.
 * @version 1.1.0
 * @updated 2025-03-31
 */

'use client'

import Card from '@/components/ui/Card'
import { FormItem } from '@/components/ui/Form'
import NumericInput from '@/components/shared/NumericInput'
import { Controller } from 'react-hook-form'
import ClientSelect from '@/components/shared/ClientSelect'
import type { FormSectionBaseProps } from '../types'

type PricingSectionProps = FormSectionBaseProps

const currencies = [
    { value: 'MXN', label: 'Peso Mexicano (MXN)' },
    { value: 'USD', label: 'Dólar Estadounidense (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
]

const PricingSection = ({ control, errors }: PricingSectionProps) => {
    return (
        <Card>
            <h4 className="mb-6">Precios</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem
                    label="Precio"
                    invalid={Boolean(errors.price)}
                    errorMessage={errors.price?.message}
                >
                    <Controller
                        name="price"
                        control={control}
                        render={({ field }) => (
                            <NumericInput
                                thousandSeparator
                                type="text"
                                inputPrefix="$"
                                autoComplete="off"
                                placeholder="0.00"
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Moneda"
                    invalid={Boolean(errors.currency)}
                    errorMessage={errors.currency?.message}
                >
                    <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                            <ClientSelect
                                instanceId="currency"
                                options={currencies}
                                value={currencies.find(
                                    (currency) =>
                                        currency.value === field.value,
                                )}
                                onChange={(option) =>
                                    field.onChange(option?.value)
                                }
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default PricingSection
