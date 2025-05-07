/**
 * frontend/src/app/(protected-pages)/modules/chatbot/monitoring/page.tsx
 * Página de monitoreo del chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

'use client'

import ChatbotMonitoring from '@/components/view/ChatbotBuilder/ChatbotMonitoring'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { useTranslation } from '@/utils/hooks/useTranslation'

const ChatbotMonitoringPage = () => {
    const { t } = useTranslation()

    return (
        <AdaptiveCard
            className="h-full"
            bodyClass="h-full"
            header={{
                content: <h4>Panel de monitoreo del chatbot</h4>,
                extra: <span></span>
            }}
        >
            <div className="lg:flex h-full">
                <div className="w-full">
                    <ChatbotMonitoring />
                </div>
            </div>
        </AdaptiveCard>
    )
}

export default ChatbotMonitoringPage