import Avatar from '@/components/ui/Avatar'
import Attachment from './Attachment'
import classNames from '@/utils/classNames'
import { TbUser, TbRobot } from 'react-icons/tb'
import type { ReactNode } from 'react'

export type MessageProps = {
    id: string
    sender: {
        id: string
        name: string
        avatarImageUrl?: string
    }
    content?: string | ReactNode
    timestamp?: Date | number
    type: 'regular' | 'reply' | 'deleted' | 'divider'
    attachments?: Array<{
        type: 'image' | 'video' | 'audio' | 'misc'
        source: File
        mediaUrl: string
    }>
    showAvatar?: boolean
    isMyMessage?: boolean
    avatarGap?: boolean
    bubbleClass?: string
    customRenderer?: () => string | ReactNode
    customAction?: () => string | ReactNode
    buttons?: Array<{
        body: string
        id?: string
    }>
    onButtonClick?: (buttonText: string) => void
    listItems?: Array<{
        text: string
        description?: string
        value: string
    }>
    listTitle?: string
    onListItemClick?: (value: string, text: string) => void
}

const Message = (props: MessageProps) => {
    const {
        attachments,
        content,
        showAvatar = true,
        avatarGap,
        isMyMessage,
        sender,
        type,
        customRenderer,
        customAction,
        bubbleClass,
        buttons,
        onButtonClick,
        listItems,
        listTitle,
        onListItemClick,
    } = props

    // Determine the avatar icon based on whether it's the user's message
    // Use TbUser for user messages and TbRobot for bot messages
    const avatarIcon = isMyMessage ? <TbUser /> : <TbRobot />

    return (
        <>
            {type === 'divider' ? (
                <></>
            ) : (
                <div
                    className={classNames('flex', isMyMessage && 'justify-end')}
                >
                    <div className="flex flex-col">
                        <div
                            className={classNames(
                                'inline-flex items-end gap-2',
                                isMyMessage && 'justify-end flex-row-reverse',
                            )}
                        >
                            {showAvatar && (
                                <div className={classNames('w-[35px]')}>
                                    {avatarGap && (
                                        <Avatar
                                            icon={avatarIcon} // Use icon instead of image
                                            size={35}
                                        />
                                    )}
                                </div>
                            )}
                            <div
                                className={classNames(
                                    'bubble flex flex-col justify-center h-full max-w-[750px] rounded-xl px-5 py-2.5 bg-gray-100 dark:bg-gray-700 prose text-sm text-gray-900 dark:text-gray-100',
                                    bubbleClass,
                                )}
                            >
                                {customRenderer ? (
                                    customRenderer()
                                ) : (
                                    <>
                                        {attachments &&
                                            attachments?.length > 0 && (
                                                <Attachment
                                                    attachments={attachments}
                                                />
                                            )}
                                        <div>{content}</div>
                                        {buttons && buttons.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {buttons.map((button, index) => (
                                                    <button
                                                        key={button.id || index}
                                                        className="px-4 py-2 bg-primary hover:bg-primary-mild text-white dark:text-gray-900 rounded-lg transition-colors cursor-pointer text-sm font-medium border border-transparent hover:border-primary-mild"
                                                        onClick={() => {
                                                            console.log('Botón presionado:', button.body);
                                                            if (onButtonClick) {
                                                                onButtonClick(button.body);
                                                            }
                                                        }}
                                                    >
                                                        {button.body}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {listItems && listItems.length > 0 && (
                                            <div className="mt-3">
                                                {listTitle && (
                                                    <div className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                                                        {listTitle}
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    {listItems.map((item, index) => (
                                                        <div
                                                            key={item.value || index}
                                                            className="flex items-center p-3 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                console.log('Item de lista seleccionado:', item.value, item.text);
                                                                if (onListItemClick) {
                                                                    onListItemClick(item.value, item.text);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium mr-3">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                    {item.text}
                                                                </div>
                                                                {item.description && (
                                                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        {customAction && (
                            <div>
                                <div
                                    className={classNames(
                                        'flex items-end gap-2',
                                        isMyMessage && ' flex-row-reverse',
                                    )}
                                >
                                    {showAvatar && avatarGap && (
                                        <div
                                            className={classNames('w-[35px]')}
                                        ></div>
                                    )}
                                    {customAction()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default Message
