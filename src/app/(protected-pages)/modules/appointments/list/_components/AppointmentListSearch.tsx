/**
 * frontend/src/app/(protected-pages)/modules/appointments/list/_components/AppointmentListSearch.tsx
 * Componente cliente para búsqueda de citas con soporte i18n.
 * @version 1.0.0
 * @updated 2025-06-30
 */

'use client'

import DebouceInput from '@/components/shared/DebouceInput'
import { TbSearch } from 'react-icons/tb'
import { Ref } from 'react'
import { useTranslations } from 'next-intl'

type AppointmentListSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}

const AppointmentListSearch = (props: AppointmentListSearchProps) => {
    const { onInputChange, ref } = props
    const t = useTranslations()

    return (
        <DebouceInput
            ref={ref}
            placeholder={t('appointments.quickSearch')}
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
}

export default AppointmentListSearch
