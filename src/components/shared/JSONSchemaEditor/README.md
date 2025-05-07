# JSONSchemaEditor

## Descripción

El componente `JSONSchemaEditor` es un editor visual para crear y editar esquemas JSON de forma interactiva. Permite definir la estructura de datos conforme a la especificación de [JSON Schema](https://json-schema.org/), facilitando la creación de esquemas complejos a través de una interfaz gráfica intuitiva.

## Características

- Editor visual con interfaz de usuario intuitiva
- Soporte para todos los tipos de datos de JSON Schema (string, number, integer, boolean, object, array, null)
- Validación integrada mediante Zod
- Vista previa en tiempo real del JSON Schema generado
- Edición de propiedades anidadas en objetos
- Soporte para validaciones específicas según el tipo de dato (minLength, maxLength, pattern, minimum, maximum, etc.)
- Modo de solo lectura para visualización
- Posibilidad de definir valores de enumeración (enum)
- Exportación del esquema completo en formato JSON Schema

## Instalación

El componente `JSONSchemaEditor` es parte de la biblioteca de componentes compartidos de PymeBot v2. No se requiere instalación adicional.

## Uso

### Importación

```jsx
import { JSONSchemaEditor } from '@/components/shared';
```

### Ejemplo básico

```jsx
import { useState } from 'react';
import { JSONSchemaEditor } from '@/components/shared';

const MyComponent = () => {
  const [schema, setSchema] = useState({});
  
  const handleSchemaChange = (newSchema) => {
    setSchema(newSchema);
    console.log('Esquema actualizado:', newSchema);
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Editor de Esquema</h2>
      <JSONSchemaEditor 
        onChange={handleSchemaChange}
      />
    </div>
  );
};
```

### Con esquema inicial

```jsx
import { JSONSchemaEditor } from '@/components/shared';

const initialSchema = {
  type: 'object',
  properties: {
    nombre: {
      type: 'string',
      description: 'Nombre completo'
    },
    edad: {
      type: 'integer',
      minimum: 0,
      description: 'Edad en años'
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Correo electrónico'
    }
  },
  required: ['nombre', 'email']
};

const MyComponent = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Editor de Esquema</h2>
      <JSONSchemaEditor 
        initialSchema={initialSchema}
        onChange={(schema) => console.log('Esquema actualizado:', schema)}
        onSave={(schema) => console.log('Esquema guardado:', schema)}
      />
    </div>
  );
};
```

### Modo solo lectura

```jsx
import { JSONSchemaEditor } from '@/components/shared';

const MyComponent = ({ schema }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Visualizador de Esquema</h2>
      <JSONSchemaEditor 
        initialSchema={schema}
        readOnly={true}
      />
    </div>
  );
};
```

## Props

| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| initialSchema | `Record<string, any>` | No | Esquema JSON inicial que se cargará en el editor. |
| onChange | `(schema: Record<string, any>) => void` | No | Función que se ejecuta cada vez que cambia el esquema. |
| onSave | `(schema: Record<string, any>) => void` | No | Función que se ejecuta cuando se guarda explícitamente el esquema. |
| readOnly | `boolean` | No | Si es `true`, el editor estará en modo solo lectura. Por defecto es `false`. |
| className | `string` | No | Clases CSS adicionales para el contenedor principal. |

## Estructura interna

El editor maneja internamente un modelo de datos que representa el esquema JSON, con las siguientes características para cada campo:

```typescript
interface SchemaField {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
  default?: any;
  properties?: Record<string, SchemaField>;
  items?: SchemaField;
}
```

## Casos de uso

El componente `JSONSchemaEditor` es ideal para:

1. **Configuración de formularios dinámicos**: Definir la estructura de formularios que pueden cambiar según necesidades específicas.
2. **Validación de datos**: Crear esquemas para validar la estructura de datos de entrada en APIs.
3. **Documentación de modelos de datos**: Visualizar y editar la estructura de modelos de datos de la aplicación.
4. **Configuración de módulos**: Permitir a los usuarios definir estructuras de datos personalizadas.

## Ejemplo de integración en una vertical

El ejemplo completo de integración del `JSONSchemaEditor` en una vertical puede verse en el componente `MedicalFormBuilder` de la vertical de medicina.

```jsx
import { JSONSchemaEditor } from '@/components/shared';

// ... código del componente

<JSONSchemaEditor
  initialSchema={schemaInEditor}
  onChange={handleSchemaChange}
  onSave={handleSaveSchema}
/>
```

Este componente utiliza el editor para crear plantillas de formularios médicos personalizados que se pueden utilizar en diferentes contextos clínicos.

## Notas de implementación

- El componente utiliza Zustand para gestión de estado, asegurando un rendimiento óptimo incluso con esquemas complejos.
- La validación se realiza mediante Zod, garantizando la integridad de los datos del esquema.
- La interfaz de usuario está construida con los componentes UI estándar de PymeBot v2, garantizando consistencia visual.
- El editor genera esquemas compatibles con la especificación JSON Schema, que pueden ser utilizados con cualquier biblioteca de validación compatible.
