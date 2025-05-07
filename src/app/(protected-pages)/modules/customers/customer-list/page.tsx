/**
 * frontend/src/app/(protected-pages)/modules/customers/customer-list/page.tsx
 * Página principal de listado de clientes con soporte de internacionalización
 * utilizando getTranslations para componentes asíncronos.
 * @version 1.0.0
 * @updated 2025-04-01
 */

import { getTranslations } from 'next-intl/server'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import CustomerListProvider from './_components/CustomerListProvider'
import CustomerListTable from './_components/CustomerListTable'
import CustomerListActionTools from './_components/CustomerListActionTools'
import CustomersListTableTools from './_components/CustomersListTableTools'
import CustomerListSelected from './_components/CustomerListSelected'
import getCustomers from '@/server/actions/getCustomers'
import type { PageProps } from '@/@types/common'

export default async function Page({ searchParams }: PageProps) {
    // Usar getTranslations en lugar de useTranslations para componentes asíncronos
    const t = await getTranslations()
    const params = await searchParams
    const data = await getCustomers(params)

    return (
        <CustomerListProvider customerList={data.list}>
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h3>{t('nav.conceptsCRM.customerList')}</h3>
                            <CustomerListActionTools />
                        </div>
                        <CustomersListTableTools />
                        <CustomerListTable
                            customerListTotal={data.total}
                            pageIndex={
                                parseInt(params.pageIndex as string) || 1
                            }
                            pageSize={parseInt(params.pageSize as string) || 10}
                        />
                    </div>
                </AdaptiveCard>
            </Container>
            <CustomerListSelected />
        </CustomerListProvider>
    )
}
