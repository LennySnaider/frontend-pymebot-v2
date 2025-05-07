/**
 * frontend/src/utils/setupChatbotTemplatesDB.js
 * Script para verificar la tabla de plantillas de chatbot en Supabase
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { supabase } from '@/services/supabase/SupabaseClient';
import { notifications } from '@/utils/notifications';

// Función para verificar si la tabla existe
export const checkTableExists = async (tableName) => {
  try {
    console.log(`Verificando si la tabla ${tableName} existe...`);
    
    // Método alternativo: intentar hacer una consulta directa a la tabla
    // Si la tabla no existe, dará un error específico que podemos identificar
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
      
    if (error) {
      // Error específico cuando la tabla no existe (code 42P01)
      if (error.code === '42P01') {
        console.error(`La tabla ${tableName} no existe.`);
        return false;
      }
      
      // Otros tipos de errores (permisos, etc.)
      console.error(`Error al verificar la tabla ${tableName}:`, error);
      return false;
    }
    
    // Si llegamos aquí, la tabla existe
    console.log(`La tabla ${tableName} existe.`);
    return true;
  } catch (error) {
    console.error(`Error inesperado al verificar la tabla ${tableName}:`, error);
    return false;
  }
};

// Función para inicializar la base de datos (debe ser llamada al inicio de la aplicación)
export const initializeChatbotDB = async () => {
  try {
    console.log('Verificando base de datos de chatbots...');
    
    // Primera verificación: método nuevo
    const tableExists = await checkTableExists('chatbot_templates');
    
    if (!tableExists) {
      console.log('La tabla chatbot_templates no existe según nuestra verificación.');
      
      // Segunda verificación: intentar consultar directamente para ver si es un problema de permisos
      try {
        const { count, error } = await supabase
          .from('chatbot_templates')
          .select('*', { count: 'exact', head: true });
          
        if (!error) {
          // Si no hay error, la tabla realmente existe pero hay otro problema
          console.log('La tabla parece existir pero hay algún problema de permisos o configuración.');
          return true;
        } else {
          // Si hay error aquí, es probable que realmente no exista la tabla
          console.log('Confirmado que la tabla no existe o no es accesible:', error);
          notifications.warning('La tabla chatbot_templates no existe o no es accesible. Contacte con el administrador de la base de datos.');
          return false;
        }
      } catch (innerError) {
        console.error('Error en la verificación secundaria:', innerError);
        notifications.warning('No se puede acceder a la tabla chatbot_templates. Contacte con el administrador de la base de datos.');
        return false;
      }
    } else {
      console.log('Base de datos de chatbots verificada correctamente');
      return true;
    }
  } catch (error) {
    console.error('Error al verificar la base de datos de chatbots:', error);
    return false;
  }
};

// Ejecutar la inicialización si se llama directamente
if (typeof window !== 'undefined') {
  // Solo ejecutar en el cliente
  window.initializeChatbotDB = initializeChatbotDB;
}

export default initializeChatbotDB;
