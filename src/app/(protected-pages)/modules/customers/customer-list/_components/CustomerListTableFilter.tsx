/**
 * frontend/src/app/(protected-pages)/modules/customers/customer-list/_components/CustomerListTableFilter.tsx
 * Componente cliente para filtros de tabla de clientes con soporte i18n.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { useCustomerListStore } from '../_store/customerListStore'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import { TbFilter } from 'react-icons/tb'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import { useTranslations } from 'next-intl'

type FormSchema = {
    purchasedProducts: string
    purchaseChannel: Array<string>
}

const validationSchema = z.object({
    purchasedProducts: z.string(),
    purchaseChannel: z.array(z.string()),
}) as ZodType<FormSchema>

const CustomerListTableFilter = () => {
    const [dialogIsOpen, setIsOpen] = useState(false)
    const t = useTranslations()

    // Canales con traducciones
    const channelList = [
        t('customers.channels.retail'),
        t('customers.channels.online'),
        t('customers.channels.resellers'),
        t('customers.channels.mobile'),
        t('customers.channels.direct'),
    ]

    const filterData = useCustomerListStore((state) => state.filterData)
    const setFilterData = useCustomerListStore((state) => state.setFilterData)

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
            purchasedProducts: values.purchasedProducts,
            purchaseChannel: values.purchaseChannel.join(','),
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
                    <FormItem label={t('customers.products')}>
                        <Controller
                            name="purchasedProducts"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder={t('customers.searchByProduct')}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label={t('customers.purchaseChannel')}>
                        <Controller
                            name="purchaseChannel"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    className="flex mt-4"
                                    {...field}
                                >
                                    {channelList.map((source, index) => (
                                        <Checkbox
                                            key={source + index}
                                            name={field.name}
                                            value={source}
                                            className="justify-between flex-row-reverse heading-text"
                                        >
                                            {source}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
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

export default CustomerListTableFilter
