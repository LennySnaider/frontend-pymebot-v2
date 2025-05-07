# Tareas: Integración de Servicios de Voz MiniMax (TTS/STT)

Este archivo rastrea el progreso de la integración de los servicios Text-to-Speech (TTS) y Speech-to-Text (STT) de MiniMax en el constructor visual de chatbots y el motor de ejecución.

## Fase 1: Servicios de Backend (MiniMax API)

- [x] **1.1 Crear Servicio Centralizado:**
    - [x] Definir la estructura del servicio (ej. `src/services/VoiceService.ts`).
    - [x] Configurar variables de entorno para API Key y Group ID de MiniMax (`MINIMAX_API_KEY`, `MINIMAX_GROUP_ID`).
    - [x] Implementar cliente HTTP base (ej. usando `axios` o `node-fetch`) con cabeceras de autorización.
- [x] **1.2 Implementar Función TTS:**
    - [x] Crear función `synthesizeSpeech(text: string, voiceConfig: object, audioConfig: object): Promise<Buffer>`.
    - [x] Mapear parámetros de entrada a la estructura de la API de MiniMax TTS (`t2a_v2`).
    - [x] Realizar la llamada POST a la API.
    - [x] Procesar la respuesta: extraer el audio hexadecimal y convertirlo a Buffer.
    - [x] Añadir manejo de errores específico de la API de MiniMax.
- [x] **1.3 Implementar Función STT:**
    - [x] Crear función `transcribeAudio(audioBuffer: Buffer, language: string): Promise<string>`.
    - [x] Preparar la petición `multipart/form-data` con el buffer de audio.
    - [x] Realizar la llamada POST a la API de MiniMax STT (`audio/transcriptions`).
    - [x] Procesar la respuesta: extraer el texto transcrito.
    - [x] Añadir manejo de errores específico de la API de MiniMax.
- [x] **1.4 Integrar Sistema de Tokens (Placeholder/Diseño):**
    - [x] Diseñar cómo se medirá y debitará el uso de tokens por tenant (puede requerir tabla adicional o integración con sistema de facturación existente).
    - [x] Añadir lógica básica de conteo (ej. caracteres para TTS, segundos para STT) en las funciones del servicio.

## Fase 2: Componentes de Frontend (Constructor Visual - React Flow)

- [x] **2.1 Desarrollar Componente Nodo TTS:**
    - [x] Crear el componente React (`src/components/view/ChatbotBuilder/nodes/TTSNode.tsx`).
    - [x] Diseñar la UI del nodo para mostrar configuración básica (ej. texto inicial, voz seleccionada).
    - [x] Definir la estructura de datos (`data`) del nodo para almacenar la configuración TTS.
    - [x] Integrar el nodo en la paleta de tipos de nodos disponibles.
- [x] **2.2 Desarrollar Componente Nodo STT:**
    - [x] Crear el componente React (`src/components/view/ChatbotBuilder/nodes/STTNode.tsx`).
    - [x] Diseñar la UI del nodo para mostrar configuración básica (ej. mensaje de prompt, variable de salida).
    - [x] Definir la estructura de datos (`data`) del nodo para almacenar la configuración STT (idioma, duración máxima, variable donde guardar transcripción).
    - [x] Integrar el nodo en la paleta de tipos de nodos disponibles.
- [x] **2.3 Implementar Paneles de Configuración:**
    - [x] Crear/Adaptar un panel lateral para configurar los detalles de los nodos TTS y STT al seleccionarlos.
    - [x] **Panel TTS:** Campos para texto (con soporte para variables), selección de voz (`voice_id`), emoción, velocidad, volumen, pitch, formato de audio, etc.
    - [x] **Panel STT:** Campos para mensaje de prompt, idioma, duración máxima, nombre de la variable de estado donde guardar la transcripción.
    - [x] Guardar la configuración en el objeto `data` del nodo correspondiente en React Flow.
- [x] **2.4 Implementar UI de Vista Previa para Pruebas:**
    - [x] Crear/Adaptar componente de vista previa para probar los nodos de voz.
    - [x] Implementar interfaz de chat similar a la existente para "Vista previa".
    - [x] Añadir funcionalidad para reproducir audio generado por TTS.
    - [x] Añadir funcionalidad para simular entrada de texto en lugar de audio para STT.
    - [x] Mostrar resultados de transcripción en la interfaz de chat.

## Fase 3: Motor de Ejecución (Chatbot Runtime - Backend)

- [x] **3.1 Integrar Llamadas TTS:**
    - [x] Modificar el motor para identificar nodos de tipo TTS.
    - [x] Leer la configuración del nodo (`data`).
    - [x] Resolver variables en el texto a sintetizar usando el `state_data` de la conversación.
    - [x] Llamar a la API de TTS.
    - [x] Enviar el audio resultante al canal correspondiente (ej. WhatsApp, webchat).
- [x] **3.2 Integrar Llamadas STT:**
    - [x] Modificar el motor para identificar nodos de tipo STT.
    - [x] Leer la configuración del nodo (`data`).
    - [x] Enviar el mensaje de prompt al usuario.
    - [x] Esperar la entrada de audio del usuario desde el canal.
    - [x] Llamar a la API de STT con el audio recibido.
    - [x] Guardar la transcripción resultante en la variable especificada dentro del `state_data` de la conversación.
    - [x] Avanzar al siguiente nodo conectado.
- [x] **3.3 Gestionar Estado de Conversación:**
    - [x] Asegurar que el `state_data` (en `conversation_sessions`) se actualice correctamente con las transcripciones STT.
    - [x] Manejar posibles estados intermedios (ej. "esperando audio del usuario").

## Fase 4: Pruebas e Integración

- [ ] **4.1 Pruebas Unitarias:**
    - [ ] Probar las funciones del `VoiceService` (TTS/STT) con mocks de la API MiniMax.
    - [ ] Probar la lógica de actualización de estado en el motor de ejecución.
- [ ] **4.2 Pruebas de Integración:**
    - [ ] Probar la configuración de nodos TTS/STT en el constructor visual y verificar que se guarda correctamente.
    - [ ] Probar la ejecución de flujos que contengan nodos TTS y STT en el backend.
- [ ] **4.3 Pruebas End-to-End:**
    - [ ] Crear un flujo simple (Inicio -> TTS -> STT -> Mensaje con transcripción -> Fin).
    - [ ] Ejecutar el flujo a través de un canal real (ej. WhatsApp si es posible, o simulado).
    - [ ] Validar que el audio se genera, se recibe la entrada de voz, se transcribe y se utiliza correctamente.
- [ ] **4.4 Optimización y Manejo de Errores:**
    - [ ] Revisar tiempos de respuesta de las APIs.
    - [ ] Implementar reintentos para errores transitorios de red.
    - [ ] Definir flujos de fallback en caso de fallo de TTS/STT (ej. enviar texto en lugar de audio).
