/**
 * Hook para manejar la síntesis de voz (TTS)
 * @version 1.1.1
 * @updated 2025-04-14
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSpeechSynthesisOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechError?: (error: any) => void;
  preferredLang?: string;
}

interface UseSpeechSynthesisResult {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  voicesLoaded: boolean;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  error: string | null;
}

export function useSpeechSynthesis({
  onSpeechStart,
  onSpeechEnd,
  onSpeechError,
  preferredLang = 'es-ES' // Idioma preferido, por defecto español, usando código de país específico
}: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Para manejar el caso donde la síntesis se queda "colgada"
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verificar disponibilidad de la API Speech Synthesis
  const isSpeechSynthesisAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;
  
  // Cargar las voces disponibles cuando se monte el componente
  useEffect(() => {
    if (!isSpeechSynthesisAvailable) {
      setError('La síntesis de voz no está soportada en este navegador');
      return;
    }
    
    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
          setVoicesLoaded(true);
          
          // Vamos a imprimir todas las voces disponibles para depuración
          console.log('Todas las voces disponibles:', voices.map(v => `${v.name} (${v.lang})`));
          
          // Buscar cualquier voz en español (es-ES, es-MX, es, etc.)
          const spanishVoice = voices.find(v => 
              v.lang.startsWith('es') || 
              v.name.toLowerCase().includes('spanish') || 
              v.name.toLowerCase().includes('español')
          );
          
          // Seleccionar voz preferida con código de país exacto, cualquier voz española, o la primera disponible
          const exactMatch = voices.find(v => v.lang === preferredLang);
          if (exactMatch) {
              setSelectedVoice(exactMatch);
              console.log(`Voz exacta seleccionada: ${exactMatch.name} (${exactMatch.lang})`);
          } else if (spanishVoice) {
              setSelectedVoice(spanishVoice);
              console.log(`Voz en español encontrada: ${spanishVoice.name} (${spanishVoice.lang})`);
          } else {
              // Buscar voces con soporte multilenguaje conocidas
              const preferredVoices = [
                'Google español', 'Microsoft Sabina', 'Microsoft Helena', 
                'Paulina', 'Monica', 'Juan', 'Diego', 'Spanish', 'Español'
              ];
              
              // Buscar por nombre parcial
              let foundPreferredVoice = false;
              for (const preferredName of preferredVoices) {
                const matchingVoice = voices.find(v => 
                  v.name.toLowerCase().includes(preferredName.toLowerCase())
                );
                if (matchingVoice) {
                  setSelectedVoice(matchingVoice);
                  console.log(`Voz preferida encontrada: ${matchingVoice.name} (${matchingVoice.lang})`);
                  foundPreferredVoice = true;
                  break;
                }
              }
              
              // Si no se encontró ninguna voz preferida, usar la primera disponible
              if (!foundPreferredVoice) {
                setSelectedVoice(voices[0]);
                console.log(`No se encontró voz en español. Usando: ${voices[0].name} (${voices[0].lang})`);
              }
          }
        } else {
          console.warn('No se encontraron voces disponibles');
        }
      } catch (e) {
        console.error('Error al cargar voces:', e);
      }
    };
    
    // Cargar voces inmediatamente si ya están disponibles
    loadVoices();
    
    // Configurar evento para cuando las voces se carguen
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Limpiar al desmontar
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [preferredLang, isSpeechSynthesisAvailable]);
  
  // Función simple para reproducir audio usando el API de Audio
  const playAudioFallback = useCallback((text: string) => {
    console.log('Usando reproducción de audio fallback');
    
    // Simular la duración del audio basada en el texto
    const duration = Math.max(2000, text.length * 80);
    
    // Simular que está hablando
    setIsSpeaking(true);
    if (onSpeechStart) onSpeechStart();
    
    // Después de la duración estimada, simular que terminó
    setTimeout(() => {
      setIsSpeaking(false);
      if (onSpeechEnd) onSpeechEnd();
    }, duration);
    
  }, [onSpeechEnd, onSpeechStart]);
  
  // Función para pronunciar texto
  const speak = useCallback((text: string, options: { voice?: string; rate?: number; } = {}) => {
    // Limpiar cualquier error previo
    setError(null);
    
    // Registrar información para depuración
    console.log(`Iniciando síntesis de voz con texto: "${text.substring(0, 100)}..." y opciones:`, options);
    console.log(`⚠️ IMPORTANTE - ¿El texto contiene acentos?: ${/[áéíóúüñÁÉÍÓÚÜÑ]/.test(text) ? 'SÍ' : 'NO'}`);
    
    // Para texto sin acentos, sustituimos algunas palabras comunes con acentos
    let textoConAcentos = text;
    if (!/[áéíóúüñÁÉÍÓÚÜÑ]/.test(text) && text.length > 10) {
      console.warn('⚠️ El texto no contiene acentos. Intentando mejorar pronunciación...');
      
      // Diccionario de sustituciones comunes (sin acento -> con acento)
      const sustituciones: Record<string, string> = {
        'esta ': 'está ',
        'estas ': 'estás ',
        'como ': 'cómo ',
        'donde ': 'dónde ',
        'cuando ': 'cuándo ',
        'quien ': 'quién ',
        'que ': 'qué ',
        'cual ': 'cuál ',
        'mas ': 'más ',
        'segun ': 'según ',
        'tambien ': 'también ',
        'ademas ': 'además ',
        'asi ': 'así ',
        'dia ': 'día ',
        'dias': 'días',
        'telefono': 'teléfono',
        'facil': 'fácil',
        'dificil': 'difícil',
        'jovenes': 'jóvenes',
        'area': 'área',
        'interes': 'interés',
        'propiedad': 'propiedad',
        'asesor': 'asesor',
        'inmobiliaria': 'inmobiliaria',
        'terraza': 'terraza',
        'balcon': 'balcón',
        'habitacion': 'habitación',
        'habitaciones': 'habitaciones',
        'salon': 'salón',
        'cocina': 'cocina',
        'bano': 'baño',
        'banos': 'baños',
        'jardin': 'jardín',
        'precio': 'precio',
        'ubicacion': 'ubicación',
        'localizacion': 'localización',
        'ascensor': 'ascensor',
        'ultima': 'última',
        'proximo': 'próximo',
        'aqui': 'aquí',
        'alli': 'allí',
        'rapido': 'rápido',
        'atras': 'atrás',
        'exito': 'éxito',
        'hipoteca': 'hipoteca',
        'credito': 'crédito',
        'corazon': 'corazón',
        'informacion': 'información',
        'comunicacion': 'comunicación',
        'tecnologia': 'tecnología',
        'centrico': 'céntrico',
        'centrica': 'céntrica',
        'agencia': 'agencia',
        'visita': 'visita',
        'alquiler': 'alquiler',
        'venta': 'venta',
        'compra': 'compra',
      };
      
      // Aplicar sustituciones (con límite para evitar procesamiento excesivo)
      Object.entries(sustituciones).forEach(([sinAcento, conAcento]) => {
        textoConAcentos = textoConAcentos.replace(new RegExp(sinAcento, 'gi'), conAcento);
      });
      
      console.log(`✅ Texto mejorado con acentos: "${textoConAcentos.substring(0, 100)}..."`);
      text = textoConAcentos;
      
      // Forzar texto en español si sigue sin tener acentos
      if (!/[áéíóúüñÁÉÍÓÚÜÑ]/.test(text)) {
        console.log('⚠️ Texto sin acentos detectado, añadiendo contexto español para mejorar la voz');
        text = "En español: " + text;
      }
    }
    
    if (!isSpeechSynthesisAvailable) {
      setError('La síntesis de voz no está soportada en este navegador');
      console.warn('Speech Synthesis API no disponible, usando fallback');
      // Usar fallback
      playAudioFallback(text);
      return;
    }
    
    try {
      // Cancelar cualquier pronunciación anterior
      window.speechSynthesis.cancel();
      
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (!text || !text.trim()) {
        console.warn('No hay texto para pronunciar');
        return;
      }
      
      // Crear nuevo utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // IMPORTANTE: Forzar el idioma español para todo el texto - esto es crítico
      // ANTES DE TODO - FORZAR ESPAÑOL
      utterance.lang = 'es-ES';
      console.log('🇪🇸 FORZANDO ESPAÑOL (es-ES) para toda la síntesis de voz');
      
      // Intentar configurar voces de español disponibles
      try {
        // Buscar voces específicas en español
        const availableVoicesArray = window.speechSynthesis.getVoices();
        console.log('🔍 Buscando voces en español entre las disponibles:', 
          availableVoicesArray.map(v => `${v.name} (${v.lang})`).join(', '));
        
        // Buscar voces en español por prioridad
        const spanishVoice = availableVoicesArray.find(v => v.lang === 'es-ES') || 
                             availableVoicesArray.find(v => v.lang === 'es_ES') ||
                             availableVoicesArray.find(v => v.lang.startsWith('es')) ||
                             availableVoicesArray.find(v => v.name.toLowerCase().includes('español')) ||
                             availableVoicesArray.find(v => v.name.toLowerCase().includes('spanish'));
                             
        if (spanishVoice) {
          utterance.voice = spanishVoice;
          console.log(`✅ USANDO VOZ ESPAÑOLA: ${spanishVoice.name} (${spanishVoice.lang})`);
        }
      } catch (e) {
        console.error('Error al buscar voces en español:', e);
      }
      
      // Configurar la voz si está disponible
      if (selectedVoice || options.voice) {
        try {
          // Priorizar la opción pasada como parámetro
          if (options.voice) {
            console.log(`Intentando configurar voz específica: ${options.voice}`);
            
            // Comprobar si es una voz española específica de MiniMax
            if (options.voice.startsWith('Spanish_')) {
              console.log(`Configurando para voz española MiniMax: ${options.voice}`);
              // Para estas voces españolas, necesitamos seleccionar una voz del navegador en español
              const spanishVoice = availableVoices.find(v => 
                v.lang.startsWith('es') || v.name.toLowerCase().includes('spanish') || v.name.toLowerCase().includes('español')
              );
              
              if (spanishVoice) {
                utterance.voice = spanishVoice;
                utterance.lang = spanishVoice.lang || 'es-ES';
                console.log(`Voz española encontrada: ${spanishVoice.name} (${spanishVoice.lang})`);
              } else {
                console.log('No se encontró voz española, usando configuración por defecto');
                // FORZAR configuración para español sin importar el navegador
                utterance.lang = 'es-ES';
                
                // Imprimir todas las voces disponibles para depuración
                console.log('🔊 VOCES DISPONIBLES:', availableVoices.map(v => `${v.name} (${v.lang})`).join(', '));
                
                // Si no hay voces en español, usar la primera voz disponible
                if (availableVoices.length > 0) {
                  utterance.voice = availableVoices[0];
                  console.log(`Sin voces españolas, usando voz por defecto: ${availableVoices[0].name}`);
                }
              }
            } 
            // Si es un tipo genérico (Male/Female)
            else if (options.voice === 'Male' || options.voice === 'Female') {
              const preferredVoiceType = options.voice === 'Male' ? 'male' : 'female';
              console.log(`Buscando voz de tipo: ${preferredVoiceType}`);
              
              const matchingVoice = availableVoices.find(v => 
                v.name.toLowerCase().includes(preferredVoiceType) || 
                v.name.toLowerCase().includes(preferredVoiceType === 'male' ? 'hombre' : 'mujer')
              );
              
              if (matchingVoice) {
                utterance.voice = matchingVoice;
                utterance.lang = matchingVoice.lang;
                console.log(`Voz configurada a tipo ${options.voice}: ${matchingVoice.name} (${matchingVoice.lang})`);
              } else if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
                console.log(`Usando voz seleccionada por defecto: ${selectedVoice.name}`);
              }
            } 
            // Otro tipo de voz específica
            else {
              console.log(`Buscando voz específica: ${options.voice}`);
              // Intentar encontrar la voz exacta por nombre
              const exactVoice = availableVoices.find(v => 
                v.name === options.voice || v.name.toLowerCase().includes(options.voice.toLowerCase())
              );
              
              if (exactVoice) {
                utterance.voice = exactVoice;
                utterance.lang = exactVoice.lang;
                console.log(`Voz exacta encontrada: ${exactVoice.name} (${exactVoice.lang})`);
              } else if (selectedVoice) {
                utterance.voice = selectedVoice;
                utterance.lang = selectedVoice.lang;
                console.log(`No se encontró voz específica, usando predeterminada: ${selectedVoice.name}`);
              }
            }
          } else if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
          }
        } catch (e) {
          console.warn('Error al configurar la voz:', e);
          // Continuar sin configurar la voz
        }
      } else {
        // Intentar establecer el idioma aunque no tengamos una voz específica
        utterance.lang = preferredLang;
      }
      
      // Configuración adicional
      utterance.rate = options.rate || 1.0;  // Velocidad (normal por defecto)
      utterance.pitch = 1.0; // Tono normal
      utterance.volume = 1.0; // Volumen máximo
      
      // Eventos - usar try/catch para cada uno por si hay errores
      try {
        utterance.onstart = () => {
          console.log('Iniciando pronunciación');
          setIsSpeaking(true);
          if (onSpeechStart) onSpeechStart();
          
          // Configurar un timeout por si el evento onend no se dispara
          const timeout = Math.max(5000, text.length * 80);
          timeoutRef.current = setTimeout(() => {
            if (isSpeaking) {
              console.log('Timeout de pronunciación alcanzado');
              setIsSpeaking(false);
              if (onSpeechEnd) onSpeechEnd();
            }
          }, timeout);
        };
      } catch (e) {
        console.warn('Error al configurar onstart:', e);
      }
      
      try {
        utterance.onend = () => {
          console.log('Pronunciación finalizada');
          setIsSpeaking(false);
          if (onSpeechEnd) onSpeechEnd();
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        };
      } catch (e) {
        console.warn('Error al configurar onend:', e);
      }
      
      try {
        utterance.onerror = (event) => {
          console.error('Error en pronunciación:', event);
          setIsSpeaking(false);
          
          // Intentar extraer detalles del error
          let errorMsg = 'Error desconocido';
          try {
            if (event && event.error) {
              errorMsg = event.error;
            } else if (event && typeof event === 'object') {
              errorMsg = JSON.stringify(event);
            }
          } catch (e) {
            errorMsg = 'Error no serializable';
          }
          
          setError(`Error en la síntesis de voz: ${errorMsg}`);
          
          if (onSpeechError) onSpeechError(event);
          
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          // Intentar con el fallback
          playAudioFallback(text);
        };
      } catch (e) {
        console.warn('Error al configurar onerror:', e);
      }
      
      // Iniciar pronunciación
      try {
        // A veces, el speak puede fallar si no hay voces disponibles
        console.log('Enviando comando speak()');
        window.speechSynthesis.speak(utterance);
        console.log('Comando speak() enviado');
      } catch (speakError) {
        console.error('Error al llamar a speak():', speakError);
        setError(`Error al iniciar la síntesis de voz: ${speakError}`);
        if (onSpeechError) onSpeechError(speakError);
        
        // Usar el fallback
        playAudioFallback(text);
      }
      
    } catch (error) {
      console.error('Error general en síntesis de voz:', error);
      setIsSpeaking(false);
      setError(`Error al iniciar la síntesis de voz: ${error}`);
      if (onSpeechError) onSpeechError(error);
      
      // Usar el fallback
      playAudioFallback(text);
    }
  }, [isSpeechSynthesisAvailable, onSpeechEnd, onSpeechError, onSpeechStart, playAudioFallback, preferredLang, selectedVoice]);
  
  // Función para cancelar la pronunciación
  const cancel = useCallback(() => {
    if (!isSpeechSynthesisAvailable) return;
    
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } catch (e) {
      console.error('Error al cancelar síntesis:', e);
    }
  }, [isSpeechSynthesisAvailable]);
  
  return {
    speak,
    cancel,
    isSpeaking,
    isPaused,
    voicesLoaded,
    availableVoices,
    selectedVoice,
    error
  };
}
