/**
 * frontend/src/app/(protected-pages)/examples/voice-chat/page.tsx REVISAR SI ES DUCPLICADO
 * Página de ejemplo para mostrar la implementación del componente VoiceChat
 * @version 1.0.0
 * @created 2025-04-14
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react' // Added useCallback
import VoiceChat from '@/components/view/ChatBox/components/VoiceChat'
import { Card, Button, toast, Notification } from '@/components/ui' // Added toast, Notification
import { AxiosError } from 'axios' // Added AxiosError for typing
import { VoiceService } from '@/services/VoiceService' // Assuming VoiceService exists for API calls

// Define the expected API response structure
interface VoiceChatResponse {
    success: boolean
    transcription?: string
    response: string
    audio_url: string
    processing_time_ms?: number
    error?: string
    details?: string
}

export default function VoiceChatExample() {
    const [isOpen, setIsOpen] = useState(true)
    const [minimized, setMinimized] = useState(false)
    const [playing, setPlaying] = useState(false) // Controls playback of bot's response audio
    const [message, setMessage] = useState('¿En qué puedo ayudarte hoy?') // Bot's current message
    const [showProducts, setShowProducts] = useState(false)
    const [showPermissionRequest, setShowPermissionRequest] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [uiStyle, setUiStyle] = useState('modern_green')
    const [visualizationType, setVisualizationType] = useState('waveform')
    const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined) // URL of bot's response audio

    // --- State for Recording and API Interaction ---
    const [isRecording, setIsRecording] = useState(false)
    const [isLoading, setIsLoading] = useState(false) // Indicates if waiting for API response
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    // --- End State ---

    // Productos de ejemplo (unchanged)
    const products = [
        {
            id: '1',
            title: 'Bloom Booster Potting Mix',
            subtitle: 'Organic soil for flowering plants',
            price: '15.99',
            imageUrl: 'https://via.placeholder.com/100',
            onClick: () => handleProductClick('1'),
        },
        {
            id: '2',
            title: 'Flower Power Fertilizer',
            subtitle: 'Enhances blooming for all flowers',
            price: '22.98',
            imageUrl: 'https://via.placeholder.com/100',
            onClick: () => handleProductClick('2'),
        },
    ]

    // Manejadores de eventos
    const handleClose = () => {
        setIsOpen(false)
        // Reabrir después de 2 segundos para demostración
        setTimeout(() => setIsOpen(true), 2000)
    }

    const handleMinimize = () => {
        setMinimized(!minimized)
    }

    const handlePlayPause = () => {
        setPlaying(!playing)
    }

    // --- Recording Logic ---
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = [] // Clear previous chunks

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: 'audio/ogg; codecs=opus',
                }) // Or appropriate type
                sendAudioToBackend(audioBlob)
                // Clean up stream tracks
                stream.getTracks().forEach((track) => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setMessage('Estoy escuchando...') // Update message while recording
            setAudioUrl(undefined) // Clear previous audio response
            setPlaying(false) // Stop playback if any
        } catch (err) {
            console.error('Error accessing microphone:', err)
            toast.push(
                <Notification title="Error de Micrófono" type="danger">
                    No se pudo acceder al micrófono. Asegúrate de haber otorgado
                    los permisos necesarios.
                </Notification>,
            )
            setIsRecording(false) // Ensure recording state is reset
        }
    }, []) // Empty dependency array as it doesn't depend on component state/props directly

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setMessage('Procesando tu voz...') // Update message while processing
        }
    }, [isRecording])

    // --- API Call Logic ---
    const sendAudioToBackend = async (audioBlob: Blob) => {
        setIsLoading(true)
        setMessage('Enviando audio y procesando...')
        setPlaying(false)
        setAudioUrl(undefined)

        try {
            // Use FormData to send the blob
            const formData = new FormData()
            formData.append('audio', audioBlob, 'recording.ogg') // Filename is optional but good practice
            // Add other potential data if needed by backend (e.g., bot_id, voice_id)
            // formData.append('bot_id', 'your_bot_id');
            // formData.append('voice_id', 'desired_voice');

            // Assuming VoiceService.sendChat handles FormData
            const response =
                await VoiceService.sendChat<VoiceChatResponse>(formData)

            if (response.data.success && response.data.audio_url) {
                setMessage(response.data.response) // Update with bot's text response
                setAudioUrl(response.data.audio_url) // Set the new audio URL
                setPlaying(true) // Auto-play the response
                console.log('User Transcription:', response.data.transcription) // Log transcription
            } else {
                throw new Error(
                    response.data.error || 'Error en la respuesta del servidor',
                )
            }
        } catch (error) {
            console.error('Error sending audio:', error)
            const errorMsg =
                error instanceof AxiosError
                    ? error.response?.data?.error || error.message
                    : (error as Error).message
            setMessage(`Error: ${errorMsg}`) // Show error message in chat
            toast.push(
                <Notification title="Error de Comunicación" type="danger">
                    No se pudo procesar el audio: {errorMsg}
                </Notification>,
            )
            setAudioUrl(undefined) // Clear audio URL on error
        } finally {
            setIsLoading(false)
        }
    }

    const sendTextToBackend = async (text: string) => {
        setIsLoading(true)
        setMessage('Enviando mensaje y procesando...')
        setPlaying(false)
        setAudioUrl(undefined)

        try {
            // Send text in the request body
            const payload = { text: text }
            // Add other potential data if needed
            // payload.bot_id = 'your_bot_id';
            // payload.voice_id = 'desired_voice';

            const response =
                await VoiceService.sendChat<VoiceChatResponse>(payload)

            if (response.data.success && response.data.audio_url) {
                setMessage(response.data.response)
                setAudioUrl(response.data.audio_url)
                setPlaying(true) // Auto-play the response
            } else {
                throw new Error(
                    response.data.error || 'Error en la respuesta del servidor',
                )
            }
        } catch (error) {
            console.error('Error sending text:', error)
            const errorMsg =
                error instanceof AxiosError
                    ? error.response?.data?.error || error.message
                    : (error as Error).message
            setMessage(`Error: ${errorMsg}`)
            toast.push(
                <Notification title="Error de Comunicación" type="danger">
                    No se pudo procesar el mensaje: {errorMsg}
                </Notification>,
            )
            setAudioUrl(undefined)
        } finally {
            setIsLoading(false)
        }
    }

    // --- Updated Event Handlers ---
    const handleSendVoice = useCallback(() => {
        if (isLoading) return // Prevent action while loading

        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }, [isLoading, isRecording, startRecording, stopRecording]) // Include dependencies

    const handleSendMessage = useCallback(
        (text: string) => {
            if (isLoading || !text.trim()) return // Prevent action while loading or empty message
            sendTextToBackend(text.trim())
        },
        [isLoading],
    ) // Include isLoading dependency

    // --- Original Handlers (mostly unchanged, might need adjustment based on real flow) ---
    const handleProductClick = (productId: string) => {
        setMessage(
            `Has seleccionado el producto ${productId}. ¿Deseas agregarlo a tu carrito?`,
        )
        setShowConfirmation(true)
        setShowProducts(false)
    }

    const handleConfirmYes = () => {
        setMessage('¡Producto agregado al carrito! ¿Necesitas algo más?')
        setShowConfirmation(false)
    }

    const handleConfirmNo = () => {
        setMessage('Entendido. ¿En qué más puedo ayudarte?')
        setShowConfirmation(false)
    }

    const handleRequestVideoYes = () => {
        setMessage(
            'Gracias por permitir el acceso a la cámara. Iniciando videollamada...',
        )
        setShowPermissionRequest(false)
    }

    const handleRequestVideoNo = () => {
        setMessage(
            'Entendido. Continuaremos con chat de voz. ¿En qué puedo ayudarte?',
        )
        setShowPermissionRequest(false)
    }

    const handleVideoCall = () => {
        setShowPermissionRequest(true)
        setMessage('¿Me permites acceder a tu cámara para una videollamada?')
    }

    // Removed the old simulation logic from handleSendMessage
    // The actual logic is now in sendTextToBackend

    return (
        <div className="p-6">
            <Card>
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">
                        Ejemplo de Chatbot de Voz
                    </h1>
                    <p className="mb-6">
                        Este es un ejemplo de interfaz para el chatbot de voz
                        integrado con IA. La interfaz está inspirada en diseños
                        modernos de asistentes de voz móviles.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">
                                Estilo de UI
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={
                                        uiStyle === 'modern_green'
                                            ? 'solid'
                                            : 'default'
                                    }
                                    onClick={() => setUiStyle('modern_green')}
                                >
                                    Verde
                                </Button>
                                <Button
                                    variant={
                                        uiStyle === 'modern_blue'
                                            ? 'solid'
                                            : 'default'
                                    }
                                    onClick={() => setUiStyle('modern_blue')}
                                >
                                    Azul
                                </Button>
                                <Button
                                    variant={
                                        uiStyle === 'classic'
                                            ? 'solid'
                                            : 'default'
                                    }
                                    onClick={() => setUiStyle('classic')}
                                >
                                    Clásico
                                </Button>
                                <Button
                                    variant={
                                        uiStyle === 'minimal'
                                            ? 'solid'
                                            : 'default'
                                    }
                                    onClick={() => setUiStyle('minimal')}
                                >
                                    Minimalista
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-2">
                                Tipo de Visualización
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={
                                        visualizationType === 'waveform'
                                            ? 'solid'
                                            : 'default'
                                    }
                                    onClick={() =>
                                        setVisualizationType('waveform')
                                    }
                                >
                                    Forma de Onda
                                </Button>
                                <Button
                                    variant={
                                        visualizationType === 'equalizer'
                                            ? 'solid'
                                            : 'default'
                                    }
                                    onClick={() =>
                                        setVisualizationType('equalizer')
                                    }
                                >
                                    Ecualizador
                                </Button>
                                <Button
                                    variant={
                                        visualizationType === 'circle_pulse'
                                            ? 'solid'
                                            : 'default'
                                    }
                                    onClick={() =>
                                        setVisualizationType('circle_pulse')
                                    }
                                >
                                    Pulso Circular
                                </Button>
                                <Button
                                    variant={
                                        visualizationType === 'none'
                                            ? 'solid'
                                            : 'default'
                                    }
                                    onClick={() => setVisualizationType('none')}
                                >
                                    Ninguno
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">
                                Controles del Chat
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="default"
                                    onClick={handleMinimize}
                                >
                                    {minimized ? 'Maximizar' : 'Minimizar'}
                                </Button>
                                <Button variant="default" onClick={handleClose}>
                                    Cerrar
                                </Button>
                                <Button
                                    variant={playing ? 'solid' : 'default'}
                                    onClick={handlePlayPause}
                                >
                                    {playing
                                        ? 'Pausar Audio'
                                        : 'Reproducir Audio'}
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() =>
                                        setShowProducts(!showProducts)
                                    }
                                >
                                    {showProducts
                                        ? 'Ocultar Productos'
                                        : 'Mostrar Productos'}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-2">
                                Escenarios
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        setShowPermissionRequest(true)
                                        setMessage(
                                            '¿Me permites acceder a tu cámara para una videollamada?',
                                        )
                                    }}
                                >
                                    Solicitar Permiso
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        setShowConfirmation(true)
                                        setMessage(
                                            '¿Quieres actualizar los productos en tu carrito?',
                                        )
                                    }}
                                >
                                    Confirmación
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        setMessage('Estoy escuchando...')
                                        setTimeout(
                                            () =>
                                                setMessage(
                                                    '¿Puedo ayudarte con algo más hoy?',
                                                ),
                                            2000,
                                        )
                                    }}
                                >
                                    Cambiar Mensaje
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center items-center mt-8">
                        <div className="h-[600px] w-full max-w-[400px] border border-gray-200 rounded-xl bg-gray-50 relative">
                            {/* Aquí se muestra el componente VoiceChat */}
                            <VoiceChat
                                isOpen={isOpen}
                                onClose={handleClose}
                                onMinimize={handleMinimize}
                                title="Asistente Inmobiliario"
                                agentIcon="/images/customer-service-avatar.svg"
                                agentName="Agente IA"
                                minimized={minimized}
                                message={message}
                                audioUrl={audioUrl}
                                playing={playing} // Controls bot response playback
                                onPlayPause={handlePlayPause} // Toggles bot response playback
                                visualizationType={visualizationType as any}
                                uiStyle={uiStyle as any}
                                onSendVoice={handleSendVoice} // Manages recording start/stop
                                onSendMessage={handleSendMessage} // Sends text message
                                onVideoCall={handleVideoCall} // Original video call logic
                                isRecording={isRecording} // Pass recording state to VoiceChat
                                isLoading={isLoading} // Pass loading state
                                items={showProducts ? products : undefined}
                                confirmAction={
                                    showConfirmation
                                        ? {
                                              message:
                                                  '¿Confirmas esta acción?',
                                              confirmText: 'Sí',
                                              cancelText: 'No',
                                              onConfirm: handleConfirmYes,
                                              onCancel: handleConfirmNo,
                                          }
                                        : undefined
                                }
                                permissionRequest={
                                    showPermissionRequest
                                        ? {
                                              type: 'camera',
                                              message:
                                                  '¿Me permites acceder a tu cámara para una videollamada?',
                                              onAllow: handleRequestVideoYes,
                                              onDeny: handleRequestVideoNo,
                                          }
                                        : undefined
                                }
                                className="absolute bottom-0 right-0 left-0 top-0 m-auto"
                            />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
