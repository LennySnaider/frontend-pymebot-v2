/**
 * frontend/src/components/view/CustomerForm/AccountSection.tsx
 * Sección de cuenta del cliente con soporte para internacionalización.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import Card from '@/components/ui/Card'
import Switcher from '@/components/ui/Switcher'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import type { FormSectionBaseProps } from './types'

type AccountSectionProps = FormSectionBaseProps

const AccountSection = ({ control }: AccountSectionProps) => {
    const t = useTranslations()

    return (
        <Card>
            <h4>{t('customers.form.account')}</h4>
            <div className="mt-6">
                <FormItem>
                    <Controller
                        name="banAccount"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center justify-between gap-8">
                                <div>
                                    <h6>{t('customers.form.banned')}</h6>
                                    <p>
                                        {t('customers.form.bannedDescription')}
                                    </p>
                                </div>
                                <Switcher
                                    checked={field.value}
                                    onChange={(checked) => {
                                        field.onChange(checked)
                                    }}
                                />
                            </div>
                        )}
                    />
                </FormItem>
                <FormItem className="mb-0">
                    <Controller
                        name="accountVerified"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center justify-between gap-8">
                                <div>
                                    <h6>
                                        {t('customers.form.accountVerified')}
                                    </h6>
                                    <p>
                                        {t(
                                            'customers.form.accountVerifiedDescription',
                                        )}
                                    </p>
                                </div>
                                <Switcher
                                    checked={field.value}
                                    onChange={(checked) => {
                                        field.onChange(checked)
                                    }}
                                />
                            </div>
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default AccountSection
