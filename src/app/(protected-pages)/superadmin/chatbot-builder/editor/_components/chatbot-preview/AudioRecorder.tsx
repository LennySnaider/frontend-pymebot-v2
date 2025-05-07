/**
 * frontend/src/app/(protected-pages)/modules/superadmin/chatbot-builder/editor/_components/chatbot-preview/AudioRecorder.tsx
 * Componente para la grabación de audio en el voicebot
 * @version 1.0.0
 * @updated 2025-04-14
 */

import React from 'react'
import { Button } from '@/components/ui'
import { Mic, MicOff, AlertTriangle } from 'lucide-react'
import { AudioRecorderProps } from './types'
import WaveformVisualizer from '../visualizers/WaveformVisualizer'
import VolumeIndicator from '../visualizers/VolumeIndicator'

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isExpectingVoiceInput,
  micPermissionGranted,
  isRecording,
  recordingDuration,
  maxRecordingDuration,
  analyserNode,
  errorMessage,
  startRecording,
  stopRecording,
}) => {
  // No mostrar nada si no se espera entrada de voz o no hay permisos
  if (!isExpectingVoiceInput || !micPermissionGranted) return null

  // Formatear tiempo (para mostrar duración de grabación)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="mb-3">
      {/* Mostrar el visualizador de forma de onda solo cuando se está grabando */}
      {isRecording && (
        <WaveformVisualizer 
          analyser={analyserNode} 
          isRecording={isRecording} 
        />
      )}
      
      {/* Siempre mostrar el indicador de volumen para referencia visual */}
      <VolumeIndicator 
        analyser={analyserNode}
        isRecording={isRecording}
      />
      
      {/* Información de grabación */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {isRecording 
            ? `Grabando: ${formatTime(recordingDuration)} / ${formatTime(maxRecordingDuration)}` 
            : 'Listo para grabar'}
        </div>
        {isRecording && (
          <div className="flex items-center">
            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
            <span className="text-xs text-red-500">REC</span>
          </div>
        )}
      </div>
      
      {/* Botones de grabación */}
      <div className="flex w-full gap-2">
        {isRecording ? (
          <Button
            type="button"
            color="danger"
            className="flex-1"
            onClick={stopRecording}
          >
            <MicOff className="h-4 w-4 mr-2" />
            Detener grabación
          </Button>
        ) : (
          <Button
            type="button"
            color="success"
            className="flex-1"
            onClick={startRecording}
          >
            <Mic className="h-4 w-4 mr-2" />
            Grabar mensaje
          </Button>
        )}
      </div>
      
      {/* Mensajes de error */}
      {errorMessage && (
        <div className="mt-2 text-red-500 text-xs flex items-center">
          <AlertTriangle size={14} className="mr-1" />
          {errorMessage}
        </div>
      )}
    </div>
  )
}

export default AudioRecorder
