'use client'

/**
 * Hook para manejar la grabación de audio con Web Audio API
 * @version 1.0.0
 * @updated 2025-04-14
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAudioRecordingOptions {
  maxDurationSeconds?: number;
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => Promise<void>;
}

interface UseAudioRecordingResult {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  recordingDuration: number;
  micPermissionGranted: boolean;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  errorMessage: string | null;
}

export function useAudioRecording({
  maxDurationSeconds = 30,
  onRecordingComplete
}: UseAudioRecordingOptions = {}): UseAudioRecordingResult {
  // Estados
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Referencias
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar audio context y solicitar permisos
  const initializeAudio = useCallback(async () => {
    setErrorMessage(null);
    
    try {
      // Solicitar permiso para el micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      micStreamRef.current = stream;
      setMicPermissionGranted(true);
      
      // Crear contexto de audio para análisis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      // Crear analizador para visualizar el audio
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // Mejor resolución
      analyserRef.current = analyser;
      
      // Conectar la fuente de audio al analizador
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      console.log('Sistema de audio inicializado correctamente');
    } catch (error) {
      console.error('Error al solicitar permisos de micrófono:', error);
      setMicPermissionGranted(false);
      setErrorMessage("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
    }
  }, []);

  // Solicitar permisos al montar el componente
  useEffect(() => {
    initializeAudio();
    
    return () => {
      // Limpiar recursos al desmontar
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [initializeAudio]);

  // Manejar el timer para la duración de grabación
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          
          // Detener automáticamente si alcanza la duración máxima
          if (newDuration >= maxDurationSeconds) {
            stopRecording();
          }
          
          return newDuration;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording, maxDurationSeconds]);

  // Iniciar grabación
  const startRecording = useCallback(() => {
    if (!micStreamRef.current || !micPermissionGranted) {
      setErrorMessage("No hay acceso al micrófono. Verifica los permisos.");
      return;
    }
    
    setErrorMessage(null);
    
    try {
      // Limpiar datos previos
      audioChunksRef.current = [];
      
      // Crear grabador de medios con configuración de alta calidad
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      // Verificar la compatibilidad
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        mediaRecorderRef.current = new MediaRecorder(micStreamRef.current, options);
      } else {
        console.warn('Formato de audio no soportado, usando predeterminado');
        mediaRecorderRef.current = new MediaRecorder(micStreamRef.current);
      }
      
      // Configurar eventos
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        // Crear blob con todos los datos de audio
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
        });
        
        // Crear URL para reproducción
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Llamar al callback si existe
        if (onRecordingComplete) {
          try {
            await onRecordingComplete(audioBlob, audioUrl);
          } catch (error) {
            console.error('Error en callback de finalización de grabación:', error);
            setErrorMessage("Error al procesar el audio grabado.");
          }
        }
        
        setIsRecording(false);
      };
      
      // Iniciar grabación
      mediaRecorderRef.current.start(100); // Recopilar datos cada 100ms para visualización fluida
      setIsRecording(true);
      
      console.log('Grabación iniciada con MimeType:', mediaRecorderRef.current.mimeType);
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      setIsRecording(false);
      setErrorMessage("Error al iniciar la grabación. Verifica tu micrófono.");
    }
  }, [micPermissionGranted, onRecordingComplete]);

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error al detener la grabación:', error);
        setIsRecording(false);
        setErrorMessage("Error al detener la grabación.");
      }
    }
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    recordingDuration,
    micPermissionGranted,
    audioContext: audioContextRef.current,
    analyserNode: analyserRef.current,
    errorMessage
  };
}
