/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_components/AppointmentListTableFilter.tsx
 * Componente cliente para filtros de tabla de citas con soporte i18n.
 * @version 1.0.0
 * @updated 2025-06-30
 */

'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Checkbox from '@/components/ui/Checkbox'
import Select from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { Form, FormItem } from '@/components/ui/Form'
import { useAppointmentListStore } from '../_store/appointmentListStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { TbFilter } from 'react-icons/tb'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import { useTranslations } from 'next-intl'
import type { Filter } from '../types'

type FormSchema = Filter

const validationSchema: ZodType<FormSchema> = z.object({
    status: z.array(z.string()),
    propertyType: z.array(z.string()),
    agentId: z.string(),
    dateRange: z.tuple([z.string().nullable(), z.string().nullable()])
})

const AppointmentListTableFilter = () => {
    const [dialogIsOpen, setIsOpen] = useState(false)
    const t = useTranslations()

    // Estados de citas con traducciones
    const statusList = [
        { value: 'scheduled', label: t('appointments.status.scheduled') },
        { value: 'confirmed', label: t('appointments.status.confirmed') },
        { value: 'completed', label: t('appointments.status.completed') },
        { value: 'cancelled', label: t('appointments.status.cancelled') },
        { value: 'rescheduled', label: t('appointments.status.rescheduled') },
    ]
    
    // Tipos de propiedades
    const propertyTypeList = [
        { value: 'house', label: t('properties.types.house') },
        { value: 'apartment', label: t('properties.types.apartment') },
        { value: 'land', label: t('properties.types.land') },
        { value: 'commercial', label: t('properties.types.commercial') },
        { value: 'office', label: t('properties.types.office') },
    ]

    const filterData = useAppointmentListStore((state) => state.filterData)
    const setFilterData = useAppointmentListStore((state) => state.setFilterData)

    const { onAppendQueryParams } = useAppendQueryParams()

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        setIsOpen(false)
    }

    const { handleSubmit, reset, control } = useForm<FormSchema>({
        defaultValues: filterData,
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = (values: FormSchema) => {
        onAppendQueryParams({
            status: values.status.join(','),
            propertyType: values.propertyType.join(','),
            agentId: values.agentId,
            fromDate: values.dateRange[0] || '',
            toDate: values.dateRange[1] || ''
        })

        setFilterData(values)
        setIsOpen(false)
    }

    return (
        <>
            <Button icon={<TbFilter />} onClick={() => openDialog()}>
                {t('common.filter')}
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">{t('common.filter')}</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label={t('appointments.status.label')}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    className="flex mt-4"
                                    {...field}
                                >
                                    {statusList.map((status) => (
                                        <Checkbox
                                            key={status.value}
                                            name={field.name}
                                            value={status.value}
                                            className="justify-between flex-row-reverse heading-text"
                                        >
                                            {status.label}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('properties.propertyType')}>
                        <Controller
                            name="propertyType"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    className="flex mt-4"
                                    {...field}
                                >
                                    {propertyTypeList.map((type) => (
                                        <Checkbox
                                            key={type.value}
                                            name={field.name}
                                            value={type.value}
                                            className="justify-between flex-row-reverse heading-text"
                                        >
                                            {type.label}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('appointments.dateRange')}>
                        <Controller
                            name="dateRange"
                            control={control}
                            render={({ field }) => (
                                <DatePicker.DatePickerRange 
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </FormItem>
                    <div className="flex justify-end items-center gap-2 mt-4">
                        <Button type="button" onClick={() => reset()}>
                            {t('common.reset')}
                        </Button>
                        <Button type="submit" variant="solid">
                            {t('common.apply')}
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}

export default AppointmentListTableFilter
