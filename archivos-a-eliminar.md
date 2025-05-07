# Archivos y directorios que se pueden eliminar (Resumen)

## 1. Archivos temporales y de migración (SEGUROS PARA ELIMINAR) ✅
- `/tmp/concept_imports.txt` ✅ ELIMINADO
- `/tmp/concept_paths.txt` ✅ ELIMINADO
- `/update-concepts-to-modules.js` ✅ ELIMINADO
- `/update-paths.js` ✅ ELIMINADO
- `/scripts/execute-rename-concepts-modules.sh` ✅ ELIMINADO
- `/scripts/rename-concepts-to-modules.sh` ✅ ELIMINADO
- `/scripts/fix-remaining-concepts-refs.js` ✅ ELIMINADO

## 2. Componentes de ejemplo y depuración (SEGUROS PARA ELIMINAR) ✅
- `/src/app/(protected-pages)/examples/` (directorio completo) ✅ ELIMINADO
- `/src/components/examples/` (directorio completo) ✅ ELIMINADO
- `/src/app/(protected-pages)/modules/chatbot/debug/` (directorio completo) ✅ ELIMINADO
- `/src/app/(protected-pages)/modules/chatbot/debug.tsx` ✅ ELIMINADO

## 3. Archivos obsoletos tras la migración "concepts" a "modules" (SEGUROS PARA ELIMINAR) ✅
- `/src/app/api/concepts/` (directorio completo) ✅ ELIMINADO

## 4. Archivos duplicados en UI (REQUIERE REFACTORIZACIÓN)
⚠️ **NO ELIMINABLES DIRECTAMENTE** - Hay interdependencias entre estos archivos. Requieren refactorización previa.

- `/src/components/ui/Card.tsx` (hace referencia a `/src/components/ui/Card/Card.tsx`)
- `/src/components/ui/Table.tsx` (hace referencia a `/src/components/ui/Table/index.ts`)
- `/src/components/ui/Tabs.ts` (hace referencia a `/src/components/ui/tabs/index.ts`)
- `/src/components/ui/Spinner.tsx` (hace referencia a `/src/components/ui/Spinner/Spinner.tsx`)

## 5. Archivos de UI duplicados (REQUIERE REFACTORIZACIÓN)
⚠️ **NO ELIMINABLES DIRECTAMENTE** - Hay interdependencias entre los archivos de UI. Por ejemplo:
- `/src/components/ui/cards.tsx` es importado por `/src/components/ui/Card/index.ts`
- Los otros archivos tienen interdependencias similares que requieren refactorización cuidadosa.

## Consideraciones importantes:
1. **Hacer backup**: Realizar una copia de seguridad completa antes de eliminar cualquier archivo.
2. **Proceso gradual**: Eliminar los archivos por categorías, verificando después de cada categoría que la aplicación sigue funcionando correctamente.
3. **Verificar referencias**: Aunque el análisis sugiere que estos archivos no son utilizados o son redundantes, es recomendable verificar si existen referencias a ellos en partes más oscuras del código.
4. **Archivos de configuración**: Tener especial cuidado con archivos de configuración para no romper la funcionalidad.

## Nota sobre la estructura de módulos:
- El proyecto tiene dos directorios de módulos:
  - `/src/modules/` - Definiciones de módulos reutilizables
  - `/src/app/(protected-pages)/modules/` - Implementaciones de páginas para cada módulo

  Esta estructura es correcta y debe mantenerse tal como está. Cada directorio tiene un propósito específico en la arquitectura del proyecto.

## Archivos para considerar eliminar en una segunda fase (verificar primero):
1. Si después de eliminar `/src/app/api/concepts/` la aplicación sigue funcionando, verificar si existen más referencias a "concepts" en el código que deban ser actualizadas a "modules".
2. Revisar las referencias a los scripts de `/scripts/` para ver si hay más archivos de scripts de migración que ya no son necesarios.