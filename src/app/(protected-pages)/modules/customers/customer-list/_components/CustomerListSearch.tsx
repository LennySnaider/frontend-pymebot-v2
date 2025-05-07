/**
 * frontend/src/app/(protected-pages)/modules/customers/customer-list/_components/CustomerListSearch.tsx
 * Componente cliente para búsqueda de clientes con soporte i18n.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import DebouceInput from '@/components/shared/DebouceInput'
import { TbSearch } from 'react-icons/tb'
import { Ref } from 'react'
import { useTranslations } from 'next-intl'

type CustomerListSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}

const CustomerListSearch = (props: CustomerListSearchProps) => {
    const { onInputChange, ref } = props
    const t = useTranslations()

    return (
        <DebouceInput
            ref={ref}
            placeholder={t('customers.quickSearch')}
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
}

export default CustomerListSearch
