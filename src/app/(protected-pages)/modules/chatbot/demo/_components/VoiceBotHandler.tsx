/**
 * frontend/src/app/(protected-pages)/modules/chatbot/demo/_components/VoiceBotHandler.tsx
 * Componente de lógica para manejo de grabación, envío y procesamiento de audio para el VoiceBot
 * @version 1.0.0
 * @updated 2025-04-28
 */

'use client'

import React, { useRef, useCallback, useState } from 'react'
import { AxiosError } from 'axios'
import { Notification, toast } from '@/components/ui'
import VoiceService from '@/services/VoiceService'

// Tipos para las respuestas de la API
export interface VoiceChatResponse {
    success: boolean
    transcription?: string
    response: string | { text: string }
    audio_url: string
    audio_blob?: Blob
    content_type?: string
    processing_time_ms?: number
    error?: string
    details?: string
}

// Props para el componente handler
interface VoiceBotHandlerProps {
    children: React.ReactNode
    isRecording: boolean
    setIsRecording: (isRecording: boolean) => void
    isLoading: boolean
    setIsLoading: (isLoading: boolean) => void
    message: string | object
    setMessage: (message: string | object) => void
    audioUrl: string | undefined
    setAudioUrl: (audioUrl: string | undefined) => void
    playing: boolean
    setPlaying: (playing: boolean) => void
}

// Componente para controlar la lógica del VoiceBot
const VoiceBotHandler: React.FC<VoiceBotHandlerProps> = ({
    children,
    isRecording,
    setIsRecording,
    isLoading,
    setIsLoading,
    message,
    setMessage,
    audioUrl,
    setAudioUrl,
    playing,
    setPlaying
}) => {
    // Referencias para el manejo de la grabación de audio
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    // Función para iniciar la grabación de audio
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            })
            mediaRecorderRef.current = new MediaRecorder(stream)
            audioChunksRef.current = []

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: 'audio/ogg; codecs=opus',
                })
                sendAudioToBackend(audioBlob)
                stream.getTracks().forEach((track) => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setMessage('Estoy escuchando...')
            setAudioUrl(undefined)
            setPlaying(false)
        } catch (err) {
            console.error('Error accessing microphone:', err)
            toast.push(
                <Notification title="Error de Micrófono" type="danger">
                    No se pudo acceder al micrófono. Asegúrate de haber otorgado
                    los permisos necesarios.
                </Notification>,
            )
            setIsRecording(false)
        }
    }, [setIsRecording, setMessage, setAudioUrl, setPlaying])

    // Función para detener la grabación
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setMessage('Procesando tu voz...')
        }
    }, [isRecording, setIsRecording, setMessage])

    // Función para enviar audio al backend
    const sendAudioToBackend = async (audioBlob: Blob) => {
        setIsLoading(true)
        setMessage('Enviando audio y procesando...')
        setPlaying(false)
        setAudioUrl(undefined)

        try {
            const formData = new FormData()
            formData.append('audio', audioBlob, 'recording.ogg')
            const response =
                await VoiceService.sendChat<VoiceChatResponse>(formData)
            
            console.log('Respuesta recibida:', {
                contentType: response.headers?.['content-type'],
                success: response.data?.success,
                hasAudioUrl: !!response.data?.audio_url,
                responseType: typeof response.data?.response
            })

            if (response.data.success) {
                // Manejar la respuesta textual (puede ser string u objeto)
                if (response.data.response) {
                    setMessage(response.data.response)
                    console.log('Respuesta establecida:', response.data.response)
                }
                
                // Manejar la URL de audio si existe
                if (response.data.audio_url) {
                    try {
                        // Si es una URL de blob o una URL válida
                        const audioUrl = response.data.audio_url
                        if (audioUrl.startsWith('blob:') || new URL(audioUrl)) {
                            console.log('Configurando URL de audio:', audioUrl)
                            console.log('Tipo de contenido:', response.data.content_type || 'desconocido')
                            
                            // Verificar extensión para debugging
                            const hasExtension = audioUrl.includes('#ext')
                            console.log('URL con extensión:', hasExtension ? 'Sí' : 'No')
                            
                            // Establecer URL y activar reproducción
                            setAudioUrl(audioUrl)
                            setPlaying(true)
                            
                            // Log de transcripción si está disponible
                            if (response.data.transcription) {
                                console.log('Transcripción:', response.data.transcription)
                            }
                        }
                    } catch (err) {
                        console.error('URL de audio inválida:', response.data.audio_url, err)
                        toast.push(
                            <Notification title="Error de Audio" type="danger">
                                La URL de audio recibida no es válida
                            </Notification>,
                        )
                    }
                } else if (response.data.audio_blob) {
                    // Si recibimos un Blob directamente (caso en que el servidor envía audio/mpeg)
                    console.log('Usando audio_blob directamente')
                    console.log('Tipo de contenido del Blob:', response.data.content_type || 'desconocido')
                    
                    // El servicio ya debería haber creado una URL para el blob
                    if (response.data.audio_url) {
                        console.log('URL de audio generada del Blob:', response.data.audio_url)
                        setAudioUrl(response.data.audio_url)
                        setPlaying(true)
                    } else {
                        // Por si acaso crear una nueva URL de objeto
                        try {
                            const contentType = response.data.content_type || 'audio/mpeg'
                            const blob = response.data.audio_blob
                            const url = URL.createObjectURL(blob)
                            console.log('Creando nueva URL de audio para Blob:', url)
                            setAudioUrl(url)
                            setPlaying(true)
                        } catch (blobError) {
                            console.error('Error al crear URL para Blob:', blobError)
                            toast.push(
                                <Notification title="Error de Audio" type="danger">
                                    No se pudo crear URL para el audio recibido
                                </Notification>,
                            )
                        }
                    }
                }
            } else {
                // Manejar errores reportados por el servidor
                const errorMessage = response.data.error || 'Error en la respuesta del servidor'
                console.error('Error reportado por el servidor:', errorMessage)
                setMessage(`Error: ${errorMessage}`)
                
                // Mostrar detalles adicionales si están disponibles
                if (response.data.details) {
                    console.error('Detalles del error:', response.data.details)
                }
                
                toast.push(
                    <Notification title="Error del Servidor" type="danger">
                        {errorMessage}
                    </Notification>,
                )
            }
        } catch (error) {
            console.error('Error al enviar audio:', error)
            let errorMsg = 'Error desconocido'
            
            if (error instanceof AxiosError) {
                // Extraer mensaje de error de la respuesta Axios
                errorMsg = error.response?.data?.error || error.message
                console.error('Detalles del error Axios:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                })
            } else if (error instanceof Error) {
                errorMsg = error.message
            }
            
            setMessage(`Error: ${errorMsg}`)
            toast.push(
                <Notification title="Error de Comunicación" type="danger">
                    No se pudo procesar el audio: {errorMsg}
                </Notification>,
            )
            setAudioUrl(undefined)
        } finally {
            setIsLoading(false)
        }
    }

    // Función para enviar mensajes de texto
    const sendTextToBackend = async (text: string) => {
        setIsLoading(true)
        setMessage('Enviando mensaje y procesando...')
        setPlaying(false)
        setAudioUrl(undefined)

        try {
            const payload = { text: text }
            const response =
                await VoiceService.sendChat<VoiceChatResponse>(payload)
            
            console.log('Respuesta de texto recibida:', {
                contentType: response.headers?.['content-type'],
                success: response.data?.success,
                hasAudioUrl: !!response.data?.audio_url,
                responseType: typeof response.data?.response
            })

            if (response.data.success) {
                // Manejar la respuesta textual (puede ser string u objeto)
                if (response.data.response) {
                    setMessage(response.data.response)
                    console.log('Respuesta establecida:', response.data.response)
                }
                
                // Manejar la URL de audio si existe
                if (response.data.audio_url) {
                    try {
                        // Si es una URL de blob o una URL válida
                        const audioUrl = response.data.audio_url
                        if (audioUrl.startsWith('blob:') || new URL(audioUrl)) {
                            console.log('Configurando URL de audio:', audioUrl)
                            console.log('Tipo de contenido:', response.data.content_type || 'desconocido')
                            
                            // Verificar extensión para debugging
                            const hasExtension = audioUrl.includes('#ext')
                            console.log('URL con extensión:', hasExtension ? 'Sí' : 'No')
                            
                            // Establecer URL y activar reproducción
                            setAudioUrl(audioUrl)
                            setPlaying(true)
                        }
                    } catch (err) {
                        console.error('URL de audio inválida:', response.data.audio_url, err)
                        toast.push(
                            <Notification title="Error de Audio" type="danger">
                                La URL de audio recibida no es válida
                            </Notification>,
                        )
                    }
                } else if (response.data.audio_blob) {
                    // Si recibimos un Blob directamente (caso en que el servidor envía audio/mpeg)
                    console.log('Usando audio_blob directamente')
                    console.log('Tipo de contenido del Blob:', response.data.content_type || 'desconocido')
                    
                    // El servicio ya debería haber creado una URL para el blob
                    if (response.data.audio_url) {
                        console.log('URL de audio generada del Blob:', response.data.audio_url)
                        setAudioUrl(response.data.audio_url)
                        setPlaying(true)
                    } else {
                        // Por si acaso crear una nueva URL de objeto
                        try {
                            const contentType = response.data.content_type || 'audio/mpeg'
                            const blob = response.data.audio_blob
                            const url = URL.createObjectURL(blob)
                            console.log('Creando nueva URL de audio para Blob:', url)
                            setAudioUrl(url)
                            setPlaying(true)
                        } catch (blobError) {
                            console.error('Error al crear URL para Blob:', blobError)
                            toast.push(
                                <Notification title="Error de Audio" type="danger">
                                    No se pudo crear URL para el audio recibido
                                </Notification>,
                            )
                        }
                    }
                }
            } else {
                // Manejar errores reportados por el servidor
                const errorMessage = response.data.error || 'Error en la respuesta del servidor'
                console.error('Error reportado por el servidor:', errorMessage)
                setMessage(`Error: ${errorMessage}`)
                
                // Mostrar detalles adicionales si están disponibles
                if (response.data.details) {
                    console.error('Detalles del error:', response.data.details)
                }
                
                toast.push(
                    <Notification title="Error del Servidor" type="danger">
                        {errorMessage}
                    </Notification>,
                )
            }
        } catch (error) {
            console.error('Error al enviar mensaje de texto:', error)
            let errorMsg = 'Error desconocido'
            
            if (error instanceof AxiosError) {
                // Extraer mensaje de error de la respuesta Axios
                errorMsg = error.response?.data?.error || error.message
                console.error('Detalles del error Axios:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                })
            } else if (error instanceof Error) {
                errorMsg = error.message
            }
            
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

    // Función para manejar el envío de voz (alternar entre grabar y detener)
    const handleSendVoice = useCallback(() => {
        if (isLoading) return
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }, [isLoading, isRecording, startRecording, stopRecording])

    // Función para reproducir/pausar el audio
    const handlePlayPause = useCallback(() => {
        setPlaying(!playing)
    }, [playing, setPlaying])

    // Devolver las funciones para que el componente hijo pueda usarlas
    return React.cloneElement(children as React.ReactElement, {
        onSendVoice: handleSendVoice,
        onSendMessage: sendTextToBackend,
        onPlayPause: handlePlayPause,
        isRecording,
        isLoading,
        message,
        audioUrl,
        playing
    })
}

export default VoiceBotHandler
