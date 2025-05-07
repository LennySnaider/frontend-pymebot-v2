# Implementación del Módulo Constructor de Variables

Módulo para que el SUPERADMIN pueda definir variables del sistema que estarán disponibles para los flujos de chatbot y que los tenants podrán personalizar según sus necesidades.

## Tareas Completadas

- [x] Definición de requisitos del módulo
- [x] Diseño conceptual de la interfaz de usuario
- [x] Planificación de la estructura de datos

## Tareas en Progreso

- [x] Creación del esquema SQL para las tablas en Supabase
- [x] Implementación de políticas RLS para seguridad multi-tenant
- [x] Desarrollo de la página principal de administración de variables (Tabla y carga de datos)
- [x] Implementación del store Zustand para gestión de estado

## Tareas Futuras

- [ ] Desarrollo del editor de variables (modal/formulario - Crear/Editar)
- [ ] Implementación de la lógica de eliminación de variables (acción del store y llamada desde la página)
- [ ] Implementación de la agrupación/filtrado por categorías/verticales
- [ ] Desarrollo de la vista previa para configuración del tenant
- [ ] Pruebas de integración con el constructor de chatbots
- [ ] Documentación para administradores y desarrolladores

## Plan de Implementación

### 1. Estructura de Datos (Supabase)

Crearemos las siguientes tablas:

- `system_variables`: Almacena todas las variables definidas por el SUPERADMIN

    - `id`: UUID (clave primaria)
    - `name`: TEXT (nombre identificador de la variable)
    - `display_name`: TEXT (nombre amigable para mostrar)
    - `description`: TEXT (descripción de la variable)
    - `type`: TEXT (texto, número, booleano, selección, fecha)
    - `default_value`: TEXT (valor por defecto)
    - `is_tenant_configurable`: BOOLEAN (si el tenant puede modificarla)
    - `is_sensitive`: BOOLEAN (si contiene información sensitiva)
    - `category_id`: UUID (referencia a categoría)
    - `vertical_id`: UUID (referencia a vertical, puede ser NULL)
    - `options`: JSONB (opciones para tipos de selección)
    - `validation`: JSONB (reglas de validación)
    - `created_at`: TIMESTAMPTZ
    - `updated_at`: TIMESTAMPTZ

- `variable_categories`: Categorías para agrupar variables

    - `id`: UUID (clave primaria)
    - `name`: TEXT (nombre de la categoría)
    - `description`: TEXT (descripción)
    - `order`: INTEGER (orden de visualización)

- `tenant_variable_values`: Valores específicos configurados por cada tenant
    - `id`: UUID (clave primaria)
    - `tenant_id`: UUID (referencia a tenant)
    - `variable_id`: UUID (referencia a system_variables)
    - `value`: TEXT (valor configurado)
    - `updated_at`: TIMESTAMPTZ

### 2. Desarrollo Frontend

#### Página Principal

Implementaremos la página principal en `/concepts/superadmin/variable-builder` con:

- Listado de variables con filtros por categoría/vertical
- Acciones CRUD (crear, editar, eliminar variables)
- Vista por categorías o tabla completa

#### Formulario de Edición/Creación

- Modal con campos dinámicos según el tipo de variable
- Vista previa de cómo se verá en la configuración del tenant
- Validaciones según tipo de variable

#### Estado Global (Zustand)

- Store para gestionar el estado de las variables
- Acciones para CRUD y filtrado
- Integración con Supabase para persistencia

### 3. Integración

- Conectar con el constructor de chatbots para usar variables en nodos
- Implementar resolución de variables en tiempo de ejecución del chatbot
- Crear APIs para obtener variables según tenant y contexto
