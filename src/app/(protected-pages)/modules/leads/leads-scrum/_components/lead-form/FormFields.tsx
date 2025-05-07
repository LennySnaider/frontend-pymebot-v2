/**
 * FormFields.tsx
 * Componente para los campos básicos del formulario de leads
 */

import React from 'react'
import { Controller } from 'react-hook-form'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { FormControl, SelectOption } from './types'

interface FormFieldsProps {
    control: FormControl
    errors: Record<string, { message?: string }>
    interestOptions: SelectOption[]
    sourceOptions: SelectOption[]
    tSalesFunnel: (key: string) => string
}

const FormFields: React.FC<FormFieldsProps> = ({
    control,
    errors,
    interestOptions,
    sourceOptions,
    tSalesFunnel,
}) => {
    return (
        <>
            {/* Campos básicos en dos columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormItem
                    label={tSalesFunnel('addNewLead.name')}
                    invalid={Boolean(errors.name)}
                    errorMessage={errors.name?.message}
                >
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder={tSalesFunnel(
                                    'addNewLead.namePlaceholder',
                                )}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label={tSalesFunnel('addNewLead.email')}
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                autoComplete="off"
                                placeholder={tSalesFunnel(
                                    'addNewLead.emailPlaceholder',
                                )}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem
                    label={tSalesFunnel('addNewLead.phone')}
                    invalid={Boolean(errors.phone)}
                    errorMessage={errors.phone?.message}
                >
                    <Controller
                        name="phone"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Input
                                type="tel"
                                autoComplete="off"
                                placeholder={tSalesFunnel(
                                    'addNewLead.phonePlaceholder',
                                )}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label={tSalesFunnel('addNewLead.interest')}
                    invalid={Boolean(errors.interest)}
                    errorMessage={errors.interest?.message}
                >
                    <Controller
                        name="interest"
                        control={control}
                        render={({ field }) => (
                            <Select
                                placeholder="Seleccionar nivel de interés"
                                options={interestOptions}
                                value={interestOptions.find(
                                    (option) => option.value === field.value,
                                )}
                                onChange={(option) => {
                                    if (option) {
                                        const value =
                                            typeof option === 'object' &&
                                            'value' in option
                                                ? option.value
                                                : option
                                        field.onChange(value)
                                    } else {
                                        field.onChange('medio')
                                    }
                                }}
                            />
                        )}
                    />
                </FormItem>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem
                    label={tSalesFunnel('addNewLead.source')}
                    invalid={Boolean(errors.source)}
                    errorMessage={errors.source?.message}
                >
                    <Controller
                        name="source"
                        control={control}
                        render={({ field }) => (
                            <Select
                                placeholder="Seleccionar origen"
                                options={sourceOptions}
                                value={sourceOptions.find(
                                    (option) => option.value === field.value,
                                )}
                                onChange={(option) => {
                                    if (option) {
                                        const value =
                                            typeof option === 'object' &&
                                            'value' in option
                                                ? option.value
                                                : option
                                        field.onChange(value)
                                    } else {
                                        field.onChange('sitio_web')
                                    }
                                }}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label={tSalesFunnel('addNewLead.notes')}
                    invalid={Boolean(errors.notes)}
                    errorMessage={errors.notes?.message}
                    className="col-span-1 md:col-span-2"
                >
                    <Controller
                        name="notes"
                        control={control}
                        render={({ field }) => (
                            <Input
                                textArea
                                rows={3}
                                autoComplete="off"
                                placeholder={tSalesFunnel(
                                    'addNewLead.notesPlaceholder',
                                )}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </>
    )
}

export default FormFields
