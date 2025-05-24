# Sistema de Sincronización de Leads

## Descripción

Este sistema proporciona sincronización en tiempo real de datos de leads entre diferentes componentes de la aplicación, especialmente entre el Sales Funnel y el Chat.

## Uso Básico

### Emisión de Actualizaciones

```typescript
import { broadcastLeadDataUpdate } from '@/utils/leadSync'

// Actualizar nombre de un lead
broadcastLeadDataUpdate(leadId, {
    name: 'Nuevo Nombre',
    full_name: 'Nuevo Nombre Completo'
}, 'lead-name-update')

// Actualización completa
broadcastLeadDataUpdate(leadId, {
    name: 'Nombre',
    email: 'email@ejemplo.com',
    phone: '123456789',
    stage: 'new'
}, 'lead-full-update')
```

### Escuchar Actualizaciones

```typescript
import { useLeadDataSync } from '@/utils/leadSync'

function MyComponent() {
    const { emitUpdate } = useLeadDataSync({
        onUpdate: (leadId, data) => {
            console.log(`Lead ${leadId} actualizado:`, data)
        },
        onNameUpdate: (leadId, name) => {
            console.log(`Nombre actualizado: ${leadId} -> ${name}`)
        }
    })
    
    // ...
}
```

## Configuración

El sistema puede configurarse mediante el objeto `leadSyncConfig`:

```javascript
// En la consola del navegador
__leadSyncConfig.update({
    enableGlobalDebugFunctions: false, // Deshabilitar funciones de debug
    enableVerboseLogging: true,        // Habilitar logs detallados
    enableAutoDiagnostics: true        // Habilitar diagnósticos
})
```

## Solución de Problemas

### Error: "Cannot find module"

Este error ocurre cuando el sistema de diagnósticos intenta importar módulos con rutas relativas. **Solución:**

1. Los diagnósticos están deshabilitados por defecto
2. Para ejecutar diagnósticos manualmente:
   ```javascript
   // En la consola del navegador
   runDiagnostics()
   ```

### Error: "Cannot set properties of undefined"

Este error ocurre cuando se intenta acceder a `window` antes de que esté disponible. **Ya está solucionado** con verificaciones de entorno.

### El sistema no se inicializa

1. Verificar que `LeadSyncInitializer` esté incluido en el layout
2. Verificar en la consola:
   ```javascript
   __leadSyncSystem.isInitialized()
   ```

### Los cambios no se sincronizan

1. Verificar que los eventos se estén emitiendo:
   ```javascript
   // Habilitar logs detallados
   __leadSyncConfig.update({ enableVerboseLogging: true })
   ```

2. Usar el tester visual (botón azul 🔄 en la esquina inferior izquierda)

3. Forzar sincronización manual:
   ```javascript
   __leadSyncSystem.forceSync('leadId', 'Nuevo Nombre')
   ```

## Herramientas de Desarrollo

### Funciones Globales (solo en desarrollo)

- `__leadSyncSystem.getCache()` - Ver caché de leads
- `__leadSyncSystem.clearCache()` - Limpiar caché
- `__leadSyncSystem.forceSync(leadId, name)` - Forzar sincronización
- `__leadSyncConfig.get()` - Ver configuración actual
- `__leadSyncConfig.update(config)` - Actualizar configuración

### Componente de Prueba

En desarrollo, aparece un botón azul (🔄) en la esquina inferior izquierda que permite probar la sincronización manualmente.

## Arquitectura

```
leadSync/
├── leadDataBroadcast.ts    # Sistema de emisión de eventos
├── useLeadDataSync.ts      # Hook React para componentes
├── initializeSystem.ts     # Inicialización global
├── diagnostics.ts          # Herramientas de diagnóstico
├── config.ts              # Configuración del sistema
└── index.ts               # Exportaciones
```

## Eventos Emitidos

- `lead-data-updated` - Actualización general de datos
- `lead-name-updated` - Actualización específica de nombre
- `lead-stage-updated` - Actualización de etapa
- `lead-full-update` - Actualización completa
- `salesfunnel-lead-updated` - Compatibilidad con sales funnel
- `syncLeadNames` - Compatibilidad con sistema anterior
- `force-chat-refresh` - Forzar actualización de UI

## Notas Importantes

1. El sistema funciona tanto dentro de una pestaña como entre pestañas
2. Los datos se persisten temporalmente en localStorage
3. Se limpian automáticamente datos antiguos (>10 minutos)
4. Compatible con SSR (Server Side Rendering)
5. Manejo robusto de errores en todas las operaciones
