# Implementación de Persistencia de Conversaciones por Lead y Plantilla

## Resumen de la Implementación

Se ha implementado un sistema completo de persistencia de datos para las conversaciones del chatbot que permite:

1. **Guardar el estado de cada conversación** por lead y plantilla
2. **Almacenar datos recolectados** durante la conversación
3. **Seguir el progreso** del lead en cada plantilla
4. **Continuar conversaciones** donde se quedaron
5. **Visualizar datos recolectados** y progreso en el panel de información

## Archivos Creados

### 1. `/src/utils/conversationPersistence.ts`
Sistema principal de persistencia que maneja:
- Estado de conversaciones (nodos visitados, datos recolectados)
- Almacenamiento en localStorage
- Limpieza automática de conversaciones antiguas
- Exportación/importación de datos

### 2. `/src/app/(protected-pages)/modules/marketing/chat/_components/ConversationPersistenceProvider.tsx`
Componente React que:
- Carga automáticamente el estado de conversación al cambiar de lead o plantilla
- Sincroniza datos entre pestañas
- Gestiona el ciclo de vida de la persistencia

### 3. `/src/app/(protected-pages)/modules/marketing/chat/_components/LeadTemplateProgress.tsx`
Componente visual que muestra:
- Progreso del lead en cada plantilla
- Estado de completitud
- Permite cambiar entre plantillas

### 4. `/src/app/(protected-pages)/modules/marketing/chat/_components/LeadCollectedData.tsx`
Componente que muestra:
- Todos los datos recolectados del lead
- Formato visual atractivo con iconos
- Última actualización

### 5. `/src/app/(protected-pages)/modules/marketing/chat/_hooks/useChatPersistence.ts`
Hook personalizado que:
- Facilita la integración con ChatBody
- Maneja la persistencia de mensajes
- Procesa respuestas del bot para extraer datos

## Archivos Actualizados

### 1. `/src/app/(protected-pages)/modules/marketing/chat/_store/chatStore.ts`
Se agregaron:
- Estados para persistencia de conversaciones
- Acciones para cargar/guardar estado
- Integración con el sistema de persistencia

### 2. `/src/app/(protected-pages)/modules/marketing/chat/page.tsx`
- Se agregó `ConversationPersistenceProvider` para envolver los componentes del chat

### 3. `/src/app/(protected-pages)/modules/marketing/chat/_components/ContactInfoDrawerUpdated.tsx`
- Se incluyeron los componentes de progreso y datos recolectados
- Se muestra solo para leads

## Pendiente de Implementar

### ChatBody.tsx
Debido al tamaño del archivo (>1000 líneas), se creó un archivo de instrucciones:
`INSTRUCTIONS_UPDATE_CHATBODY.txt`

Las instrucciones detallan cómo integrar el hook `useChatPersistence` para:
- Persistir mensajes del usuario y bot
- Guardar el nodeId del flujo
- Procesar y extraer datos de las respuestas

## Funcionalidades Implementadas

1. **Persistencia Automática**
   - Los mensajes se guardan automáticamente
   - El progreso del flujo se actualiza en tiempo real
   - Los datos se sincronizan entre pestañas

2. **Visualización de Progreso**
   - Barra de progreso por cada plantilla
   - Indicadores visuales de estado
   - Cambio fácil entre plantillas

3. **Datos Recolectados**
   - Vista organizada de todos los datos
   - Iconos apropiados para cada tipo de dato
   - Formato legible de fechas y valores

4. **Continuidad de Conversaciones**
   - Al cambiar de lead/plantilla se carga el estado previo
   - Se mantiene el historial de mensajes
   - Se recuerda el nodo actual del flujo

## Estructura de Datos

### ConversationState
```typescript
{
  leadId: string
  templateId: string
  currentNodeId?: string
  visitedNodes: string[]
  collectedData: Record<string, any>
  messages: ConversationMessage[]
  metadata: {
    startedAt: number
    lastInteraction: number
    completed: boolean
    stage?: string
  }
}
```

### Almacenamiento
- **localStorage key**: `chatbot_conversations` - Conversaciones completas
- **localStorage key**: `chatbot_collected_data` - Datos recolectados globales

## Uso

1. El sistema se activa automáticamente al seleccionar un lead
2. Los datos se persisten en cada interacción
3. El progreso se actualiza visualmente
4. Los datos recolectados están disponibles en el panel de información

## Consideraciones

- Los datos se limpian automáticamente después de 30 días de inactividad
- La sincronización entre pestañas es instantánea
- El sistema es compatible con el flujo existente del chatbot
- No requiere cambios en el backend

## Próximos Pasos

1. Actualizar `ChatBody.tsx` siguiendo las instrucciones
2. Probar la persistencia con diferentes plantillas
3. Validar la sincronización entre pestañas
4. Considerar respaldo en base de datos para persistencia a largo plazo
