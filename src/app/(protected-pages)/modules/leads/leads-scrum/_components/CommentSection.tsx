// frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/CommentSection.tsx
import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { Comment, Lead } from './types'

interface CommentSectionProps {
    leadData: Lead
    updateLead: (lead: Lead) => void
}

const CommentSection = ({ leadData, updateLead }: CommentSectionProps) => {
    const tBase = useTranslations('salesFunnel')
    const [newComment, setNewComment] = useState('')

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

    const formatDate = (date: number | Date) => {
        const dateObj = typeof date === 'number' ? new Date(date) : date
        return dayjs(dateObj).format('DD MMM YYYY')
    }

    const handleCommentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (newComment.trim() === '' || !leadData) return

        const newComments: Comment[] = [
            ...(leadData.comments || []),
            {
                id: `comment-${Date.now()}`,
                name: 'Usuario actual',
                src: '/img/avatars/thumb-1.jpg',
                message: newComment,
                date: new Date(),
            },
        ]

        const updatedLead = { ...leadData, comments: newComments }
        updateLead(updatedLead)
        setNewComment('')
    }

    return (
        <div className="p-6">
            {leadData.comments && leadData.comments.length > 0 ? (
                <div className="mb-4">
                    {leadData.comments.map((comment) => (
                        <div key={comment.id} className="mb-4 last:mb-0">
                            <div className="flex items-center mb-2">
                                <Avatar src={comment.src} size={30} />
                                <div className="ml-2">
                                    <div className="font-semibold">
                                        {comment.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatDate(comment.date)}
                                    </div>
                                </div>
                            </div>
                            <div className="mb-4 ml-10">{comment.message}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-4 text-gray-500">
                    {text('leads.lead.noComments')}
                </div>
            )}
            <form onSubmit={handleCommentSubmit}>
                <div className="relative">
                    <Input
                        type="textarea"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 pr-20 focus:outline-none focus:ring focus:border-blue-500 text-sm dark:bg-gray-800"
                        rows={3}
                        placeholder={text('leads.lead.addComment')}
                        value={newComment}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setNewComment(e.target.value)
                        }
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="absolute right-3 bottom-3"
                        disabled={newComment.trim() === ''}
                    >
                        {text('leads.lead.submit')}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default CommentSection
