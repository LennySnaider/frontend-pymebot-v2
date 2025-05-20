# Implementación Integración Sales Funnel con Chatbot

## ✅ Cambios Realizados

### 1. Corrección de Errores
- **✓ Error `prefixClassName`**: Corregido en AIFlowGeneratorDialog.tsx
- **✓ Error 500 en generación IA**: Identificado en `/api/ai/chatbot-generator/route.ts`

### 2. Tipos y Estructura

#### 2.1 Tipos de Sales Funnel
Creado: `editor/types/salesFunnelIntegration.ts`
```typescript
- SalesFunnelStage
- SALES_FUNNEL_STAGES (nuevos, prospectando, calificación, oportunidad)
- SalesFunnelNodeData
- nodeStageMapping
```

#### 2.2 Componentes Creados

##### SalesFunnelStageSelector
Archivo: `editor/_components/SalesFunnelStageSelector.tsx`
- Selector visual de etapas con colores
- Variantes: MoveToStageSelector y RequireStageSelector

##### SalesFunnelStageIndicator
Archivo: `modules/marketing/chat/_components/SalesFunnelStageIndicator.tsx`
- Indicador visual de etapa actual
- Barra de progreso animada
- Versión badge compacta

### 3. Integraciones Realizadas

#### 3.1 NodePropertiesPanel
- Agregado selector de etapa para cada nodo
- Campo "Etapa asociada" y "Mover a etapa"
- Solo muestra opciones relevantes por tipo de nodo

#### 3.2 ChatHeader
- Integrado SalesFunnelStageIndicator
- Muestra etapa actual del lead
- Animaciones de transición

#### 3.3 ChatStore
- Agregado estado `currentLeadStage`
- Acciones `setCurrentLeadStage` y `updateLeadStage`
- Preparado para integración con API

## 🔄 Flujo de Trabajo

1. **En el Builder**: 
   - Asignar etapa a cada nodo
   - Configurar "Mover a etapa" para cambios automáticos

2. **En el Chat**:
   - Visualizar etapa actual del lead
   - Actualizar automáticamente al ejecutar nodos

3. **En el Sales Funnel**:
   - Sincronizar cambios del chatbot
   - Mantener drag & drop existente

## 📝 Pendientes

### 1. Backend Integration
- [ ] API endpoint para actualizar etapa del lead
- [ ] Webhook para sincronizar con sales funnel
- [ ] Persistencia de progreso del lead

### 2. Flow Processor
- [ ] Implementar lógica para cambio de etapas
- [ ] Validar permisos de etapa
- [ ] Tracking de transiciones

### 3. Animaciones y UX
- [ ] Animación de drag & drop mejorada
- [ ] Notificaciones de cambio de etapa
- [ ] Historial de etapas

### 4. Nuevos Nodos de Citas
- [ ] ProductsNode
- [ ] AvailabilityNode
- [ ] BookingNode

## 🚀 Próximos Pasos

1. **Corregir error 500**: Arreglar estructura de nodos en generador IA
2. **Integrar con backend**: Crear endpoints necesarios
3. **Testing completo**: Verificar sincronización entre sistemas
4. **Documentación**: Actualizar guías de usuario

## 🧪 Testing

Para probar la integración actual:

1. Abrir chatbot builder
2. Seleccionar un nodo
3. Asignar etapa del sales funnel
4. Configurar "Mover a etapa" si aplica
5. Ver indicador en el chat

## 🎨 Mejoras Visuales

- Los colores están sincronizados con el sales funnel existente
- Animaciones suaves con Framer Motion
- Indicadores responsivos
- Progreso visual del lead

---
*Última actualización: 2025-05-17*