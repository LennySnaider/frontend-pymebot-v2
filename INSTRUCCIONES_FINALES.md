# Instrucciones para Completar la Corrección de Leads

Hemos identificado y solucionado dos problemas críticos en el sistema de actualización de leads:

## 1. Problema de Políticas RLS en la Base de Datos

El error `violates row-level security policy for table "leads"` indica que la política RLS está impidiendo las operaciones de inserción/actualización. Hemos creado un script SQL para corregir esta situación:

**Instrucciones:**

1. Ejecutar el script SQL `fix_leads_rls_policies.sql` en su base de datos Supabase:
   - Vaya al Dashboard de Supabase
   - Seleccione el proyecto
   - Vaya a la sección "SQL Editor"
   - Abra una nueva consulta
   - Copie y pegue el contenido del archivo `fix_leads_rls_policies.sql`
   - Ejecute la consulta

Esta corrección:
- Crea políticas RLS más permisivas para la tabla `leads`
- Agrega funciones de ayuda para casos especiales
- Crea una función para limpiar leads duplicados

## 2. Error en Componente React `setSelectedLeadId is not defined`

Hemos creado una versión corregida del componente `LeadEditForm` que maneja correctamente las funciones del store de Zustand:

**Instrucciones:**

1. Cambiar el nombre del archivo corregido:
```bash
mv src/app/\(protected-pages\)/modules/leads/leads-scrum/_components/LeadEditForm_FIX.tsx src/app/\(protected-pages\)/modules/leads/leads-scrum/_components/LeadEditForm.tsx
```

2. Compilar la aplicación nuevamente:
```bash
npm run build
# O usar el script optimizado
./build-with-more-memory.sh
```

## 3. Limpieza de Registros Duplicados

Una vez implementadas estas correcciones, puede limpiar los leads duplicados utilizando la función agregada en el script SQL:

```sql
SELECT * FROM cleanup_duplicate_leads();
```

## 4. Beneficios de las Correcciones Implementadas

- **Políticas RLS Mejoradas**: Las nuevas políticas RLS son más flexibles y permiten realizar operaciones CRUD basadas en tenant_id correctamente.
- **Funciones de Ayuda**: Las funciones SQL adicionales proporcionan mecanismos para casos especiales, como inserción con permisos elevados.
- **Componente React Robusto**: El componente `LeadEditForm` corregido accede al store de Zustand de forma segura.
- **Prevención de Duplicados**: El nuevo endpoint `update-fallback` ayuda a prevenir la creación de leads duplicados.

## 5. Próximos Pasos Recomendados

1. **Migración de Datos**: Considere ejecutar un proceso de migración para unificar leads duplicados y limpiar metadatos redundantes.
2. **Monitoreo**: Implemente un monitoreo más detallado para detectar problemas en tiempo real.
3. **Validación**: Agregue más validaciones en el frontend para evitar enviar datos inválidos al backend.
4. **Documentación**: Actualice la documentación del proyecto con las nuevas prácticas implementadas.