# Integración Chat con Sales Funnel

## 🚀 Implementación Completada

### 1. Actualización del Chat Store
Modificado el `chatStore.ts` para:
- Llamar a la API real `/api/leads/update-stage` cuando se actualiza una etapa
- Emitir evento personalizado `lead-stage-updated` para notificar al sales funnel
- Incluir flag `fromChatbot: true` para identificar actualizaciones del chat

### 2. Sales Funnel Listener
Agregado en `SalesFunnel.tsx`:
- Listener para eventos `lead-stage-updated` del chatbot
- Movimiento visual automático de leads entre columnas
- Notificación toast cuando un lead se mueve desde el chatbot

### 3. Animaciones Visuales
Implementado en `LeadCard.tsx` y `LeadCardList.tsx`:
- Animaciones con Framer Motion para movimientos suaves
- Transiciones de entrada/salida con `AnimatePresence`
- Efectos hover y tap para mejor UX
- Animación tipo "spring" para movimientos naturales

### 4. API Endpoint
Actualizado `/api/leads/update-stage/route.ts`:
- Soporte para parámetro `fromChatbot` 
- Logging mejorado para rastrear origen de actualizaciones
- Respuesta incluye flag `fromChatbot` para confirmación

## 📋 Flujo de Trabajo

1. **Chatbot avanza en conversación** → Detecta `salesStageId` en el nodo
2. **Chat Store actualiza estado** → Llama a API con `fromChatbot: true`
3. **API actualiza base de datos** → Cambia stage del lead en Supabase
4. **Evento emitido** → `lead-stage-updated` con detalles del lead
5. **Sales Funnel escucha** → Detecta el evento y busca el lead
6. **Movimiento visual** → Anima el lead a la nueva columna
7. **Notificación mostrada** → Toast confirma el movimiento

## 🧪 Pasos para Probar

### 1. Configurar Lead de Prueba
```sql
-- Crear un lead de prueba en etapa "nuevos"
INSERT INTO leads (id, name, stage, tenant_id) 
VALUES ('test-lead-123', 'Lead de Prueba', 'nuevos', 'your-tenant-id');
```

### 2. Abrir Sales Funnel y Chat
- Abrir sales funnel en una pestaña: `/modules/leads/leads-scrum`
- Abrir chat en otra pestaña: `/modules/marketing/chat`
- Verificar que el lead aparezca en columna "Nuevos"

### 3. Simular Avance en Chat
En la consola del navegador (pestaña del chat):
```javascript
// Obtener store del chat
const chatStore = window.chatStore;

// Simular cambio de etapa
chatStore.updateLeadStage('test-lead-123', 'prospectando');
```

### 4. Verificar Animación
- El lead debe moverse visualmente de "Nuevos" a "Prospectando"
- Debe aparecer una notificación toast
- La animación debe ser suave y visible

### 5. Probar Múltiples Etapas
```javascript
// Mover a calificación
chatStore.updateLeadStage('test-lead-123', 'calificacion');

// Mover a oportunidad
chatStore.updateLeadStage('test-lead-123', 'oportunidad');
```

## 🔧 Debugging

### Verificar en Consola
```javascript
// En sales funnel - ver columnas actuales
console.log(useSalesFunnelStore.getState().columns);

// En chat - ver estado actual
console.log(useChatStore.getState().currentLeadStage);

// Verificar eventos
window.addEventListener('lead-stage-updated', (e) => {
    console.log('Evento recibido:', e.detail);
});
```

### Logs del Servidor
Los logs mostrarán:
- `API update-stage: Procesando actualización - fromChatbot: true`
- `Sales Funnel: Actualizando lead desde chatbot`

## 🎯 Próximos Pasos

1. **Integración con flujo real del chatbot**: Conectar con el procesamiento real de plantillas
2. **Persistencia de estado**: Guardar progreso del chat en base de datos
3. **Notificaciones en tiempo real**: Usar WebSockets para múltiples usuarios
4. **Historial de movimientos**: Registrar cada cambio de etapa con timestamp
5. **Permisos y validaciones**: Verificar que el chatbot pueda mover leads según reglas de negocio

## 🐛 Problemas Conocidos

- Los leads deben existir en ambos sistemas (chat y sales funnel)
- La animación puede no verse si el sales funnel no está abierto
- Requiere que ambas pestañas estén en el mismo navegador para eventos

## 📝 Notas de Implementación

- Se usa `CustomEvent` para comunicación entre pestañas del mismo origen
- Las animaciones usan Framer Motion para rendimiento óptimo
- El evento incluye `leadId` y `newStage` para identificación precisa
- Se valida que el lead exista antes de intentar moverlo visualmente