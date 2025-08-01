'use client'

import { Form, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useScrumBoardStore } from '../_store/scrumBoardStore'
import { useTranslations } from 'next-intl'
import sleep from '@/utils/sleep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import cloneDeep from 'lodash/cloneDeep'
import { createCardObject } from '../utils'

const validationSchema = z.object({
    title: z.string().min(1, 'Title is required'),
})

type FormSchema = z.infer<typeof validationSchema>

/**
 * Componente para añadir una nueva tarjeta al tablero
 *
 * @version 1.0.0
 * @updated 2025-03-25
 */
const AddNewTicketContent = () => {
    const t = useTranslations('scrumboard')
    const tCommon = useTranslations('common')
    
    // Recrear el schema con las traducciones disponibles
    const validationSchemaWithTranslations = z.object({
        title: z.string().min(1, t('tickets.validation.titleRequired')),
    })

    const { columns, board, closeDialog, updateColumns, setSelectedBoard } =
        useScrumBoardStore()

    const {
        control,
        formState: { errors },
        handleSubmit,
    } = useForm<FormSchema>({
        defaultValues: {
            title: '',
        },
        resolver: zodResolver(validationSchemaWithTranslations),
    })

    const onFormSubmit = async ({ title }: FormSchema) => {
        const data = columns
        const newCard = createCardObject()
        newCard.name = title ? title : t('tickets.untitledCard')

        const newData = cloneDeep(data)
        newData[board].push(newCard)
        updateColumns(newData)
        closeDialog()
        await sleep(1000)
        setSelectedBoard('')
    }

    return (
        <div>
            <h5>{t('tickets.addNewTicket')}</h5>
            <div className="mt-8">
                <Form layout="inline" onSubmit={handleSubmit(onFormSubmit)}>
                    <FormItem
                        label={t('tickets.titleLabel')}
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

export default AddNewTicketContent
