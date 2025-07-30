'use client'

import { useRef } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import { useChatStore } from '../_store/chatStore'
import { useAuth } from '@/hooks/useAuth'
import {
    TbDotsVertical,
    TbBell,
    TbBellOff,
    TbShare3,
    TbTrash,
    TbUserPlus,
    TbUserExclamation,
    TbUserCheck,
    TbArrowsExchange,
} from 'react-icons/tb'
import type { DropdownRef } from '@/components/ui/Dropdown'

type ChatActionProps = {
    muted?: boolean;
    testAsLead?: boolean;
    onToggleTestMode?: () => void;
}

const ChatAction = ({ muted, testAsLead, onToggleTestMode }: ChatActionProps) => {
    const dropdownRef = useRef<DropdownRef>(null)
    
    // Usar el hook de autenticación principal
    const { isSuperAdmin, user, role } = useAuth()
    
    // Debug temporal
    console.log('[ChatAction] Debug:', {
        role,
        user,
        isSuperAdmin: isSuperAdmin(),
        userEmail: user?.email
    })
    
    const selectedChat = useChatStore((state) => state.selectedChat)
    const setSelectedChat = useChatStore((state) => state.setSelectedChat)
    const deleteConversationRecord = useChatStore(
        (state) => state.deleteConversationRecord,
    )
    const clearCurrentConversation = useChatStore((state) => state.clearCurrentConversation)
    const setChatMute = useChatStore((state) => state.setChatMute)

    const handleMute = () => {
        const nextMuted = !selectedChat.muted
        setSelectedChat({ ...selectedChat, muted: nextMuted })
        setChatMute({ id: selectedChat.id as string, muted: nextMuted })
    }

    const handleDelete = () => {
        if (confirm('¿Estás seguro de que quieres borrar toda la conversación? Esta acción no se puede deshacer.')) {
            clearCurrentConversation()
            // El dropdown se cierra automáticamente al hacer clic en un item
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Dropdown
                ref={dropdownRef}
                placement="bottom-end"
                renderTitle={
                    <button className="outline-hidden rounded-full p-2 text-xl bg-white dark:bg-gray-500 hover:bg-gray-200 dark:hover:bg-gray-400 hover:text-gray-800 dark:text-gray-200 dark:hover:text-gray-100">
                        <TbDotsVertical />
                    </button>
                }
            >
                <Dropdown.Item eventKey="mute" onClick={handleMute}>
                    <span className="text-lg">
                        {muted ? <TbBellOff /> : <TbBell />}
                    </span>
                    <span>{muted ? 'Unmute' : 'Mute'}</span>
                </Dropdown.Item>
                {/* Modo de prueba toggle - Agregado para super_admin */}
                <Dropdown.Item
                    eventKey="toggleTestMode"
                    onClick={() => onToggleTestMode && onToggleTestMode()}
                >
                    <span className="text-lg text-blue-500">
                        {testAsLead ? <TbUserCheck /> : <TbUserExclamation />}
                    </span>
                    <span className={testAsLead ? "text-blue-600 font-bold" : ""}>
                        {testAsLead ? "Modo Lead Activado" : "Activar Modo Lead"}
                    </span>
                </Dropdown.Item>

                {selectedChat.chatType === 'groups' ? (
                    <Dropdown.Item eventKey="inviteMember">
                        <span className="text-lg">
                            <TbUserPlus />
                        </span>
                        <span>Invite member</span>
                    </Dropdown.Item>
                ) : (
                    <Dropdown.Item eventKey="shareContact">
                        <span className="text-lg">
                            <TbShare3 />
                        </span>
                        <span>Share contact</span>
                    </Dropdown.Item>
                )}
                {isSuperAdmin() && (
                    <Dropdown.Item eventKey="delete" onClick={handleDelete}>
                        <span className="text-lg text-error">
                            <TbTrash />
                        </span>
                        <span className="text-error">Borrar conversación</span>
                    </Dropdown.Item>
                )}
            </Dropdown>
        </div>
    )
}

export default ChatAction
