/**
 * ClientSalesFunnelProvider.tsx
 * Wrapper client-side para evitar errores de SSR con Zustand
 */

'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'
import type { Lead, SalesTeam } from '../types'

interface ClientSalesFunnelProviderProps {
    children: ReactNode
    data: Record<string, Lead[]>
    salesTeam: SalesTeam
}

// Importar el provider dinámicamente para evitar SSR
const SalesFunnelProvider = dynamic(
    () => import('./SalesFunnelProvider'),
    { 
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }
)

export default function ClientSalesFunnelProvider(props: ClientSalesFunnelProviderProps) {
    return <SalesFunnelProvider {...props} />
}