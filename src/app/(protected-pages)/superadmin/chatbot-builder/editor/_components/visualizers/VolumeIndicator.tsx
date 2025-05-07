/**
 * Componente para visualizar el nivel de volumen del audio
 * @version 1.0.0
 * @updated 2025-04-14
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'

interface VolumeIndicatorProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ analyser, isRecording }) => {
  const [volume, setVolume] = useState(0)
  const requestRef = useRef<number>()
  
  // Función para calcular el volumen a partir de los datos de frecuencia
  const updateVolume = useCallback(() => {
    if (!analyser || !isRecording) return
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    
    // Calcular el promedio del volumen
    const avg = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    
    // Normalizar a 0-1
    setVolume(Math.min(1, avg / 128))
    
    // Continuar la animación
    requestRef.current = requestAnimationFrame(updateVolume)
  }, [analyser, isRecording])
  
  // Efecto para iniciar y detener la actualización del volumen
  useEffect(() => {
    if (isRecording) {
      requestRef.current = requestAnimationFrame(updateVolume)
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [updateVolume, isRecording])
  
  // Crear una barra de volumen de 20 segmentos
  const segments = Array.from({ length: 20 }, (_, i) => i)
  
  return (
    <div className="flex justify-center items-end h-4 gap-[2px] mb-2">
      {segments.map((i) => {
        // Determinar si el segmento debe estar activo según el volumen actual
        const threshold = i / segments.length
        const active = volume >= threshold
        
        // Determinar el color según el nivel
        let bgColor = "bg-green-500"
        if (i > segments.length * 0.7) bgColor = "bg-red-500"
        else if (i > segments.length * 0.5) bgColor = "bg-amber-500"
        
        return (
          <div
            key={i}
            className={`w-2 rounded-sm ${active ? bgColor : "bg-gray-300 dark:bg-gray-700"}`}
            style={{
              height: `${Math.max(3, (i + 1) * 0.75)}px`,
              opacity: active ? 1 : 0.5
            }}
          />
        )
      })}
    </div>
  )
}

export default VolumeIndicator
