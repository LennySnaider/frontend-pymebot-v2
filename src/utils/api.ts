/**
 * Utilidades para manejo de la API
 */

import axios, { AxiosError } from 'axios';

/**
 * Formatea un error para mostrar información útil
 * @param error Error a formatear
 * @returns Mensaje de error formateado
 */
export function formatError(error: any): string {
  // Si es un error de Axios
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Si hay un mensaje de error en la respuesta
    if (axiosError.response?.data) {
      const data = axiosError.response.data as any;
      
      if (typeof data === 'string') {
        return data;
      }
      
      if (data.message) {
        return data.message;
      }
      
      if (data.error) {
        return data.error;
      }
    }
    
    // Si hay un mensaje de error en el código de estado
    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      const statusText = axiosError.response.statusText;
      
      return `${status} ${statusText}`;
    }
    
    // Si hay un mensaje de error en el error
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  
  // Si es un objeto Error
  if (error instanceof Error) {
    return error.message;
  }
  
  // Si es un string
  if (typeof error === 'string') {
    return error;
  }
  
  // Si es otro tipo de objeto
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch (e) {
      return 'Error desconocido (objeto no serializable)';
    }
  }
  
  // Fallback
  return 'Error desconocido';
}

/**
 * Genera una URL de API con query params
 * @param path Ruta de la API
 * @param params Parámetros de query
 * @returns URL completa
 */
export function generateApiUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  // Remover slash inicial si existe
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Construir URL base
  let url = `/api/${normalizedPath}`;
  
  // Añadir query params si existen
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }
    
    url += `?${queryParams.toString()}`;
  }
  
  return url;
}

/**
 * Checks if a value is a valid UUID
 * @param value Value to check
 * @returns True if valid UUID
 */
export function isValidUuid(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}