import ClientSalesFunnelProvider from './_components/ClientSalesFunnelProvider'
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
    
    // Debug: Log los datos que se están pasando
    console.log('Page: Datos que se pasan al provider:')
    console.log('Page: data keys:', Object.keys(data))
    console.log('Page: data new:', data.new?.length || 0, 'leads')
    console.log('Page: data prospecting:', data.prospecting?.length || 0, 'leads')
    console.log('Page: data qualification:', data.qualification?.length || 0, 'leads')
    console.log('Page: data opportunity:', data.opportunity?.length || 0, 'leads')
    console.log('Page: salesTeam activeAgents:', salesTeam.activeAgents?.length || 0)
    console.log('Page: salesTeam allAgents:', salesTeam.allAgents?.length || 0)

    return (
        <ClientSalesFunnelProvider data={data} salesTeam={salesTeam}>
            <SalesFunnel />
        </ClientSalesFunnelProvider>
    )
}
