# Tareas del Chatbot Builder

## Fase 1: Desarrollo del Constructor Visual (COMPLETADO)

### General

- [x] Flujo visual en formato horizontal (no vertical)
- [x] Persistencia en localStorage (fallback para falta de tabla en Supabase)
- [x] Manejo coherente de IDs entre componentes
- [x] Importación/exportación de plantillas
- [x] Información sobre capacidades de voz (sección UI)

### Componentes Principales

#### Listado de Plantillas

- [x] Carga de plantillas (Supabase + localStorage fallback)
- [x] Botón "Importar" correctamente posicionado
- [x] Operaciones CRUD completas (crear, ver, editar, eliminar)
- [x] Filtrado y búsqueda de plantillas

#### Editor de Flujo

- [x] Visualización horizontal de nodos (conexiones de izquierda a derecha)
- [x] Carga correcta de plantilla existente
- [x] Creación de nueva plantilla con nodos por defecto
- [x] Guardado local de cambios
- [x] Referencias entre componentes (forwardRef, useImperativeHandle)

#### Nodos Básicos

- [x] Nodo de inicio (StartNode)
- [x] Nodo de texto (TextNode)
- [x] Nodo de entrada (InputNode)
- [x] Nodo condicional (ConditionalNode)
- [x] Nodo de IA (AINode)
- [x] Nodo de router (RouterNode)
- [x] Nodo de acción (ActionNode)
- [x] Nodo de síntesis de voz (TTSNode)
- [x] Nodo de reconocimiento de voz (STTNode)

### Errores Corregidos en Fase 1

- [x] "No se encontró la plantilla" al editar una plantilla (corregido con fallback a localStorage)
- [x] No guarda el nombre de la plantilla (implementada validación y guardado inmediato)
- [x] Posición incorrecta del botón de importar (mejorado layout de botones)
- [x] Ausencia de información sobre capacidades de voz en la UI (implementado panel informativo)
- [x] Manejo inadecuado de IDs de plantilla (estandarizado uso de UUIDs)

## Fase 2: Integración con Citas y Sales Funnel (COMPLETADO)

### Servicios Principales

- [x] ChatbotStateService.ts - Manejo del estado de las conversaciones
- [x] SalesFunnelService.ts - Gestión de leads en el embudo de ventas
- [x] BusinessHoursService.ts - Control de disponibilidad y horarios
- [x] QRCodeService.ts - Generación de códigos QR para citas

### Nodos de Negocio

- [x] CheckAvailabilityNode - Verificación de disponibilidad de citas
- [x] BookAppointmentNode - Reserva automática de citas
- [x] LeadQualificationNode - Calificación automática de leads

### Motor de Ejecución

- [x] node-executor.ts - Ejecución de nodos individuales
- [x] flow-executor.ts - Procesamiento del flujo completo
- [x] business-nodes.ts - Integración de nodos de negocio

### Endpoints de API

- [x] /api/chatbot/process-message - Nuevo endpoint para procesamiento de mensajes
- [x] Integración con las APIs existentes de citas y leads

### Registro en Sistema Existente

- [x] Actualización del índice de nodos para incluir los nuevos tipos
- [x] Configuración de propiedades iniciales para nuevos nodos
- [x] Corrección de errores de importación en archivos del sistema

## Pendientes de Implementación

- [ ] Nodo de Reprogramación de Citas
- [ ] Nodo de Verificación de QR
- [ ] Nodo de Asignación Inteligente de Agentes
- [ ] Pruebas unitarias para todos los componentes
- [ ] Panel de pruebas/simulación de flujo
- [ ] Historial de versiones de plantillas
- [ ] Estadísticas de uso de plantillas
- [ ] Permisos y roles para edición de plantillas

## Próximos Pasos

1. Desarrollar nodos adicionales para gestión de citas (reprogramación, cancelación)
2. Implementar integración con pagos para reserva de citas con depósito
3. Añadir panel de pruebas/simulación de flujo
4. Desarrollar sistema de plantillas predefinidas por vertical
5. Mejorar la documentación técnica y de usuario final
6. Implementar mecanismos de análisis de conversaciones
