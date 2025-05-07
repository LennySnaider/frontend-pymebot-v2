# Log de Migración de Estructura para Herramientas de Superadmin

## Cambios realizados (30 de abril de 2025)

### Estructura reorganizada

Hemos iniciado la migración de las herramientas de superadmin desde la ruta:
```
/src/app/(protected-pages)/concepts/superadmin/
```

hacia la nueva ubicación:
```
/src/app/(protected-pages)/superadmin/
```

### Componentes migrados

- ✅ `subscription-plans`: Migrado completamente con todos sus componentes y stores
- ✅ `chatbot-builder`: Migrado completamente el 30/04/2025
- ✅ `ia-config`: Migrado completamente el 30/04/2025
- ✅ `notification-builder`: Migrado completamente el 30/04/2025
- ✅ `variable-builder`: Migrado completamente el 30/04/2025

### Otros cambios

- Se ha creado un archivo README.md en el directorio `/superadmin/` con instrucciones detalladas
- Se han agregado páginas de redirección temporales que informan a los usuarios sobre el cambio de ubicación
- Se ha creado un script `update-paths.js` para facilitar la migración de directorios
- Se ha ejecutado el script de migración para copiar y actualizar todas las herramientas de superadmin

## Tareas pendientes

### Actualización de rutas y referencias

- [ ] Buscar y reemplazar todas las referencias a `/concepts/superadmin/` en el código de otros componentes
- [ ] Asegurar que las navegaciones entre herramientas usen las nuevas rutas
- [ ] Actualizar los menús de navegación para que apunten a las nuevas ubicaciones

### Pruebas y verificación

- [ ] Probar todas las funcionalidades en las herramientas migradas
- [ ] Verificar que las redirecciones funcionen correctamente
- [ ] Asegurar que no hay rutas rotas o navegación interrumpida

## Razones para el cambio

1. **Mejor organización**: La nueva estructura organiza las herramientas de superadmin en su propio directorio de nivel superior, lo que facilita su gestión.

2. **Claridad en la estructura**: La ruta `/superadmin/` es más intuitiva y clara que `/concepts/superadmin/`.

3. **Consistencia con arquitectura modular**: Alinea la estructura con el enfoque de arquitectura modular de PymeBot v2.

## Notas adicionales

- Las herramientas migradas deben mantener la misma funcionalidad que tenían en la ubicación anterior.
- Cualquier nueva herramienta de superadmin debe crearse directamente en la nueva ubicación.
- A largo plazo, el directorio `/concepts/` se usará solo para prototipos y conceptos experimentales, no para funcionalidades principales del sistema.

---

*Documento preparado para el Project Knowledge de PymeBot v2*