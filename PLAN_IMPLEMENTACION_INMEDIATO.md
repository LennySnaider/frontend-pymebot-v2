# Plan de Implementación Inmediato - Sales Funnel

## 🚨 Correcciones Críticas Completadas

### 1. ✅ Error React `prefixClassName`
- **Corregido**: Cambiado a `className` en AIFlowGeneratorDialog.tsx
- **Estado**: Completado

### 2. 🔧 Error 500 en Generación con IA
- **Problema identificado**: Estructura incorrecta en los nodos generados
- **Solución pendiente**: Necesita corrección en route.ts

## 📋 Implementación de Sales Funnel - Paso a Paso

### Paso 1: Definir Modelo de Datos para Etapas
```typescript
// src/types/salesFunnel.ts
export interface SalesStage {
  id: string;
  name: string;
  color: string;
  order: number;
  description?: string;
  icon?: string;
}

export const DEFAULT_SALES_STAGES: SalesStage[] = [
  { id: 'awareness', name: 'Conciencia', color: '#3B82F6', order: 1, icon: 'eye' },
  { id: 'interest', name: 'Interés', color: '#8B5CF6', order: 2, icon: 'heart' },
  { id: 'consideration', name: 'Consideración', color: '#F59E0B', order: 3, icon: 'brain' },
  { id: 'intent', name: 'Intención', color: '#10B981', order: 4, icon: 'shopping-cart' },
  { id: 'purchase', name: 'Compra', color: '#EF4444', order: 5, icon: 'check-circle' },
  { id: 'loyalty', name: 'Fidelización', color: '#EC4899', order: 6, icon: 'star' }
];
```

### Paso 2: Actualizar Tipos de Nodos
```typescript
// src/app/(protected-pages)/superadmin/chatbot-builder/editor/types.ts
export interface ExtendedNodeData extends NodeData {
  salesStage?: string; // ID de la etapa
  stageColor?: string; // Color de la etapa
}
```

### Paso 3: Crear Componente de Selector de Etapas
```typescript
// src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/StageSelector.tsx
import { Select } from '@/components/ui';
import { DEFAULT_SALES_STAGES } from '@/types/salesFunnel';

interface StageSelectorProps {
  value?: string;
  onChange: (stageId: string) => void;
}

export const StageSelector = ({ value, onChange }: StageSelectorProps) => {
  return (
    <Select value={value} onChange={onChange}>
      <Select.Option value="">Sin etapa</Select.Option>
      {DEFAULT_SALES_STAGES.map(stage => (
        <Select.Option key={stage.id} value={stage.id}>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: stage.color }}
            />
            {stage.name}
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};
```

### Paso 4: Implementar Vista de Sales Funnel
```typescript
// src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/SalesFunnelView.tsx
import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Node } from 'reactflow';
import { motion } from 'framer-motion';
import { DEFAULT_SALES_STAGES } from '@/types/salesFunnel';

interface SalesFunnelViewProps {
  nodes: Node[];
  onNodeStageChange: (nodeId: string, stageId: string) => void;
}

export const SalesFunnelView = ({ nodes, onNodeStageChange }: SalesFunnelViewProps) => {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const nodeId = result.draggableId;
    const newStageId = result.destination.droppableId;
    
    onNodeStageChange(nodeId, newStageId);
  };

  const getNodesForStage = (stageId: string) => {
    return nodes.filter(node => node.data.salesStage === stageId);
  };

  return (
    <div className="w-full h-full overflow-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 p-4 min-h-full">
          {DEFAULT_SALES_STAGES.map(stage => (
            <div key={stage.id} className="flex-1 min-w-[250px]">
              <div 
                className="p-3 rounded-t-lg text-white font-semibold"
                style={{ backgroundColor: stage.color }}
              >
                {stage.name}
              </div>
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      min-h-[400px] bg-gray-50 dark:bg-gray-800 
                      border-2 rounded-b-lg p-2
                      ${snapshot.isDraggingOver ? 'border-blue-400' : 'border-gray-200'}
                    `}
                  >
                    {getNodesForStage(stage.id).map((node, index) => (
                      <Draggable key={node.id} draggableId={node.id} index={index}>
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            animate={{
                              scale: snapshot.isDragging ? 1.05 : 1,
                              opacity: snapshot.isDragging ? 0.8 : 1
                            }}
                            className="mb-2"
                          >
                            <NodeCard node={node} />
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

const NodeCard = ({ node }: { node: Node }) => {
  return (
    <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow cursor-move">
      <div className="font-medium">{node.data.label}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {node.type}
      </div>
    </div>
  );
};
```

### Paso 5: Crear Indicador de Etapa en el Chat
```typescript
// src/app/(protected-pages)/modules/marketing/chat/_components/StageIndicator.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { DEFAULT_SALES_STAGES } from '@/types/salesFunnel';

interface StageIndicatorProps {
  currentStageId: string;
}

export const StageIndicator = ({ currentStageId }: StageIndicatorProps) => {
  const currentStage = DEFAULT_SALES_STAGES.find(s => s.id === currentStageId);
  
  if (!currentStage) return null;
  
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mb-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Etapa actual:</span>
        <div 
          className="px-3 py-1 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: currentStage.color }}
        >
          {currentStage.name}
        </div>
      </div>
      
      {/* Barra de progreso */}
      <div className="mt-2 relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: currentStage.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(currentStage.order / DEFAULT_SALES_STAGES.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};
```

### Paso 6: Implementar Nuevos Nodos de Citas

#### 6.1 Nodo Mostrar Productos
```typescript
// src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/ProductsNode.tsx
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const ProductsNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`
      px-4 py-2 shadow-md rounded-md bg-purple-50 dark:bg-purple-900
      border-2 ${selected ? 'border-purple-600' : 'border-purple-300'}
    `}>
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2">
        <span className="text-lg">🛍️</span>
        <div className="text-sm font-bold text-purple-800 dark:text-purple-100">
          {data.label || 'Mostrar Productos'}
        </div>
      </div>
      
      <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">
        Muestra catálogo de productos
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

#### 6.2 Nodo Verificar Disponibilidad
```typescript
// src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/AvailabilityNode.tsx
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const AvailabilityNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`
      px-4 py-2 shadow-md rounded-md bg-green-50 dark:bg-green-900
      border-2 ${selected ? 'border-green-600' : 'border-green-300'}
    `}>
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2">
        <span className="text-lg">📅</span>
        <div className="text-sm font-bold text-green-800 dark:text-green-100">
          {data.label || 'Verificar Disponibilidad'}
        </div>
      </div>
      
      <div className="text-xs text-green-600 dark:text-green-300 mt-1">
        Consulta horarios disponibles
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

#### 6.3 Nodo Agendar Cita
```typescript
// src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/BookingNode.tsx
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const BookingNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`
      px-4 py-2 shadow-md rounded-md bg-red-50 dark:bg-red-900
      border-2 ${selected ? 'border-red-600' : 'border-red-300'}
    `}>
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2">
        <span className="text-lg">✅</span>
        <div className="text-sm font-bold text-red-800 dark:text-red-100">
          {data.label || 'Agendar Cita'}
        </div>
      </div>
      
      <div className="text-xs text-red-600 dark:text-red-300 mt-1">
        Confirma y agenda la cita
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

## 🗓️ Cronograma de Implementación

### Día 1-2: Estructura Base
- [ ] Crear tipos y constantes de sales funnel
- [ ] Actualizar modelo de datos de nodos
- [ ] Implementar selector de etapas

### Día 3-4: Vista Sales Funnel
- [ ] Instalar @hello-pangea/dnd
- [ ] Crear componente SalesFunnelView
- [ ] Implementar drag & drop básico

### Día 5-6: Integración Chat
- [ ] Crear StageIndicator
- [ ] Integrar en ChatHeader
- [ ] Sincronizar cambios de etapa

### Día 7-8: Nuevos Nodos
- [ ] Implementar nodo Productos
- [ ] Implementar nodo Disponibilidad
- [ ] Implementar nodo Agendar
- [ ] Agregar al panel de nodos

### Día 9-10: Testing y Pulido
- [ ] Pruebas de integración
- [ ] Animaciones y transiciones
- [ ] Documentación

## 📝 Siguientes Pasos Inmediatos

1. **Corregir error de generación IA** en chatbot-generator/route.ts
2. **Crear estructura de tipos** para sales funnel
3. **Implementar selector de etapas** en NodePropertiesPanel
4. **Instalar dependencias** necesarias (@hello-pangea/dnd, framer-motion)

---
*Este plan está diseñado para implementación inmediata y práctica*