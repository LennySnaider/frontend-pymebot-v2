/**
 * Script de prueba para verificar updateLeadData
 * Este archivo puede ser usado para debuggear problemas con la actualización de leads
 */

import { updateLeadData, updateLeadMessageCount } from './updateLeadData'

export async function testUpdateLeadMessageCount(
    leadId: string = '12345',
    messageCount: number = 1,
    lastMessage: string = 'Mensaje de prueba'
) {
    console.log('=== INICIO TEST updateLeadMessageCount ===')
    console.log('Parámetros de prueba:', { leadId, messageCount, lastMessage })
    
    try {
        console.log('Intentando actualizar contador de mensajes...')
        const result = await updateLeadMessageCount(leadId, messageCount, lastMessage)
        console.log('✅ Éxito:', result)
        return result
    } catch (error) {
        console.error('❌ Error en test:', {
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error,
            errorType: typeof error,
            timestamp: new Date().toISOString()
        })
        throw error
    } finally {
        console.log('=== FIN TEST updateLeadMessageCount ===')
    }
}

export async function testUpdateLeadData(
    leadId: string = '12345',
    data: Record<string, any> = { full_name: 'Test User', email: 'test@example.com' }
) {
    console.log('=== INICIO TEST updateLeadData ===')
    console.log('Parámetros de prueba:', { leadId, data })
    
    try {
        console.log('Intentando actualizar datos del lead...')
        const result = await updateLeadData(leadId, data)
        console.log('✅ Éxito:', result)
        return result
    } catch (error) {
        console.error('❌ Error en test:', {
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error,
            errorType: typeof error,
            timestamp: new Date().toISOString()
        })
        throw error
    } finally {
        console.log('=== FIN TEST updateLeadData ===')
    }
}

// Función para ejecutar ambos tests
export async function runAllTests() {
    console.log('🧪 Ejecutando todos los tests de updateLeadData...')
    
    try {
        // Test 1: updateLeadData básico
        await testUpdateLeadData()
        
        // Test 2: updateLeadMessageCount básico
        await testUpdateLeadMessageCount()
        
        // Test 3: Casos de error - leadId vacío
        try {
            await testUpdateLeadMessageCount('')
            console.error('❌ Error: debería haber fallado con leadId vacío')
        } catch (error) {
            console.log('✅ Correcto: falló con leadId vacío como se esperaba')
        }
        
        // Test 4: Casos de error - messageCount negativo
        try {
            await testUpdateLeadMessageCount('test-id', -1)
            console.error('❌ Error: debería haber fallado con messageCount negativo')
        } catch (error) {
            console.log('✅ Correcto: falló con messageCount negativo como se esperaba')
        }
        
        console.log('🎉 Todos los tests completados')
        
    } catch (error) {
        console.error('💥 Error en la ejecución de tests:', error)
    }
}