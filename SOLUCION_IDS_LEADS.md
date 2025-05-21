# Solución para Problema de IDs de Leads

## 🐛 Problema Identificado

Al mover un lead en el sales funnel, aparece el error:
```
Error: Error en la API: "No se encontró el lead con ID: b2bc68dc-9c96-4872-9218-17bfe02b443b"
```

### Causa Raíz
- Los IDs usados en el frontend (para drag & drop) no siempre coinciden con los IDs reales en la base de datos
- Los leads pueden tener IDs almacenados en diferentes lugares:
  - `lead.id` (usado por el frontend)
  - `lead.metadata.db_id` (ID real en la base de datos)
  - `lead.metadata.real_id` (ID alternativo)
  - `lead.metadata.original_lead_id` (ID original guardado)

## ✅ Solución Implementada

### 1. Creada Utilidad `leadIdResolver.ts`

```typescript
// src/utils/leadIdResolver.ts
export function getRealLeadId(lead: LeadWithMetadata): string {
    // Prioriza IDs en este orden:
    // 1. metadata.db_id
    // 2. metadata.real_id
    // 3. metadata.original_lead_id
    // 4. lead.id (si es UUID válido)
    // 5. Fallback al lead.id original
}
```

### 2. Actualizado `SalesFunnel.tsx`

- **onDragEnd**: Usa `getRealLeadId()` para obtener el ID correcto antes de enviar a la API
- **handleCloseLead**: También usa `getRealLeadId()` para operaciones de cierre
- **handleLeadStageUpdate**: Busca leads considerando todos los posibles IDs

### 3. Actualizado `salesFunnelStore.ts`

- **moveLeadToStage**: Usa `getRealLeadId()` al llamar a la API de actualización

## 🔧 Cambios Técnicos

### En SalesFunnel.tsx
```typescript
// Antes
const realLeadId = leadInSource.metadata?.db_id || 
                  leadInSource.metadata?.real_id || 
                  leadInSource.metadata?.original_lead_id ||
                  result.draggableId;

// Después
const realLeadId = getRealLeadId(leadInSource);
```

### Búsqueda Mejorada de Leads
```typescript
// Busca lead por cualquier ID posible
const lead = leads.find(l => 
    l.id === leadId ||
    l.metadata?.db_id === leadId ||
    l.metadata?.real_id === leadId ||
    l.metadata?.original_lead_id === leadId
);
```

## 🛠️ Herramientas de Debug Creadas

### `debug-lead-ids.js`
Script para ejecutar en la consola del navegador:
```javascript
debugLeadIds()        // Ver todos los IDs de leads
findLeadById(id)      // Buscar un lead específico
checkIdConsistency()  // Analizar consistencia de IDs
```

## 📝 Próximos Pasos Recomendados

1. **Unificar IDs en la Base de Datos**
   - Migrar todos los leads para usar IDs consistentes
   - Agregar constraint único en la tabla leads

2. **Actualizar Carga Inicial de Datos**
   - Asegurar que todos los leads tengan el ID correcto en `metadata.db_id`
   - Estandarizar la estructura de metadata

3. **Agregar Validaciones**
   - Validar formato de IDs al crear nuevos leads
   - Prevenir creación de leads con IDs inválidos

4. **Mejorar Logging**
   - Agregar más logs para rastrear transformaciones de IDs
   - Implementar telemetría para monitorear errores de IDs

## ⚡ Resultado

- El drag & drop ahora funciona correctamente
- Los leads se pueden mover entre columnas sin errores
- La API recibe el ID correcto de la base de datos
- Se mantiene la compatibilidad con IDs legacy