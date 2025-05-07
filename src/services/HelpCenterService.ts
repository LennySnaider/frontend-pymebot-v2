/**
 * frontend/src/services/HelpCenterService.ts
 * Servicio para interactuar con el centro de ayuda y artículos de soporte
 * @version 1.0.0
 * @updated 2025-06-05
 */

import axios from 'axios';

// Configuración de las API y endpoints
const API_BASE_URL = '/api';
const HELP_CENTER_ENDPOINT = `${API_BASE_URL}/helps`;

/**
 * Obtiene los artículos del centro de soporte según los filtros proporcionados
 * @param params Parámetros de búsqueda (query y topic)
 * @returns Lista de artículos que coinciden con los criterios de búsqueda
 */
export const apiGetSupportHubArticles = async <T, D = any>(params: D): Promise<T> => {
  try {
    const { data } = await axios.get(`${HELP_CENTER_ENDPOINT}/articles`, {
      params,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene las categorías y artículos populares para el centro de soporte
 * @returns Categorías y artículos populares
 */
export const apiGetSupportHubCategories = async <T>(): Promise<T> => {
  try {
    const { data } = await axios.get(`${HELP_CENTER_ENDPOINT}/categories`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene un artículo específico por su ID
 * @param id ID del artículo a obtener
 * @returns Detalles del artículo
 */
export const apiGetSupportHubArticle = async <T>(id: string): Promise<T> => {
  try {
    const { data } = await axios.get(`${HELP_CENTER_ENDPOINT}/articles/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Marca un artículo como favorito/destacado
 * @param id ID del artículo
 * @param starred Estado de favorito
 * @returns Respuesta de la operación
 */
export const apiStarSupportHubArticle = async <T>(id: string, starred: boolean): Promise<T> => {
  try {
    const { data } = await axios.put(`${HELP_CENTER_ENDPOINT}/articles/${id}/star`, {
      starred,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Registra una vista para un artículo
 * @param id ID del artículo
 * @returns Respuesta de la operación
 */
export const apiViewSupportHubArticle = async <T>(id: string): Promise<T> => {
  try {
    const { data } = await axios.put(`${HELP_CENTER_ENDPOINT}/articles/${id}/view`);
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Añade un comentario a un artículo
 * @param id ID del artículo
 * @param comment Contenido del comentario
 * @returns Respuesta de la operación
 */
export const apiAddSupportHubArticleComment = async <T>(id: string, comment: string): Promise<T> => {
  try {
    const { data } = await axios.post(`${HELP_CENTER_ENDPOINT}/articles/${id}/comments`, {
      content: comment,
    });
    return data;
  } catch (error) {
    throw error;
  }
};