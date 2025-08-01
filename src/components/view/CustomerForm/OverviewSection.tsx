/**
 * frontend/src/components/view/CustomerForm/OverviewSection.tsx
 * Sección de información general del cliente con soporte para internacionalización.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select, { Option as DefaultOption } from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import { FormItem } from '@/components/ui/Form'
import NumericInput from '@/components/shared/NumericInput'
import { countryList } from '@/constants/countries.constant'
import { Controller } from 'react-hook-form'
import { components } from 'react-select'
import { useTranslations } from 'next-intl'
import type { FormSectionBaseProps } from './types'
import type { ControlProps, OptionProps } from 'react-select'

type OverviewSectionProps = FormSectionBaseProps

type CountryOption = {
    label: string
    dialCode: string
    value: string
}

const { Control } = components

const CustomSelectOption = (props: OptionProps<CountryOption>) => {
    return (
        <DefaultOption<CountryOption>
            {...props}
            customLabel={(data) => (
                <span className="flex items-center gap-2">
                    <Avatar
                        shape="circle"
                        size={20}
                        src={`/img/countries/${data.value}.png`}
                    />
                    <span>{data.dialCode}</span>
                </span>
            )}
        />
    )
}

const CustomControl = ({ children, ...props }: ControlProps<CountryOption>) => {
    const selected = props.getValue()[0]
    return (
        <Control {...props}>
            {selected && (
                <Avatar
                    className="ltr:ml-4 rtl:mr-4"
                    shape="circle"
                    size={20}
                    src={`/img/countries/${selected.value}.png`}
                />
            )}
            {children}
        </Control>
    )
}

const OverviewSection = ({ control, errors }: OverviewSectionProps) => {
    const t = useTranslations()

    const dialCodeList = useMemo(() => {
        const newCountryList: Array<CountryOption> = JSON.parse(
            JSON.stringify(countryList),
        )

        return newCountryList.map((country) => {
            country.label = country.dialCode
            return country
        })
    }, [])

    return (
        <Card>
            <h4 className="mb-6">{t('customers.form.overview')}</h4>
            <div className="grid md:grid-cols-2 gap-4">
                <FormItem
                    label={t('customers.form.firstName')}
                    invalid={Boolean(errors.firstName)}
                    errorMessage={errors.firstName?.message}
                >
                    <Controller
                        name="firstName"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder={t('customers.form.firstName')}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label={t('customers.form.lastName')}
                    invalid={Boolean(errors.lastName)}
                    errorMessage={errors.lastName?.message}
                >
                    <Controller
                        name="lastName"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder={t('customers.form.lastName')}
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
            <FormItem
                label={t('customers.form.email')}
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
                            placeholder={t('customers.form.email')}
                            {...field}
                        />
                    )}
                />
            </FormItem>
            <div className="flex items-end gap-4 w-full">
                <FormItem
                    invalid={
                        Boolean(errors.phoneNumber) || Boolean(errors.dialCode)
                    }
                >
                    <label className="form-label mb-2">
                        {t('customers.form.phoneNumber')}
                    </label>
                    <Controller
                        name="dialCode"
                        control={control}
                        render={({ field }) => (
                            <Select<CountryOption>
                                instanceId="dial-code"
                                options={dialCodeList}
                                {...field}
                                className="w-[150px]"
                                components={{
                                    Option: CustomSelectOption,
                                    Control: CustomControl,
                                }}
                                placeholder=""
                                value={dialCodeList.filter(
                                    (option) => option.dialCode === field.value,
                                )}
                                onChange={(option) =>
                                    field.onChange(option?.dialCode)
                                }
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    className="w-full"
                    invalid={
                        Boolean(errors.phoneNumber) || Boolean(errors.dialCode)
                    }
                    errorMessage={errors.phoneNumber?.message}
                >
                    <Controller
                        name="phoneNumber"
                        control={control}
                        render={({ field }) => (
                            <NumericInput
                                autoComplete="off"
                                placeholder={t('customers.form.phoneNumber')}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default OverviewSection
