# Tasks para Corregir Integración Sales Funnel con Chat

## 🚨 Problemas Identificados

1. **Sales Funnel drag and drop manual roto**
   - El drag and drop manual del sales funnel ya no funciona correctamente
   - Posible conflicto con las nuevas animaciones de Framer Motion

2. **Chat no actualiza etapas del lead**
   - Al avanzar en los mensajes del chat, el lead no cambia de etapa
   - La conexión entre nodos del chat y cambio de stage no está funcionando

3. **Discrepancia en número de leads**
   - Diferente cantidad de leads mostrados en sales funnel vs chat
   - Posible problema de filtrado o sincronización de datos

4. **Error al mover lead manualmente**
   - Error: "JSON object requested, multiple (or no) rows returned"
   - Problema con la consulta de base de datos que retorna múltiples filas

## 🛠️ Plan de Acción por Etapas

### Etapa 1: Diagnóstico y Recolección de Información

#### Task 1.1: Analizar Error de Base de Datos
- **Objetivo**: Identificar por qué la consulta retorna múltiples filas
- **Acciones**:
  - Revisar query en `updateLeadStage` 
  - Verificar unicidad de IDs de leads
  - Examinar posibles duplicados en base de datos
  - Añadir logs detallados para debugging

#### Task 1.2: Verificar Compatibilidad Drag & Drop
- **Objetivo**: Identificar conflicto entre react-beautiful-dnd y Framer Motion
- **Acciones**:
  - Revisar documentación de incompatibilidades
  - Probar temporalmente sin animaciones
  - Verificar orden de wrappers de componentes
  - Examinar eventos del mouse que puedan estar bloqueados

#### Task 1.3: Rastrear Flujo de Actualización de Etapas
- **Objetivo**: Entender por qué el chat no actualiza etapas
- **Acciones**:
  - Verificar que el chat lea correctamente salesStageId
  - Rastrear flujo de eventos desde chat hasta sales funnel
  - Verificar que el lead ID sea correcto en ambos sistemas
  - Revisar logs del servidor para actualizaciones

#### Task 1.4: Auditar Sincronización de Datos
- **Objetivo**: Entender discrepancia en conteo de leads
- **Acciones**:
  - Comparar queries de ambos módulos
  - Verificar filtros aplicados (tenant_id, etc.)
  - Examinar políticas RLS de Supabase
  - Verificar si hay leads "fantasma" o en estados inconsistentes

### Etapa 2: Correcciones Puntuales

#### Task 2.1: Corregir Query de Actualización
- **Objetivo**: Resolver error "multiple rows returned"
- **Acciones**:
  - Añadir validaciones de unicidad
  - Usar `.maybeSingle()` en lugar de `.single()` donde sea apropiado
  - Implementar manejo de casos edge
  - Agregar transaction para atomicidad

#### Task 2.2: Restaurar Drag & Drop Manual
- **Objetivo**: Hacer compatible drag & drop con animaciones
- **Acciones**:
  - Ajustar orden de componentes HOC
  - Desactivar animaciones durante el drag
  - Usar `layoutId` de Framer Motion correctamente
  - Implementar flag `isDragging` para control

#### Task 2.3: Implementar Actualización desde Chat
- **Objetivo**: Conectar progreso del chat con cambio de etapas
- **Acciones**:
  - Crear hook/función para detectar cambio de nodo
  - Mapear nodos del chat con etapas del funnel
  - Implementar llamada a updateLeadStage
  - Añadir validaciones de permisos

#### Task 2.4: Sincronizar Conteo de Leads
- **Objetivo**: Unificar vista de leads entre módulos
- **Acciones**:
  - Estandarizar queries y filtros
  - Implementar caché compartido
  - Crear servicio único de leads
  - Añadir refresh automático

### Etapa 3: Testing y Validación

#### Task 3.1: Suite de Tests Automatizados
- **Objetivo**: Prevenir regresiones futuras
- **Acciones**:
  - Tests unitarios para funciones críticas
  - Tests de integración para flujo completo
  - Tests E2E para drag & drop
  - Tests de sincronización de datos

#### Task 3.2: Testing Manual Completo
- **Objetivo**: Validar experiencia de usuario
- **Acciones**:
  - Probar todos los escenarios de uso
  - Verificar animaciones y transiciones
  - Confirmar sincronización en tiempo real
  - Validar manejo de errores

### Etapa 4: Optimización y Mejoras

#### Task 4.1: Mejorar Performance
- **Objetivo**: Optimizar rendimiento de animaciones
- **Acciones**:
  - Implementar debouncing en actualizaciones
  - Usar React.memo donde sea apropiado
  - Optimizar re-renders innecesarios
  - Implementar lazy loading

#### Task 4.2: Mejorar UX
- **Objetivo**: Hacer la integración más intuitiva
- **Acciones**:
  - Añadir indicadores visuales de sincronización
  - Mejorar mensajes de error
  - Implementar undo/redo para movimientos
  - Añadir confirmaciones para acciones críticas

## 📋 Orden de Ejecución Recomendado

1. **Urgente**: Task 2.1 - Corregir error de base de datos
2. **Crítico**: Task 2.2 - Restaurar drag & drop manual
3. **Importante**: Task 2.3 - Implementar actualización desde chat
4. **Necesario**: Task 2.4 - Sincronizar conteo de leads
5. **Validación**: Tasks 3.1 y 3.2
6. **Mejoras**: Tasks 4.1 y 4.2

## 🔍 Herramientas de Debugging

```javascript
// Para debugging en consola
window.debugSalesFunnel = {
  getState: () => useSalesFunnelStore.getState(),
  getColumns: () => useSalesFunnelStore.getState().columns,
  findLead: (id) => {
    const { columns } = useSalesFunnelStore.getState();
    for (const [stage, leads] of Object.entries(columns)) {
      const lead = leads.find(l => l.id === id);
      if (lead) return { stage, lead };
    }
    return null;
  }
};

window.debugChat = {
  getState: () => useChatStore.getState(),
  getCurrentLead: () => useChatStore.getState().selectedChat,
  triggerStageUpdate: (leadId, stage) => {
    useChatStore.getState().updateLeadStage(leadId, stage);
  }
};
```

## 📝 Notas Importantes

- Mantener backups antes de cada cambio mayor
- Documentar todos los cambios realizados
- Comunicar al equipo sobre cambios breaking
- Priorizar la estabilidad sobre nuevas features

## 🚀 Métricas de Éxito

1. Drag & drop funciona sin errores
2. Leads se mueven automáticamente desde el chat
3. Conteo de leads es consistente
4. No hay errores en consola
5. Performance es aceptable (< 100ms para actualizaciones)
6. UX es intuitiva y sin fricciones