/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/SalesFunnelProvider.tsx
 * Proveedor de contexto para el funnel de ventas inmobiliario.
 * Inicializa y proporciona el estado global para el funnel.
 *
 * @version 3.0.0
 * @updated 2025-04-12
 */

'use client'

import { ReactNode, useEffect } from 'react'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import type { Lead, SalesTeam } from '../types'

interface SalesFunnelProviderProps {
    children: ReactNode
    data: Record<string, Lead[]>
    salesTeam: SalesTeam
}

/**
 * Proveedor de contexto que inicializa el estado del funnel de ventas
 * con los datos de leads y miembros del equipo
 */
const SalesFunnelProvider = ({
    children,
    data,
    salesTeam,
}: SalesFunnelProviderProps) => {
    // Acceder a las acciones del store
    const {
        updateColumns,
        updateOrdered,
        updateBoardMembers,
        updateAllMembers,
    } = useSalesFunnelStore()

    // Inicializar el estado cuando el componente se monta
    useEffect(() => {
        if (data) {
            // Inicializar columnas con los datos proporcionados
            updateColumns(data)

            // Establecer el orden de las columnas (por defecto o predefinido)
            const defaultOrder = [
                'new',
                'prospecting',
                'qualification',
                'opportunity'
            ]

            // Usar el orden de las claves proporcionadas o el orden predeterminado
            const orderedColumns =
                Object.keys(data).length > 0
                    ? Object.keys(data)
                    : defaultOrder.filter((key) => data[key])

            updateOrdered(orderedColumns)
        }

        // Inicializar miembros del equipo
        if (salesTeam) {
            updateBoardMembers(salesTeam.activeAgents || [])
            updateAllMembers(salesTeam.allAgents || [])
        }
    }, [
        data,
        salesTeam,
        updateColumns,
        updateOrdered,
        updateBoardMembers,
        updateAllMembers,
    ])

    return <>{children}</>
}

export default SalesFunnelProvider
