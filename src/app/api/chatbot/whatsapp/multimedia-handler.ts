/**
 * frontend/src/app/api/chatbot/whatsapp/multimedia-handler.ts
 * Gestión de contenido multimedia para WhatsApp
 * 
 * @version 1.0.0
 * @created 2025-07-05
 */

import axios from 'axios'
import { WhatsAppService } from './whatsapp-service'
import { supabase } from '@/services/supabase/SupabaseClient'

/**
 * Tipos de contenido multimedia soportados
 */
export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VOICE = 'voice',
  VIDEO = 'video',
  DOCUMENT = 'document'
}

/**
 * Interfaz para metadatos de un archivo multimedia
 */
export interface MediaMetadata {
  id: string;
  mimeType?: string;
  sha256?: string;
  fileSize?: number;
  fileName?: string;
  originalUrl?: string;
  internalUrl?: string;
  caption?: string;
}

/**
 * Interfaz para un mensaje multimedia procesado
 */
export interface ProcessedMediaMessage {
  mediaType: MediaType;
  metadata: MediaMetadata;
  textContent?: string;
  detectedObjects?: string[];
  transcription?: string;
  processingError?: string;
}

/**
 * Clase para gestionar contenido multimedia de WhatsApp
 */
export class WhatsAppMediaHandler {
  private whatsappService: WhatsAppService;
  private accessToken: string;
  
  /**
   * Constructor del manejador de multimedia
   * 
   * @param accessToken Token de acceso para la API de WhatsApp
   */
  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.whatsappService = new WhatsAppService(accessToken);
  }
  
  /**
   * Procesa un mensaje multimedia de WhatsApp
   * 
   * @param tenantId ID del tenant
   * @param mediaId ID del contenido multimedia en WhatsApp
   * @param mediaType Tipo de contenido multimedia
   * @param caption Texto opcional adjunto al contenido (ej: caption de una imagen)
   * @returns Mensaje multimedia procesado con metadatos
   */
  async processMediaMessage(
    tenantId: string,
    mediaId: string,
    mediaType: MediaType,
    caption?: string
  ): Promise<ProcessedMediaMessage> {
    try {
      // Obtener URL para descargar el contenido
      const mediaUrl = await this.getMediaUrl(mediaId);
      
      // Descargar el contenido multimedia
      const response = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'arraybuffer'
      });
      
      // Detectar el tipo MIME real del contenido
      const mimeType = response.headers['content-type'] || this.getMimeTypeFromMediaType(mediaType);
      
      // Crear nombre de archivo basado en el mediaId y el tipo
      const fileName = `${mediaId}.${this.getFileExtension(mimeType)}`;
      
      // Generar metadatos básicos
      const metadata: MediaMetadata = {
        id: mediaId,
        mimeType,
        fileSize: response.data.length,
        fileName,
        originalUrl: mediaUrl,
        caption
      };
      
      // Guardar temporalmente el archivo y generar URL accesible internamente
      const { internalUrl, error } = await this.storeMediaFile(
        tenantId,
        mediaId,
        response.data,
        fileName,
        mimeType
      );
      
      if (error) {
        throw new Error(`Error al almacenar archivo multimedia: ${error.message}`);
      }
      
      metadata.internalUrl = internalUrl;
      
      // Procesar según el tipo de contenido
      let processedMessage: ProcessedMediaMessage = {
        mediaType,
        metadata,
        textContent: caption
      };
      
      // Procesar según el tipo de contenido
      switch (mediaType) {
        case MediaType.IMAGE:
          // En una versión futura, podríamos integrar análisis de imágenes
          // processedMessage.detectedObjects = await this.analyzeImage(internalUrl);
          break;
          
        case MediaType.AUDIO:
        case MediaType.VOICE:
          // En una versión futura, podríamos integrar transcripción de audio
          // processedMessage.transcription = await this.transcribeAudio(internalUrl);
          break;
      }
      
      return processedMessage;
    } catch (error: any) {
      console.error(`Error al procesar contenido multimedia (${mediaType}):`, error);
      
      return {
        mediaType,
        metadata: { id: mediaId, caption },
        processingError: error.message
      };
    }
  }
  
  /**
   * Obtiene la URL para descargar un contenido multimedia
   * 
   * @param mediaId ID del contenido multimedia en WhatsApp
   * @returns URL para descargar el contenido
   */
  private async getMediaUrl(mediaId: string): Promise<string> {
    const apiVersion = 'v18.0';
    const url = `https://graph.facebook.com/${apiVersion}/${mediaId}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.data || !response.data.url) {
        throw new Error('No se pudo obtener la URL del contenido multimedia');
      }
      
      return response.data.url;
    } catch (error: any) {
      console.error('Error al obtener URL de contenido multimedia:', error?.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Almacena un archivo multimedia en el storage de Supabase
   * 
   * @param tenantId ID del tenant
   * @param mediaId ID del contenido multimedia
   * @param data Datos binarios del archivo
   * @param fileName Nombre del archivo
   * @param mimeType Tipo MIME del archivo
   * @returns URL interna para acceder al archivo
   */
  private async storeMediaFile(
    tenantId: string,
    mediaId: string,
    data: ArrayBuffer,
    fileName: string,
    mimeType: string
  ): Promise<{ internalUrl?: string, error?: Error }> {
    try {
      // Crear una ruta específica para cada tenant y tipo de contenido
      const mediaParts = fileName.split('.');
      const extension = mediaParts.length > 1 ? mediaParts.pop() : '';
      const mediaType = this.getMediaTypeFromMimeType(mimeType);
      const path = `tenants/${tenantId}/whatsapp/${mediaType}/${mediaId}.${extension}`;
      
      // Subir el archivo a Supabase Storage
      const { data: uploadData, error } = await supabase.storage
        .from('chatbot_media')
        .upload(path, data, {
          contentType: mimeType,
          upsert: true
        });
      
      if (error) {
        return { error: new Error(`Error al subir archivo: ${error.message}`) };
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('chatbot_media')
        .getPublicUrl(path);
      
      return { internalUrl: urlData.publicUrl };
    } catch (error: any) {
      return { error };
    }
  }
  
  /**
   * Obtiene el tipo MIME basado en el tipo de multimedia
   * 
   * @param mediaType Tipo de multimedia
   * @returns Tipo MIME por defecto para ese tipo de media
   */
  private getMimeTypeFromMediaType(mediaType: MediaType): string {
    switch (mediaType) {
      case MediaType.IMAGE:
        return 'image/jpeg';
      case MediaType.AUDIO:
      case MediaType.VOICE:
        return 'audio/mpeg';
      case MediaType.VIDEO:
        return 'video/mp4';
      case MediaType.DOCUMENT:
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }
  
  /**
   * Obtiene la extensión de archivo basado en el tipo MIME
   * 
   * @param mimeType Tipo MIME
   * @returns Extensión de archivo
   */
  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    
    return mimeToExt[mimeType] || 'bin';
  }
  
  /**
   * Determina el tipo de contenido multimedia basado en el MIME type
   * 
   * @param mimeType Tipo MIME
   * @returns Tipo de contenido multimedia
   */
  private getMediaTypeFromMimeType(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'images';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else {
      return 'documents';
    }
  }
}