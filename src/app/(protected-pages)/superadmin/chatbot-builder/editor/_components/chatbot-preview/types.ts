/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/chatbot-preview/types.ts
 * Tipos e interfaces para el componente ChatbotPreview
 * @version 1.0.0
 * @updated 2025-04-14
 */

import { Node, Edge } from 'reactflow'

// Props del componente principal
export interface ChatbotPreviewProps {
  nodes: Node[]
  edges: Edge[]
  onClose: () => void
}

// Tipo de mensaje para la conversación
export interface MessageType {
  content: string
  senderId: 'user' | 'agent' | 'system'
  timestamp: string
  hasAudio?: boolean
  voiceStatusText?: string
}

// Contexto del chatbot
export interface ChatbotContext {
  variables: Record<string, string | number | boolean>
  currentNodeId: string | null
  processedNodes: Set<string>
}

// Props para el componente ChatbotHeader
export interface ChatbotHeaderProps {
  isVoiceBot: boolean
  ttsEnabled: boolean
  toggleTTS: () => void
  onClose: () => void
}

// Props para el componente ChatbotInput
export interface ChatbotInputProps {
  isVoiceBot: boolean
  isExpectingInput: boolean
  isExpectingVoiceInput: boolean
  inputValue: string
  setInputValue: (value: string) => void
  handleSendMessage: () => void
  micPermissionGranted: boolean
}

// Props para el componente AudioRecorder
export interface AudioRecorderProps {
  isExpectingVoiceInput: boolean
  micPermissionGranted: boolean
  isRecording: boolean
  recordingDuration: number
  maxRecordingDuration: number
  analyserNode: AnalyserNode | null
  errorMessage: string | null
  startRecording: () => void
  stopRecording: () => void
}

// Props para el componente StatusIndicator
export interface StatusIndicatorProps {
  isExpectingInput: boolean
  isExpectingVoiceInput: boolean
  currentNodeId: string | null
  isSpeaking: boolean
}
