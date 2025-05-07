import SalesFunnelProvider from './_components/SalesFunnelProvider'
import SalesFunnel from './_components/SalesFunnel'
import getSalesFunnelDataWithAgents from '@/server/actions/getSalesFunnelDataWithAgents'
import getSrcumboardMembers from '@/server/actions/getSrcumboardMembers'
import { getTranslations } from 'next-intl/server'

/**
 * Página principal del embudo de ventas inmobiliario
 * Obtiene datos del servidor y renderiza el embudo.
 * Actualizada para usar la versión con datos de agentes incluidos.
 *
 * @version 2.1.0
 * @updated 2025-04-15
 */
export default async function Page() {
    const data = await getSalesFunnelDataWithAgents()
    const members = await getSrcumboardMembers()

    // Adaptamos la estructura antigua a la nueva
    const salesTeam = {
        activeAgents: members.participantMembers,
        allAgents: members.allMembers,
    }

    await getTranslations(['salesFunnel', 'common']) // Precargar traducciones

    return (
        <SalesFunnelProvider data={data} salesTeam={salesTeam}>
            <SalesFunnel />
        </SalesFunnelProvider>
    )
}
