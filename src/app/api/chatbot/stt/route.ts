/**
 * frontend/src/app/api/chatbot/stt/route.ts
 * API para reconocimiento de voz (Speech-to-Text) usando Hailo Minimax
 * @version 1.0.0
 * @updated 2025-04-08
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import { TokenUsageService } from '../token-service'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { Readable } from 'stream'

// Inicialización de Supabase (usando credenciales de servicio)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Servicio de tokens
const tokenService = new TokenUsageService(supabase)

// Configuración de APIs
const HAILO_API_KEY = process.env.HAILO_API_KEY
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || ''

// Máximo tamaño de archivo (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * POST - Transcribe audio a texto
 */
export async function POST(req: NextRequest) {
    try {
        // Verificar API key
        const apiKey = req.headers.get('x-api-key')
        if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
            return NextResponse.json(
                { error: 'API key no válida' },
                { status: 401 }
            )
        }

        // Verificar si es multipart/form-data o si ya viene con la URL del audio
        const contentType = req.headers.get('content-type') || ''
        
        let tenantId = ''
        let audioUrl = ''
        let audioData: Buffer | null = null
        let language = 'es-MX'
        let sessionId = ''
        let provider = 'hailo'
        
        if (contentType.includes('multipart/form-data')) {
            // Procesar formulario multipart
            const formData = await req.formData()
            tenantId = formData.get('tenant_id') as string
            language = (formData.get('language') as string) || 'es-MX'
            sessionId = (formData.get('session_id') as string) || ''
            provider = (formData.get('provider') as string) || 'hailo'
            
            const audioFile = formData.get('audio_file') as File
            
            if (!audioFile) {
                return NextResponse.json(
                    { error: 'No se proporcionó archivo de audio' },
                    { status: 400 }
                )
            }
            
            if (audioFile.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: 'El archivo excede el tamaño máximo permitido (10MB)' },
                    { status: 400 }
                )
            }
            
            // Convertir el archivo a buffer
            audioData = Buffer.from(await audioFile.arrayBuffer())
        } else {
            // Procesar JSON con URL o datos de audio
            const body = await req.json()
            tenantId = body.tenant_id
            audioUrl = body.audio_url
            audioData = body.audio_data ? Buffer.from(body.audio_data, 'base64') : null
            language = body.language || 'es-MX'
            sessionId = body.session_id
            provider = body.provider || 'hailo'
        }
        
        // Validar campos requeridos
        if (!tenantId || (!audioUrl && !audioData)) {
            return NextResponse.json(
                { error: 'Se requiere tenant_id y audio_url o audio_data' },
                { status: 400 }
            )
        }
        
        // Verificar disponibilidad de tokens
        const { canUseTokens, tokensAvailable } = await tokenService.checkTokenAvailability(
            tenantId,
            'stt'
        )

        if (!canUseTokens) {
            return NextResponse.json(
                { 
                    error: 'Límite de tokens de STT excedido para este tenant',
                    tokens_available: tokensAvailable 
                },
                { status: 403 }
            )
        }

        // Si se proporciona URL pero no datos, descargar el audio
        if (audioUrl && !audioData) {
            const response = await axios.get(audioUrl, { responseType: 'arraybuffer' })
            audioData = Buffer.from(response.data)
        }
        
        if (!audioData) {
            return NextResponse.json(
                { error: 'No se pudo obtener datos de audio válidos' },
                { status: 400 }
            )
        }

        // Estimar tokens a utilizar (aproximadamente 1 token por segundo de audio)
        // Una estimación más precisa requeriría analizar la duración del audio
        const estimatedTokens = Math.max(100, Math.ceil(audioData.length / 16000)) // Estimación aproximada

        // Transcribir según el proveedor seleccionado
        let transcription = ''
        let tokensUsed = estimatedTokens

        if (provider === 'hailo' && HAILO_API_KEY) {
            transcription = await transcribeWithHailo(audioData, language)
        } 
        else if (provider === 'minimax' && MINIMAX_API_KEY) {
            transcription = await transcribeWithMinimax(audioData, language)
        }
        else {
            return NextResponse.json(
                { error: 'Proveedor de STT no disponible o no configurado' },
                { status: 400 }
            )
        }

        // Registrar uso de tokens
        await tokenService.registerTokenUsage(
            tenantId,
            'stt',
            tokensUsed,
            sessionId,
            { audio_size: audioData.length, language, provider }
        )

        return NextResponse.json({
            success: true,
            text: transcription,
            tokens_used: tokensUsed,
            language
        })

    } catch (error: any) {
        console.error('Error en servicio STT:', error)
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        )
    }
}

/**
 * Transcribe audio usando la API de Hailo
 */
async function transcribeWithHailo(audioData: Buffer, language: string): Promise<string> {
    try {
        // Obtener un nombre de archivo temporal
        const tempDir = path.join(os.tmpdir(), 'chatbot-stt')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const audioExt = language.startsWith('en') ? 'wav' : 'mp3'
        const tempFilePath = path.join(tempDir, `stt_${uuidv4()}.${audioExt}`)
        
        // Guardar el buffer como archivo
        fs.writeFileSync(tempFilePath, audioData)
        
        // Crear form-data para la API
        const form = new FormData()
        form.append('audio', new Blob([fs.readFileSync(tempFilePath)]))
        form.append('language', language.split('-')[0]) // 'es-MX' -> 'es'
        
        // Llamar a la API
        const response = await axios.post(
            'https://api.hailo.ai/asr',
            form,
            {
                headers: {
                    'Authorization': `Bearer ${HAILO_API_KEY}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        )
        
        // Limpiar archivo temporal
        fs.unlinkSync(tempFilePath)
        
        // Extraer la transcripción
        if (response.data && response.data.text) {
            return response.data.text.trim()
        }
        
        throw new Error('La respuesta de la API no contiene una transcripción válida')
    } catch (error: any) {
        console.error('Error en transcripción con Hailo:', error)
        throw new Error(`Error en API Hailo: ${error.message}`)
    }
}

/**
 * Transcribe audio usando la API de Minimax
 */
async function transcribeWithMinimax(audioData: Buffer, language: string): Promise<string> {
    try {
        // Obtener un nombre de archivo temporal
        const tempDir = path.join(os.tmpdir(), 'chatbot-stt')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const tempFilePath = path.join(tempDir, `stt_${uuidv4()}.wav`)
        
        // Guardar el buffer como archivo
        fs.writeFileSync(tempFilePath, audioData)
        
        // Crear form-data para la API
        const form = new FormData()
        form.append('audio_file', new Blob([fs.readFileSync(tempFilePath)]))
        form.append('language', mapLanguageToMinimax(language))
        
        // Llamar a la API
        const response = await axios.post(
            'https://api.minimax.chat/v1/speech_recognition',
            form,
            {
                headers: {
                    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                    'X-Minimax-Group-Id': MINIMAX_GROUP_ID,
                    'Content-Type': 'multipart/form-data'
                }
            }
        )
        
        // Limpiar archivo temporal
        fs.unlinkSync(tempFilePath)
        
        // Extraer la transcripción
        if (response.data && response.data.text) {
            return response.data.text.trim()
        }
        
        throw new Error('La respuesta de la API no contiene una transcripción válida')
    } catch (error: any) {
        console.error('Error en transcripción con Minimax:', error)
        throw new Error(`Error en API Minimax: ${error.message}`)
    }
}

/**
 * Mapea los códigos de idioma estándar a los códigos soportados por Minimax
 */
function mapLanguageToMinimax(language: string): string {
    const langMap: Record<string, string> = {
        'es-MX': 'es',
        'es-ES': 'es',
        'es': 'es',
        'en-US': 'en',
        'en-GB': 'en',
        'en': 'en',
        'pt-BR': 'pt',
        'pt': 'pt',
        'fr': 'fr',
        'fr-FR': 'fr',
        'de': 'de',
        'de-DE': 'de',
        'it': 'it',
        'it-IT': 'it'
    }
    
    return langMap[language] || 'es'
}

/**
 * GET - Obtiene información sobre los idiomas disponibles
 */
export async function GET(req: NextRequest) {
    // Verificar API key
    const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key')
    if (!apiKey || apiKey !== process.env.CHATBOT_API_KEY) {
        return NextResponse.json(
            { error: 'API key no válida' },
            { status: 401 }
        )
    }

    // Determinar proveedor
    const provider = req.nextUrl.searchParams.get('provider') || 'all'

    // Lista de idiomas disponibles
    const languages = {
        hailo: [
            { code: 'es-MX', name: 'Español (México)' },
            { code: 'es-ES', name: 'Español (España)' },
            { code: 'en-US', name: 'Inglés (Estados Unidos)' },
            { code: 'en-GB', name: 'Inglés (Reino Unido)' },
            { code: 'pt-BR', name: 'Portugués (Brasil)' },
            { code: 'fr-FR', name: 'Francés' },
            { code: 'de-DE', name: 'Alemán' },
            { code: 'it-IT', name: 'Italiano' }
        ],
        minimax: [
            { code: 'es', name: 'Español' },
            { code: 'en', name: 'Inglés' },
            { code: 'pt', name: 'Portugués' },
            { code: 'fr', name: 'Francés' },
            { code: 'de', name: 'Alemán' },
            { code: 'it', name: 'Italiano' }
        ]
    }

    // Retornar los idiomas solicitados
    return NextResponse.json({
        languages: provider === 'all' ? languages : languages[provider as keyof typeof languages] || []
    })
}