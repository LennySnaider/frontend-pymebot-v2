/**
 * frontend/src/app/api/chatbot/channels/route.ts
 * API para gestionar canales de chatbot (WhatsApp, webchat, etc.)
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Verificación de API key
const verifyApiKey = (apiKey: string | null) => {
    return apiKey === process.env.CHATBOT_API_KEY
}

// POST - Crear o actualizar un canal
export async function POST(req: NextRequest) {
    try {
        // Verificar la API key en el query string
        const apiKey = req.nextUrl.searchParams.get('api_key')
        if (!verifyApiKey(apiKey)) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener datos del cuerpo
        const { 
            tenant_id, 
            channel_type, 
            channel_identifier, 
            is_active = true,
            default_activation_id,
            config = {}
        } = await req.json()
        
        // Validar campos requeridos
        if (!tenant_id || !channel_type || !channel_identifier) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos (tenant_id, channel_type, channel_identifier)' },
                { status: 400 }
            )
        }
        
        // Verificar que el tenant exista
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id')
            .eq('id', tenant_id)
            .single()
        
        if (tenantError) {
            return NextResponse.json(
                { error: 'Tenant no encontrado' },
                { status: 404 }
            )
        }
        
        // Verificar que la activación exista (si se proporciona)
        if (default_activation_id) {
            const { data: activation, error: activationError } = await supabase
                .from('tenant_chatbot_activations')
                .select('id')
                .eq('id', default_activation_id)
                .eq('tenant_id', tenant_id)
                .single()
            
            if (activationError) {
                return NextResponse.json(
                    { error: 'Activación no encontrada o no pertenece a este tenant' },
                    { status: 404 }
                )
            }
        }
        
        // Verificar si ya existe un canal con la misma identificación
        const { data: existingChannel, error: findError } = await supabase
            .from('tenant_chatbot_channels')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('channel_type', channel_type)
            .eq('channel_identifier', channel_identifier)
            .maybeSingle()
        
        let result
        
        if (existingChannel) {
            // Actualizar canal existente
            const { data, error: updateError } = await supabase
                .from('tenant_chatbot_channels')
                .update({
                    is_active,
                    default_activation_id,
                    config,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingChannel.id)
                .select()
                .single()
            
            if (updateError) {
                throw updateError
            }
            
            result = { 
                action: 'updated', 
                channel: data
            }
        } else {
            // Crear nuevo canal
            const { data, error: createError } = await supabase
                .from('tenant_chatbot_channels')
                .insert({
                    tenant_id,
                    channel_type,
                    channel_identifier,
                    is_active,
                    default_activation_id,
                    config,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()
            
            if (createError) {
                throw createError
            }
            
            result = { 
                action: 'created', 
                channel: data
            }
        }
        
        return NextResponse.json(result)
        
    } catch (error: any) {
        console.error('Error en API de canales (POST):', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

// GET - Obtener canales
export async function GET(req: NextRequest) {
    try {
        // Verificar la API key en el query string
        const apiKey = req.nextUrl.searchParams.get('api_key')
        if (!verifyApiKey(apiKey)) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener parámetros de la consulta
        const tenantId = req.nextUrl.searchParams.get('tenant_id')
        const channelType = req.nextUrl.searchParams.get('channel_type')
        const channelId = req.nextUrl.searchParams.get('channel_id')
        const isActive = req.nextUrl.searchParams.get('is_active')
        
        // Construir la consulta base
        let query = supabase
            .from('tenant_chatbot_channels')
            .select(`
                *,
                activations:default_activation_id (
                    id,
                    template_id,
                    templates:template_id (
                        id,
                        name
                    )
                )
            `)
        
        // Aplicar filtros
        if (tenantId) {
            query = query.eq('tenant_id', tenantId)
        }
        
        if (channelType) {
            query = query.eq('channel_type', channelType)
        }
        
        if (channelId) {
            query = query.eq('id', channelId)
        }
        
        if (isActive) {
            query = query.eq('is_active', isActive === 'true')
        }
        
        // Ejecutar la consulta
        const { data, error, count } = await query.order('created_at', { ascending: false })
        
        if (error) {
            throw error
        }
        
        return NextResponse.json({
            channels: data || [],
            count: count || 0
        })
        
    } catch (error: any) {
        console.error('Error en API de canales (GET):', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

// DELETE - Desactivar o eliminar un canal
export async function DELETE(req: NextRequest) {
    try {
        // Verificar la API key en el query string
        const apiKey = req.nextUrl.searchParams.get('api_key')
        if (!verifyApiKey(apiKey)) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener ID del canal
        const channelId = req.nextUrl.searchParams.get('channel_id')
        const hardDelete = req.nextUrl.searchParams.get('hard_delete') === 'true'
        
        if (!channelId) {
            return NextResponse.json(
                { error: 'Falta el parámetro channel_id' },
                { status: 400 }
            )
        }
        
        if (hardDelete) {
            // Eliminar completamente el canal
            const { data, error } = await supabase
                .from('tenant_chatbot_channels')
                .delete()
                .eq('id', channelId)
                .select()
                .single()
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                message: 'Canal eliminado correctamente',
                channel: data
            })
        } else {
            // Solo desactivar el canal
            const { data, error } = await supabase
                .from('tenant_chatbot_channels')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', channelId)
                .select()
                .single()
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                message: 'Canal desactivado correctamente',
                channel: data
            })
        }
        
    } catch (error: any) {
        console.error('Error en API de canales (DELETE):', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

// PATCH - Actualizar configuración parcial de un canal
export async function PATCH(req: NextRequest) {
    try {
        // Verificar la API key en el query string
        const apiKey = req.nextUrl.searchParams.get('api_key')
        if (!verifyApiKey(apiKey)) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener ID del canal y datos a actualizar
        const channelId = req.nextUrl.searchParams.get('channel_id')
        const { is_active, default_activation_id, config } = await req.json()
        
        if (!channelId) {
            return NextResponse.json(
                { error: 'Falta el parámetro channel_id' },
                { status: 400 }
            )
        }
        
        // Verificar que el canal exista
        const { data: existingChannel, error: findError } = await supabase
            .from('tenant_chatbot_channels')
            .select('id, config')
            .eq('id', channelId)
            .single()
        
        if (findError) {
            return NextResponse.json(
                { error: 'Canal no encontrado' },
                { status: 404 }
            )
        }
        
        // Construir objeto de actualización
        const updateData: any = {
            updated_at: new Date().toISOString()
        }
        
        if (is_active !== undefined) {
            updateData.is_active = is_active
        }
        
        if (default_activation_id) {
            updateData.default_activation_id = default_activation_id
        }
        
        if (config) {
            // Fusionar configuración existente con la nueva
            updateData.config = {
                ...(existingChannel.config || {}),
                ...config
            }
        }
        
        // Actualizar el canal
        const { data, error: updateError } = await supabase
            .from('tenant_chatbot_channels')
            .update(updateData)
            .eq('id', channelId)
            .select()
            .single()
        
        if (updateError) {
            throw updateError
        }
        
        return NextResponse.json({
            success: true,
            channel: data
        })
        
    } catch (error: any) {
        console.error('Error en API de canales (PATCH):', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}
