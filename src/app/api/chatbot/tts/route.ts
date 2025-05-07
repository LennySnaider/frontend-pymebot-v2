/**
 * frontend/src/app/api/chatbot/tts/route.ts
 * API para síntesis de voz (Text-to-Speech) usando Hailo Minimax
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configuración de Hailo Minimax
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || ''
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || ''
const MINIMAX_TTS_API_URL = 'https://api.minimax.chat/v1/text_to_speech'

/**
 * POST - Sintetiza voz a partir de texto
 */
export async function POST(req: NextRequest) {
    try {
        // Verificar la API key
        const apiKey = req.headers.get('x-api-key')
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }
        
        // Verificar configuración de Minimax
        if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
            return NextResponse.json(
                { error: 'Configuración de Minimax incompleta en el servidor' },
                { status: 500 }
            )
        }
        
        // Obtener los datos del cuerpo de la solicitud
        const body = await req.json()
        
        const { 
            text, 
            tenant_id,
            voice = 'female_1',
            format = 'mp3',
            session_id,
            speed = 1.0
        } = body
        
        // Validar parámetros obligatorios
        if (!text || !tenant_id) {
            return NextResponse.json(
                { error: 'Se requieren los parámetros text y tenant_id' },
                { status: 400 }
            )
        }
        
        // Verificar si el tenant tiene tokens disponibles
        const { data: tokenData, error: tokenError } = await supabase
            .from('tenant_chatbot_tokens')
            .select('tokens_used, tokens_limit')
            .eq('tenant_id', tenant_id)
            .eq('token_type', 'tts')
            .single()
        
        if (!tokenError && tokenData && tokenData.tokens_limit > 0) {
            if (tokenData.tokens_used >= tokenData.tokens_limit) {
                return NextResponse.json(
                    { error: 'Se ha alcanzado el límite de tokens TTS para este tenant' },
                    { status: 403 }
                )
            }
        }
        
        // Estimar tokens (1 token ≈ 3 caracteres para TTS)
        const estimatedTokens = Math.ceil(text.length / 3)
        
        // Generar un nombre único para el archivo
        const filename = `tts_${uuidv4()}.${format}`
        const tempDir = path.join(os.tmpdir(), 'chatbot-tts')
        
        // Asegurar que el directorio existe
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const tempFilePath = path.join(tempDir, filename)
        
        // Llamar a la API de Minimax
        const response = await axios.post(
            MINIMAX_TTS_API_URL,
            {
                text,
                voice_id: voice,
                speed,
                output_format: format.toUpperCase()
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                    'X-Minimax-Group-Id': MINIMAX_GROUP_ID
                },
                responseType: 'arraybuffer'
            }
        )
        
        // Extraer tokens utilizados de las cabeceras si están disponibles
        let actualTokensUsed = estimatedTokens
        if (response.headers && response.headers['x-tokens-used']) {
            actualTokensUsed = parseInt(response.headers['x-tokens-used'], 10)
        }
        
        // Guardar el archivo de audio
        fs.writeFileSync(tempFilePath, response.data)
        
        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('audio-files')
            .upload(`tts/${tenant_id}/${filename}`, fs.createReadStream(tempFilePath), {
                contentType: format === 'mp3' ? 'audio/mpeg' : 'audio/wav',
                cacheControl: '3600'
            })
        
        if (uploadError) {
            throw uploadError
        }
        
        // Obtener URL pública
        const { data: publicUrl } = supabase.storage
            .from('audio-files')
            .getPublicUrl(`tts/${tenant_id}/${filename}`)
        
        // Eliminar el archivo temporal
        fs.unlinkSync(tempFilePath)
        
        // Registrar uso de tokens
        await supabase
            .from('token_usage_logs')
            .insert({
                tenant_id,
                token_type: 'tts',
                tokens_used: actualTokensUsed,
                session_id,
                created_at: new Date().toISOString(),
                request_data: {
                    text_length: text.length,
                    voice,
                    format
                }
            })
        
        // Actualizar contador de tokens
        if (!tokenError) {
            await supabase
                .from('tenant_chatbot_tokens')
                .update({
                    tokens_used: (tokenData?.tokens_used || 0) + actualTokensUsed,
                    updated_at: new Date().toISOString()
                })
                .eq('tenant_id', tenant_id)
                .eq('token_type', 'tts')
        } else {
            // Si no existe el registro, crearlo
            await supabase
                .from('tenant_chatbot_tokens')
                .insert({
                    tenant_id,
                    token_type: 'tts',
                    tokens_used: actualTokensUsed,
                    tokens_limit: 0, // Sin límite por defecto
                    created_at: new Date().toISOString()
                })
        }
        
        return NextResponse.json({
            success: true,
            audio_url: publicUrl.publicUrl,
            text,
            tokens_used: actualTokensUsed,
            format
        })
        
    } catch (error: any) {
        console.error('Error en síntesis de voz:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}
