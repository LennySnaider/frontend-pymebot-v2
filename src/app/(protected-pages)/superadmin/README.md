# Directorio de Herramientas de Superadmin

## Estructura del Directorio

Este directorio contiene todas las herramientas y funcionalidades específicas para el rol de superadmin en PymeBot v2.

```
/superadmin/
├── admin-tools/       # Herramientas administrativas generales
├── module-editor/     # Editor/creador de módulos individuales
├── verticals/         # Gestión de verticales de negocio
│   ├── [id]/          # Detalles y edición de una vertical específica
│   ├── new/           # Creación de nueva vertical
│   └── page.tsx       # Listado de verticales
├── chatbot-builder/   # Constructor visual de chatbots (migrado de /concepts)
├── ia-config/         # Configuración de inteligencia artificial (migrado de /concepts)
├── notification-builder/ # Constructor de notificaciones (migrado de /concepts)
├── subscription-plans/ # Gestión de planes de suscripción (migrado de /concepts)
└── variable-builder/  # Constructor de variables del sistema (migrado de /concepts)
```

## Estado de la Migración

Se ha completado la migración de todas las herramientas de superadmin desde `/concepts/superadmin/` hacia `/superadmin/`:

- ✅ subscription-plans
- ✅ chatbot-builder
- ✅ ia-config
- ✅ notification-builder
- ✅ variable-builder

## Tareas Pendientes

Para finalizar completamente la integración de estas herramientas:

1. **Actualizar Referencias en el Código**:
   - Buscar y reemplazar referencias a `/concepts/superadmin/...` en todo el proyecto
   - Actualizar rutas en navegación y enlaces

2. **Pruebas**:
   - Verificar que todas las funcionalidades siguen funcionando correctamente
   - Probar navegación entre diferentes herramientas
   - Comprobar redirecciones temporales

## Nuevas Funcionalidades

Las nuevas funcionalidades de superadmin deben crearse directamente en este directorio, siguiendo la estructura:

- Crear un subdirectorio con nombre descriptivo en `/superadmin/`
- Mantener componentes, stores y lógica relacionada dentro del subdirectorio
- Usar patrones consistentes de arquitectura y navegación

## Estilo de Código

Todas las herramientas en este directorio deben seguir estas convenciones:

- Archivos con extensión `.tsx` para componentes React
- Archivos con extensión `.ts` para lógica, servicios y stores
- Nombres de archivos en PascalCase para componentes y camelCase para utilidades
- Comentarios en español con tags JSDoc para documentación
- Uso consistente de Tailwind CSS para estilos

## Seguridad y Permisos

Todas las rutas en este directorio están protegidas y requieren el rol `super_admin`. Cada componente debe verificar explícitamente el rol del usuario para mayor seguridad.

## Fecha de Actualización

Última actualización: 30 de abril de 2025