/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/ClientChatHeader.tsx
 * Componente cliente que carga ChatHeader dinámicamente
 * @version 1.0.0
 * @updated 2025-04-26
 */

'use client'

import dynamic from 'next/dynamic'

// Cargamos el ChatHeader solo del lado del cliente
const ChatHeader = dynamic(() => import('./ChatHeader'), { ssr: false })

const ClientChatHeader = () => {
  return <ChatHeader />
}

export default ClientChatHeader
