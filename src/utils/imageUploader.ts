/**
 * frontend/src/utils/imageUploader.ts
 * Utilidad para subir imágenes a Supabase Storage con control total del tipo MIME.
 * Implementa múltiples estrategias para garantizar que las imágenes se suban correctamente.
 * @version 1.0.0
 * @updated 2025-04-30
 */

// Variables de entorno para autenticación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface UploadedImageResult {
  url: string;          // URL completa con parámetros de caché
  baseUrl: string;      // URL base sin parámetros
  fileName: string;     // Nombre del archivo en el bucket
  fileType: string;     // Tipo MIME del archivo
  filePath: string;     // Ruta completa incluyendo bucket
  timestamp: number;    // Timestamp usado para el anti-caché
  extension: string;    // Extensión del archivo
}

/**
 * Sube una imagen a Supabase Storage usando fetch + FormData para control total de headers
 * Esta implementación evita problemas de tipo MIME incorrecto
 * @param file Archivo a subir
 * @param bucket Nombre del bucket (por defecto 'images')
 * @param folder Carpeta dentro del bucket (opcional)
 * @returns Información de la imagen subida
 */
export async function uploadImageDirect(
  file: File,
  bucket: string = 'images',
  folder: string = ''
): Promise<UploadedImageResult> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variables de entorno de Supabase no configuradas');
  }

  // Validar que el archivo es una imagen
  if (!file.type.startsWith('image/')) {
    throw new Error(`El archivo no es una imagen válida: ${file.type}`);
  }

  // Determinar la extensión basada en el tipo MIME
  let extension = '';
  switch (file.type) {
    case 'image/jpeg':
    case 'image/jpg':
      extension = 'jpg';
      break;
    case 'image/png':
      extension = 'png';
      break;
    case 'image/webp':
      extension = 'webp';
      break;
    case 'image/svg+xml':
      extension = 'svg';
      break;
    default:
      // Usar la extensión del nombre del archivo como fallback
      extension = file.name.split('.').pop() || 'png';
  }

  // Generar nombre de archivo único con timestamp
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  
  // Construir una ruta segura 
  const folderPrefix = folder ? `${folder}/` : '';
  const safeFileName = `${folderPrefix}image_${timestamp}_${randomId}.${extension}`;
  
  console.log('Preparando subida de imagen:', {
    fileName: safeFileName,
    fileType: file.type,
    fileSize: `${(file.size / 1024).toFixed(2)} KB`,
    bucket: bucket
  });

  try {
    // Crear un FormData para enviar el archivo con su tipo MIME intacto
    const formData = new FormData();
    formData.append('file', file);
    
    // URL del endpoint de almacenamiento de Supabase
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${safeFileName}`;
    
    // Headers con autorización pero SIN tipo de contenido para preservar el FormData boundary
    const headers = {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
      'x-upsert': 'true', // Equivalente a {upsert: true}
    };
    
    // Realizar la carga con fetch para control total
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: headers,
      body: formData,
    });
    
    // Verificar respuesta
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Error al subir imagen:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        errorText
      });
      throw new Error(`Error al subir imagen: ${uploadResponse.statusText}`);
    }
    
    // Construir la URL pública
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${safeFileName}`;
    
    // Realizar verificación de tipo del archivo
    const contentTypeCheck = await fetch(publicUrl, { method: 'HEAD' })
    .catch(() => null);
      
    if (contentTypeCheck?.ok) {
      const reportedContentType = contentTypeCheck.headers.get('content-type');
    console.log('Verificación de tipo MIME de la imagen:', {
    expected: file.type,
    actual: reportedContentType,
      path: safeFileName
      });
    
      // Si el tipo reportado es application/json pero debería ser una imagen,
    // intentamos una corrección
    if (reportedContentType === 'application/json' && file.type.startsWith('image/')) {
      console.warn('Tipo MIME incorrecto detectado, intentando corregir...');
      try {
        // Intentar una corrección manual usando la API updateBucket
        const correctHeaders = {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        };
        
        const payload = {
          contentType: file.type,
          cacheControl: '3600'
        };
        
        // Intentar actualizar los metadatos del archivo
        await fetch(`${supabaseUrl}/storage/v1/object/info/${bucket}/${safeFileName}`, {
          method: 'POST',
          headers: correctHeaders,
          body: JSON.stringify(payload)
        });
        
        console.log('Intento de corrección de tipo MIME completado');
      } catch (fixError) {
        console.error('Error al intentar corregir tipo MIME:', fixError);
      }
    }
  }
    
    // Crear URL con cache busting
    const cacheBustedUrl = `${publicUrl}?t=${timestamp}`;
    
    // Retornar información completa
    return {
      url: cacheBustedUrl,
      baseUrl: publicUrl,
      fileName: safeFileName,
      fileType: file.type,
      filePath: `${bucket}/${safeFileName}`,
      timestamp,
      extension,
    };
  } catch (error) {
    console.error('Error fatal en subida de imagen:', error);
    throw error;
  }
}

/**
 * Convierte un File o Blob a una data URL para previsualización
 * Útil para mostrar imágenes sin depender de URLs externas
 */
export function createLocalPreview(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Valida que un archivo sea una imagen y cumpla con los requisitos
 * @returns true si es válido, string con mensaje de error si no lo es
 */
export function validateImageFile(file: File): true | string {
  // Validar tipo de archivo
  const allowedFileTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
  ];
  
  if (!allowedFileTypes.includes(file.type)) {
    return 'Por favor sube una imagen en formato JPG, PNG, WebP o SVG.';
  }
  
  // Validar tamaño (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return 'El tamaño máximo permitido es 5MB.';
  }
  
  return true;
}
