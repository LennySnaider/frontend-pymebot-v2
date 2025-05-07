/**
 * API para filtrar propiedades por tipo.
 * /api/properties/filter?type=Casa
 * 
 * @version 1.0.3
 * @updated 2025-04-12
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
            'Nave Industrial': 'industrial'
        }
        
        // Intentar mapear directamente (para mantener 'Casa' -> 'house')
        let dbPropertyType = mappings[propertyType] || propertyType
        
        // Si no se encontró un mapeo directo, convertir a minúsculas e intentar de nuevo
        if (!mappings[propertyType]) {
            const lowerCaseType = propertyType.toLowerCase()
            dbPropertyType = mappings[lowerCaseType] || lowerCaseType
        }
        
        console.log(`Tipo de propiedad recibido: "${propertyType}", mapeado a: "${dbPropertyType}"`)
        console.log(`Ejecutando consulta: properties WHERE tenant_id = ${tenant_id} AND property_type similar a ${dbPropertyType}`)
        
        // Consulta directa a las columnas sin usar campos JSONB
        // Primero vamos a registrar todas las propiedades disponibles para debug
        const { data: allProperties, error: allPropsError } = await supabase
            .from('properties')
            .select('id, property_type, title')
            .eq('tenant_id', tenant_id)
            .limit(50)
            
        if (allProperties) {
            console.log('Todas las propiedades disponibles para este tenant:')
            allProperties.forEach(p => {
                console.log(`ID: ${p.id}, Type: ${p.property_type}, Title: ${p.title || 'Sin título'}`)
            })
        }
        
        // Ahora hacemos la consulta filtrada
        const { data, error } = await supabase
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
                description
            `)
            .eq('tenant_id', tenant_id)
            .eq('status', 'available')
            // Usar ilike para búsqueda insensible a mayúsculas/minúsculas
            .ilike('property_type', `%${dbPropertyType}%`)
            .limit(15)
            
        if (error) {
            console.error('Error en consulta de propiedades:', error)
            return NextResponse.json(
                { error: 'Error al consultar propiedades en la base de datos' },
                { status: 500 }
            )
        }
        
        console.log(`Propiedades encontradas: ${data?.length || 0}`)
        
        // Si no hay datos, informar al cliente
        if (!data || data.length === 0) {
            console.log('No se encontraron propiedades para el tipo:', propertyType)
            return NextResponse.json([])
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

/**
 * Función auxiliar para generar propiedades de ejemplo
 * Útil para desarrollo y como fallback cuando hay errores
 */
function getMockProperties(propertyType: string): any[] {
    const type = propertyType.toLowerCase()
    
    if (type === 'casa' || type === 'house') {
        return [
            {
                id: 'mock-casa-1',
                name: 'Casa Muestra Exclusiva',
                location: 'Lomas de Chapultepec, CDMX',
                price: 7500000,
                currency: 'MXN',
                propertyType: 'house',
                bedrooms: 4,
                bathrooms: 3.5,
                area: 280,
                areaUnit: 'm²',
                description: 'Hermosa casa en zona exclusiva'
            },
            {
                id: 'mock-casa-2',
                name: 'Residencia Moderna',
                location: 'Del Valle, Ciudad de México',
                price: 5200000,
                currency: 'MXN',
                propertyType: 'house',
                bedrooms: 3,
                bathrooms: 2,
                area: 210,
                areaUnit: 'm²',
                description: 'Amplia residencia estilo moderno'
            }
        ]
    }
    
    if (type === 'apartamento' || type === 'apartment') {
        return [
            {
                id: 'mock-apto-1',
                name: 'Penthouse de Lujo',
                location: 'Polanco, CDMX',
                price: 12000000,
                currency: 'MXN',
                propertyType: 'apartment',
                bedrooms: 3,
                bathrooms: 3,
                area: 180,
                areaUnit: 'm²',
                description: 'Increíble penthouse con vista panorámica'
            },
            {
                id: 'mock-apto-2',
                name: 'Apartamento Céntrico',
                location: 'Reforma, Ciudad de México',
                price: 4900000,
                currency: 'MXN',
                propertyType: 'apartment',
                bedrooms: 2,
                bathrooms: 2,
                area: 95,
                areaUnit: 'm²',
                description: 'Moderno apartamento en el corazón de la ciudad'
            }
        ]
    }
    
    // Default para cualquier otro tipo de propiedad
    return [
        {
            id: `mock-${type}-1`,
            name: `${propertyType} Muestra Premium`,
            location: 'Zona Exclusiva, Ciudad',
            price: 3800000,
            currency: 'MXN',
            propertyType: type,
            bedrooms: type === 'land' || type === 'commercial' ? undefined : 2,
            bathrooms: type === 'land' || type === 'commercial' ? undefined : 1,
            area: 150,
            areaUnit: 'm²',
            description: `Excelente ${propertyType.toLowerCase()} con ubicación privilegiada`
        },
        {
            id: `mock-${type}-2`,
            name: `${propertyType} Oportunidad`,
            location: 'Centro, Ciudad',
            price: 2500000,
            currency: 'MXN',
            propertyType: type,
            bedrooms: type === 'land' || type === 'commercial' ? undefined : 1,
            bathrooms: type === 'land' || type === 'commercial' ? undefined : 1,
            area: 80,
            areaUnit: 'm²',
            description: `Gran oportunidad de inversión en ${propertyType.toLowerCase()}`
        }
    ]
}