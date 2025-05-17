'use client'

/**
 * Componente para visualizar la forma de onda de audio en tiempo real
 * @version 1.0.0
 * @updated 2025-04-14
 */
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'

interface WaveformVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ analyser, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestRef = useRef<number>()
  const [warning, setWarning] = useState<string | null>(null)
  const silenceCounterRef = useRef(0)
  
  // Renderiza la forma de onda en un canvas HTML
  const draw = useCallback(() => {
    if (!analyser || !canvasRef.current || !isRecording) return
    
    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return
    
    // Obtener datos del analizador de audio
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteTimeDomainData(dataArray)
    
    // Verificar si hay audio real (no solo silencio)
    let totalDeviation = 0
    for (let i = 0; i < dataArray.length; i++) {
      totalDeviation += Math.abs(dataArray[i] - 128)
    }
    const avgDeviation = totalDeviation / dataArray.length

    const hasAudioSignal = avgDeviation > 1 // Umbral más bajo para detectar sonidos suaves
    
    // Mostrar advertencia si no se detecta audio durante la grabación por varios frames
    if (isRecording && !hasAudioSignal) {
      silenceCounterRef.current += 1
      if (silenceCounterRef.current > 20) { // Mostrar aviso después de ~1 segundo de silencio
        setWarning("No se detecta audio. Verifica tu micrófono.")
      }
    } else {
      silenceCounterRef.current = 0
      setWarning(null)
    }
    
    // Configurar el canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Seleccionar el color de fondo según el tema
    if (document.documentElement.classList.contains('dark')) {
      canvasCtx.fillStyle = 'rgb(31, 41, 55)' // Fondo oscuro para tema oscuro (bg-gray-800)
    } else {
      canvasCtx.fillStyle = 'rgb(243, 244, 246)' // Fondo claro para tema claro (bg-gray-100)
    }
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Seleccionar el color de la línea según el tema
    canvasCtx.lineWidth = 2
    canvasCtx.strokeStyle = 'rgb(99, 102, 241)' // Color indigo para la forma de onda
    
    canvasCtx.beginPath()
    
    const sliceWidth = (canvas.width * 1.0) / bufferLength
    let x = 0
    
    for (let i = 0; i < bufferLength; i++) {
      // Aplicar amplificación para hacer la onda más visible
      const amplification = 2.5 // Factor de amplificación
      let v = (dataArray[i] / 128.0 - 1) * amplification + 1
      v = Math.max(0, Math.min(2, v)) // Limitar entre 0 y 2
      
      const y = v * (canvas.height / 2)
      
      if (i === 0) {
        canvasCtx.moveTo(x, y)
      } else {
        canvasCtx.lineTo(x, y)
      }
      
      x += sliceWidth
    }
    
    canvasCtx.lineTo(canvas.width, canvas.height / 2)
    canvasCtx.stroke()
    
    // Continuar la animación
    requestRef.current = requestAnimationFrame(draw)
  }, [analyser, isRecording])
  
  // Efecto para iniciar y detener la animación de la forma de onda
  useEffect(() => {
    if (isRecording) {
      requestRef.current = requestAnimationFrame(draw)
      silenceCounterRef.current = 0 // Reiniciar contador al iniciar grabación
    } else {
      setWarning(null) // Limpiar advertencia al detener grabación
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [draw, isRecording])
  
  return (
    <div className="flex flex-col items-center w-full">
      <canvas 
        ref={canvasRef} 
        className="w-full h-16 rounded-lg my-2"
        width={320}
        height={64}
      />
      {warning && (
        <div className="flex items-center text-amber-500 text-xs mb-2">
          <AlertTriangle size={14} className="mr-1" />
          {warning}
        </div>
      )}
    </div>
  )
}

export default WaveformVisualizer
