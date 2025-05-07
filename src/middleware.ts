/**
 * frontend/src/middleware.ts
 * Middleware central de Next.js para autenticación y resolución de rutas dinámicas de verticales.
 * Intercepta navegaciones para verificar permisos y resolver rutas adecuadas.
 * @version 2.1.0
 * @updated 2025-06-05
 */

import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import {
    authRoutes as _authRoutes,
    publicRoutes as _publicRoutes,
} from '@/configs/routes.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import appConfig from '@/configs/app.config'
import { auth } from '@/auth'

const publicRoutes = Object.entries(_publicRoutes).map(([key]) => key)
const authRoutes = Object.entries(_authRoutes).map(([key]) => key)

const apiAuthPrefix = `${appConfig.apiPrefix}/auth`
const verticalPathPattern = /^\/(?:app\/)?(?:\(protected-pages\)\/)?vertical-([a-z0-9_]+)(?:\/(.*))?$/i

/**
 * Middleware para manejo de autenticación y resolución de rutas dinámicas de verticales
 * Implementa:
 * 1. Control de acceso a rutas protegidas/auth
 * 2. Resolución dinámica de rutas para verticales
 * 3. Verificación de permisos para acceso a verticales
 * 4. Redirección a páginas adecuadas según contexto
 */
export default auth(async (req) => {
    const { nextUrl } = req
    const isSignedIn = !!req.auth
    
    // Obtener token JWT para información adicional
    const token = await getToken({ req })
    
    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
    const isAuthRoute = authRoutes.includes(nextUrl.pathname)
    
    // Detectar si es una ruta de vertical
    const verticalMatch = nextUrl.pathname.match(verticalPathPattern)
    const isVerticalRoute = !!verticalMatch
    let verticalCode = verticalMatch ? verticalMatch[1] : null
    let verticalPath = verticalMatch ? verticalMatch[2] || '' : null
    
    // Skip middleware para rutas API de auth
    if (isApiAuthRoute) return
    
    // Manejo de rutas de autenticación
    if (isAuthRoute) {
        if (isSignedIn) {
            // Redireccionar a ruta autenticada si ya tiene sesión
            return Response.redirect(
                new URL(appConfig.authenticatedEntryPath, nextUrl),
            )
        }
        return
    }
    
    // Redireccionar a login si no está autenticado y la ruta requiere auth
    if (!isSignedIn && !isPublicRoute) {
        let callbackUrl = nextUrl.pathname
        if (nextUrl.search) {
            callbackUrl += nextUrl.search
        }
        
        return Response.redirect(
            new URL(
                `${appConfig.unAuthenticatedEntryPath}?${REDIRECT_URL_KEY}=${callbackUrl}`,
                nextUrl,
            ),
        )
    }
    
    // Resolución dinámica de rutas para verticales
    if (isSignedIn && isVerticalRoute && verticalCode) {
        // Verificar si tiene acceso a la vertical
        const hasAccess = await checkVerticalAccess(token, verticalCode)
        
        if (!hasAccess) {
            // Redireccionar a página de acceso denegado
            const unauthorizedUrl = new URL('/app/unauthorized', nextUrl)
            unauthorizedUrl.searchParams.set('vertical', verticalCode)
            return NextResponse.redirect(unauthorizedUrl)
        }
        
        // Verificar si la vertical existe y está disponible
        const isVerticalAvailable = await isVerticalEnabled(verticalCode)
        
        if (!isVerticalAvailable) {
            // Redireccionar a página de vertical no disponible
            const unavailableUrl = new URL('/app/vertical-unavailable', nextUrl)
            unavailableUrl.searchParams.set('vertical', verticalCode)
            return NextResponse.redirect(unavailableUrl)
        }
        
        // Verificar ruta específica para módulos
        if (verticalPath) {
            // Extraer código del módulo de la ruta
            const modulePath = verticalPath.split('/')
            const moduleCode = modulePath[0]
            
            // Verificar si tiene acceso al módulo específico
            if (moduleCode) {
                const hasModuleAccess = await checkModuleAccess(token, verticalCode, moduleCode)
                
                if (!hasModuleAccess) {
                    // Redireccionar a página de acceso denegado para módulo
                    const moduleUnauthorizedUrl = new URL('/app/module-unauthorized', nextUrl)
                    moduleUnauthorizedUrl.searchParams.set('vertical', verticalCode)
                    moduleUnauthorizedUrl.searchParams.set('module', moduleCode)
                    return NextResponse.redirect(moduleUnauthorizedUrl)
                }
                
                // Verificar si el módulo está habilitado
                const isModuleEnabled = await isModuleAvailable(verticalCode, moduleCode)
                
                if (!isModuleEnabled) {
                    // Redireccionar a página de módulo no disponible
                    const moduleUnavailableUrl = new URL('/app/module-unavailable', nextUrl)
                    moduleUnavailableUrl.searchParams.set('vertical', verticalCode)
                    moduleUnavailableUrl.searchParams.set('module', moduleCode)
                    return NextResponse.redirect(moduleUnavailableUrl)
                }
            }
        }
        
        // En este punto, el usuario tiene acceso a la vertical y al módulo
        // La resolución de rutas continuará normalmente en Next.js
    }
    
    // Continuar con la solicitud normal si todo está bien
    return NextResponse.next()
})

/**
 * Verifica si el usuario tiene acceso a una vertical específica
 * Basado en el tenant, plan y permisos del usuario
 */
async function checkVerticalAccess(token: any, verticalCode: string): Promise<boolean> {
    if (!token) return false
    
    // Superadmin siempre tiene acceso a todas las verticales
    if (token.role === 'super_admin') return true
    
    try {
        // En producción, esto sería una llamada a la API o a una función del servidor
        // Verificando permisos basados en el tenant y rol del usuario
        
        // Por ahora, simulamos la verificación con datos de ejemplo
        // En un entorno real, esto verificaría los permisos en una base de datos o API
        
        const mockVerticalPermissions: Record<string, string[]> = {
            'tenant_admin': ['medicina', 'salon', 'restaurante', 'bienes_raices'],
            'agent': ['medicina', 'salon']
        }
        
        // Verificar si el rol tiene acceso a la vertical
        return mockVerticalPermissions[token.role]?.includes(verticalCode) || false
    } catch (error) {
        console.error(`Error al verificar acceso a vertical ${verticalCode}:`, error)
        return false
    }
}

/**
 * Verifica si la vertical está habilitada y disponible en el sistema
 */
async function isVerticalEnabled(verticalCode: string): Promise<boolean> {
    try {
        // En producción, esto verificaría en la base de datos o API si la vertical está habilitada
        // Por ahora, simulamos con datos de ejemplo
        
        const mockEnabledVerticals = ['medicina', 'salon', 'restaurante', 'bienes_raices']
        return mockEnabledVerticals.includes(verticalCode)
    } catch (error) {
        console.error(`Error al verificar disponibilidad de vertical ${verticalCode}:`, error)
        return false
    }
}

/**
 * Verifica si el usuario tiene acceso a un módulo específico de una vertical
 */
async function checkModuleAccess(token: any, verticalCode: string, moduleCode: string): Promise<boolean> {
    if (!token) return false
    
    // Superadmin siempre tiene acceso a todos los módulos
    if (token.role === 'super_admin') return true
    
    try {
        // En producción, esto verificaría los permisos específicos del módulo
        // Por ahora, simulamos con datos de ejemplo
        
        const mockModulePermissions: Record<string, Record<string, string[]>> = {
            'tenant_admin': {
                'medicina': ['patients', 'appointments', 'records', 'billing'],
                'salon': ['clients', 'appointments', 'services', 'inventory'],
                'restaurante': ['menu', 'orders', 'tables', 'inventory'],
                'bienes_raices': ['properties', 'clients', 'leads', 'contracts']
            },
            'agent': {
                'medicina': ['patients', 'appointments'],
                'salon': ['clients', 'appointments']
            }
        }
        
        // Verificar si el rol tiene acceso al módulo específico
        return mockModulePermissions[token.role]?.[verticalCode]?.includes(moduleCode) || false
    } catch (error) {
        console.error(`Error al verificar acceso a módulo ${moduleCode} en vertical ${verticalCode}:`, error)
        return false
    }
}

/**
 * Verifica si un módulo específico está habilitado y disponible
 */
async function isModuleAvailable(verticalCode: string, moduleCode: string): Promise<boolean> {
    try {
        // En producción, esto verificaría en la base de datos o API si el módulo está habilitado
        // Por ahora, simulamos con datos de ejemplo
        
        const mockEnabledModules: Record<string, string[]> = {
            'medicina': ['patients', 'appointments', 'records', 'billing', 'analytics'],
            'salon': ['clients', 'appointments', 'services', 'inventory', 'marketing'],
            'restaurante': ['menu', 'orders', 'tables', 'inventory', 'reservations'],
            'bienes_raices': ['properties', 'clients', 'leads', 'contracts', 'marketing']
        }
        
        return mockEnabledModules[verticalCode]?.includes(moduleCode) || false
    } catch (error) {
        console.error(`Error al verificar disponibilidad de módulo ${moduleCode} en vertical ${verticalCode}:`, error)
        return false
    }
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api)(.*)'],
}