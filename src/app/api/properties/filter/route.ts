/**
 * API para filtrar propiedades por tipo.
 * /api/properties/filter?type=Casa
 * 
 * @version 1.1.0
 * @updated 2025-05-20
 */

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@/services/supabase/SupabaseClient'
import { getTenantFromSession } from '@/server/actions/tenant/getTenantFromSession'

export async function GET(request: NextRequest) {
    try {
        // Obtener parámetros de consulta
        const searchParams = request.nextUrl.searchParams
        const propertyType = searchParams.get('type')
        
        if (!propertyType) {
            return NextResponse.json(
                { error: 'Se requiere el parámetro tipo de propiedad' },
                { status: 400 }
            )
        }
        
        // Inicializar cliente Supabase
        const supabase = SupabaseClient.getInstance()
        
        // Obtener el tenant actual
        const tenant_id = await getTenantFromSession()
        
        if (!tenant_id) {
            console.error('Error crítico: No se pudo obtener tenant_id')
            return NextResponse.json(
                { error: 'Error de autenticación. No se pudo identificar el tenant.' },
                { status: 401 }
            )
        }

        console.log(`Filtrando propiedades para tenant_id: ${tenant_id} de tipo: ${propertyType}`)

        // Mapear valores en español a valores en inglés usados en la BD
        const mappings: { [key: string]: string } = {
            'casa': 'house',
            'apartamento': 'apartment',
            'local comercial': 'commercial',
            'oficina': 'office',
            'terreno': 'land',
            'nave industrial': 'industrial',
            // Variantes adicionales con diferentes formatos
            'local': 'commercial',
            'departamento': 'apartment',
            // Variantes con mayúsculas
            'Casa': 'house',
            'Apartamento': 'apartment',
            'Local Comercial': 'commercial',
            'Oficina': 'office',
            'Terreno': 'land',
            'Nave Industrial': 'industrial',
            // Variantes con posible formato en BD
            'House': 'house',
            'Apartment': 'apartment',
            'Commercial': 'commercial',
            'Office': 'office',
            'Land': 'land',
            'Industrial': 'industrial'
        }
        
        // Intentar mapear directamente (para mantener 'Casa' -> 'house')
        let dbPropertyType = mappings[propertyType] || propertyType
        
        // Si no se encontró un mapeo directo, convertir a minúsculas e intentar de nuevo
        if (!mappings[propertyType]) {
            const lowerCaseType = propertyType.toLowerCase()
            dbPropertyType = mappings[lowerCaseType] || lowerCaseType
        }
        
        // Lista de tipos alternativos para buscar (ayuda cuando hay inconsistencias)
        const alternativeTypes = [
            dbPropertyType,                      // El tipo mapeado principal
            propertyType,                        // El tipo original
            dbPropertyType.toLowerCase(),        // Minúsculas
            dbPropertyType.toUpperCase(),        // Mayúsculas
            propertyType.toLowerCase(),          // Original en minúsculas
            propertyType.toUpperCase(),          // Original en mayúsculas
            dbPropertyType.charAt(0).toUpperCase() + dbPropertyType.slice(1), // Primera letra mayúscula
            propertyType.charAt(0).toUpperCase() + propertyType.slice(1)      // Original primera letra mayúscula
        ]
        
        console.log('Tipos alternativos a buscar:', alternativeTypes)
        
        console.log(`Tipo de propiedad recibido: "${propertyType}", mapeado a: "${dbPropertyType}"`)
        console.log(`Ejecutando consulta: properties WHERE tenant_id = ${tenant_id} AND property_type ILIKE %${dbPropertyType}%`)
        
        // Consulta directa para probar acceso a la tabla, IGNORANDO el tenant_id
        // Solo para debug - ayuda a detectar problemas de permisos RLS
        console.log("=== DIAGNÓSTICO DE PERMISOS RLS ===")
        const { data: allPropertiesNoTenant, error: errorNoTenant } = await supabase
            .from('properties')
            .select('count')
        
        console.log(`Total propiedades en tabla sin restricción de tenant: ${allPropertiesNoTenant ? allPropertiesNoTenant.count : 'ERROR'}`);
        if (errorNoTenant) {
            console.error("ERROR EN CONSULTA SIN TENANT (posible RLS bloqueando):", errorNoTenant);
        }
        
        // Consulta directa a las columnas sin usar campos JSONB
        // Primero vamos a registrar todas las propiedades disponibles para debug
        const { data: allProperties, error: allPropsError } = await supabase
            .from('properties')
            .select('id, property_type, title, status, tenant_id')
            .eq('tenant_id', tenant_id)
            .limit(50)
            
        console.log(`DIAGNÓSTICO: Propiedades para tenant ${tenant_id}: ${allProperties?.length || 0}`)
        if (allPropsError) {
            console.error("ERROR EN CONSULTA DE PROPIEDADES:", allPropsError)
        }
            
        if (allProperties) {
            console.log(`Todas las propiedades disponibles para tenant ${tenant_id}:`)
            allProperties.forEach(p => {
                console.log(`ID: ${p.id}, Type: ${p.property_type}, Status: ${p.status}, Title: ${p.title || 'Sin título'}`)
            })
            
            // Filtrar propiedades por tipo para debug
            const matchingTypes = allProperties.filter(p => 
                p.property_type && p.property_type.toLowerCase().includes(dbPropertyType.toLowerCase())
            )
            console.log(`Propiedades que coinciden con tipo "${dbPropertyType}":`, matchingTypes.length)
        }
        
        // Verificar si existe exactamente la propiedad con id 9dd01c94-8f92-4114-8a19-3404cb3ff1a9
        console.log("=== DIAGNÓSTICO DE PROPIEDAD ESPECÍFICA ===")
        const { data: specificProperty, error: specificError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', '9dd01c94-8f92-4114-8a19-3404cb3ff1a9')
            .eq('tenant_id', tenant_id)
            .single()
            
        console.log(`Propiedad específica encontrada:`, specificProperty ? JSON.stringify(specificProperty, null, 2) : 'NO ENCONTRADA')
        if (specificError) {
            console.error("Error al buscar propiedad específica:", specificError)
        }
            
        // Probemos una búsqueda directa usando RPC
        console.log("=== PRUEBA DIRECTA SIN TENANT ===")
        const { data: directData, error: directError } = await supabase
            .rpc('get_properties_by_type', { 
                p_type: dbPropertyType 
            })
            
        console.log(`Respuesta de RPC directa:`, directData ? `${directData.length} propiedades` : 'ERROR')
        if (directError) {
            console.error("Error en RPC directa:", directError)
        } else if (directData) {
            console.log("Primeras propiedades encontradas:", directData.slice(0, 3))
        }
        
        // Usar RPC directamente - esta es la que sí funciona en los logs 
        // y no tiene problemas con RLS
        console.log(`Consultando RPC get_properties_by_type con tipo: ${dbPropertyType}`)
        const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_properties_by_type', { 
                p_type: dbPropertyType 
            })
            
        console.log(`Respuesta de RPC: ${rpcData ? `${rpcData.length} propiedades` : 'ERROR'}`)
        
        // Si la RPC falla o no devuelve datos, intentar con el tipo original
        let data = rpcData;
        let error = rpcError;
        
        if (!data || data.length === 0) {
            console.log(`RPC no encontró resultados con tipo "${dbPropertyType}", intentando con tipo original`)
            
            // Intentar con el tipo original
            const { data: rpcOriginalData, error: rpcOriginalError } = await supabase
                .rpc('get_properties_by_type', { 
                    p_type: propertyType
                })
                
            if (rpcOriginalData && rpcOriginalData.length > 0) {
                console.log(`RPC encontró ${rpcOriginalData.length} propiedades con tipo original "${propertyType}"`)
                data = rpcOriginalData;
                error = rpcOriginalError;
            }
        }
        
        // Si aún no hay resultados, intentar consultas directas como fallback
        if (!data || data.length === 0) {
            console.log("RPC no encontró resultados, intentando consultas directas como fallback")
            
            // Intentar con ILIKE para flexibilidad en la búsqueda
            const { data: dataILike, error: errorILike } = await supabase
                .from('properties')
                .select(`
                    id,
                    title,
                    code,
                    property_type,
                    price,
                    currency,
                    address,
                    city,
                    colony,
                    bedrooms,
                    bathrooms,
                    area,
                    area_unit,
                    description,
                    status
                `)
                .eq('tenant_id', tenant_id)
                // Usar operador IN para buscar cualquier coincidencia exacta de tipo
                .in('property_type', alternativeTypes)
                .limit(15)
            
            console.log(`Búsqueda ILIKE flexible - tenant_id: ${tenant_id}, property_type ilike %${dbPropertyType}%`)
            console.log(`Resultados búsqueda ILIKE: ${dataILike?.length || 0} propiedades encontradas`)
            
            if (dataILike && dataILike.length > 0) {
                data = dataILike;
                error = errorILike;
            } else {
                // Intentar búsqueda exacta sin filtro de status 
                const { data: dataNoStatus, error: errorNoStatus } = await supabase
                    .from('properties')
                    .select(`
                        id,
                        title,
                        code,
                        property_type,
                        price,
                        currency,
                        address,
                        city,
                        colony,
                        bedrooms,
                        bathrooms,
                        area,
                        area_unit,
                        description,
                        status
                    `)
                    .eq('tenant_id', tenant_id)
                    .eq('property_type', dbPropertyType)
                    .limit(15)
                
                console.log(`Búsqueda sin filtro de status - tenant_id: ${tenant_id}, property_type: ${dbPropertyType}`)
                console.log(`Resultados sin filtro de status: ${dataNoStatus?.length || 0} propiedades encontradas`)
                
                if (dataNoStatus && dataNoStatus.length > 0) {
                    data = dataNoStatus;
                    error = errorNoStatus;
                }
            }
        }
            
        if (error) {
            console.error('Error en consulta de propiedades:', error)
            return NextResponse.json(
                { error: 'Error al consultar propiedades en la base de datos' },
                { status: 500 }
            )
        }
        
        console.log(`Propiedades encontradas: ${data?.length || 0}`)
        
        // Esta sección se ha eliminado porque dataNoStatus ya no está definido en el nuevo código
            
        // Si no hay datos, simplemente devolver un array vacío - NO usar Casa Claudia como fallback
        if (!data || data.length === 0) {
            console.log('No se encontraron propiedades en consultas normales')
            console.log(`No hay propiedades de tipo ${propertyType}, devolviendo array vacío`)
            // NO usamos ningún fallback, el frontend mostrará "Sin resultados"
        }
        
        // Si no hay datos después de todos los intentos, devolver un array vacío
        if (!data || data.length === 0) {
            console.log(`No se encontraron propiedades de tipo ${propertyType}. Devolviendo array vacío.`)
            
            // Devolver array vacío para que el frontend maneje el mensaje "Sin resultados"
            return NextResponse.json([]);
        }
        
        // Mapear a estructura esperada por el frontend
        const processed = data.map(property => ({
            id: property.id,
            name: property.title || property.code || `Propiedad ${property.id.slice(0, 6)}`,
            location: `${property.colony || ''}, ${property.city || ''}`.trim() || property.address || 'Sin ubicación',
            price: Number(property.price) || 0,
            currency: property.currency || 'MXN',
            propertyType: property.property_type,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            areaUnit: property.area_unit,
            description: property.description
        }))

        // Registrar las propiedades procesadas para debug
        console.log('Propiedades procesadas para enviar al frontend:')
        processed.forEach(p => {
            console.log(`- ${p.name} (${p.propertyType}): ${p.price} ${p.currency}`)
        })

        return NextResponse.json(processed)
    } catch (error) {
        console.error('Error en API filtrado de propiedades:', error)
        return NextResponse.json(
            { error: 'Error inesperado al filtrar propiedades' },
            { status: 500 }
        )
    }
}

// Esta función se ha eliminado y reemplazado por datos reales