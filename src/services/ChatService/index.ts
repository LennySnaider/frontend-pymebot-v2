/**
 * frontend/src/services/ChatService/index.ts
 * Exportaciones centralizadas para servicios de API de chat
 * @version 2.1.0
 * @updated 2025-04-26
 */

import apiGetConversation from './apiGetConversation'
import apiMarkAsRead from './apiMarkAsRead'
import apiSendMessage from './apiSendMessage'
import apiToggleMuteChat from './apiToggleMuteChat'
import apiGetContactDetails from './apiGetContactDetails'
import apiSendChatMessage from './apiSendChatMessage'
import apiFetchConversations from './apiFetchConversations'
import apiFetchChatHistory from './apiFetchChatHistory'
import apiClearChatHistory from './apiClearChatHistory'
import apiGetChatTemplates from './apiGetChatTemplates'
import apiSetActiveTemplate from './apiSetActiveTemplate'
import { getOrCreateSessionId, getOrCreateUserId } from './utils'

// Re-exportar todas las funciones API
export {
    // Funciones API originales
    apiGetConversation,
    apiMarkAsRead,
    apiSendMessage,
    apiToggleMuteChat,
    apiGetContactDetails,
    
    // Nuevas funciones API para chat de texto
    apiSendChatMessage,
    apiFetchConversations,
    apiFetchChatHistory,
    apiClearChatHistory,
    
    // Funciones para plantillas de chatbot
    apiGetChatTemplates,
    apiSetActiveTemplate,
    
    // Utilidades
    getOrCreateSessionId,
    getOrCreateUserId
}

// Para compatibilidad con código existente
export const sendChatMessage = apiSendChatMessage
export const fetchConversations = apiFetchConversations
export const fetchChatHistory = apiFetchChatHistory
export const clearChatHistory = apiClearChatHistory
export const getChatTemplates = apiGetChatTemplates
export const setActiveTemplate = apiSetActiveTemplate
