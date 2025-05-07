/**
 * frontend/src/app/(protected-pages)/modules/customers/customer-details/[id]/page.tsx
 * Página principal de detalles de cliente con soporte para internacionalización.
 * @version 1.0.0
 * @updated 2025-04-01
 */

import { getTranslations } from 'next-intl/server'
import CustomerDetails from './_components/CustomerDetails'
import NoUserFound from '@/assets/svg/NoUserFound'
import getCustomer from '@/server/actions/getCustomer'
import isEmpty from 'lodash/isEmpty'

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const t = await getTranslations()
    const params = await props.params

    const data = await getCustomer(params)

    if (isEmpty(data)) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <NoUserFound height={280} width={280} />
                <h2 className="mt-4">{t('customers.noCustomerFound')}</h2>
            </div>
        )
    }

    return <CustomerDetails data={data} />
}
