/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/page.tsx
 * Página principal del componente de chat con selector de plantillas
 * @version 2.3.0
 * @updated 2025-09-05
 */

// Configuración para evitar errores de SSR
export const runtime = 'edge'

import Card from '@/components/ui/Card'
import ChatProvider from './_components/ChatProvider'
import ChatSidebar from './_components/ChatSidebar'
import ChatBody from './_components/ChatBody'
import ContactInfoDrawer from './_components/ContactInfoDrawer'
import ClientChatHeader from './_components/ClientChatHeader'
import getChatListFromLeads from '@/server/actions/getChatListFromLeads'
import { auth } from '@/auth'

export default async function Page() {
    // Obtener la sesión actual para tener acceso al tenant_id
    const session = await auth()
    console.log('SESSION EN CHAT PAGE:', session?.user)

    // Ahora usamos la nueva función para obtener chats a partir de leads reales
    const data = await getChatListFromLeads()

    return (
        <ChatProvider chats={data}>
            <Card className="h-full border-0" bodyClass="h-full flex flex-col">
                {/* Usando el componente cliente para el header */}
                <ClientChatHeader />
                
                <div className="flex flex-auto h-full gap-8">
                    <ChatSidebar />
                    <ChatBody />
                </div>
            </Card>
            <ContactInfoDrawer />
        </ChatProvider>
    )
}