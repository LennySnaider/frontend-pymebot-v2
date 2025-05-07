# Notas de Migración: properties → property_listings

## Estructura Original
- property-create/
- property-details/
- property-edit/
- property-list/

## Plan de Migración
1. [ ] Revisar cada subcarpeta y decidir cómo mapearla a la nueva estructura
2. [ ] Copiar componentes y lógica manteniendo la funcionalidad
3. [ ] Actualizar importaciones para reflejar la nueva ubicación
4. [ ] Implementar archivos proxy en las ubicaciones originales de page.tsx
5. [ ] Probar extensivamente que nada se haya roto

## Mapeo de Carpetas
- property-create/ → views/create/ (propertyCreateView)
- property-details/ → views/detail/ (propertyDetailsView)
- property-edit/ → views/edit/ (propertyEditView)
- property-list/ → views/list/ (propertyListView)

## Notas sobre Archivos Proxy

Es importante mantener los archivos `page.tsx` en sus ubicaciones originales en la estructura de Next.js. 
Estos archivos actuarán como "proxies" que simplemente importan y utilizan los componentes desde la nueva estructura.

Ejemplo:

```tsx
// app/(protected-pages)/concepts/properties/property-create/page.tsx

import { propertyCreateView } from '@/modules/property_listings/views/create';

export default function Page() {
  return <propertyCreateView />;
}
```

Se han creado ejemplos de estos archivos proxy en la carpeta `_proxies/` para referencia.

## Notas Adicionales
- Añadir aquí cualquier consideración importante
- Asegurarse de actualizar las importaciones en todos los archivos
- Mantener consistencia en la convención de nombres

## Estado
- [ ] Migración iniciada
- [ ] Carpetas y archivos básicos migrados
- [ ] Importaciones actualizadas
- [ ] Archivos proxy implementados
- [ ] Pruebas completadas
- [ ] Migración completada
