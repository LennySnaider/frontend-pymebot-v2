# Plan de Integración Chatbot con Sales Funnel Existente

## 🎯 Objetivo
Integrar el chatbot builder con el sales funnel existente para que:
1. Los nodos del chatbot puedan estar asociados a etapas del funnel
2. El chatbot pueda mover automáticamente leads entre etapas
3. Se visualice la etapa actual en el chat con los mismos colores
4. Se mantenga el drag & drop existente del sales funnel

## 📋 Etapas del Sales Funnel Existente

Basado en la interfaz actual:
1. **Nuevos** - Color morado
2. **Prospectando** - Color azul  
3. **Calificación** - Color naranja
4. **Oportunidad** - Color rosa/rojo

Estados adicionales:
- **Confirmado** - Check verde ✓
- **Cerrado** - X roja ✗

## 🏗️ Arquitectura Actual

### Sales Funnel
- **Store**: `salesFunnelStore.ts` - Gestión del estado con Zustand
- **Tipos**: `types.ts` - Interfaces Lead, FunnelStage
- **Componentes**: 
  - `SalesFunnel.tsx` - Componente principal con drag & drop
  - `FunnelStageColumn.tsx` - Columnas del funnel
  - `LeadCard.tsx` - Tarjetas de leads

### Chatbot Builder
- **Editor**: `/superadmin/chatbot-builder/editor`
- **Nodos**: Diferentes tipos (MessageNode, ButtonsNode, etc.)
- **Store**: Gestión del flujo conversacional

## 🔗 Plan de Integración

### Fase 1: Asociar Nodos con Etapas

1. **Actualizar tipos de nodos**:
```typescript
// En chatbot builder types
interface ExtendedNodeData extends NodeData {
  salesStageId?: string; // ID de la etapa del funnel
  movesToStage?: string; // Etapa a la que mueve el lead
}
```

2. **Agregar selector de etapa en NodePropertiesPanel**:
```typescript
const StageSelector = ({ value, onChange }) => {
  const stages = [
    { id: 'nuevos', name: 'Nuevos', color: '#8B5CF6' },
    { id: 'prospectando', name: 'Prospectando', color: '#3B82F6' },
    { id: 'calificacion', name: 'Calificación', color: '#F59E0B' },
    { id: 'oportunidad', name: 'Oportunidad', color: '#EF4444' }
  ];
  
  return (
    <Select value={value} onChange={onChange}>
      {stages.map(stage => (
        <Option key={stage.id} value={stage.id}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" 
                 style={{ backgroundColor: stage.color }} />
            {stage.name}
          </div>
        </Option>
      ))}
    </Select>
  );
};
```

### Fase 2: Sincronización Chat-Funnel

1. **Crear servicio de sincronización**:
```typescript
// services/ChatbotFunnelSync.ts
export const syncLeadStage = async (
  leadId: string, 
  newStageId: string,
  chatSessionId: string
) => {
  // Actualizar en el sales funnel
  await updateLeadStage(leadId, newStageId);
  
  // Registrar el cambio
  await logStageTransition({
    leadId,
    fromStage: currentStage,
    toStage: newStageId,
    triggeredBy: 'chatbot',
    sessionId: chatSessionId,
    timestamp: new Date()
  });
};
```

2. **Indicador de etapa en el chat**:
```typescript
// ChatHeader component
const StageIndicator = ({ leadId }) => {
  const stage = useLeadStage(leadId);
  
  if (!stage) return null;
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full"
           style={{ backgroundColor: stage.color }} />
      <span className="text-sm">{stage.name}</span>
    </div>
  );
};
```

### Fase 3: Nuevos Nodos de Citas

1. **Actualizar tipos de nodos existentes**:
   - BookAppointmentNode
   - CheckAvailabilityNode  
   - LeadQualificationNode

2. **Asociar con etapas específicas**:
```typescript
const nodeStageMapping = {
  'startNode': 'nuevos',
  'leadQualificationNode': 'prospectando',
  'checkAvailabilityNode': 'calificacion',
  'bookAppointmentNode': 'oportunidad'
};
```

### Fase 4: Ejecución del Flujo

1. **En flowProcessor.ts**:
```typescript
const processNode = async (node, context) => {
  // Procesar nodo normalmente
  const result = await executeNode(node, context);
  
  // Si el nodo cambia la etapa
  if (node.data.movesToStage) {
    await syncLeadStage(
      context.leadId,
      node.data.movesToStage,
      context.sessionId
    );
  }
  
  return result;
};
```

2. **Tracking de progreso**:
```typescript
interface ConversationProgress {
  leadId: string;
  currentStage: string;
  stagesCompleted: string[];
  lastNodeExecuted: string;
  timestamp: Date;
}
```

## 🎨 Mejoras Visuales

### 1. Nodos con color de etapa
```typescript
const getNodeStyle = (node) => {
  const stage = stages.find(s => s.id === node.data.salesStageId);
  return {
    borderColor: stage?.color || '#ccc',
    borderWidth: 2
  };
};
```

### 2. Animación de transición
```typescript
const animateStageChange = (leadId, newStage) => {
  // Usar framer-motion para animar el cambio
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Contenido del lead */}
    </motion.div>
  );
};
```

## 🚀 Implementación por Pasos

### Semana 1
1. ✅ Corregir error prefixClassName
2. 🔧 Corregir error 500 en generación IA
3. Agregar campo salesStageId a nodos
4. Crear selector de etapa en propiedades

### Semana 2  
1. Implementar servicio de sincronización
2. Agregar indicador de etapa en chat
3. Actualizar flowProcessor para cambios de etapa
4. Testing de sincronización

### Semana 3
1. Actualizar nodos de citas existentes
2. Implementar animaciones
3. Integración completa
4. Testing y documentación

## 📊 Métricas de Éxito

1. **Automática**: El chatbot mueve leads entre etapas sin intervención manual
2. **Visible**: Los cambios se reflejan inmediatamente en el sales funnel
3. **Consistente**: Los colores y estados son coherentes entre chat y funnel
4. **Trazable**: Se registra el historial de cambios de etapa

## 🔧 Consideraciones Técnicas

1. **Mantener compatibilidad** con el drag & drop existente
2. **No duplicar lógica** - reutilizar el salesFunnelStore
3. **Performance** - evitar actualizaciones excesivas
4. **Seguridad** - validar permisos para cambiar etapas

---
*Este plan se basa en la estructura existente para minimizar cambios y maximizar reutilización*