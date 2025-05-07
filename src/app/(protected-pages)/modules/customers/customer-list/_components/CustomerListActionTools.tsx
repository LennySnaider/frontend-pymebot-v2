/**
 * frontend/src/app/(protected-pages)/modules/customers/customer-list/_components/CustomerListActionTools.tsx
 * Componente cliente para gestionar acciones sobre la lista de clientes con soporte i18n.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import Button from '@/components/ui/Button'
import { TbCloudDownload, TbUserPlus } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { useCustomerListStore } from '../_store/customerListStore'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

const CSVLink = dynamic(() => import('react-csv').then((mod) => mod.CSVLink), {
    ssr: false,
})

const CustomerListActionTools = () => {
    const router = useRouter()
    // Usar hook de internacionalización para componentes cliente
    const t = useTranslations()

    const customerList = useCustomerListStore((state) => state.customerList)

    return (
        <div className="flex flex-col md:flex-row gap-3">
            <CSVLink
                className="w-full"
                filename="customerList.csv"
                data={customerList}
            >
                <Button
                    icon={<TbCloudDownload className="text-xl" />}
                    className="w-full"
                >
                    {t('common.download')}
                </Button>
            </CSVLink>
            <Button
                variant="solid"
                icon={<TbUserPlus className="text-xl" />}
                onClick={() =>
                    router.push('/modules/customers/customer-create')
                }
            >
                {t('customers.addNew')}
            </Button>
        </div>
    )
}

export default CustomerListActionTools
