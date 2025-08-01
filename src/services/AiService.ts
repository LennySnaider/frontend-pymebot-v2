/**
 * frontend/src/services/AiService.ts
 * Servicio para interactuar con APIs de IA para chat y generación de imágenes
 * @version 1.1.0
 * @updated 2025-08-05
 */

import axios from 'axios';

// Configuración de las API y endpoints
const API_BASE_URL = '/api';
const AI_CHAT_ENDPOINT = `${API_BASE_URL}/ai/chat`;
const AI_IMAGES_ENDPOINT = `${API_BASE_URL}/ai/images`;
const AI_CHATBOT_GENERATOR_ENDPOINT = `${API_BASE_URL}/ai/chatbot-generator`;

// Tipos de respuesta para post de chat
export interface PostAiChatResponseChoice {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
}

export interface PostAiChatResponse {
  id: string;
  choices: PostAiChatResponseChoice[];
  model: string;
  created: number;
}

// Tipos de respuesta para imágenes
export interface AiImageItem {
  id: string;
  url: string;
  prompt: string;
  created_at: string;
}

export interface GetImageResponse {
  data: AiImageItem[];
  loadable: boolean;
}

export interface PostImageResponse extends Array<AiImageItem> {}

// Tipos para generación de chatbots
export interface ChatbotGenerationOptions {
  vertical?: string;
  industry?: string;
  description?: string;
  features?: string[];
  complexity?: 'simple' | 'medium' | 'complex';
  language?: string;
  includeAI?: boolean;
  tenant_id?: string;
}

export interface ChatbotGenerationResponse {
  name: string;
  description: string;
  status: 'draft' | 'published';
  react_flow_json: {
    nodes: any[];
    edges: any[];
  };
  version: number;
}

/**
 * Envía un mensaje al API de chat IA
 * @param data Datos a enviar en la solicitud
 * @returns Respuesta del servidor de IA
 */
export const apiPostChat = async <T, D = any>(data: D): Promise<T> => {
  try {
    const response = await axios.post(AI_CHAT_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error en apiPostChat:', error);
    throw error;
  }
};

/**
 * Obtiene el historial de chat con la IA
 * @param data Parámetros para obtener el historial
 * @returns Historial de chat
 */
export const apiGetChatHistory = async <T, D = any>(data: D): Promise<T> => {
  try {
    const response = await axios.get(`${AI_CHAT_ENDPOINT}/history`, { params: data });
    return response.data;
  } catch (error) {
    console.error('Error en apiGetChatHistory:', error);
    throw error;
  }
};

/**
 * Envía una solicitud para generar imágenes con IA
 * @param data Datos para la generación de imágenes (prompt, configuración)
 * @returns Imágenes generadas
 */
export const apiPostImages = async <T, D = any>(data: D): Promise<T> => {
  try {
    const response = await axios.post(AI_IMAGES_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error en apiPostImages:', error);
    throw error;
  }
};

/**
 * Obtiene imágenes generadas previamente
 * @param data Parámetros para filtrar imágenes
 * @returns Lista de imágenes
 */
export const apiGetImages = async <T, D = any>(data: D): Promise<T> => {
  try {
    const response = await axios.get(AI_IMAGES_ENDPOINT, { params: data });
    return response.data;
  } catch (error) {
    console.error('Error en apiGetImages:', error);
    throw error;
  }
};

/**
 * Genera un flujo de chatbot utilizando IA
 * @param options Opciones para la generación del chatbot (vertical, industria, descripción, etc.)
 * @returns Flujo de chatbot generado en formato compatible con ReactFlow
 */
export const apiGenerateChatbotFlow = async (
  options: ChatbotGenerationOptions
): Promise<ChatbotGenerationResponse> => {
  try {
    const response = await axios.post(AI_CHATBOT_GENERATOR_ENDPOINT, options);
    return response.data;
  } catch (error) {
    console.error('Error en apiGenerateChatbotFlow:', error);
    throw error;
  }
};

// Exportamos todos los métodos
export default {
  apiPostChat,
  apiGetChatHistory,
  apiPostImages,
  apiGetImages,
  apiGenerateChatbotFlow
};