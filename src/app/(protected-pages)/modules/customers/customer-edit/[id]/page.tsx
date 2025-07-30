import CustomerEdit from './_components/CustomerEdit'
import NoUserFound from '@/assets/svg/NoUserFound'
import getCustomer from '@/server/actions/getCustomer'
import isEmpty from 'lodash/isEmpty'
import { getTranslations } from 'next-intl/server'

/**
 * Página para editar cliente que obtiene datos del servidor
 * y renderiza el formulario o mensaje de error
 *
 * @version 1.0.0
 * @updated 2025-03-25
 */
export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    // Obtener traducciones del servidor utilizando la estructura exacta del archivo JSON
    const t = await getTranslations('customers')

    const data = await getCustomer(params)

    if (isEmpty(data)) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <NoUserFound height={280} width={280} />
                <h2 className="mt-4">{t('noCustomerFound')}</h2>
            </div>
        )
    }

    return <CustomerEdit data={data as any} />
}
