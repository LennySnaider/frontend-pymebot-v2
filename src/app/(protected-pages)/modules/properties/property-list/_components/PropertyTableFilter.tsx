/**
 * frontend/src/app/(protected-pages)/modules/properties/property-list/_components/PropertyTableFilter.tsx
 * Componente de filtros avanzados para la lista de propiedades.
 *
 * @version 1.0.0
 * @updated 2025-05-20
 */

'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Drawer from '@/components/ui/Drawer'
import Checkbox from '@/components/ui/Checkbox'
import Badge from '@/components/ui/Badge'
import usePropertyListStore from '../_store/propertyListStore'
import Select, { Option as DefaultOption } from '@/components/ui/Select'
import { components } from 'react-select'
const { Control } = components
import { Form, FormItem } from '@/components/ui/Form'
import NumericInput from '@/components/shared/NumericInput'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { TbFilter, TbMinus } from 'react-icons/tb'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { ControlProps, OptionProps } from 'react-select'
import classNames from '@/utils/classNames'

type FormSchema = {
    minPrice: number | string
    maxPrice: number | string
    propertyStatus: string
    propertyType: Array<string>
    operationType: string
    minBedrooms: number | string
    maxBedrooms: number | string
    minBathrooms: number | string
    maxBathrooms: number | string
}

type Option = {
    value: string
    label: string
    className: string
}

const propertyStatusOption: Option[] = [
    { value: 'available', label: 'Disponible', className: 'bg-emerald-500' },
    { value: 'sold', label: 'Vendida', className: 'bg-red-500' },
    { value: 'rented', label: 'Rentada', className: 'bg-amber-500' },
    { value: 'pending', label: 'Pendiente', className: 'bg-blue-500' },
    { value: 'reserved', label: 'Reservada', className: 'bg-purple-500' },
]

const operationTypeOption: Option[] = [
    { value: 'all', label: 'Todas', className: 'bg-gray-500' },
    { value: 'sale', label: 'Venta', className: 'bg-blue-500' },
    { value: 'rent', label: 'Renta', className: 'bg-green-500' },
]

const propertyTypeList = [
    'house',
    'apartment',
    'land',
    'commercial',
    'office',
    'industrial',
]
const propertyTypeLabels: Record<string, string> = {
    house: 'Casa',
    apartment: 'Apartamento',
    land: 'Terreno',
    commercial: 'Local Comercial',
    office: 'Oficina',
    industrial: 'Industrial',
}

const CustomSelectOption = (props: OptionProps<Option>) => {
    return (
        <DefaultOption<Option>
            {...props}
            customLabel={(data, label) => (
                <span className="flex items-center gap-2">
                    <Badge className={data.className} />
                    <span className="ml-2 rtl:mr-2">{label}</span>
                </span>
            )}
        />
    )
}

const CustomControl = ({ children, ...props }: ControlProps<Option>) => {
    const selected = props.getValue()[0]
    return (
        <Control {...props}>
            {selected && (
                <Badge className={classNames('ml-4', selected.className)} />
            )}
            {children}
        </Control>
    )
}

const validationSchema: ZodType<FormSchema> = z.object({
    minPrice: z.union([z.string(), z.number()]),
    maxPrice: z.union([z.string(), z.number()]),
    propertyStatus: z.string(),
    propertyType: z.array(z.string()),
    operationType: z.string(),
    minBedrooms: z.union([z.string(), z.number()]),
    maxBedrooms: z.union([z.string(), z.number()]),
    minBathrooms: z.union([z.string(), z.number()]),
    maxBathrooms: z.union([z.string(), z.number()]),
})

const PropertyTableFilter = () => {
    const [filterIsOpen, setFilterIsOpen] = useState(false)

    const { filter: filterData, setFilter: setFilterData } = usePropertyListStore()

    const { onAppendQueryParams } = useAppendQueryParams()

    const { handleSubmit, control, getValues } = useForm<FormSchema>({
        defaultValues: filterData,
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = (values: FormSchema) => {
        setFilterData(values)

        onAppendQueryParams({
            minPrice: values.minPrice,
            maxPrice: values.maxPrice,
            propertyStatus: values.propertyStatus,
            propertyType: values.propertyType.join(','),
            operationType: values.operationType,
            minBedrooms: values.minBedrooms,
            maxBedrooms: values.maxBedrooms,
            minBathrooms: values.minBathrooms,
            maxBathrooms: values.maxBathrooms,
        })

        setFilterIsOpen(false)
    }

    return (
        <>
            <Button icon={<TbFilter />} onClick={() => setFilterIsOpen(true)}>
                Filtros
            </Button>
            <Drawer
                title="Filtros de propiedades"
                isOpen={filterIsOpen}
                onClose={() => setFilterIsOpen(false)}
                onRequestClose={() => setFilterIsOpen(false)}
            >
                <Form
                    className="h-full"
                    containerClassName="flex flex-col justify-between h-full"
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <div>
                        <FormItem label="Rango de precios">
                            <div className="flex items-center gap-2">
                                <Controller
                                    name="minPrice"
                                    control={control}
                                    render={({ field }) => (
                                        <NumericInput
                                            thousandSeparator
                                            type="text"
                                            inputPrefix="$"
                                            autoComplete="off"
                                            placeholder="0.00"
                                            value={field.value}
                                            max={getValues('maxPrice')}
                                            isAllowed={(values) => {
                                                const { floatValue } = values
                                                return (
                                                    (floatValue || 0) <=
                                                    (getValues(
                                                        'maxPrice',
                                                    ) as number)
                                                )
                                            }}
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                        />
                                    )}
                                />
                                <span>
                                    <TbMinus />
                                </span>
                                <Controller
                                    name="maxPrice"
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
                            </div>
                        </FormItem>
                        <FormItem label="Estado de la propiedad">
                            <Controller
                                name="propertyStatus"
                                control={control}
                                render={({ field }) => (
                                    <Select<Option>
                                        instanceId="status"
                                        options={propertyStatusOption}
                                        {...field}
                                        value={propertyStatusOption.filter(
                                            (option) =>
                                                option.value === field.value,
                                        )}
                                        components={{
                                            Option: CustomSelectOption,
                                            Control: CustomControl,
                                        }}
                                        onChange={(option) =>
                                            field.onChange(option?.value)
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Tipo de operación">
                            <Controller
                                name="operationType"
                                control={control}
                                render={({ field }) => (
                                    <Select<Option>
                                        instanceId="operationType"
                                        options={operationTypeOption}
                                        {...field}
                                        value={operationTypeOption.filter(
                                            (option) =>
                                                option.value === field.value,
                                        )}
                                        components={{
                                            Option: CustomSelectOption,
                                            Control: CustomControl,
                                        }}
                                        onChange={(option) =>
                                            field.onChange(option?.value)
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Tipo de propiedad">
                            <div className="mt-4">
                                <Controller
                                    name="propertyType"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox.Group
                                            vertical
                                            className="flex"
                                            {...field}
                                        >
                                            {propertyTypeList.map(
                                                (type, index) => (
                                                    <Checkbox
                                                        key={type + index}
                                                        name={field.name}
                                                        value={type}
                                                        className="justify-between flex-row-reverse heading-text"
                                                    >
                                                        {
                                                            propertyTypeLabels[
                                                                type
                                                            ]
                                                        }
                                                    </Checkbox>
                                                ),
                                            )}
                                        </Checkbox.Group>
                                    )}
                                />
                            </div>
                        </FormItem>
                        <FormItem label="Habitaciones">
                            <div className="flex items-center gap-2">
                                <Controller
                                    name="minBedrooms"
                                    control={control}
                                    render={({ field }) => (
                                        <NumericInput
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Min"
                                            value={field.value}
                                            max={getValues('maxBedrooms')}
                                            isAllowed={(values) => {
                                                const { floatValue } = values
                                                return (
                                                    (floatValue || 0) <=
                                                    (getValues(
                                                        'maxBedrooms',
                                                    ) as number)
                                                )
                                            }}
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                        />
                                    )}
                                />
                                <span>
                                    <TbMinus />
                                </span>
                                <Controller
                                    name="maxBedrooms"
                                    control={control}
                                    render={({ field }) => (
                                        <NumericInput
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Max"
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </FormItem>
                        <FormItem label="Baños">
                            <div className="flex items-center gap-2">
                                <Controller
                                    name="minBathrooms"
                                    control={control}
                                    render={({ field }) => (
                                        <NumericInput
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Min"
                                            value={field.value}
                                            max={getValues('maxBathrooms')}
                                            isAllowed={(values) => {
                                                const { floatValue } = values
                                                return (
                                                    (floatValue || 0) <=
                                                    (getValues(
                                                        'maxBathrooms',
                                                    ) as number)
                                                )
                                            }}
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                        />
                                    )}
                                />
                                <span>
                                    <TbMinus />
                                </span>
                                <Controller
                                    name="maxBathrooms"
                                    control={control}
                                    render={({ field }) => (
                                        <NumericInput
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Max"
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </FormItem>
                    </div>
                    <Button variant="solid" type="submit">
                        Aplicar filtros
                    </Button>
                </Form>
            </Drawer>
        </>
    )
}

export default PropertyTableFilter
