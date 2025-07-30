/**
 * frontend/src/app/api/chatbot/invalidate-cache/route.ts
 * API para invalidar la caché de plantillas del chatbot
 * 
 * @version 1.0.0
 * @created 2025-05-17
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Contador global para la versión de la caché (solo para esta instancia)
let CACHE_VERSION = Date.now();

// Mapa de plantillas cargadas en la caché (almacena versiones por template_id)
const templateCacheVersions: Record<string, number> = {};

/**
 * Verificar si una plantilla está en caché y si es la versión más reciente
 * @param templateId ID de la plantilla
 * @returns Objeto con el estado de la caché y su versión
 */
function checkTemplateCache(templateId: string): { isCached: boolean, version: number } {
    const version = templateCacheVersions[templateId] || 0;
    return {
        isCached: version > 0,
        version
    };
}

/**
 * Invalida la caché de una plantilla específica
 * @param templateId ID de la plantilla
 */
function invalidateTemplateCache(templateId: string): void {
    // Incrementar versión de la caché
    CACHE_VERSION++;
    templateCacheVersions[templateId] = CACHE_VERSION;
    console.log(`Caché invalidada para plantilla ${templateId}, nueva versión: ${CACHE_VERSION}`);
}

/**
 * Invalida toda la caché de plantillas
 */
function invalidateAllTemplatesCache(): void {
    CACHE_VERSION++;
    // Actualizar todas las plantillas en caché con la nueva versión
    Object.keys(templateCacheVersions).forEach(id => {
        templateCacheVersions[id] = CACHE_VERSION;
    });
    console.log(`Toda la caché de plantillas invalidada, nueva versión: ${CACHE_VERSION}`);
}

/**
 * Handler para solicitudes POST
 */
export async function POST(req: NextRequest) {
    try {
        // Obtener datos del cuerpo
        const body = await req.json();
        const { template_id, action = 'update' } = body;

        // Verificar parámetros
        if (!template_id && action !== 'invalidate_all') {
            return NextResponse.json(
                { error: 'Se requiere template_id para esta acción' },
                { status: 400 }
            );
        }

        // Registrar en la consola
        console.log(`⭐ SOLICITUD DE INVALIDACIÓN DE CACHÉ ⭐ Acción: ${action}, Plantilla: ${template_id || 'todas'}`);

        // Realizar acciones según el tipo
        switch (action) {
            case 'update':
            case 'invalidate':
                if (template_id) {
                    // Invalidar caché de la plantilla específica
                    invalidateTemplateCache(template_id);

                    // Intentar purgar la caché en el backend externo
                    await purgeCacheInBackend(template_id);

                    return NextResponse.json({
                        success: true,
                        message: `Caché invalidada para plantilla ${template_id}`,
                        new_version: templateCacheVersions[template_id]
                    });
                }
                break;

            case 'invalidate_all':
                // Invalidar toda la caché
                invalidateAllTemplatesCache();

                // Intentar purgar la caché en el backend externo
                await purgeCacheInBackend();

                return NextResponse.json({
                    success: true,
                    message: 'Toda la caché de plantillas invalidada',
                    new_version: CACHE_VERSION
                });

            default:
                return NextResponse.json(
                    { error: `Acción desconocida: ${action}` },
                    { status: 400 }
                );
        }

        return NextResponse.json(
            { error: 'Parámetros inválidos' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error al procesar solicitud de invalidación de caché:', error);
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

/**
 * Intenta purgar la caché en el backend externo
 * @param templateId ID de la plantilla opcional
 */
async function purgeCacheInBackend(templateId?: string): Promise<void> {
    try {
        // URL del backend
        const BACKEND_URL = process.env.CHATBOT_BACKEND_URL || 'http://localhost:3090';
        
        // Intentar notificar al backend que debe purgar su caché
        await fetch(`${BACKEND_URL}/api/admin/purge-cache`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                template_id: templateId,
                action: templateId ? 'invalidate' : 'invalidate_all'
            })
        });
        
        console.log(`Solicitud de purga de caché enviada al backend ${templateId ? `para plantilla ${templateId}` : 'para todas las plantillas'}`);
    } catch (error) {
        console.warn('No se pudo notificar al backend para purgar caché:', error);
        // No lanzamos el error, simplemente lo registramos
    }
}

/**
 * Handler para solicitudes GET
 */
export async function GET(req: NextRequest) {
    try {
        // Obtener el ID de plantilla del query string
        const templateId = req.nextUrl.searchParams.get('template_id');
        
        if (templateId) {
            // Verificar caché para una plantilla específica
            const cacheStatus = checkTemplateCache(templateId);
            
            return NextResponse.json({
                success: true,
                template_id: templateId,
                cache_status: cacheStatus
            });
        } else {
            // Mostrar estado de caché general
            return NextResponse.json({
                success: true,
                global_cache_version: CACHE_VERSION,
                cached_templates: Object.keys(templateCacheVersions).length,
                templates: templateCacheVersions
            });
        }
    } catch (error) {
        console.error('Error al procesar solicitud GET de caché:', error);
        
        return NextResponse.json(
            { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}