/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-details/[id]/page.tsx
 * Página de detalles de un prospecto específico
 * 
 * @version 1.0.0
 * @updated 2025-07-04
 */

import LeadDetails from './_components/LeadDetails'
import NoUserFound from '@/assets/svg/NoUserFound'
import getLead from '@/server/actions/getLead'
import isEmpty from 'lodash/isEmpty'
import { getTranslations } from 'next-intl/server'

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const t = await getTranslations()

    // Obtener datos del prospecto (lead)
    const data = await getLead(params)

    if (isEmpty(data)) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <NoUserFound height={280} width={280} />
                <h2 className="mt-4">{t('common.noData')}</h2>
            </div>
        )
    }

    return <LeadDetails data={data} />
}
