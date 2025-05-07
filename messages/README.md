# Estructura de Traducciones Modularizada

Este directorio contiene los archivos de traducción para la aplicación, organizados en una estructura modular para facilitar el mantenimiento.

## Estructura de Archivos

```
messages/
├── en/                  # Traducciones en inglés (modular)
│   ├── core.json        # Traducciones básicas (header, common)
│   ├── sales.json       # Traducciones relacionadas con ventas
│   ├── customers.json   # Traducciones relacionadas con clientes
│   ├── appointments.json # Traducciones relacionadas con citas
│   ├── properties.json  # Traducciones relacionadas con propiedades
│   ├── dashboard.json   # Traducciones del panel de control
│   ├── navigation.json  # Traducciones de navegación
│   ├── ui.json          # Traducciones de componentes UI
│   ├── system.json      # Traducciones de variables del sistema (parte 1)
│   ├── system-forms.json # Traducciones de variables del sistema (parte 2)
│   └── index.ts         # Archivo que combina todos los módulos
├── es/                  # Traducciones en español (modular)
│   ├── core.json        # Traducciones básicas (header, common)
│   ├── sales.json       # Traducciones relacionadas con ventas
│   ├── customers.json   # Traducciones relacionadas con clientes
│   ├── appointments.json # Traducciones relacionadas con citas
│   ├── properties.json  # Traducciones relacionadas con propiedades
│   ├── dashboard.json   # Traducciones del panel de control
│   ├── navigation.json  # Traducciones de navegación
│   ├── ui.json          # Traducciones de componentes UI
│   ├── system-basic.json # Traducciones de variables del sistema (parte 1)
│   └── system-forms.json # Traducciones de variables del sistema (parte 2)
├── en.json              # Archivo de traducción en inglés (legacy)
├── es.json              # Archivo de traducción en español (legacy)
└── README.md            # Este archivo
```

## Cómo Funciona

La aplicación utiliza `next-intl` para gestionar las traducciones. El archivo `src/i18n/request.ts` ha sido modificado para soportar tanto la estructura modular como los archivos legacy.

### Importación de Traducciones

El sistema intentará cargar las traducciones desde la estructura modular primero:

1. Para inglés, intenta importar desde `en/index.ts`, que combina todos los módulos.
2. Para español, importa cada módulo individualmente y los combina en tiempo de ejecución.
3. Si hay algún error, cae de vuelta a los archivos legacy (`en.json` o `es.json`).

### Añadir Nuevas Traducciones

Para añadir nuevas traducciones:

1. Identifica el módulo apropiado para la traducción (por ejemplo, `sales.json` para traducciones relacionadas con ventas).
2. Añade la traducción en el archivo correspondiente para cada idioma.
3. Si es necesario crear un nuevo módulo:
    - Crea el archivo JSON en cada carpeta de idioma.
    - Actualiza `en/index.ts` para importar el nuevo módulo.
    - Actualiza `src/i18n/request.ts` para importar el nuevo módulo para español.

### Ventajas de la Estructura Modular

- **Mantenimiento más sencillo**: Las traducciones están organizadas por funcionalidad, lo que facilita encontrar y actualizar traducciones específicas.
- **Trabajo en equipo**: Diferentes desarrolladores pueden trabajar en diferentes módulos sin conflictos.
- **Mejor rendimiento**: Solo se cargan las traducciones necesarias para cada página.
- **Escalabilidad**: Facilita la adición de nuevos idiomas y módulos.

## Migración Completa

En el futuro, se recomienda:

1. Migrar completamente a la estructura modular para todos los idiomas.
2. Crear un archivo `index.ts` para español similar al de inglés.
3. Eliminar los archivos legacy (`en.json` y `es.json`) una vez que la migración esté completa.
