/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/SalesFunnelHeader.tsx
 * Encabezado del funnel de ventas inmobiliario con información del estado.
 * La búsqueda y el botón de añadir prospecto se movieron a FunnelViewSwitcher.
 *
 * @version 2.0.0
 * @updated 2025-04-29
 */

'use client'

import { useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import { useMemo } from 'react'

const SalesFunnelHeader = () => {
    // Utilizamos t como función de traducción para el namespace "scrumboard"
    const t = useTranslations('salesFunnel')

    // Obtener las columnas del store
    const { columns } = useSalesFunnelStore()

    // Calcular el número total de leads
    const leadCount = useMemo(() => {
        let count = 0
        // Sumar los leads de todas las columnas
        Object.values(columns).forEach((columnLeads) => {
            count += columnLeads.length
        })
        return count
    }, [columns])

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2">
                <h4>
                    {t('header.title', {
                        defaultValue: 'Embudo de Ventas',
                    })}
                </h4>
                <Badge className="bg-blue-100 text-blue-600 rounded-full px-2 py-1 text-xs font-semibold">
                    {leadCount} {leadCount === 1 ? 'lead' : 'leads'}
                </Badge>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {t('header.subtitle', {
                    defaultValue: 'Gestiona tus prospectos de manera eficiente',
                })}
            </p>
        </div>
    )
}

export default SalesFunnelHeader
