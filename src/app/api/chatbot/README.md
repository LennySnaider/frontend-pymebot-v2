# Sistema de Chatbot - Documentación Técnica

## Introducción

Este sistema implementa un motor de chatbot basado en plantillas visuales de flujo. El sistema está diseñado para:

- Procesar mensajes entrantes de usuarios por diferentes canales
- Ejecutar flujos de conversación definidos visualmente
- Mantener estado de sesión y contexto de conversación
- Soportar múltiples tipos de nodos (mensajes, entradas, condiciones, etc.)
- Integrarse con sistemas externos mediante nodos especializados

## Arquitectura

El sistema se compone de los siguientes componentes principales:

1. **API Endpoints**: Reciben mensajes y manejan interacciones externas
2. **Gestor de Conversaciones**: Maneja sesiones y estado
3. **Ejecutor de Flujo**: Coordina la ejecución de plantillas
4. **Ejecutor de Nodos**: Procesa cada nodo individual según su tipo
5. **Base de Datos**: Almacena plantillas, sesiones y mensajes

## Auto-Flow vs. Espera de Respuesta

Una característica importante del sistema es la capacidad de un nodo para continuar automáticamente al siguiente nodo o esperar una respuesta del usuario.

### Propiedad `waitForResponse`

- **Cuando `waitForResponse = true`**: El flujo se detiene en ese nodo, esperando una respuesta del usuario.
- **Cuando `waitForResponse = false`**: El flujo continúa automáticamente al siguiente nodo (modo "auto-flow").

### Comportamiento por defecto:

1. **Nodos de mensaje de bienvenida**: `waitForResponse = false` (auto-flow)
   - Se identifican por ID (`messageNode-welcome`, contiene `welcome`)
   - O por etiqueta (contiene `Bienvenida` o `Welcome`)

2. **Otros nodos de mensaje**: `waitForResponse = true` (esperan respuesta)

3. **Nodos de entrada (inputNode)**: Siempre esperan respuesta (equivalente a `waitForResponse = true`)

### Ejemplo de flujo con Auto-Flow:

```
[startNode] --> [messageNode waitForResponse=false] --> [messageNode waitForResponse=false] --> [inputNode]
```

En este flujo, cuando se inicia la conversación:
1. Se muestra el primer mensaje
2. Automáticamente se muestra el segundo mensaje (sin esperar respuesta)
3. Finalmente se detiene en el inputNode, esperando entrada del usuario

## Depuración de Plantillas

Para asegurar que todas las plantillas tengan la propiedad `waitForResponse` correctamente configurada, se proporciona un endpoint de debug:

```
GET /api/chatbot/debug/update-templates
```

Este endpoint revisa todas las plantillas activas y actualiza los nodos de mensaje, estableciendo `waitForResponse`:
- A `false` para nodos de bienvenida
- A `true` para otros nodos de mensaje que no tengan esta propiedad definida

## Flujo de Ejecución

1. Se recibe un mensaje en `/api/chatbot/message`
2. Se encuentra o crea una sesión para el usuario/tenant
3. Se busca la plantilla activa
4. Se identifica el nodo actual o inicial
5. Se ejecuta cada nodo en secuencia hasta:
   - Encontrar un nodo con `waitForResponse = true`
   - O llegar al final del flujo
6. Se devuelven las respuestas generadas

## Mejores Prácticas

- Asegúrese de diseñar flujos con nodos de bienvenida claramente identificados
- Configure explícitamente `waitForResponse = false` en nodos que deban continuar automáticamente
- Para secuencias de mensajes automáticos, use nodos separados en lugar de mensajes concatenados
- Limite la profundidad de secuencias auto-flow para evitar sobrecarga al usuario