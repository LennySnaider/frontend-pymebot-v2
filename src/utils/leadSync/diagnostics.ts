/**
 * Script de verificación para diagnosticar problemas de inicialización
 * Se ejecuta automáticamente en desarrollo para detectar errores
 */

export function runDiagnostics() {
    if (typeof window === 'undefined') {
        console.log('🔍 [Diagnostics] Running in SSR environment, skipping client diagnostics')
        return
    }

    console.group('🔍 Lead Sync System Diagnostics')
    
    try {
        // 1. Verificar que window existe
        console.log('✅ Window object exists:', typeof window !== 'undefined')
        
        // 2. Verificar funciones globales sin importar módulos
        if ((window as any).__updateLeadName) {
            console.log('✅ Global __updateLeadName function exists')
        } else {
            console.warn('⚠️ Global __updateLeadName function not found (might be disabled by config)')
        }
        
        if ((window as any).__debugChatStore) {
            console.log('✅ Global __debugChatStore function exists')
            try {
                // Intentar ejecutar para verificar que funciona
                (window as any).__debugChatStore()
                console.log('✅ __debugChatStore executed successfully')
            } catch (error) {
                console.warn('⚠️ __debugChatStore exists but failed to execute:', error)
            }
        } else {
            console.warn('⚠️ Global __debugChatStore function not found (might be disabled by config)')
        }
        
        if ((window as any).__leadSyncSystem) {
            console.log('✅ Global __leadSyncSystem object exists')
            const syncSystem = (window as any).__leadSyncSystem
            console.log('   Available methods:', Object.keys(syncSystem || {}).join(', '))
        } else {
            console.warn('⚠️ Global __leadSyncSystem object not found')
        }
        
        // 3. Verificar localStorage
        try {
            const testKey = '__lead_sync_test__'
            localStorage.setItem(testKey, 'test')
            localStorage.removeItem(testKey)
            console.log('✅ localStorage is accessible')
        } catch (error) {
            console.error('❌ localStorage is not accessible:', error)
        }
        
        // 4. Verificar event listeners registrados
        console.log('ℹ️ Event listeners should be registered for:', [
            'lead-data-updated',
            'lead-name-updated',
            'salesfunnel-lead-updated',
            'syncLeadNames',
            'force-chat-refresh'
        ])
        
        // 5. Verificar configuración
        if ((window as any).__leadSyncConfig) {
            const config = (window as any).__leadSyncConfig.get()
            console.log('✅ Lead Sync Config loaded:', {
                globalDebugEnabled: config.enableGlobalDebugFunctions,
                verboseLogging: config.enableVerboseLogging
            })
        }
        
        console.log('\n🎆 To test the sync system manually:')
        console.log('1. Open the blue sync tester button (🔄) in the bottom left')
        console.log('2. Or use: __leadSyncSystem.forceSync("leadId", "New Name")')
        console.log('3. Check console for sync events')
        
    } catch (error) {
        console.error('❌ Diagnostic error:', error)
    }
    
    console.groupEnd()
}

// NO ejecutar automáticamente aquí para evitar errores de importación
// La ejecución se hace desde LeadSyncInitializer
