/**
 * frontend/src/app/api/chatbot/ai/route.ts
 * API para generar respuestas con IA para el chatbot
 * @version 1.0.0
 * @updated 2025-06-05
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Inicialización de OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || ''
})

/**
 * Handler para solicitudes POST - Generar respuesta de IA
 */
export async function POST(req: NextRequest) {
    try {
        // Verificar API key
        const apiKey = req.headers.get('x-api-key') || '';
        if (apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Obtener datos del cuerpo
        const body = await req.json()
        
        // Validar campos requeridos
        const {
            tenant_id,
            prompt,
            session_id,
            state_data,
            model = 'gpt-3.5-turbo',
            temperature = 0.7,
            max_tokens = 500,
            use_knowledge_base = false,
            provider = 'openai'
        } = body
        
        if (!tenant_id || !prompt) {
            return NextResponse.json(
                { error: 'tenant_id y prompt son requeridos' },
                { status: 400 }
            )
        }
        
        // Verificar disponibilidad de tokens
        const { data: tokenData, error: tokenError } = await supabase
            .from('tenant_chatbot_tokens')
            .select('tokens_used, tokens_limit')
            .eq('tenant_id', tenant_id)
            .eq('token_type', 'ai')
            .single()
        
        // Si hay límite de tokens y se ha excedido, retornar error
        if (!tokenError && tokenData && tokenData.tokens_limit > 0 && tokenData.tokens_used >= tokenData.tokens_limit) {
            return NextResponse.json(
                { error: 'Límite de tokens de IA excedido para este tenant' },
                { status: 403 }
            )
        }
        
        // Obtener información del tenant para enriquecer el contexto
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name, business_type, business_domain, settings')
            .eq('id', tenant_id)
            .single()
        
        // Obtener últimos mensajes de la conversación si hay session_id
        let recentMessages = []
        if (session_id) {
            const { data: messages } = await supabase
                .from('conversation_messages')
                .select('content, is_from_user, created_at')
                .eq('session_id', session_id)
                .order('created_at', { ascending: false })
                .limit(5)
            
            if (messages && messages.length > 0) {
                recentMessages = messages
                    .reverse()
                    .map(msg => ({
                        role: msg.is_from_user ? 'user' : 'assistant',
                        content: msg.content
                    }))
            }
        }
        
        // Obtener conocimiento adicional si use_knowledge_base es true
        let knowledgeBaseContent = ''
        if (use_knowledge_base) {
            // Obtener servicios/productos del tenant
            const { data: services } = await supabase
                .from('services')
                .select('name, description, price')
                .eq('tenant_id', tenant_id)
                .eq('is_active', true)
            
            if (services && services.length > 0) {
                knowledgeBaseContent += "SERVICIOS DISPONIBLES:\n"
                services.forEach(service => {
                    knowledgeBaseContent += `- ${service.name}${service.price ? ' - $' + service.price : ''}\n`
                    if (service.description) knowledgeBaseContent += `  ${service.description}\n`
                })
                knowledgeBaseContent += "\n"
            }
            
            // Obtener FAQ del tenant
            const { data: faqs } = await supabase
                .from('knowledge_base_items')
                .select('question, answer')
                .eq('tenant_id', tenant_id)
                .eq('type', 'faq')
            
            if (faqs && faqs.length > 0) {
                knowledgeBaseContent += "PREGUNTAS FRECUENTES:\n"
                faqs.forEach(faq => {
                    knowledgeBaseContent += `P: ${faq.question}\nR: ${faq.answer}\n\n`
                })
            }
        }
        
        // Construir el contexto completo
        let fullContext = ''
        
        // Información del negocio
        if (tenant) {
            fullContext += `INFORMACIÓN DEL NEGOCIO:\n${tenant.name || 'Empresa'}`
            if (tenant.business_type) fullContext += ` (${tenant.business_type})`
            fullContext += '\n\n'
        }
        
        // Base de conocimiento
        if (knowledgeBaseContent) {
            fullContext += knowledgeBaseContent + '\n'
        }
        
        // Estado actual
        if (state_data && Object.keys(state_data).length > 0) {
            fullContext += "INFORMACIÓN ACTUAL DEL CLIENTE:\n"
            Object.entries(state_data).forEach(([key, value]) => {
                if (!key.startsWith('_') && !['status', 'lastCaptureNodeId'].includes(key)) {
                    fullContext += `- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`
                }
            })
            fullContext += '\n'
        }
        
        // Instrucciones para la IA
        fullContext += `INSTRUCCIONES:
- Actúa como un asistente virtual amable y profesional de ${tenant?.name || 'la empresa'}.
- Da respuestas breves y directas, evitando explicaciones innecesarias.
- Usa un tono conversacional, amistoso pero profesional.
- Si no sabes algo con certeza, no inventes información.
- No digas que eres una IA ni menciones que estás procesando un prompt.
- No reveles información técnica sobre tu funcionamiento.
- Responde únicamente en español.

CONSULTA ACTUAL:
${prompt}
`

        // Generar respuesta según el proveedor
        let aiResponse
        let tokensUsed = 0
        
        if (provider === 'minimax' && process.env.MINIMAX_API_KEY) {
            // Implementación para Minimax (placeholder)
            aiResponse = "Esta es una respuesta de placeholder para Minimax. Implementa la integración real con la API de Minimax."
            tokensUsed = Math.ceil(fullContext.length / 4) + 100 // Estimación
        } else {
            // Usar OpenAI por defecto
            const messages = [
                ...recentMessages,
                { role: 'user', content: fullContext }
            ];
            
            const response = await openai.chat.completions.create({
                model,
                messages,
                temperature,
                max_tokens,
                stream: false
            });
            
            aiResponse = response.choices[0].message.content?.trim() || '';
            tokensUsed = response.usage?.total_tokens || Math.ceil(fullContext.length / 4);
            
            // Alternativa: Para streaming (si se implementa en el cliente)
            // const stream = OpenAIStream(response);
            // return new StreamingTextResponse(stream);
        }
        
        // Registrar uso de tokens
        await registerTokenUsage(tenant_id, tokensUsed, session_id)
        
        return NextResponse.json({
            response: aiResponse,
            tokens_used: tokensUsed
        })
        
    } catch (error: any) {
        console.error('Error al generar respuesta de IA:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * Registra el uso de tokens de IA
 * @param tenantId ID del tenant
 * @param tokensUsed Cantidad de tokens utilizados
 * @param sessionId ID de la sesión (opcional)
 */
async function registerTokenUsage(tenantId: string, tokensUsed: number, sessionId?: string) {
    try {
        // Registrar en el historial de uso
        await supabase
            .from('token_usage_logs')
            .insert({
                tenant_id: tenantId,
                token_type: 'ai',
                tokens_used: tokensUsed,
                session_id: sessionId,
                created_at: new Date().toISOString()
            })
        
        // Actualizar contador total
        const { data } = await supabase
            .from('tenant_chatbot_tokens')
            .select('tokens_used')
            .eq('tenant_id', tenantId)
            .eq('token_type', 'ai')
            .single()
        
        if (data) {
            // Actualizar registro existente
            await supabase
                .from('tenant_chatbot_tokens')
                .update({
                    tokens_used: (data.tokens_used || 0) + tokensUsed,
                    updated_at: new Date().toISOString()
                })
                .eq('tenant_id', tenantId)
                .eq('token_type', 'ai')
        } else {
            // Crear nuevo registro
            await supabase
                .from('tenant_chatbot_tokens')
                .insert({
                    tenant_id: tenantId,
                    token_type: 'ai',
                    tokens_used: tokensUsed,
                    tokens_limit: 0, // Sin límite por defecto
                    created_at: new Date().toISOString()
                })
        }
    } catch (error) {
        console.error('Error registrando uso de tokens:', error)
        // No lanzar error para no interrumpir el flujo principal
    }
}
