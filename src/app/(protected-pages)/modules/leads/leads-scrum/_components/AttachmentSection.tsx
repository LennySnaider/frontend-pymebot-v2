// frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/AttachmentSection.tsx
import Button from '@/components/ui/Button'
import { TbPlus } from 'react-icons/tb'
import { useTranslations } from 'next-intl'
import AttachmentDisplay from './AttachmentDisplay'
import { Lead, SimpleAttachment } from './types'

interface AttachmentSectionProps {
    leadData: Lead
    mode: 'view' | 'edit'
    updateLead: (lead: Lead) => void
}

const AttachmentSection = ({
    leadData,
    mode,
    updateLead,
}: AttachmentSectionProps) => {
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
        } catch {
            return (
                key
                    .split('.')
                    .pop()
                    ?.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase()) || key
            )
        }
    }

    const handleDeleteAttachment = (attachmentId: string) => {
        if (!leadData) return

        const updatedAttachments =
            leadData.attachments?.filter(
                (attachment) => attachment.id !== attachmentId,
            ) || []

        const updatedLead = {
            ...leadData,
            attachments: updatedAttachments,
        }
        updateLead(updatedLead)
    }

    return (
        <div className="p-6">
            {leadData.attachments && leadData.attachments.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {leadData.attachments.map(
                        (attachment: SimpleAttachment) => (
                            <AttachmentDisplay
                                key={attachment.id}
                                attachment={attachment}
                                onDelete={handleDeleteAttachment}
                            />
                        ),
                    )}
                </div>
            ) : (
                <div className="text-center p-4 text-gray-500">
                    {text('leads.lead.noAttachments')}
                </div>
            )}
            {mode === 'edit' && (
                <div className="mt-4">
                    <Button
                        type="button"
                        variant="default"
                        icon={<TbPlus />}
                        onClick={() => {
                            console.log('Añadir archivo adjunto')
                            const fileInput = document.createElement('input')
                            fileInput.type = 'file'
                            fileInput.accept = 'image/*,.pdf'
                            fileInput.click()
                        }}
                    >
                        {text('leads.lead.addAttachment')}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default AttachmentSection
