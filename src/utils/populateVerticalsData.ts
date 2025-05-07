/**
 * frontend/src/utils/populateVerticalsData.ts
 * Utilidad para poblar datos iniciales de verticales en la base de datos
 * @version 1.0.0
 * @created 2025-04-14
 */

import { supabase } from '@/services/supabase/SupabaseClient'

// Datos de verticales y sus categorías
const verticalsData = {
    belleza: {
        name: 'Belleza',
        code: 'belleza',
        description: 'Salones de belleza, barberías y servicios estéticos',
        icon: 'beauty',
        brand_name: 'AgentBeauty by PymeBot',
        categories: [
            'Salón',
            'Barbería',
            'Salón de uñas',
            'Estudio de bronceado'
        ]
    },
    bienestar_y_relajación: {
        name: 'Bienestar y Relajación',
        code: 'bienestar_y_relajación',
        description: 'Spas, saunas y servicios de masajes',
        icon: 'spa',
        brand_name: 'AgentZen by PymeBot',
        categories: [
            'Spa',
            'Sauna',
            'Masajes'
        ]
    },
    salud_y_recuperación: {
        name: 'Salud y Recuperación',
        code: 'salud_y_recuperación',
        description: 'Fisioterapia y servicios de recuperación física',
        icon: 'health',
        brand_name: 'AgentVital by PymeBot',
        categories: [
            'Fisioterapia',
            'Práctica sanitaria',
            'Fitness y recuperación'
        ]
    },
    arte_corporal: {
        name: 'Arte Corporal',
        code: 'arte_corporal',
        description: 'Estudios de tatuajes y piercings',
        icon: 'tattoo',
        brand_name: 'AgentInk by PymeBot',
        categories: [
            'Tatuajes',
            'Piercing'
        ]
    },
    mascotas: {
        name: 'Mascotas',
        code: 'mascotas',
        description: 'Veterinarias y servicios para mascotas',
        icon: 'pet',
        brand_name: 'AgentPet by PymeBot',
        categories: [
            'Peluquería para mascotas',
            'Veterinarias'
        ]
    },
    bienes_raices: {
        name: 'Bienes Raíces',
        code: 'bienes_raices',
        description: 'Inmobiliarias, constructoras y servicios inmobiliarios',
        icon: 'building',
        brand_name: 'AgentProp by PymeBot',
        categories: [
            'Inmobiliarias',
            'Constructoras',
            'Bienes raíces'
        ]
    },
    restaurantes: {
        name: 'Restaurantes',
        code: 'restaurantes',
        description: 'Restaurantes, cafeterías y servicios de comida',
        icon: 'food',
        brand_name: 'AgentChef by PymeBot',
        categories: [
            'Restaurantes',
            'Comida rápida',
            'Cafeterías',
            'Repostería y pastelería'
        ]
    },
    medicina: {
        name: 'Medicina',
        code: 'medicina',
        description: 'Consultorios médicos, dentistas y servicios de salud',
        icon: 'medical',
        brand_name: 'AgentMedic by PymeBot',
        categories: [
            'Médicos',
            'Dentistas',
            'Psicólogos',
            'Nutriólogos',
            'Oftalmólogos',
            'Podólogos',
            'Centro de medicina estética'
        ]
    }
}

/**
 * Función para poblar las verticales y sus categorías en la base de datos
 */
export const populateVerticals = async () => {
    console.log('Iniciando la población de verticales...')
    
    try {
        // Para cada vertical en los datos
        for (const [code, vertical] of Object.entries(verticalsData)) {
            console.log(`Procesando vertical: ${vertical.name}`)
            
            // Comprobar si la vertical ya existe
            const { data: existingVertical, error: checkError } = await supabase
                .from('verticals')
                .select('id')
                .eq('code', code)
                .single()
                
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = No se encontraron resultados
                console.error(`Error al verificar la vertical ${code}:`, checkError)
                continue
            }
            
            let verticalId: string
            
            if (existingVertical) {
                console.log(`La vertical ${vertical.name} ya existe, actualizando...`)
                verticalId = existingVertical.id
                
                // Actualizar la vertical existente
                const { error: updateError } = await supabase
                    .from('verticals')
                    .update({
                        name: vertical.name,
                        description: vertical.description,
                        icon: vertical.icon,
                        brand_name: vertical.brand_name,
                        is_active: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', verticalId)
                    
                if (updateError) {
                    console.error(`Error al actualizar la vertical ${code}:`, updateError)
                    continue
                }
            } else {
                console.log(`Creando nueva vertical: ${vertical.name}`)
                
                // Insertar nueva vertical
                const { data: newVertical, error: insertError } = await supabase
                    .from('verticals')
                    .insert({
                        name: vertical.name,
                        code: code,
                        description: vertical.description,
                        icon: vertical.icon,
                        brand_name: vertical.brand_name,
                        is_active: true
                    })
                    .select('id')
                    .single()
                    
                if (insertError || !newVertical) {
                    console.error(`Error al insertar la vertical ${code}:`, insertError)
                    continue
                }
                
                verticalId = newVertical.id
            }
            
            // Procesar categorías para esta vertical
            console.log(`Procesando ${vertical.categories.length} categorías para ${vertical.name}`)
            
            for (let i = 0; i < vertical.categories.length; i++) {
                const categoryName = vertical.categories[i]
                const categoryCode = categoryName
                    .toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remover acentos
                    .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
                
                // Comprobar si la categoría ya existe
                const { data: existingCategory, error: checkCatError } = await supabase
                    .from('vertical_categories')
                    .select('id')
                    .eq('vertical_id', verticalId)
                    .eq('code', categoryCode)
                    .single()
                    
                if (checkCatError && checkCatError.code !== 'PGRST116') {
                    console.error(`Error al verificar la categoría ${categoryCode}:`, checkCatError)
                    continue
                }
                
                if (existingCategory) {
                    console.log(`Categoría ${categoryName} ya existe, actualizando...`)
                    
                    // Actualizar la categoría existente
                    const { error: updateCatError } = await supabase
                        .from('vertical_categories')
                        .update({
                            name: categoryName,
                            is_active: true,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingCategory.id)
                        
                    if (updateCatError) {
                        console.error(`Error al actualizar la categoría ${categoryCode}:`, updateCatError)
                    }
                } else {
                    console.log(`Creando nueva categoría: ${categoryName}`)
                    
                    // Insertar nueva categoría
                    const { error: insertCatError } = await supabase
                        .from('vertical_categories')
                        .insert({
                            vertical_id: verticalId,
                            name: categoryName,
                            code: categoryCode,
                            description: `Categoría de ${vertical.name}`,
                            is_active: true
                        })
                        
                    if (insertCatError) {
                        console.error(`Error al insertar la categoría ${categoryCode}:`, insertCatError)
                    }
                }
            }
            
            console.log(`Vertical ${vertical.name} procesada correctamente`)
        }
        
        console.log('Todas las verticales y categorías han sido procesadas correctamente')
        return { success: true, message: 'Datos de verticales ingresados correctamente' }
    } catch (error) {
        console.error('Error al popular verticales:', error)
        return { success: false, message: 'Error al ingestar los datos de verticales', error }
    }
}

export default populateVerticals
