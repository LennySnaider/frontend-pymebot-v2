/**
 * frontend/src/app/api/chatbot/tenant-config/route.ts
 * API para obtener la configuración de chatbot de un tenant por su ID o canal
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
    try {
        // Obtener parámetros de la consulta
        const searchParams = req.nextUrl.searchParams
        const tenantId = searchParams.get('tenant_id')
        const channelType = searchParams.get('channel_type')
        const channelId = searchParams.get('channel_id')
        const apiKey = searchParams.get('api_key')
        
        // Verificar API key
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Se requiere tenant_id o (channel_type y channel_id)
        if (!tenantId && !(channelType && channelId)) {
            return NextResponse.json(
                { error: 'Se requiere tenant_id o (channel_type y channel_id)' },
                { status: 400 }
            )
        }
        
        let effectiveTenantId = tenantId
        
        // Si se proporcionaron channel_type y channel_id, buscar el tenant_id correspondiente
        if (channelType && channelId) {
            const { data: channel, error: channelError } = await supabase
                .from('tenant_chatbot_channels')
                .select('tenant_id, default_activation_id')
                .eq('channel_type', channelType)
                .eq('channel_identifier', channelId)
                .eq('is_active', true)
                .single()
            
            if (channelError) {
                return NextResponse.json(
                    { error: 'Canal no encontrado' },
                    { status: 404 }
                )
            }
            
            effectiveTenantId = channel.tenant_id
            
            // Si el canal tiene una activación predeterminada, usarla directamente
            if (channel.default_activation_id) {
                const { data: config, error: configError } = await supabase
                    .from('tenant_chatbot_configurations')
                    .select(`
                        *,
                        activations:activation_id (
                            id,
                            template_id,
                            template_version,
                            templates:template_id (
                                id,
                                name,
                                react_flow_json
                            )
                        )
                    `)
                    .eq('activation_id', channel.default_activation_id)
                    .single()
                
                if (!configError && config) {
                    return NextResponse.json({
                        tenant_id: effectiveTenantId,
                        activation_id: channel.default_activation_id,
                        template_id: config.activations.template_id,
                        template_version: config.activations.template_version,
                        template_name: config.activations.templates.name,
                        flow_structure: config.activations.templates.react_flow_json,
                        config_data: config.config_data
                    })
                }
            }
        }
        
        // Buscar la activación más reciente del tenant
        const { data: activation, error: activationError } = await supabase
            .from('tenant_chatbot_activations')
            .select(`
                id,
                template_id,
                template_version,
                templates:template_id (
                    id,
                    name,
                    react_flow_json
                )
            `)
            .eq('tenant_id', effectiveTenantId)
            .eq('is_active', true)
            .order('activated_at', { ascending: false })
            .limit(1)
            .single()
        
        if (activationError) {
            return NextResponse.json(
                { error: 'No hay activaciones para este tenant' },
                { status: 404 }
            )
        }
        
        // Buscar la configuración para esta activación
        const { data: config, error: configError } = await supabase
            .from('tenant_chatbot_configurations')
            .select('*')
            .eq('activation_id', activation.id)
            .single()
        
        if (configError && configError.code !== 'PGRST116') { // No data found is ok
            return NextResponse.json(
                { error: 'Error al obtener la configuración' },
                { status: 500 }
            )
        }
        
        // Incluir también información del tenant
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name, business_type, business_domain, settings')
            .eq('id', effectiveTenantId)
            .single()
        
        return NextResponse.json({
            tenant_id: effectiveTenantId,
            tenant_name: tenant?.name,
            tenant_business_type: tenant?.business_type,
            tenant_settings: tenant?.settings,
            activation_id: activation.id,
            template_id: activation.template_id,
            template_version: activation.template_version,
            template_name: activation.templates.name,
            flow_structure: activation.templates.react_flow_json,
            config_data: config?.config_data || {}
        })
        
    } catch (error: any) {
        console.error('Error en API de configuración de tenant:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
