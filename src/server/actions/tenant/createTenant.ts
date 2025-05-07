/**
 * backend/src/server/actions/tenant/createTenant.ts
 * Server action para crear un nuevo tenant en Supabase.
 * Se llama desde el proceso de onboarding.
 * @version 1.0.0
 * @updated 2025-03-22
 */

'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

interface CreateTenantParams {
  name: string
  industry: string
  phone: string
  timezone: string
  currency: string
  subscriptionPlan: 'free' | 'basic' | 'pro'
  userId: string
}

export async function createTenant(params: CreateTenantParams) {
  // Verificar que tenemos el userId
  if (!params.userId) {
    throw new Error('ID de usuario no proporcionado')
  }
  
  // Usar el cliente de Supabase con la clave anónima
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    console.log('Iniciando creación de tenant para usuario:', params.userId)
    
    // 1. Crear el tenant en la tabla tenants utilizando solo los campos existentes
    // Basado en la estructura real de la tabla que nos proporcionaste
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert([
        {
          name: params.name,
          domain: `${params.name.toLowerCase().replace(/\s+/g, '-')}.agentprop.com`,
          phone_contact: params.phone,
          email_contact: params.industry === 'real_estate' ? 'inmobiliaria@example.com' : 'contacto@example.com',
          active: true,
          // Los campos como primary_color, secondary_color, etc. se dejan como null
          // porque no están en los datos del formulario y pueden ser null según vimos en la estructura
        }
      ])
      .select('id')
      .single()
    
    if (tenantError) {
      console.error('Error al crear tenant:', tenantError)
      throw new Error(`Error al crear tenant: ${tenantError.message}`)
    }
    
    if (!tenantData || !tenantData.id) {
      console.error('No se pudo obtener el ID del tenant creado')
      throw new Error('No se pudo obtener el ID del tenant creado')
    }
    
    console.log('Tenant creado con ID:', tenantData.id)
    
    // 2. Actualizar el usuario con el tenant_id
    const { error: userError } = await supabase
      .from('users')
      .update({ tenant_id: tenantData.id })
      .eq('id', params.userId)
    
    if (userError) {
      console.error('Error al actualizar usuario con tenant_id:', userError)
      // Si hay un error al actualizar el usuario, eliminamos el tenant creado para evitar inconsistencias
      await supabase.from('tenants').delete().eq('id', tenantData.id)
      throw new Error(`Error al actualizar usuario con tenant_id: ${userError.message}`)
    }
    
    console.log('Usuario actualizado con tenant_id')
    
    // 3. Crear configuración en la tabla tenant_configs
    // Usando los campos que existen en la tabla según la imagen proporcionada
    const { error: configError } = await supabase
      .from('tenant_configs')
      .insert([
        {
          tenant_id: tenantData.id,
          welcome_message: `¡Bienvenido a ${params.name}! ¿En qué podemos ayudarte?`,
          offline_message: `Gracias por contactar a ${params.name}. En este momento estamos fuera de horario de atención. Nos pondremos en contacto contigo lo antes posible.`,
          working_hours: JSON.stringify({
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
            wednesday: { start: '09:00', end: '18:00' },
            thursday: { start: '09:00', end: '18:00' },
            friday: { start: '09:00', end: '18:00' },
            saturday: { start: '10:00', end: '14:00' },
            sunday: { start: null, end: null },
            timezone: params.timezone
          }),
          auto_assignment: true,
          custom_settings: JSON.stringify({
            currency: params.currency,
            subscription_plan: params.subscriptionPlan,
            industry: params.industry
          })
        }
      ])
    
    if (configError) {
      console.error('Error al crear configuración del tenant:', configError)
      throw new Error(`Error al crear configuración del tenant: ${configError.message}`)
    }
    
    console.log('Configuración del tenant creada correctamente')
    
    // 4. Registrar la suscripción (si existe la tabla)
    try {
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([
          {
            tenant_id: tenantData.id,
            plan: params.subscriptionPlan,
            status: 'active',
            // Para una suscripción gratuita o demo, establecemos start_date y end_date
            start_date: new Date().toISOString(),
            end_date: params.subscriptionPlan === 'free' 
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
          }
        ])
      
      if (subscriptionError) {
        console.error('Error al registrar suscripción:', subscriptionError)
        console.log('Continuando sin registrar suscripción')
      } else {
        console.log('Suscripción registrada correctamente')
      }
    } catch (error) {
      console.error('Error al intentar registrar suscripción:', error)
      console.log('Continuando sin registrar suscripción')
    }
    
    // Revalidar las rutas del home para reflejar el cambio
    revalidatePath('/home')
    
    return { success: true, tenantId: tenantData.id }
  } catch (error) {
    console.error('Error en createTenant:', error)
    throw error
  }
}