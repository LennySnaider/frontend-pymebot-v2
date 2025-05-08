/**
 * frontend/src/services/supabase/SupabaseClient.ts
 * Cliente centralizado de Supabase para la aplicación.
 * Patrón Singleton para proporcionar una única instancia del cliente Supabase.
 * 
 * @version 2.2.1
 * @updated 2025-07-05
 */

import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js'

// Valores de configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJh...ejemplo...cCI6IkpXVCJ9'

// Verificar si las variables de entorno están definidas
if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar definidas',
    { supabaseUrl: supabaseUrl ? 'Configurada' : 'NO CONFIGURADA', 
      supabaseKey: supabaseKey ? 'Configurada' : 'NO CONFIGURADA' }
  )
}

// Headers personalizados que incluyen siempre la API key
const customHeaders = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Prefer': 'return=representation'
};

/**
 * Clase que implementa el patrón Singleton para el cliente Supabase
 */
export class SupabaseClient {
  private static instance: SupabaseClientType;
  private static connectionVerified: boolean = false;
  private static lastConnectionCheck: number = 0;
  private static connectionError: Error | null = null;

  /**
   * Obtiene la instancia única del cliente Supabase
   * @returns La instancia del cliente Supabase
   */
  public static getInstance(): SupabaseClientType {
    // Si ya tenemos una instancia y la conexión ha sido verificada, la devolvemos directamente
    if (SupabaseClient.instance && SupabaseClient.connectionVerified) {
      return SupabaseClient.instance;
    }

    // Si hay un error de conexión previo y han pasado menos de 30 segundos, lo reutilizamos
    // para evitar intentos continuos si el servicio está caído
    const now = Date.now();
    if (SupabaseClient.connectionError && (now - SupabaseClient.lastConnectionCheck) < 30000) {
      console.warn('Reusing previous connection error without retry:', SupabaseClient.connectionError.message);
      // Devolvemos la instancia existente a pesar del error, para que la aplicación pueda seguir funcionando
      // con datos locales o cachés si es posible.
      return SupabaseClient.instance || createClient(supabaseUrl, supabaseKey);
    }

    // Es hora de verificar la conexión nuevamente
    SupabaseClient.lastConnectionCheck = now;
    SupabaseClient.connectionError = null;

    // Verificar que tenemos las credenciales necesarias
    console.log('Verificando credenciales de Supabase...');
    console.log('Supabase URL:', supabaseUrl ? `Configurada (${supabaseUrl.substring(0, 15)}...)` : 'NO CONFIGURADA');
    console.log('Supabase Key:', supabaseKey ? 'Configurada (********)' : 'NO CONFIGURADA');

    try {
      // Si ya tenemos una instancia, sólo verificamos la conexión
      if (!SupabaseClient.instance) {
        console.log('Creando nueva instancia de Supabase...');
        SupabaseClient.instance = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
          global: {
            headers: customHeaders,
          },
        });
        console.log('Nueva instancia de Supabase creada.');
      } else {
        // console.log('Retornando instancia existente de Supabase.'); // Descomentar para debugging si es necesario
      }
      
      // NOTA: Deshabilitamos la verificación asincrónica para evitar problemas por promesas no resueltas
      // Esta verificación ahora se hace explícitamente en los server actions que necesitan Supabase
      SupabaseClient.connectionVerified = true;
      
      // Devolver la instancia
      return SupabaseClient.instance;
    } catch (error) {
       console.error('Error FATAL al crear/verificar la instancia de Supabase:', error);
       SupabaseClient.connectionError = error instanceof Error ? error : new Error(String(error));
       
       // Devolver un cliente no funcional con credenciales por defecto
       return createClient(supabaseUrl, supabaseKey);
    }
  }
}

// Crear el cliente Supabase para uso general
const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: customHeaders,
  },
});

console.log('Cliente Supabase principal inicializado correctamente.');

// Exportar el cliente como 'supabase' para compatibilidad con el código existente
export const supabase = supabaseClient;

// Exportar supabase como default para mantener compatibilidad
export default supabase;
