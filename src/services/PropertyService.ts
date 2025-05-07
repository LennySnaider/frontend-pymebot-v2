/**
 * frontend/src/services/PropertyService.ts
 * Servicio para gestionar operaciones con propiedades en Supabase.
 * Actualizado para soportar el campo colony y mejorar manejo de errores.
 * 
 * @version 2.3.0
 * @updated 2025-04-11
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient'

// Interface para respuestas API
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Servicio de propiedades
const PropertyService = {
  /**
   * Crea una nueva propiedad
   * 
   * @param propertyData Datos de la propiedad a crear
   * @returns Resultado de la operación
   */
  apiCreateProperty: async (propertyData: any): Promise<ApiResponse> => {
    try {
      const supabase = SupabaseClient.getInstance()
      console.log('API Create Property - Datos recibidos:', JSON.stringify(propertyData, null, 2))
      
      // Función auxiliar para manejar campos numéricos
      const safeNumber = (value: any): number | null => {
        if (value === '' || value === undefined || value === null) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };
      
      // Función auxiliar para manejar específicamente enteros (smallint)
      const safeInteger = (value: any): number | null => {
        if (value === '' || value === undefined || value === null) return null;
        // Para valores como 3.5, convertir a entero (3)
        const num = Number(value);
        return isNaN(num) ? null : Math.floor(num);
      };
      
      // Función auxiliar para manejar valores decimales (específicamente para baños)
      const safeDecimal = (value: any): number | null => {
        if (value === '' || value === undefined || value === null) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };
      
      // Crear un objeto con la estructura correcta para Supabase
      // Asegurando que todos los campos tengan los nombres correctos
      const supabasePropertyData = {
        // ID de tenant (debe estar en los datos recibidos o ser obtenido en la acción del servidor)
        tenant_id: propertyData.tenant_id,
        
        // Campos básicos
        title: propertyData.title || propertyData.name || '',
        description: propertyData.description || '',
        property_type: propertyData.property_type || propertyData.propertyType || '',
        status: propertyData.status || 'available',
        price: typeof propertyData.price === 'number' 
          ? propertyData.price 
          : (typeof propertyData.price === 'string' && propertyData.price.trim() !== '' 
            ? parseFloat(propertyData.price.replace(/[^0-9.-]+/g, '')) 
            : null),
        currency: propertyData.currency || 'MXN',
        
        // Datos de ubicación
        address: propertyData.address || propertyData.location?.address || '',
        city: propertyData.city || propertyData.location?.city || '',
        state: propertyData.state || propertyData.location?.state || '',
        zip_code: propertyData.zip_code === null || propertyData.zip_code === undefined
          ? (propertyData.location?.zipCode ? parseInt(propertyData.location.zipCode.toString().trim(), 10) || null : null)
          : parseInt(propertyData.zip_code.toString().trim(), 10) || null,
        // Añadir el campo colony para la colonia/barrio
        colony: propertyData.colony || propertyData.location?.colony || '',
        country: propertyData.country || propertyData.location?.country || '',
        // Añadir campo de ubicación aproximada - Ahora solo desde location.showApproximateLocation
        show_approximate_location: (
            propertyData.location?.showApproximateLocation === true || 
            propertyData.location?.showApproximateLocation === "true" ||
            propertyData.show_approximate_location === true ||
            propertyData.show_approximate_location === "true"
        ),
        latitude: safeNumber(propertyData.latitude || propertyData.location?.coordinates?.lat),
        longitude: safeNumber(propertyData.longitude || propertyData.location?.coordinates?.lng),
        
        // Características - Usando tipos apropiados para cada campo
        bedrooms: safeInteger(propertyData.bedrooms || propertyData.features?.bedrooms),
        bathrooms: safeDecimal(propertyData.bathrooms || propertyData.features?.bathrooms),
        area: safeNumber(propertyData.area || propertyData.features?.area),
        area_unit: propertyData.area_unit || 'm²', // Por defecto m²
        parking_spots: safeInteger(propertyData.parking_spots || propertyData.features?.parkingSpots),
        year_built: safeNumber(propertyData.year_built || propertyData.features?.yearBuilt),
        
        // Características booleanas
        has_pool: 'has_pool' in propertyData 
          ? propertyData.has_pool 
          : (propertyData.features?.hasPool || false),
        has_garden: 'has_garden' in propertyData 
          ? propertyData.has_garden 
          : (propertyData.features?.hasGarden || false),
        has_garage: 'has_garage' in propertyData 
          ? propertyData.has_garage 
          : (propertyData.features?.hasGarage || false),
        has_security: 'has_security' in propertyData 
          ? propertyData.has_security 
          : (propertyData.features?.hasSecurity || false),
        
        // Código de propiedad
        code: propertyData.code || propertyData.propertyCode || null,
        
        // Tipo de operación (venta/renta)
        operation_type: propertyData.operation_type || propertyData.operationType || 'sale',
        
        // Agente asignado
        agent_id: propertyData.agent_id || propertyData.agentId || null,
        
        // Estado activo por defecto
        is_active: true,
        
        // Marcas de tiempo
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Filtrar campos nulos o undefined para asegurar que sólo mandamos los campos con valores
      const filteredData = Object.entries(supabasePropertyData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>)
      
      // Debug especial para show_approximate_location
      console.log('Valor de show_approximate_location:', filteredData.show_approximate_location);
      console.log('Tipo de show_approximate_location:', typeof filteredData.show_approximate_location);
      
      // Verificar si hay algún problema de serialización que podría estar cambiando el tipo
      const serialized = JSON.stringify(filteredData);
      const deserialized = JSON.parse(serialized);
      console.log('Tipo después de serialización/deserialización:', typeof deserialized.show_approximate_location);
      
      // Simplemente registrar el valor sin transformar para diagnóstico
      if ('show_approximate_location' in filteredData) {
        // Imprimir valor sin transformar para diagnóstico
        console.log('PropertyService - show_approximate_location:', {
          'valor': filteredData.show_approximate_location,
          'tipo': typeof filteredData.show_approximate_location
        });
      }
      
      console.log('Datos para Supabase:', filteredData)

      // Crear la propiedad en Supabase
      const { data, error } = await supabase
        .from('properties')
        .insert(filteredData)
        .select()
        .single()

      if (error) {
        console.error('Error al crear propiedad:', error)
        throw error
      }

      // Gestionar imágenes si existen
      if (propertyData.media && Array.isArray(propertyData.media) && data?.id) {
        console.log(`Procesando ${propertyData.media.length} imágenes para la propiedad ${data.id}`)
        
        // Insertar imágenes nuevas
        await Promise.all(propertyData.media.map(async (media: any, index: number) => {
          if (media.url) {
            const imageData = {
              property_id: data.id,
              url: media.url,
              is_primary: media.isPrimary || index === 0,
              display_order: index,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            console.log(`Insertando imagen: ${media.id}`)
            await supabase
              .from('property_images')
              .insert({
                id: media.id,
                ...imageData
              })
          }
        }))
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error en apiCreateProperty:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al crear' 
      }
    }
  },

  /**
   * Elimina una propiedad por su ID
   * Versión mejorada que verifica primero si existe y realiza una eliminación más robusta
   * 
   * @param id ID de la propiedad a eliminar
   * @returns Resultado de la operación
   */
  apiDeleteProperty: async (id: string): Promise<ApiResponse> => {
    try {
      const supabase = SupabaseClient.getInstance()
      console.log(`PropertyService.apiDeleteProperty: Eliminando propiedad con ID ${id}`)
      
      // Primero verificamos una vez más que la propiedad existe
      const { data: propertyExists, error: propertyCheckError } = await supabase
        .from('properties')
        .select('id')
        .eq('id', id)
        .maybeSingle()
      
      if (propertyCheckError) {
        console.error('Error al verificar existencia de la propiedad:', propertyCheckError)
        throw propertyCheckError
      }
      
      if (!propertyExists) {
        console.warn(`La propiedad ${id} no existe o ya fue eliminada`)
        return { success: true } // Consideramos éxito si ya no existe
      }
      
      // Primero eliminamos las imágenes asociadas de la base de datos
      console.log(`Comenzando a eliminar imágenes de la propiedad ${id}`)
      const { error: imageDeleteError } = await supabase
        .from('property_images')
        .delete()
        .eq('property_id', id)
      
      if (imageDeleteError) {
        console.error('Error al eliminar imágenes asociadas:', imageDeleteError)
        // Continuamos a pesar del error para intentar eliminar la propiedad
      } else {
        console.log(`Imágenes de la propiedad ${id} eliminadas correctamente de la base de datos`)
      }
      
      // Eliminar la propiedad con reintentos
      let deleteAttempts = 0
      const maxDeleteAttempts = 3
      let lastError = null
      
      while (deleteAttempts < maxDeleteAttempts) {
        deleteAttempts++
        try {
          console.log(`Intento ${deleteAttempts}/${maxDeleteAttempts} de eliminar propiedad ${id}`)
          
          const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error(`Error en intento ${deleteAttempts}:`, error)
            lastError = error
            
            // Esperar antes del siguiente intento
            if (deleteAttempts < maxDeleteAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500 * deleteAttempts))
            }
          } else {
            console.log(`Propiedad ${id} eliminada correctamente en intento ${deleteAttempts}`)
            return { success: true }
          }
        } catch (attemptError) {
          console.error(`Error inesperado en intento ${deleteAttempts}:`, attemptError)
          lastError = attemptError
          
          if (deleteAttempts < maxDeleteAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 * deleteAttempts))
          }
        }
      }
      
      // Si llegamos aquí, todos los intentos fallaron
      console.error(`No se pudo eliminar la propiedad ${id} después de ${maxDeleteAttempts} intentos`)
      throw lastError || new Error('Error persistente al intentar eliminar la propiedad')
    } catch (error) {
      console.error('Error en apiDeleteProperty:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al eliminar la propiedad' 
      }
    }
  },
  /**
   * Obtiene una propiedad por su ID
   * 
   * @param id ID de la propiedad a obtener
   * @returns Resultado de la operación
   */
  apiGetPropertyById: async (id: string): Promise<ApiResponse> => {
    try {
      const supabase = SupabaseClient.getInstance()
      console.log(`PropertyService.apiGetPropertyById: Obteniendo propiedad con ID ${id}`)
      
      // Consultar propiedad por ID
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        // Verificar si es un error 404 (no encontrado) y manejarlo de forma específica
        if (error.code === 'PGRST116') {
          console.log(`Propiedad con ID ${id} no encontrada (normal si ha sido eliminada)`)
          return { success: false, error: 'Propiedad no encontrada' }
        }
        
        console.error('Error al obtener propiedad:', error)
        throw error
      }
      
      if (!data) {
        return { success: false, error: 'Propiedad no encontrada' }
      }

      // Ya no mapeamos aquí para evitar inconsistencias. En su lugar, devolvemos los datos crudos
      // y dejamos que getProperty los mapee de forma consistente usando mapSupabaseToProperty
      // Esto evita tener dos formas diferentes de mapear los datos
      
      return { success: true, data: data }
    } catch (error) {
      console.error('Error en apiGetPropertyById:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al obtener la propiedad' 
      }
    }
  },

  /**
   * Actualiza una propiedad existente
   * 
   * @param id ID de la propiedad a actualizar
   * @param propertyData Nuevos datos de la propiedad
   * @returns Resultado de la operación
   */
  apiUpdateProperty: async (id: string, propertyData: any): Promise<ApiResponse> => {
    try {
      const supabase = SupabaseClient.getInstance()
      console.log('API Update Property - Datos recibidos:', JSON.stringify(propertyData, null, 2))
      
      // Función auxiliar para manejar campos numéricos
      const safeNumber = (value: any): number | null => {
        if (value === '' || value === undefined || value === null) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };
      
      // Función auxiliar para manejar específicamente enteros (smallint)
      const safeInteger = (value: any): number | null => {
        if (value === '' || value === undefined || value === null) return null;
        // Para valores como 3.5, convertir a entero (3)
        const num = Number(value);
        return isNaN(num) ? null : Math.floor(num);
      };
      
      // Función auxiliar para manejar valores decimales (específicamente para baños)
      const safeDecimal = (value: any): number | null => {
        if (value === '' || value === undefined || value === null) return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };
      
      // Crear un objeto con la estructura correcta para Supabase
      // Asegurando que todos los campos tengan los nombres correctos
      const supabasePropertyData = {
        // Campos básicos
        title: propertyData.title || propertyData.name || '',
        description: propertyData.description || '',
        property_type: propertyData.property_type || propertyData.propertyType || '',
        status: propertyData.status || 'available',
        price: typeof propertyData.price === 'number' 
          ? propertyData.price 
          : (typeof propertyData.price === 'string' && propertyData.price.trim() !== '' 
            ? parseFloat(propertyData.price.replace(/[^0-9.-]+/g, '')) 
            : null),
        currency: propertyData.currency || 'MXN',
        
        // Datos de ubicación
        address: propertyData.address || propertyData.location?.address || '',
        city: propertyData.city || propertyData.location?.city || '',
        state: propertyData.state || propertyData.location?.state || '',
        zip_code: propertyData.zip_code === null || propertyData.zip_code === undefined
          ? (propertyData.location?.zipCode ? parseInt(propertyData.location.zipCode.toString().trim(), 10) || null : null)
          : parseInt(propertyData.zip_code.toString().trim(), 10) || null,
        // Añadir el campo colony para la colonia/barrio
        colony: propertyData.colony || propertyData.location?.colony || '',
        country: propertyData.country || propertyData.location?.country || '',
        // Añadir campo de ubicación aproximada - Ahora desde múltiples posibles fuentes
        show_approximate_location: 
          propertyData.location?.showApproximateLocation === true || 
          propertyData.location?.showApproximateLocation === "true" ||
          propertyData.show_approximate_location === true ||
          propertyData.show_approximate_location === "true",
        latitude: safeNumber(propertyData.latitude || propertyData.location?.coordinates?.lat),
        longitude: safeNumber(propertyData.longitude || propertyData.location?.coordinates?.lng),
        
        // Características - Usando tipos apropiados para cada campo
        bedrooms: safeInteger(propertyData.bedrooms || propertyData.features?.bedrooms),
        bathrooms: safeDecimal(propertyData.bathrooms || propertyData.features?.bathrooms),
        area: safeNumber(propertyData.area || propertyData.features?.area),
        area_unit: propertyData.area_unit || 'm²', // Por defecto m²
        parking_spots: safeInteger(propertyData.parking_spots || propertyData.features?.parkingSpots),
        year_built: safeNumber(propertyData.year_built || propertyData.features?.yearBuilt),
        
        // Características booleanas
        has_pool: 'has_pool' in propertyData 
          ? propertyData.has_pool 
          : (propertyData.features?.hasPool || false),
        has_garden: 'has_garden' in propertyData 
          ? propertyData.has_garden 
          : (propertyData.features?.hasGarden || false),
        has_garage: 'has_garage' in propertyData 
          ? propertyData.has_garage 
          : (propertyData.features?.hasGarage || false),
        has_security: 'has_security' in propertyData 
          ? propertyData.has_security 
          : (propertyData.features?.hasSecurity || false),
        
        // Código de propiedad
        code: propertyData.code || propertyData.propertyCode || null,
        
        // Tipo de operación (venta/renta)
        operation_type: propertyData.operation_type || propertyData.operationType || 'sale',
        
        // Agente asignado
        agent_id: propertyData.agent_id || propertyData.agentId || null,
        
        // Marca de tiempo de actualización
        updated_at: new Date().toISOString()
      }
      
      // Filtrar campos nulos o undefined para asegurar que sólo mandamos los campos con valores
      const filteredData = Object.entries(supabasePropertyData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>)
      
      // Debug especial para show_approximate_location
      console.log('Valor de show_approximate_location:', filteredData.show_approximate_location);
      console.log('Tipo de show_approximate_location:', typeof filteredData.show_approximate_location);
      
      // Verificar si hay algún problema de serialización que podría estar cambiando el tipo
      const serialized = JSON.stringify(filteredData);
      const deserialized = JSON.parse(serialized);
      console.log('Tipo después de serialización/deserialización:', typeof deserialized.show_approximate_location);
      
      // Simplemente registrar el valor sin transformar para diagnóstico
      if ('show_approximate_location' in filteredData) {
        // Imprimir valor sin transformar para diagnóstico
        console.log('PropertyService - show_approximate_location:', {
          'valor': filteredData.show_approximate_location,
          'tipo': typeof filteredData.show_approximate_location
        });
      }
      
      console.log('Datos para Supabase:', filteredData)

      // Actualizar la propiedad en Supabase
      const { data, error } = await supabase
        .from('properties')
        .update(filteredData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error al actualizar propiedad:', error)
        throw error
      }

      // Gestionar imágenes (eliminar existentes si es necesario y agregar nuevas)
      if (propertyData.media) {
        // Obtener IDs de imágenes existentes para esta propiedad
        const { data: existingImages } = await supabase
          .from('property_images')
          .select('id')
          .eq('property_id', id)
        
        const existingIds = existingImages?.map(img => img.id) || []
        const newIds = propertyData.media.map((m: any) => m.id)
        
        // Identificar imágenes a eliminar (existentes pero no en la nueva lista)
        const idsToDelete = existingIds.filter(imgId => !newIds.includes(imgId))
        
        // Eliminar imágenes que ya no están en la lista
        if (idsToDelete.length > 0) {
          console.log(`Eliminando ${idsToDelete.length} imágenes que ya no se necesitan`)
          await supabase
            .from('property_images')
            .delete()
            .in('id', idsToDelete)
        }
        
        // Filtrar medios para eliminar duplicados y elementos de carga
        const uniqueMedia = propertyData.media
          .filter((media: any) => media && media.url && !media._uploading)
          // Filtrar duplicados por URL (mantener solo la primera aparición)
          .filter((media: any, index: number, self: any[]) => 
            index === self.findIndex((m: any) => m.url === media.url)
          );
        
        console.log(`Procesando ${uniqueMedia.length} imágenes únicas para la propiedad ${id}`);
        
        // Actualizar o insertar imágenes nuevas
        const mediaPromises = uniqueMedia.map(async (media: any, index: number) => {
          try {
            if (!media.url) {
              console.log(`Omitiendo imagen sin URL en posición ${index}`);
              return;
            }
            
            // Datos base para la imagen
            const imageData = {
              property_id: id,
              url: media.url,
              is_primary: media.isPrimary || index === 0,
              display_order: index,
              storage_path: media._storagePath, // Guardar ruta de storage si existe
              updated_at: new Date().toISOString()
            }
            
            // Verificar si la imagen ya existe
            const { data: existing, error: queryError } = await supabase
              .from('property_images')
              .select('id')
              .eq('id', media.id)
              .maybeSingle()
            
            if (queryError) {
              console.error(`Error al verificar existencia de imagen ${media.id}:`, queryError);
            }
              
            if (existing) {
              // Actualizar imagen existente
              console.log(`Actualizando imagen existente: ${media.id}`);
              const { error: updateError } = await supabase
                .from('property_images')
                .update(imageData)
                .eq('id', media.id);
                
              if (updateError) {
                console.error(`Error al actualizar imagen ${media.id}:`, updateError);
              }
            } else {
              // Insertar nueva imagen
              console.log(`Insertando nueva imagen: ${media.id}`);
              const { error: insertError } = await supabase
                .from('property_images')
                .insert({
                  id: media.id,
                  ...imageData,
                  created_at: new Date().toISOString()
                });
                
              if (insertError) {
                console.error(`Error al insertar imagen ${media.id}:`, insertError);
              }
            }
          } catch (mediaError) {
            console.error(`Error al procesar imagen en posición ${index}:`, mediaError);
          }
        });
        
        // Esperar a que todas las operaciones de imágenes terminen
        await Promise.all(mediaPromises);
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error en apiUpdateProperty:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido al actualizar' 
      }
    }
  },

  /**
   * Obtiene todas las propiedades con paginación opcional
   * 
   * @param page Número de página (opcional)
   * @param pageSize Tamaño de página (opcional)
   * @param filters Filtros adicionales (opcional)
   * @returns Resultado de la operación con lista de propiedades
   */
  apiGetProperties: async (
    page = 1, 
    pageSize = 20,
    filters: Record<string, any> = {}
  ): Promise<ApiResponse> => {
    try {
      // Verificar parámetros
      if (page < 1) page = 1;
      if (pageSize < 1) pageSize = 20;
      
      // Obtener cliente Supabase y verificar que existe
      let supabase;
      try {
        supabase = SupabaseClient.getInstance();
        if (!supabase) {
          throw new Error("No se pudo obtener una instancia válida del cliente Supabase");
        }
      } catch (clientError) {
        console.error("Error al obtener cliente Supabase:", clientError);
        return {
          success: false,
          error: "Error de conexión con la base de datos. Por favor, inténtelo de nuevo."
        };
      }
      
      console.log(`PropertyService.apiGetProperties: Consultando propiedades (página ${page}, tamaño ${pageSize})`)
      
      // Iniciar la consulta
      let query = supabase
        .from('properties')
        .select(`
          *,
          property_images(*),
          agent:agents(id, name, email, profile_image)
        `)
        .order('created_at', { ascending: false })
      
      // Aplicar filtros si existen
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'property_type' && Array.isArray(value)) {
            query = query.in('property_type', value)
          } else if (key === 'price_min') {
            query = query.gte('price', value)
          } else if (key === 'price_max') {
            query = query.lte('price', value)
          } else if (key === 'bedrooms_min') {
            query = query.gte('bedrooms', value)
          } else if (key === 'bathrooms_min') {
            query = query.gte('bathrooms', value)
          } else if (key === 'operation_type') {
            query = query.eq('operation_type', value)
          } else if (key === 'is_active') {
            query = query.eq('is_active', value)
          } else if (key === 'tenant_id') {
            query = query.eq('tenant_id', value)
          } else if (key === 'search') {
            query = query.or(`title.ilike.%${value}%,description.ilike.%${value}%,address.ilike.%${value}%`)
          } else {
            query = query.eq(key, value)
          }
        }
      }
      
      // Aplicar paginación
      const start = (page - 1) * pageSize
      const end = start + pageSize - 1
      query = query.range(start, end)
      
      // Ejecutar la consulta, evitando registro de errores en la consola
      let data = null;
      let error = null;
      try {
        const result = await query.order('created_at', { ascending: false });
        data = result.data;
        error = result.error;
      } catch (queryError) {
        console.warn('Error capturado al ejecutar consulta:', queryError);
        return { 
          success: true, 
          data: {
            properties: [],
            page,
            pageSize,
            totalCount: 0
          },
          error: 'Error al acceder a la base de datos'
        };
      }
      
      if (error) {
        // No usamos console.error para evitar mensajes en consola que asusten al usuario
        console.warn('Se encontró un error al obtener propiedades:', 
          typeof error === 'object' && Object.keys(error).length === 0 ? 'Objeto vacío {}' : error
        );
        
        // Siempre devolvemos un resultado controlado, nunca lanzamos el error
        return { 
          success: true, 
          data: {
            properties: [],
            page,
            pageSize,
            totalCount: 0
          },
          error: 'No se pudieron cargar las propiedades'
        };
      }
      
      // Obtener el total de registros que coinciden con los filtros
      // Iniciamos una nueva consulta para contar
      let countQuery = supabase
        .from('properties')
        .select('id', { count: 'exact' })
      
      // Aplicamos los mismos filtros a la consulta de conteo
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'property_type' && Array.isArray(value)) {
            countQuery = countQuery.in('property_type', value)
          } else if (key === 'price_min') {
            countQuery = countQuery.gte('price', value)
          } else if (key === 'price_max') {
            countQuery = countQuery.lte('price', value)
          } else if (key === 'bedrooms_min') {
            countQuery = countQuery.gte('bedrooms', value)
          } else if (key === 'bathrooms_min') {
            countQuery = countQuery.gte('bathrooms', value)
          } else if (key === 'operation_type') {
            countQuery = countQuery.eq('operation_type', value)
          } else if (key === 'is_active') {
            countQuery = countQuery.eq('is_active', value)
          } else if (key === 'tenant_id') {
            countQuery = countQuery.eq('tenant_id', value)
          } else if (key === 'search') {
            countQuery = countQuery.or(`title.ilike.%${value}%,description.ilike.%${value}%,address.ilike.%${value}%`)
          } else {
            countQuery = countQuery.eq(key, value)
          }
        }
      }
      
      // Obtener conteo con manejo seguro de errores
      let totalCount = 0;
      try {
        const { count, error: countError } = await countQuery
        
        if (countError) {
          // Evitar console.error para no mostrar mensajes alarmantes
          console.warn('No se pudo obtener conteo exacto de propiedades:', 
            typeof countError === 'object' && Object.keys(countError).length === 0 ? 'Objeto vacío {}' : countError
          );
          // Continuamos con totalCount = 0
        } else {
          totalCount = count || 0;
        }
      } catch (countException) {
        // Usar warn en lugar de error para no alarmar
        console.warn('Excepción controlada al obtener conteo de propiedades:', 
          typeof countException === 'object' && Object.keys(countException).length === 0 ? 'Objeto vacío {}' : countException
        );
        // Continuamos con totalCount = 0
      }
      
      return { 
        success: true, 
        data: {
          properties: data || [],
          page,
          pageSize,
          totalCount: totalCount || 0
        } 
      }
    } catch (error) {
      // Usar console.warn para evitar mensajes de error en la consola
      console.warn('Error controlado en apiGetProperties:', 
        typeof error === 'object' && Object.keys(error).length === 0 ? 'Objeto vacío {}' : error
      );
      
      // Para cualquier tipo de error, devolvemos siempre un resultado exitoso
      // con propiedades vacías y un mensaje informativo
      return { 
        success: true, 
        data: {
          properties: [],
          page,
          pageSize,
          totalCount: 0
        },
        error: 'No se pudieron cargar las propiedades. Puede continuar sin seleccionar propiedad.'
      }
    }
  },

  /**
   * Obtiene propiedades recomendadas basadas en criterios específicos
   * 
   * @param criteria Criterios para recomendación (tipo, precio, ubicación, etc.)
   * @param limit Número máximo de propiedades a devolver
   * @returns Resultado de la operación con lista de propiedades recomendadas
   */
  apiGetRecommendedProperties: async (
    criteria: Record<string, any> = {},
    limit = 4
  ): Promise<ApiResponse> => {
    try {
      const supabase = SupabaseClient.getInstance()
      console.log(`PropertyService.apiGetRecommendedProperties: Buscando ${limit} propiedades recomendadas`)
      
      // Si no hay criterios específicos, devolver las propiedades más recientes
      if (Object.keys(criteria).length === 0) {
        const { data, error } = await supabase
          .from('properties')
          .select(`
            *,
            property_images(*)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit)
        
        if (error) {
          console.error('Error al obtener propiedades recomendadas:', error)
          throw error
        }
        
        return {
          success: true,
          data: data || []
        }
      }
      
      // Iniciar consulta con criterios específicos
      let query = supabase
        .from('properties')
        .select(`
          *,
          property_images(*)
        `)
        .eq('is_active', true)
      
      // Aplicar filtros basados en criterios
      if (criteria.property_type) {
        query = query.eq('property_type', criteria.property_type)
      }
      
      if (criteria.operation_type) {
        query = query.eq('operation_type', criteria.operation_type)
      }
      
      if (criteria.city) {
        query = query.eq('city', criteria.city)
      }
      
      if (criteria.state) {
        query = query.eq('state', criteria.state)
      }
      
      if (criteria.price_range) {
        if (criteria.price_range.min) {
          query = query.gte('price', criteria.price_range.min)
        }
        if (criteria.price_range.max) {
          query = query.lte('price', criteria.price_range.max)
        }
      }
      
      if (criteria.bedrooms_min) {
        query = query.gte('bedrooms', criteria.bedrooms_min)
      }
      
      if (criteria.bathrooms_min) {
        query = query.gte('bathrooms', criteria.bathrooms_min)
      }
      
      if (criteria.tenant_id) {
        query = query.eq('tenant_id', criteria.tenant_id)
      }
      
      // Ejecutar la consulta con límite
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) {
        console.error('Error al obtener propiedades recomendadas con criterios:', error)
        throw error
      }
      
      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      console.error('Error en apiGetRecommendedProperties:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al obtener propiedades recomendadas'
      }
    }
  },

  /**
   * Obtiene propiedades para seleccionar en una cita
   * 
   * @param criteria Criterios para filtrar (tenant_id es obligatorio)
   * @returns Resultado de la operación con lista de propiedades formateadas para selector
   */
  apiGetPropertiesForAppointment: async (
    criteria: Record<string, any> = {}
  ): Promise<ApiResponse> => {
    try {
      if (!criteria.tenant_id) {
        return {
          success: false,
          error: 'Se requiere tenant_id para obtener propiedades para cita'
        }
      }
      
      const supabase = SupabaseClient.getInstance()
      console.log(`PropertyService.apiGetPropertiesForAppointment: Consultando propiedades para tenant ${criteria.tenant_id}`)
      
      // Obtener propiedades activas del tenant con formato simplificado para selector
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          address,
          city,
          state,
          price,
          currency,
          property_type,
          operation_type,
          property_images(id, url, is_primary)
        `)
        .eq('tenant_id', criteria.tenant_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error al obtener propiedades para cita:', error)
        throw error
      }
      
      // Formatear los datos para el selector de propiedades en citas
      const formattedProperties = data?.map(prop => {
        // Encontrar la imagen principal
        const primaryImage = prop.property_images?.find((img: any) => img.is_primary) || 
                            prop.property_images?.[0];
        
        // Formatear precio
        const formattedPrice = new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: prop.currency || 'MXN',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(prop.price || 0);
        
        return {
          id: prop.id,
          title: prop.title,
          subtitle: `${prop.address}, ${prop.city}`,
          description: `${prop.property_type} - ${formattedPrice}`,
          imageUrl: primaryImage?.url || null,
          data: prop  // Datos completos para referencia
        }
      });
      
      return {
        success: true,
        data: formattedProperties || []
      }
    } catch (error) {
      console.error('Error en apiGetPropertiesForAppointment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al obtener propiedades para cita'
      }
    }
  }
}

export default PropertyService