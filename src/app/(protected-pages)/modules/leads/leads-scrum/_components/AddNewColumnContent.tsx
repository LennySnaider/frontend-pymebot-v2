'use client'

import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import { useTranslations } from 'next-intl'
import sleep from '@/utils/sleep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import cloneDeep from 'lodash/cloneDeep'
import type { ZodType } from 'zod'
import type { Columns } from '../types'

type FormSchema = {
    title: string
}

/**
 * Componente para añadir una nueva columna al tablero
 *
 * @version 1.0.0
 * @updated 2025-03-25
 */
const AddNewColumnContent = () => {
    const t = useTranslations('scrumboard')
    const tCommon = useTranslations('common')

    const validationSchema: ZodType<FormSchema> = z.object({
        title: z.string().min(1, t('columns.validation.titleRequired')),
    })

    const {
        columns,
        ordered,
        closeDialog,
        updateColumns,
        resetView,
        updateOrdered,
    } = useSalesFunnelStore()

    const {
        control,
        formState: { errors },
        handleSubmit,
    } = useForm<FormSchema>({
        defaultValues: {
            title: '',
        },
        resolver: zodResolver(validationSchema),
    })

    const onFormSubmit = async ({ title }: FormSchema) => {
        const data = cloneDeep(columns)
        data[title ? title : t('columns.untitledBoard')] = []
        const newOrdered = [
            ...ordered,
            ...[title ? title : t('columns.untitledBoard')],
        ]
        const newColumns: Columns = {}

        newOrdered.forEach((elm) => {
            newColumns[elm] = data[elm]
        })

        updateColumns(newColumns)
        updateOrdered(newOrdered)
        closeDialog()
        await sleep(500)
        resetView()
    }

    return (
        <div>
            <h5>{t('columns.addNewColumn')}</h5>
            <div className="mt-8">
                <Form layout="inline" onSubmit={handleSubmit(onFormSubmit)}>
                    <FormItem
                        label={t('columns.titleLabel')}
                        invalid={Boolean(errors.title)}
                        errorMessage={errors.title?.message}
                    >
                        <Controller
                            name="title"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem>
                        <Button variant="solid" type="submit">
                            {tCommon('add')}
                        </Button>
                    </FormItem>
                </Form>
            </div>
        </div>
    )
}

export default AddNewColumnContent
