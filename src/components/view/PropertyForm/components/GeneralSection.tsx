/**
 * frontend/src/components/view/PropertyForm/components/GeneralSection.tsx
 * Sección de información general del formulario de propiedades con valores predeterminados visibles correctamente.
 * @version 1.8.6
 * @updated 2025-03-31
 */

'use client'

import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import RichTextEditor from '@/components/shared/RichTextEditor'
import { Controller } from 'react-hook-form'
import Select from '@/components/ui/Select'
import ClientOnly from '@/components/shared/ClientOnly'
import type { FormSectionBaseProps } from '../types'
import type { PropertyFormSchema } from '../types' // Importa el tipo PropertyFormSchema

type GeneralSectionProps = FormSectionBaseProps

// Define tipos para las opciones de los selectores
type SelectOption = { value: string; label: string }

// Opciones para los selectores con valores predeterminados
const propertyTypes: SelectOption[] = [
    { value: 'house', label: 'Casa' },
    { value: 'apartment', label: 'Apartamento' },
    { value: 'land', label: 'Terreno' },
    { value: 'commercial', label: 'Local Comercial' },
    { value: 'office', label: 'Oficina' },
    { value: 'industrial', label: 'Industrial' },
]

const propertyStatuses: SelectOption[] = [
    { value: 'available', label: 'Disponible' },
    { value: 'sold', label: 'Vendida' },
    { value: 'rented', label: 'Rentada' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'reserved', label: 'Reservada' },
]

const operationTypes: SelectOption[] = [
    { value: 'sale', label: 'Venta' },
    { value: 'rent', label: 'Renta' },
]

const GeneralSection = ({ control, errors }: GeneralSectionProps) => {
    return (
        <Card>
            <h4 className="mb-6">Información Básica</h4>
            <div>
                <FormItem
                    label="Nombre de la propiedad"
                    invalid={Boolean(errors.name)}
                    errorMessage={errors.name?.message}
                >
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Ej: Casa en Residencial Los Pinos"
                                {...field}
                                value={field.value ?? ''} // Asegura que siempre haya un valor controlado
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Código de propiedad"
                    invalid={Boolean(errors.propertyCode)}
                    errorMessage={errors.propertyCode?.message}
                >
                    <Controller
                        name="propertyCode"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Ej: PROP-001"
                                {...field}
                                value={field.value ?? ''} // Asegura que siempre haya un valor controlado
                            />
                        )}
                    />
                </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormItem
                    label="Tipo de propiedad"
                    invalid={Boolean(errors.propertyType)}
                    errorMessage={errors.propertyType?.message}
                >
                    <Controller
                        name="propertyType"
                        control={control}
                        render={({ field }) => (
                            <ClientOnly>
                                <Select
                                    id="propertyType"
                                    instanceId="propertyType"
                                    options={propertyTypes}
                                    styles={{
                                        menuPortal: (base) => ({
                                            ...base,
                                            zIndex: 9999,
                                        }),
                                    }}
                                    value={
                                        propertyTypes.find(
                                            (option) =>
                                                option.value ===
                                                (field.value as PropertyFormSchema['propertyType']),
                                        ) || null // Null si no hay coincidencia
                                    }
                                    onChange={(option: SelectOption | null) => {
                                        field.onChange(
                                            option ? option.value : undefined,
                                        )
                                    }}
                                    placeholder="Seleccionar tipo de propiedad"
                                    menuPortalTarget={
                                        typeof document !== 'undefined'
                                            ? document.body
                                            : undefined
                                    }
                                />
                            </ClientOnly>
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Estado"
                    invalid={Boolean(errors.status)}
                    errorMessage={errors.status?.message}
                >
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <ClientOnly>
                                <Select
                                    instanceId="status"
                                    options={propertyStatuses}
                                    value={
                                        propertyStatuses.find(
                                            (option) =>
                                                option.value ===
                                                (field.value as PropertyFormSchema['status']),
                                        ) || null // Null si no hay coincidencia
                                    }
                                    onChange={(option: SelectOption | null) => {
                                        field.onChange(
                                            option ? option.value : undefined,
                                        )
                                    }}
                                    placeholder="Seleccionar estado"
                                    menuPortalTarget={
                                        typeof document !== 'undefined'
                                            ? document.body
                                            : undefined
                                    }
                                />
                            </ClientOnly>
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Tipo de operación"
                    invalid={Boolean(errors.operationType)}
                    errorMessage={errors.operationType?.message}
                >
                    <Controller
                        name="operationType"
                        control={control}
                        render={({ field }) => (
                            <ClientOnly>
                                <Select
                                    instanceId="operationType"
                                    options={operationTypes}
                                    value={
                                        operationTypes.find(
                                            (option) =>
                                                option.value ===
                                                (field.value as PropertyFormSchema['operationType']),
                                        ) || null // Null si no hay coincidencia
                                    }
                                    onChange={(option: SelectOption | null) => {
                                        field.onChange(
                                            option ? option.value : undefined,
                                        )
                                    }}
                                    placeholder="Seleccionar tipo de operación"
                                    menuPortalTarget={
                                        typeof document !== 'undefined'
                                            ? document.body
                                            : undefined
                                    }
                                />
                            </ClientOnly>
                        )}
                    />
                </FormItem>
            </div>

            <FormItem
                label="Descripción"
                invalid={Boolean(errors.description)}
                errorMessage={errors.description?.message}
            >
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <ClientOnly>
                            <RichTextEditor
                                content={field.value ?? ''} // Asegura que siempre haya un valor controlado
                                invalid={Boolean(errors.description)}
                                onChange={({ html }) => {
                                    field.onChange(html)
                                }}
                            />
                        </ClientOnly>
                    )}
                />
            </FormItem>
        </Card>
    )
}

export default GeneralSection
