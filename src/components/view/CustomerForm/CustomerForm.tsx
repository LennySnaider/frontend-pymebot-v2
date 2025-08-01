/**
 * frontend/src/components/view/CustomerForm/CustomerForm.tsx
 * Componente principal de formulario de clientes con soporte para internacionalización.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import { useEffect } from 'react'
import { Form } from '@/components/ui/Form'
import Container from '@/components/shared/Container'
import BottomStickyBar from '@/components/template/BottomStickyBar'
import OverviewSection from './OverviewSection'
import AddressSection from './AddressSection'
import TagsSection from './TagsSection'
import ProfileImageSection from './ProfileImageSection'
import AccountSection from './AccountSection'
import isEmpty from 'lodash/isEmpty'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import type { CustomerFormSchema } from './types'
import { useTranslations } from 'next-intl'

type CustomerFormProps = {
    onFormSubmit: (values: CustomerFormSchema) => void
    defaultValues?: CustomerFormSchema
    newCustomer?: boolean
} & CommonProps

const CustomerForm = (props: CustomerFormProps) => {
    const {
        onFormSubmit,
        defaultValues = {},
        newCustomer = false,
        children,
    } = props

    const t = useTranslations()

    // Definimos el schema de validación con mensajes traducidos
    const validationSchema: ZodType<CustomerFormSchema> = z.object({
        firstName: z
            .string()
            .min(1, { message: t('customers.validation.firstNameRequired') }),
        lastName: z
            .string()
            .min(1, { message: t('customers.validation.lastNameRequired') }),
        email: z
            .string()
            .min(1, { message: t('customers.validation.emailRequired') })
            .email({ message: t('customers.validation.invalidEmail') }),
        dialCode: z
            .string()
            .min(1, { message: t('customers.validation.dialCodeRequired') }),
        phoneNumber: z
            .string()
            .min(1, { message: t('customers.validation.phoneNumberRequired') }),
        country: z
            .string()
            .min(1, { message: t('customers.validation.countryRequired') }),
        address: z
            .string()
            .min(1, { message: t('customers.validation.addressRequired') }),
        postcode: z
            .string()
            .min(1, { message: t('customers.validation.postcodeRequired') }),
        city: z
            .string()
            .min(1, { message: t('customers.validation.cityRequired') }),
        img: z.string(),
        tags: z.array(z.object({ value: z.string(), label: z.string() })),
    })

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<CustomerFormSchema>({
        defaultValues: {
            ...{
                banAccount: false,
                accountVerified: true,
            },
            ...defaultValues,
        },
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultValues)])

    const onSubmit = (values: CustomerFormSchema) => {
        onFormSubmit?.(values)
    }

    return (
        <Form
            className="flex w-full h-full"
            containerClassName="flex flex-col w-full justify-between"
            onSubmit={handleSubmit(onSubmit)}
        >
            <Container>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="gap-4 flex flex-col flex-auto">
                        <OverviewSection control={control} errors={errors} />
                        <AddressSection control={control} errors={errors} />
                    </div>
                    <div className="md:w-[370px] gap-4 flex flex-col">
                        <ProfileImageSection
                            control={control}
                            errors={errors}
                        />
                        <TagsSection control={control} errors={errors} />
                        {!newCustomer && (
                            <AccountSection control={control} errors={errors} />
                        )}
                    </div>
                </div>
            </Container>
            <BottomStickyBar>{children}</BottomStickyBar>
        </Form>
    )
}

export default CustomerForm
