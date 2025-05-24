export type ChatType = 'personal' | 'groups' | 'leads' | 'prospects'

export type Chat = {
    id: string
    name: string
    userId: string
    avatar: string
    unread: number
    time: number
    lastConversation: string
    muted: boolean
    chatType: ChatType
    groupId: string
    tenantId?: string
    metadata?: {
        stage?: string
        email?: string
        phone?: string
        lastActivity?: number
        lastLocalUpdate?: number
        [key: string]: any
    }
}

export type Message = {
    id: string
    sender: {
        id: string
        name: string
        avatarImageUrl: string
    }
    attachments?: Array<{
        type: 'image' | 'video' | 'audio' | 'misc'
        source: File
        mediaUrl: string
    }>
    content: string
    timestamp: number | Date
    type: 'regular' | 'reply' | 'deleted' | 'divider'
    isMyMessage: boolean
    showAvatar?: boolean
    buttons?: Array<{
        body: string
        id?: string
    }>
    listItems?: Array<{
        text: string
        description?: string
        value: string
    }>
    listTitle?: string
}

export type SelectedChat = {
    id?: string
    user?: {
        id: string
        name: string
        avatarImageUrl: string
    }
    muted?: boolean
    chatType?: ChatType
    members?: {
        id: string
        name: string
        avatarImageUrl: string
    }
    tenantId?: string // Tenant ID property
    stage?: string    // Etapa del lead (new, prospecting, qualification, etc.)
    name?: string     // Nombre del lead o chat para facilitar referencia
    avatar?: string   // Avatar URL para facilitar referencia
}

export type Messages = Message[]

export type Conversation = {
    id: string
    conversation: Messages
}

export type Conversations = Conversation[]

export type Chats = Chat[]

export type UserDetails = {
    id: string
    name: string
    email: string
    img: string
    role: string
    lastOnline: number
    status: string
    title: string
    personalInfo: {
        birthday: string
        phoneNumber: string
    }
    members: {
        id: string
        name: string
        img: string
        email: string
    }[]
}

export type GetConversationResponse = Conversation

export type GetContactsResponse = UserDetails[]

export type GetContactDetailResponse = {
    userDetails: UserDetails
    media: {
        images: {
            id: string
            url: string
            name: string
        }[]
        files: {
            id: string
            name: string
            fileType: string
            srcUrl: string
            size: number
        }[]
        links: {
            id: string
            favicon: string
            title: string
            description: string
            url: string
        }[]
    }
}
