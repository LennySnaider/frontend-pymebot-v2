/**
 * frontend/src/services/StorageService.ts
 * Servicio para gestionar operaciones con el almacenamiento de Supabase.
 * Proporciona métodos para subir, descargar y eliminar archivos.
 * Se ha mejorado para aumentar la fiabilidad en la creación de buckets y manejo de errores.
 *
 * @version 1.2.0
 * @updated 2025-06-24
 */

import { supabase, SupabaseClient } from './supabase/SupabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

// Nombre del bucket en Supabase Storage
const BUCKET_NAME = 'properties' // Asegúrate de que el bucket se llame igual que en Supabase

/**
 * Tipo de respuesta para la subida de imágenes
 */
interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

// Variable global para evitar verificar el bucket en cada operación
let bucketVerified = false

/**
 * Verifica si el bucket existe y lo crea si no existe
 * Implementa reintentos para mayor fiabilidad
 */
export const ensureBucketExists = async (): Promise<boolean> => {
  // Si ya verificamos el bucket previamente, retornar true inmediatamente
  if (bucketVerified) {
    return true
  }
  
  try {
    // Obtener instancia fresca del cliente Supabase
    const supabase = SupabaseClient.getInstance()
    
    // Comprobar si el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error al listar buckets:', listError)
      // No intentar crear el bucket automáticamente debido a políticas RLS
      bucketVerified = false
      return false
    }
    
    // Verificar si el bucket ya existe
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME)
    
    // Si no existe, no intentar crearlo debido a políticas RLS
    if (!bucketExists) {
      console.log(`Bucket '${BUCKET_NAME}' no encontrado. No se puede crear automáticamente debido a políticas RLS.`)
      bucketVerified = false
      return false
    } else {
      console.log(`Bucket '${BUCKET_NAME}' ya existe`)
    }
    
    // Marcar como verificado para evitar comprobaciones redundantes
    bucketVerified = true
    return true
    
  } catch (error) {
    console.error('Error en ensureBucketExists:', error)
    return false
  }
}

/**
 * Sube una imagen de propiedad a Supabase Storage
 * Mejorado con múltiples reintentos y manejo de errores
 * 
 * @param file Archivo a subir
 * @param propertyId ID de la propiedad
 * @returns Resultado de la operación con URL pública si es exitosa
 */
export const uploadPropertyImage = async (
  file: File,
  propertyId: string
): Promise<UploadResult> => {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Intento ${attempts}/${maxAttempts} de subir imagen para propiedad ${propertyId}`);
    
    try {
      // Obtener instancia fresca del cliente Supabase para cada intento
      const supabaseClient = SupabaseClient.getInstance();
      
      // Asegurar que existe el bucket
      const bucketExists = await ensureBucketExists();
      if (!bucketExists) {
        console.log(`Intento ${attempts}: No se pudo verificar/crear el bucket`);
        if (attempts === maxAttempts) {
          return {
            success: false,
            error: 'No se pudo acceder o crear el bucket de almacenamiento después de varios intentos'
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar antes de reintentar
        continue;
      }
      
      // Obtener el tenant_id actual o usar un valor predeterminado
      let tenantId;
      try {
        tenantId = await getTenantFromSession();
      } catch (error) {
        console.warn('Error al obtener tenant_id, usando "default":', error);
        tenantId = 'default';
      }
      
      if (!tenantId) {
        console.warn('No se pudo obtener tenant_id, usando "default"');
        tenantId = 'default';
      }
      
      // Generar un nombre único para el archivo (diferente en cada intento)
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${uuidv4()}_${attempts}.${fileExt}`;
      
      // Construir la ruta dentro del bucket (organizada por tenant/propiedad)
      const filePath = `${tenantId}/${propertyId}/${fileName}`;
      
      console.log(`Intento ${attempts}: Subiendo archivo a ${BUCKET_NAME}/${filePath}...`);
      
      // Subir el archivo a Supabase Storage
      const { data, error: uploadError } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600', // 1 hora de cache
          upsert: true // Permitir sobreescribir para mayor fiabilidad
        });
      
      if (uploadError) {
        console.error(`Intento ${attempts}: Error al subir la imagen a Storage:`, uploadError);
        
        if (attempts < maxAttempts) {
          // Esperar un poco antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        return {
          success: false,
          error: uploadError.message
        };
      }
      
      console.log(`Intento ${attempts}: Archivo subido correctamente. Obteniendo URL pública...`);
      
      // Obtener la URL pública
      const { data: urlData } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
        
      if (urlData?.publicUrl) {
        console.log(`Intento ${attempts}: URL pública obtenida:`, urlData.publicUrl);
        return {
          success: true,
          url: urlData.publicUrl,
          path: filePath
        };
      }
      
      if (attempts < maxAttempts) {
        console.warn(`Intento ${attempts}: No se pudo obtener la URL pública, reintentando...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      return {
        success: false,
        error: 'No se pudo obtener la URL pública después de varios intentos'
      };
      
    } catch (error) {
      console.error(`Intento ${attempts}: Error general en uploadPropertyImage:`, error);
      
      if (attempts < maxAttempts) {
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en la subida de imagen'
      };
    }
  }
  
  // Este punto no debería alcanzarse nunca, pero por si acaso
  return {
    success: false,
    error: 'Error inesperado en la subida de imagen'
  };
}

/**
 * Elimina un archivo del Storage de Supabase
 * Mejorado con reintentos y mejor manejo de errores
 * 
 * @param filePath Ruta del archivo en el bucket
 * @returns Resultado de la operación
 */
export const deleteFile = async (
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  const maxAttempts = 3;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`Intento ${attempt}/${maxAttempts}: Eliminando archivo: ${BUCKET_NAME}/${filePath}...`)
      
      // Obtener una instancia fresca del cliente Supabase para cada intento
      const supabaseClient = SupabaseClient.getInstance();
      
      const { error } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .remove([filePath])
      
      if (error) {
        console.error(`Intento ${attempt}/${maxAttempts}: Error al eliminar archivo:`, error)
        
        // Si este es el último intento, fallamos
        if (attempt === maxAttempts) {
          return {
            success: false,
            error: error.message
          }
        }
        
        // Esperamos antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      console.log(`Archivo eliminado correctamente: ${filePath}`)
      return {
        success: true
      }
    } catch (error) {
      console.error(`Intento ${attempt}/${maxAttempts}: Error inesperado al eliminar archivo:`, error)
      
      // Si este es el último intento, fallamos
      if (attempt === maxAttempts) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }
      }
      
      // Esperamos antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return {
    success: false,
    error: 'Se excedió el número máximo de intentos'
  }
}

/**
 * Elimina todos los archivos asociados a una propiedad
 * Versión mejorada con reintentos y procesamiento en lotes para mayor fiabilidad
 * 
 * @param propertyId ID de la propiedad
 * @returns Resultado de la operación
 */
export const deletePropertyFiles = async (
  propertyId: string
): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
  try {
    // Obtener el tenant_id actual o usar un valor por defecto según sea necesario
    let tenantId;
    try {
      tenantId = await getTenantFromSession()
    } catch (error) {
      console.warn('Error al obtener tenant_id, usando "default":', error)
      tenantId = 'default'
    }
    
    if (!tenantId) {
      console.warn('No se pudo obtener el tenant_id, usando "default"')
      tenantId = 'default'
    }
    
    console.log(`Listando archivos para propiedad: ${tenantId}/${propertyId}...`)
    
    // Obtener una instancia fresca de Supabase
    const supabaseClient = SupabaseClient.getInstance();
    
    // Listar todos los archivos en la carpeta de la propiedad
    const { data: files, error: listError } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .list(`${tenantId}/${propertyId}`)
    
    if (listError) {
      console.error('Error al listar archivos:', listError)
      return {
        success: false,
        error: listError.message,
        deletedCount: 0
      }
    }
    
    if (!files || files.length === 0) {
      console.log(`No se encontraron archivos para la propiedad ${propertyId}`)
      return {
        success: true,
        deletedCount: 0
      }
    }
    
    console.log(`Encontrados ${files.length} archivos para eliminar`)
    
    // Construir rutas completas para eliminar
    const filePaths = files.map(file => `${tenantId}/${propertyId}/${file.name}`)
    
    // Dividir en lotes para no sobrecargar la API (máximo 100 archivos por operación)
    const BATCH_SIZE = 50
    const batches = []
    
    for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
      batches.push(filePaths.slice(i, i + BATCH_SIZE))
    }
    
    let totalDeleted = 0
    let lastError = null
    
    // Eliminar por lotes
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`Eliminando lote ${i+1}/${batches.length} con ${batch.length} archivos...`)
      
      try {
        const { error: deleteError } = await supabaseClient.storage
          .from(BUCKET_NAME)
          .remove(batch)
        
        if (deleteError) {
          console.error(`Error al eliminar lote ${i+1}:`, deleteError)
          lastError = deleteError
        } else {
          totalDeleted += batch.length
          console.log(`Lote ${i+1} eliminado correctamente (${batch.length} archivos)`)
        }
      } catch (error) {
        console.error(`Error inesperado al eliminar lote ${i+1}:`, error)
        lastError = error
        
        // Si hay un error en un lote, intentamos eliminar archivo por archivo
        console.log(`Intentando eliminación individual para el lote ${i+1}`)
        
        for (const filePath of batch) {
          try {
            const result = await deleteFile(filePath)
            if (result.success) {
              totalDeleted++
            }
          } catch (innerError) {
            console.error(`No se pudo eliminar ${filePath}:`, innerError)
          }
        }
      }
      
      // Pausar brevemente entre lotes para evitar limitaciones de la API
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
    
    // Informar del resultado
    if (totalDeleted === filePaths.length) {
      console.log(`Todos los ${totalDeleted} archivos eliminados correctamente`)
      return {
        success: true,
        deletedCount: totalDeleted
      }
    } else {
      console.warn(`Se eliminaron ${totalDeleted} de ${filePaths.length} archivos`)
      return {
        success: totalDeleted > 0, // Éxito parcial si se eliminó al menos uno
        error: lastError ? (lastError instanceof Error ? lastError.message : String(lastError)) : 'Algunos archivos no pudieron ser eliminados',
        deletedCount: totalDeleted
      }
    }
  } catch (error) {
    console.error('Error general en deletePropertyFiles:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      deletedCount: 0
    }
  }
}

/**
 * Obtiene todas las URLs públicas de las imágenes de una propiedad
 * 
 * @param propertyId ID de la propiedad
 * @returns Lista de URLs públicas
 */
export const getPropertyImages = async (
  propertyId: string
): Promise<{ success: boolean; images?: {url: string, path: string}[]; error?: string }> => {
  try {
    // Obtener el tenant_id actual
    const tenantId = await getTenantFromSession()
    
    if (!tenantId) {
      return {
        success: false,
        error: 'No se pudo obtener el tenant_id para listar imágenes'
      }
    }
    
    // Listar todos los archivos en la carpeta de la propiedad
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${tenantId}/${propertyId}`)
    
    if (listError) {
      console.error('Error al listar archivos:', listError)
      return {
        success: false,
        error: listError.message
      }
    }
    
    if (!files || files.length === 0) {
      return {
        success: true,
        images: []
      }
    }
    
    // Obtener URLs públicas para todos los archivos
    const images = files.map(file => {
      const path = `${tenantId}/${propertyId}/${file.name}`
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path)
      
      return {
        url: data.publicUrl,
        path
      }
    })
    
    return {
      success: true,
      images
    }
    
  } catch (error) {
    console.error('Error en getPropertyImages:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

export default {
  uploadPropertyImage,
  deleteFile,
  deletePropertyFiles,
  getPropertyImages,
  ensureBucketExists
}