/**
 * frontend/src/app/(protected-pages)/modules/customers/customer-list/_components/CustomersListTableTools.tsx
 * Componente cliente para herramientas de filtrado y búsqueda de clientes con soporte i18n.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import CustomerListSearch from './CustomerListSearch'
import CustomerTableFilter from './CustomerListTableFilter'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'

const CustomersListTableTools = () => {
    const { onAppendQueryParams } = useAppendQueryParams()

    const handleInputChange = (query: string) => {
        onAppendQueryParams({
            query,
        })
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <CustomerListSearch onInputChange={handleInputChange} />
            <CustomerTableFilter />
        </div>
    )
}

export default CustomersListTableTools
