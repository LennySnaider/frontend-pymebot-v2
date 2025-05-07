/**
 * agentprop/src/app/(protected-pages)/superadmin/variable-builder/_components/VariableTypeFields.tsx
 * Componente para renderizar campos específicos según el tipo de variable
 * @version 1.0.1
 * @created 2025-10-04
 * @updated 2025-10-04 - Mejoras en validaciones y manejo de errores
 */

'use client'

import React from 'react'
import { useTranslation } from '@/utils/hooks/useTranslation'
import { Input, FormItem, Switcher, Button, Tooltip } from '@/components/ui'
import { Controller, Control, FieldErrors } from 'react-hook-form'
import { PiPlusBold, PiTrashBold, PiInfoBold } from 'react-icons/pi'

// Interfaz para las opciones de selección
interface SelectOption {
    value: string
    label: string
}

// Props para el componente
interface VariableTypeFieldsProps {
    type: string
    control: Control<any>
    errors: FieldErrors<any>
    loading: boolean
}

const VariableTypeFields: React.FC<VariableTypeFieldsProps> = ({
    type,
    control,
    errors,
    loading,
}) => {
    const t = useTranslation()

    // Renderizar campos específicos según el tipo de variable
    switch (type) {
        case 'text':
            return (
                <FormItem
                    label={t('systemVariables.form.defaultValue')}
                    className="mt-4"
                >
                    <Controller
                        name="default_value"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder={t(
                                    'systemVariables.form.textDefaultPlaceholder',
                                )}
                                disabled={loading}
                            />
                        )}
                    />
                </FormItem>
            )

        case 'number':
            return (
                <FormItem
                    label={t('systemVariables.form.defaultValue')}
                    className="mt-4"
                    invalid={!!errors.default_value}
                    errorMessage={errors.default_value?.message as string}
                >
                    <Controller
                        name="default_value"
                        control={control}
                        rules={{
                            pattern: {
                                value: /^-?\d*\.?\d*$/,
                                message: t(
                                    'systemVariables.validation.numberFormat',
                                ),
                            },
                            validate: {
                                isValidNumber: (value) =>
                                    !value ||
                                    !isNaN(Number(value)) ||
                                    t(
                                        'systemVariables.validation.invalidNumber',
                                    ),
                            },
                        }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="number"
                                placeholder={t(
                                    'systemVariables.form.numberDefaultPlaceholder',
                                )}
                                disabled={loading}
                                suffix={
                                    <Tooltip
                                        title={t(
                                            'systemVariables.form.numberHelp',
                                        )}
                                    >
                                        <PiInfoBold className="text-gray-400" />
                                    </Tooltip>
                                }
                            />
                        )}
                    />
                </FormItem>
            )

        case 'boolean':
            return (
                <FormItem
                    label={t('systemVariables.form.defaultValue')}
                    className="mt-4"
                >
                    <Controller
                        name="default_value"
                        control={control}
                        render={({ field }) => (
                            <Switcher
                                checked={field.value === 'true'}
                                onChange={(checked) =>
                                    field.onChange(checked ? 'true' : 'false')
                                }
                                disabled={loading}
                            />
                        )}
                    />
                </FormItem>
            )

        case 'select':
            return (
                <>
                    <FormItem
                        label={t('systemVariables.form.defaultValue')}
                        className="mt-4"
                        invalid={!!errors.default_value}
                        errorMessage={errors.default_value?.message as string}
                    >
                        <Controller
                            name="default_value"
                            control={control}
                            rules={{
                                validate: {
                                    matchesOption: (value, formValues) => {
                                        if (!value) return true
                                        const options =
                                            (formValues.options as SelectOption[]) ||
                                            []
                                        return (
                                            options.some(
                                                (opt) => opt.value === value,
                                            ) ||
                                            t(
                                                'systemVariables.validation.defaultValueNotInOptions',
                                            )
                                        )
                                    },
                                },
                            }}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder={t(
                                        'systemVariables.form.selectDefaultPlaceholder',
                                    )}
                                    disabled={loading}
                                />
                            )}
                        />
                        <small className="text-gray-500 mt-1 block">
                            {t('systemVariables.form.selectDefaultHelp')}
                        </small>
                    </FormItem>

                    <FormItem
                        label={t('systemVariables.form.selectOptions')}
                        className="mt-4"
                        invalid={!!errors.options}
                        errorMessage={errors.options?.message as string}
                    >
                        <Controller
                            name="options"
                            control={control}
                            defaultValue={[{ value: '', label: '' }]}
                            rules={{
                                validate: {
                                    hasValidOptions: (
                                        options: SelectOption[] | undefined,
                                    ) => {
                                        if (!options || options.length === 0) {
                                            return t(
                                                'systemVariables.validation.optionsRequired',
                                            )
                                        }

                                        // Verificar que al menos una opción tenga valor y etiqueta
                                        const hasValidOption = options.some(
                                            (opt: SelectOption) =>
                                                opt.value.trim() !== '' &&
                                                opt.label.trim() !== '',
                                        )

                                        return (
                                            hasValidOption ||
                                            t(
                                                'systemVariables.validation.atLeastOneOption',
                                            )
                                        )
                                    },
                                },
                            }}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    {(field.value || []).map(
                                        (
                                            option: SelectOption,
                                            index: number,
                                        ) => (
                                            <div
                                                key={index}
                                                className="flex gap-2"
                                            >
                                                <Input
                                                    placeholder={t(
                                                        'systemVariables.form.optionValue',
                                                    )}
                                                    value={option.value}
                                                    onChange={(e) => {
                                                        const newOptions = [
                                                            ...(field.value ||
                                                                []),
                                                        ]
                                                        newOptions[index] = {
                                                            ...newOptions[
                                                                index
                                                            ],
                                                            value: e.target
                                                                .value,
                                                        }
                                                        field.onChange(
                                                            newOptions,
                                                        )
                                                    }}
                                                    disabled={loading}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    placeholder={t(
                                                        'systemVariables.form.optionLabel',
                                                    )}
                                                    value={option.label}
                                                    onChange={(e) => {
                                                        const newOptions = [
                                                            ...(field.value ||
                                                                []),
                                                        ]
                                                        newOptions[index] = {
                                                            ...newOptions[
                                                                index
                                                            ],
                                                            label: e.target
                                                                .value,
                                                        }
                                                        field.onChange(
                                                            newOptions,
                                                        )
                                                    }}
                                                    disabled={loading}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    shape="circle"
                                                    variant="plain"
                                                    size="sm"
                                                    icon={<PiTrashBold />}
                                                    onClick={() => {
                                                        const newOptions = [
                                                            ...(field.value ||
                                                                []),
                                                        ]
                                                        newOptions.splice(
                                                            index,
                                                            1,
                                                        )
                                                        field.onChange(
                                                            newOptions,
                                                        )
                                                    }}
                                                    disabled={
                                                        loading ||
                                                        !field.value ||
                                                        field.value.length <= 1
                                                    }
                                                />
                                            </div>
                                        ),
                                    )}

                                    <Button
                                        variant="plain"
                                        size="sm"
                                        icon={<PiPlusBold />}
                                        onClick={() => {
                                            field.onChange([
                                                ...(field.value || []),
                                                { value: '', label: '' },
                                            ])
                                        }}
                                        disabled={loading}
                                    >
                                        {t('systemVariables.form.addOption')}
                                    </Button>
                                </div>
                            )}
                        />
                    </FormItem>
                </>
            )

        case 'date':
            return (
                <FormItem
                    label={t('systemVariables.form.defaultValue')}
                    className="mt-4"
                    invalid={!!errors.default_value}
                    errorMessage={errors.default_value?.message as string}
                >
                    <Controller
                        name="default_value"
                        control={control}
                        rules={{
                            validate: {
                                isValidDate: (value) => {
                                    if (!value) return true
                                    const date = new Date(value)
                                    return (
                                        !isNaN(date.getTime()) ||
                                        t(
                                            'systemVariables.validation.invalidDate',
                                        )
                                    )
                                },
                            },
                        }}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="date"
                                placeholder={t(
                                    'systemVariables.form.dateDefaultPlaceholder',
                                )}
                                disabled={loading}
                            />
                        )}
                    />
                    <small className="text-gray-500 mt-1 block">
                        {t('systemVariables.form.dateFormatHelp')}
                    </small>
                </FormItem>
            )

        default:
            return null
    }
}

export default VariableTypeFields
