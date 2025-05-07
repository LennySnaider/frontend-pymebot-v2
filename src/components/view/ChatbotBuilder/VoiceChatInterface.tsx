/**
 * frontend/src/components/view/ChatbotBuilder/VoiceChatInterface.tsx
 * Componente que implementa la interfaz de usuario para el chatbot con capacidades de voz
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect, useRef } from 'react'
import { Button, Avatar } from '@/components/ui'
import { PiXBold, PiExpandBold, PiMinusBold, PiMicrophoneFill, PiPhoneFill, PiPaperPlaneTiltFill } from 'react-icons/pi'
import Iconify from '@/components/shared/Iconify'

interface VoiceChatInterfaceProps {
    botName?: string
    botAvatarUrl?: string
    primaryColor?: string
    secondaryColor?: string
    isFullscreen?: boolean
    onClose?: () => void
    onMinimize?: () => void
    onMaximize?: () => void
    onSendMessage?: (message: string) => void
    onSendVoice?: (audioBlob: Blob) => void
    onCallAgent?: () => void
    initialMessages?: Array<{
        content: string
        type: 'text' | 'voice' | 'image' | 'system'
        sender: 'user' | 'bot'
        audioUrl?: string
        timestamp?: Date
    }>
}

const VoiceChatInterface: React.FC<VoiceChatInterfaceProps> = ({
    botName = 'Customer Service Agent',
    botAvatarUrl,
    primaryColor = '#1a614a', // Color verde como en la imagen
    secondaryColor = '#ffffff',
    isFullscreen = false,
    onClose,
    onMinimize,
    onMaximize,
    onSendMessage,
    onSendVoice,
    onCallAgent,
    initialMessages = []
}) => {
    // Referencias y estados
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const microphoneStreamRef = useRef<MediaStream | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    
    const [messages, setMessages] = useState(initialMessages)
    const [inputMessage, setInputMessage] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
    const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
    const [recordingTimer, setRecordingTimer] = useState<number>(0)
    const [isWaveformVisible, setIsWaveformVisible] = useState(false)
    const [microphoneMediaRecorder, setMicrophoneMediaRecorder] = useState<MediaRecorder | null>(null)
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
    
    // Inicialización
    useEffect(() => {
        // Scroll al final de los mensajes cuando cambian
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages])
    
    // Función para manejar el inicio de grabación
    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Tu navegador no soporta la grabación de audio')
            }
            
            // Solicitar permisos de micrófono
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            microphoneStreamRef.current = stream
            
            // Configurar AudioContext para el análisis de audio
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioContextRef.current = audioContext
            const analyser = audioContext.createAnalyser()
            analyserRef.current = analyser
            const microphone = audioContext.createMediaStreamSource(stream)
            microphone.connect(analyser)
            analyser.fftSize = 256
            
            // Iniciar grabación
            const options = { mimeType: 'audio/webm' }
            const mediaRecorder = new MediaRecorder(stream, options)
            setMicrophoneMediaRecorder(mediaRecorder)
            
            // Eventos de grabación
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setRecordedChunks((prev) => [...prev, e.data])
                }
            }
            
            mediaRecorder.onstop = () => {
                // Procesar el audio grabado
                const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' })
                if (onSendVoice) {
                    onSendVoice(audioBlob)
                }
                
                // Agregar mensaje con audio
                const audioUrl = URL.createObjectURL(audioBlob)
                setMessages((prev) => [
                    ...prev,
                    {
                        content: '[Mensaje de voz]',
                        type: 'voice',
                        sender: 'user',
                        audioUrl,
                        timestamp: new Date()
                    }
                ])
                
                // Simular respuesta del bot
                setIsTyping(true)
                setTimeout(() => {
                    setIsTyping(false)
                    // Respuesta simulada
                    const botResponse = {
                        content: 'Gracias por tu mensaje de voz. ¿Necesitas ayuda con algo específico hoy?',
                        type: 'text' as const,
                        sender: 'bot' as const,
                        timestamp: new Date()
                    }
                    setMessages((prev) => [...prev, botResponse])
                }, 2000)
                
                // Limpiar
                setRecordedChunks([])
            }
            
            // Iniciar grabación
            mediaRecorder.start(100)
            setIsRecording(true)
            setIsWaveformVisible(true)
            setRecordingStartTime(new Date())
            
            // Iniciar visualización
            startWaveformVisualization()
        } catch (error) {
            console.error('Error al iniciar la grabación:', error)
            alert('No se pudo acceder al micrófono')
        }
    }
    
    // Función para detener la grabación
    const stopRecording = () => {
        if (microphoneMediaRecorder && microphoneMediaRecorder.state !== 'inactive') {
            microphoneMediaRecorder.stop()
        }
        
        if (microphoneStreamRef.current) {
            microphoneStreamRef.current.getTracks().forEach(track => track.stop())
            microphoneStreamRef.current = null
        }
        
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }
        
        setIsRecording(false)
        setIsWaveformVisible(false)
        setRecordingStartTime(null)
        setRecordingTimer(0)
    }
    
    // Timer para la grabación
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        
        if (isRecording && recordingStartTime) {
            interval = setInterval(() => {
                const now = new Date()
                const elapsed = Math.floor((now.getTime() - recordingStartTime.getTime()) / 1000)
                setRecordingTimer(elapsed)
                
                // Limitar grabación a 60 segundos
                if (elapsed >= 60) {
                    stopRecording()
                }
            }, 1000)
        }
        
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRecording, recordingStartTime])
    
    // Función para visualizar la forma de onda
    const startWaveformVisualization = () => {
        if (!canvasRef.current || !analyserRef.current) return
        
        const canvas = canvasRef.current
        const canvasCtx = canvas.getContext('2d')
        if (!canvasCtx) return
        
        const analyser = analyserRef.current
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw)
            
            analyser.getByteTimeDomainData(dataArray)
            
            canvasCtx.fillStyle = primaryColor
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height)
            
            canvasCtx.lineWidth = 2
            canvasCtx.strokeStyle = 'rgb(255, 255, 255)'
            canvasCtx.beginPath()
            
            const sliceWidth = (canvas.width * 1.0) / bufferLength
            let x = 0
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0
                const y = (v * canvas.height) / 2
                
                if (i === 0) {
                    canvasCtx.moveTo(x, y)
                } else {
                    canvasCtx.lineTo(x, y)
                }
                
                x += sliceWidth
            }
            
            canvasCtx.lineTo(canvas.width, canvas.height / 2)
            canvasCtx.stroke()
        }
        
        draw()
    }
    
    // Función para formatear el tiempo en MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs < 10 ? '0' + secs : secs}`
    }
    
    // Función para enviar mensaje de texto
    const handleSendMessage = () => {
        if (!inputMessage.trim()) return
        
        // Agregar mensaje del usuario
        setMessages((prev) => [
            ...prev,
            {
                content: inputMessage,
                type: 'text',
                sender: 'user',
                timestamp: new Date()
            }
        ])
        
        // Notificar al componente padre si es necesario
        if (onSendMessage) {
            onSendMessage(inputMessage)
        }
        
        // Limpiar input
        setInputMessage('')
        
        // Simular respuesta del bot
        setIsTyping(true)
        setTimeout(() => {
            setIsTyping(false)
            // Respuesta simulada
            const botResponse = {
                content: 'Gracias por tu mensaje. ¿En qué más puedo ayudarte?',
                type: 'text' as const,
                sender: 'bot' as const,
                timestamp: new Date()
            }
            setMessages((prev) => [...prev, botResponse])
        }, 1500)
    }
    
    // Función para reproducir mensajes de audio
    const playAudio = (audioUrl: string) => {
        // Detener cualquier audio en reproducción
        if (currentAudio) {
            currentAudio.pause()
            currentAudio.currentTime = 0
        }
        
        // Crear y reproducir el nuevo audio
        const audio = new Audio(audioUrl)
        setCurrentAudio(audio)
        
        audio.play().catch(error => {
            console.error('Error al reproducir audio:', error)
        })
        
        audio.onended = () => {
            setCurrentAudio(null)
        }
    }
    
    return (
        <div 
            className="flex flex-col rounded-lg overflow-hidden shadow-xl" 
            style={{ 
                width: isFullscreen ? '100%' : '360px',
                height: isFullscreen ? '100%' : '600px',
                maxHeight: '90vh',
                backgroundColor: primaryColor
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center">
                    <div className="h-8 w-8 bg-green-300 rounded-full flex items-center justify-center mr-3">
                        {botAvatarUrl ? (
                            <img src={botAvatarUrl} className="h-8 w-8 rounded-full" alt={botName} />
                        ) : (
                            <Iconify icon="mdi:robot" className="text-white" />
                        )}
                    </div>
                    <div className="text-white font-medium">{botName}</div>
                </div>
                <div className="flex items-center space-x-2">
                    {isFullscreen ? (
                        <button 
                            onClick={onMinimize} 
                            className="text-white hover:text-gray-200 focus:outline-none"
                        >
                            <PiMinusBold />
                        </button>
                    ) : (
                        <button 
                            onClick={onMaximize} 
                            className="text-white hover:text-gray-200 focus:outline-none"
                        >
                            <PiExpandBold />
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="text-white hover:text-gray-200 focus:outline-none"
                    >
                        <PiXBold />
                    </button>
                </div>
            </div>
            
            {/* Chat Container */}
            <div 
                ref={chatContainerRef}
                className="flex-1 bg-white p-4 overflow-y-auto flex flex-col"
            >
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <Iconify icon="mdi:robot" className="text-4xl mx-auto mb-2" />
                            <p>¡Hola! Estoy aquí para ayudarte.</p>
                            <p className="text-sm mt-1">Puedes enviar un mensaje de texto o voz.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <div 
                                key={index} 
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                            >
                                {message.sender === 'bot' && (
                                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                                        {botAvatarUrl ? (
                                            <img src={botAvatarUrl} className="h-8 w-8 rounded-full" alt={botName} />
                                        ) : (
                                            <Iconify icon="mdi:robot" className="text-white" />
                                        )}
                                    </div>
                                )}
                                
                                <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                    message.sender === 'user' 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {message.type === 'text' && (
                                        <p>{message.content}</p>
                                    )}
                                    
                                    {message.type === 'voice' && (
                                        <div>
                                            <div className="flex items-center mb-1">
                                                <Iconify icon="mdi:microphone" className="mr-2" />
                                                <span>Mensaje de voz</span>
                                            </div>
                                            {message.audioUrl && (
                                                <button 
                                                    onClick={() => playAudio(message.audioUrl!)}
                                                    className={`px-2 py-1 rounded-md ${
                                                        message.sender === 'user' 
                                                            ? 'bg-blue-600 text-white' 
                                                            : 'bg-gray-200 text-gray-800'
                                                    }`}
                                                >
                                                    {currentAudio?.src === message.audioUrl ? 'Pausar' : 'Reproducir'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    
                                    {message.timestamp && (
                                        <div className={`text-xs mt-1 ${
                                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                            {new Date(message.timestamp).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                {message.sender === 'user' && (
                                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                                        <Iconify icon="mdi:account" className="text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="flex justify-start mb-4">
                                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
                                    {botAvatarUrl ? (
                                        <img src={botAvatarUrl} className="h-8 w-8 rounded-full" alt={botName} />
                                    ) : (
                                        <Iconify icon="mdi:robot" className="text-white" />
                                    )}
                                </div>
                                <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Voice Recording UI */}
            {isWaveformVisible && (
                <div className="px-4 py-6 flex flex-col items-center justify-center" style={{ backgroundColor: primaryColor }}>
                    <canvas ref={canvasRef} className="w-full h-24" width="300" height="100"></canvas>
                    <p className="text-white mt-4">Por favor, envía un mensaje de voz...</p>
                    <div className="text-white mt-2">{formatTime(recordingTimer)}</div>
                </div>
            )}
            
            {/* Input Area */}
            <div className="border-t border-gray-200 bg-white p-2 flex items-center">
                {isRecording ? (
                    <button 
                        onClick={stopRecording}
                        className="rounded-full w-12 h-12 flex items-center justify-center bg-red-500 text-white mr-2"
                    >
                        <Iconify icon="mdi:stop-circle" className="text-2xl" />
                    </button>
                ) : (
                    <button 
                        onClick={startRecording}
                        className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 mr-2"
                    >
                        <PiMicrophoneFill className="text-gray-600 text-xl" />
                    </button>
                )}
                
                <input 
                    type="text" 
                    placeholder="Escribe un mensaje..." 
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isRecording}
                />
                
                <div className="flex ml-2">
                    <button 
                        onClick={handleSendMessage}
                        className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                        disabled={!inputMessage.trim() || isRecording}
                    >
                        <PiPaperPlaneTiltFill className={`text-xl ${
                            !inputMessage.trim() || isRecording ? 'text-gray-400' : 'text-blue-500'
                        }`} />
                    </button>
                    
                    <button 
                        onClick={onCallAgent}
                        className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 ml-1"
                    >
                        <PiPhoneFill className="text-gray-600 text-xl" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default VoiceChatInterface