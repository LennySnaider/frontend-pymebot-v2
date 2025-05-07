/**
 * Servicio para interactuar con las APIs de Minimax
 * @version 1.0.0
 * @updated 2025-04-14
 */

// Interfaces para las respuestas de la API
interface MinimaxTTSResponse {
  base_resp: {
    status_code: number;
    status_msg?: string;
  };
  data?: {
    audio: string; // Audio en formato hexadecimal
    extra_info: {
      audio_length: number;
      audio_size: number;
    };
  };
}

interface MinimaxSTTResponse {
  text: string;
  language?: string;
  duration?: number;
}

// Interfaces para configuración
interface TTSVoiceSettings {
  voice_id: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry';
  speed?: number;
  vol?: number;
  pitch?: number;
}

interface TTSAudioSettings {
  format: 'mp3' | 'wav';
  sample_rate: number;
  bitrate: number;
  channel: number;
}

/**
 * Servicio para interacción con la API Text-to-Speech de Minimax
 * @param text - Texto a convertir en voz
 * @param voiceSettings - Configuración de la voz
 * @param audioSettings - Configuración del audio
 * @returns Blob de audio
 */
export async function synthesizeSpeech(
  text: string,
  voiceSettings: TTSVoiceSettings = {
    voice_id: 'female-tianmei-jingpin',
    emotion: 'neutral',
    speed: 1.0,
    vol: 1.0,
    pitch: 0
  },
  audioSettings: TTSAudioSettings = {
    format: 'mp3',
    sample_rate: 24000,
    bitrate: 128000,
    channel: 1
  }
): Promise<Blob> {
  // En un entorno real, estas serían variables de entorno
  const API_KEY = process.env.NEXT_PUBLIC_MINIMAX_API_KEY || '';
  const GROUP_ID = process.env.NEXT_PUBLIC_MINIMAX_GROUP_ID || '';
  
  if (!API_KEY || !GROUP_ID) {
    throw new Error('Faltan las credenciales de Minimax (API_KEY o GROUP_ID)');
  }
  
  try {
    const response = await fetch(
      `https://api.minimax.chat/v1/t2a_v2?GroupId=${GROUP_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "speech-02-hd",
          text: text,
          voice_setting: voiceSettings,
          audio_setting: audioSettings,
          stream: false
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error al llamar a la API de Minimax TTS: ${response.status} ${response.statusText}`);
    }
    
    const result: MinimaxTTSResponse = await response.json();
    
    if (result.base_resp.status_code !== 0) {
      throw new Error(`Error en la respuesta de Minimax TTS: ${result.base_resp.status_msg || 'Desconocido'}`);
    }
    
    if (!result.data?.audio) {
      throw new Error('No se recibió audio en la respuesta de Minimax TTS');
    }
    
    // Convertir el audio hexadecimal a Blob
    const audioBuffer = hexToBuffer(result.data.audio);
    return new Blob([audioBuffer], { type: audioSettings.format === 'mp3' ? 'audio/mp3' : 'audio/wav' });
    
  } catch (error) {
    console.error('Error en la síntesis de voz:', error);
    throw error;
  }
}

/**
 * Servicio para interacción con la API Speech-to-Text de Minimax
 * @param audioBlob - Blob de audio a transcribir
 * @param language - Idioma del audio (opcional)
 * @returns Texto transcrito
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language: string = 'es'
): Promise<string> {
  // En un entorno real, estas serían variables de entorno
  const API_KEY = process.env.NEXT_PUBLIC_MINIMAX_API_KEY || '';
  const GROUP_ID = process.env.NEXT_PUBLIC_MINIMAX_GROUP_ID || '';
  
  if (!API_KEY || !GROUP_ID) {
    throw new Error('Faltan las credenciales de Minimax (API_KEY o GROUP_ID)');
  }
  
  try {
    // Crear FormData
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    formData.append('language', language);
    
    const response = await fetch(
      `https://api.minimax.chat/v1/audio/transcriptions?GroupId=${GROUP_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        body: formData
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error al llamar a la API de Minimax STT: ${response.status} ${response.statusText}`);
    }
    
    const result: MinimaxSTTResponse = await response.json();
    
    if (!result.text) {
      throw new Error('No se recibió texto en la respuesta de Minimax STT');
    }
    
    return result.text;
    
  } catch (error) {
    console.error('Error en la transcripción de audio:', error);
    throw error;
  }
}

/**
 * Convierte una cadena hexadecimal en un ArrayBuffer
 * @param hex - Cadena hexadecimal
 * @returns ArrayBuffer
 */
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// NOTA: En un entorno de vista previa, estos servicios no se llamarán directamente
// sino que se simularán para probar la interfaz
