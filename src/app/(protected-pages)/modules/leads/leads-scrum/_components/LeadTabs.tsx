// frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadTabs.tsx
import Tabs from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'
import CommentSection from './CommentSection'
import AttachmentSection from './AttachmentSection'
import { Lead } from './types'
import type { TabsProps } from '@/components/ui/tabs'

interface LeadTabsProps {
    leadData: Lead
    mode: 'view' | 'edit'
    updateLead: (lead: Lead) => void
}

const LeadTabs = ({ leadData, mode, updateLead }: LeadTabsProps) => {
    const tBase = useTranslations('salesFunnel')

    const text = (key: string) => {
        try {
            const defaultText =
                key
                    .split('.')
                    .pop()
                    ?.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase()) || key
            return tBase(key) || defaultText
        } catch (e) {
            return (
                key
                    .split('.')
                    .pop()
                    ?.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase()) || key
            )
        }
    }

    const tabItems: TabsProps['items'] = [
        {
            key: 'comments',
            label: text('leads.lead.tabs.comments'),
            count: leadData?.comments?.length || 0,
            component: (
                <CommentSection leadData={leadData} updateLead={updateLead} />
            ),
        },
        {
            key: 'attachments',
            label: text('leads.lead.tabs.attachments'),
            count: leadData?.attachments?.length || 0,
            component: (
                <AttachmentSection
                    leadData={leadData}
                    mode={mode}
                    updateLead={updateLead}
                />
            ),
        },
    ]

    return <Tabs items={tabItems} />
}

export default LeadTabs
