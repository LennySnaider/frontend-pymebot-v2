/**
 * frontend/src/components/view/CustomerForm/TagsSection.tsx
 * Sección de etiquetas del cliente con soporte para internacionalización.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { Controller } from 'react-hook-form'
import CreatableSelect from 'react-select/creatable'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import type { FormSectionBaseProps } from './types'

type TagsSectionProps = FormSectionBaseProps

const TagsSection = ({ control }: TagsSectionProps) => {
    const t = useTranslations()

    const defaultOptions = useMemo(
        () => [
            {
                value: 'frequentShoppers',
                label: t('customers.tags.frequentShoppers'),
            },
            { value: 'inactiveCustomers', label: t('customers.tags.inactive') },
            { value: 'newCustomers', label: t('customers.tags.new') },
        ],
        [t],
    )

    return (
        <Card>
            <h4 className="mb-2">{t('customers.form.customerTags')}</h4>
            <div className="mt-6">
                <Controller
                    name="tags"
                    control={control}
                    render={({ field }) => (
                        <Select
                            isMulti
                            isClearable
                            instanceId="tags"
                            placeholder={t('customers.form.tagsPlaceholder')}
                            componentAs={CreatableSelect}
                            options={defaultOptions}
                            onChange={(option) => field.onChange(option)}
                        />
                    )}
                />
            </div>
        </Card>
    )
}

export default TagsSection
