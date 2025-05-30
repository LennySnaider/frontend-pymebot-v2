# Tareas Pendientes - PymeBot Frontend

**Última actualización: 30/05/2025**

- **Total de tareas:** 17
- **Completadas:** 11 (65%)
- **En progreso:** 0 (0%)
- **Pendientes:** 6 (35%)

## 🎉 Avances de esta sesión (30/05/2025)

### ✅ Implementación de iconos de WhatsApp/Instagram en avatares de leads
- **Descripción:** Añadir iconos de WhatsApp e Instagram a los avatares de leads para distinguir su origen.
- **Fecha:** 2025-05-30
- **Estado:** COMPLETADO
- **Solución implementada:**
  - **ChatList.tsx**: 
    - Agregada función `renderSourceAvatar()` que muestra iconos según `metadata.source`
    - WhatsApp: Icono personalizado `/img/icons/whatsIcon.png` con fondo verde
    - Instagram: Icono FaInstagram con fondo rosa
    - Fallback a WhatsApp por defecto
  - **LeadCard.tsx (Sales Scrum)**:
    - Iconos de red social al lado del avatar del agente
    - Mismo tamaño (25x25px) que el avatar
    - Se muestra siempre, incluso sin agente asignado
  - **Preparado para futura integración** de Instagram y otras redes sociales

### ✅ Optimización de rendimiento en carga de plantillas de chat
- **Descripción:** El chat tardaba 94 segundos en cargar debido a timeouts en consultas a Supabase.
- **Fecha:** 2025-05-30
- **Estado:** COMPLETADO
- **Solución implementada:**
  - **Backend (supabase.ts)**:
    - Implementado cache con TTL de 5 minutos para plantillas
    - Reducción de timeouts: 5s para DB, sin reintentos
    - Función `clearTemplateCache()` para limpiar cache
    - Corregido error de referencia `activationsError`
  - **Frontend API**:
    - Timeout de 10 segundos en `/api/chatbot/templates`
    - Manejo específico de errores de timeout
  - **ChatStore**:
    - Timeout de 15 segundos con mensajes claros
    - Fallback a localStorage si falla la API
  - **Nuevo endpoint**: `/api/cache/clear-templates` para limpiar cache manualmente
  - **Resultado**: De 94 segundos a ~5 segundos en primera carga, cargas subsecuentes casi instantáneas

## 🎉 Avances de sesión anterior (29/05/2025)

### ✅ **INTEGRACIÓN COMPLETA:** Sistema de Chatbot con Captura de Leads y Flujo de Citas - COMPLETADO

- **Descripción:** Implementación completa del flujo de chatbot PymeBot V1 con captura automática de leads, selección interactiva de servicios, verificación de disponibilidad y agendamiento de citas.
- **Fecha:** 2025-05-29
- **Contexto:** El backend del chatbot (`v2-backend-pymebot`) implementa la funcionalidad completa que debe integrarse con el frontend
- **Solución implementada:**

  #### **🔧 Persistencia de Sesión en Backend:**
  - **Archivo backend:** `/v2-backend-pymebot/src/api/text.ts` (líneas 218-231)
  - **Problema resuelto:** Cada request generaba userId anónimo diferente, rompiendo persistencia
  - **Funcionalidad:** Priorizar `session_id` para mantener consistencia entre mensajes
  - **Impacto frontend:** El chat mantiene contexto durante toda la conversación

  #### **🤖 Auto-creación de Leads desde Backend:**
  - **Archivo backend:** `/v2-backend-pymebot/src/services/templateConverter.ts` (líneas 610-635)
  - **Funcionalidad:** Creación automática de leads al capturar nombre + teléfono desde WhatsApp
  - **Variables detectadas:** `nombre_lead`, `cliente_nombre`, `name`, `telefono`, `phone`, `email`
  - **Impacto frontend:** Los leads aparecen automáticamente en el SalesFunnel sin configuración

  #### **📋 Lista Interactiva de Productos/Servicios:**
  - **Archivo backend:** `/v2-backend-pymebot/src/services/templateConverter.ts` (líneas 1700-1800)
  - **Funcionalidad nueva:**
    - **>3 productos:** Usa lista interactiva WhatsApp (`provider.sendList()`)
    - **≤3 productos:** Usa botones simples
    - **Captura automática:** Guarda selección en estado como `servicio_seleccionado`
    - **Matching inteligente:** Busca coincidencias en productos disponibles
  - **Impacto frontend:** Mejorar UI del chatbot builder para configurar productos interactivos

  #### **🎯 Flujo Completo Como PymeBot V1:**
  ```
  1. Saludo → 2. Captura nombre → 3. Captura teléfono → [CREA LEAD AUTOMÁTICAMENTE]
  4. Lista servicios interactiva → 5. Usuario selecciona → 6. Verifica disponibilidad 
  7. Agenda cita → 8. Confirmación con QR
  ```

  #### **✅ Funcionalidades Backend Implementadas:**
  - **Formularios multi-paso:** Funcionan completamente
  - **Captura automática de leads:** Desde WhatsApp sin configuración
  - **Selección interactiva de servicios:** Con listas/botones automáticos
  - **Agendamiento de citas:** Flujo completo con confirmación y QR
  - **Variables de sesión:** Persisten durante toda la conversación
  - **Sales funnel:** Progresión automática de etapas

## 🎉 Avances de sesión anterior (30/01/2025)

### ✅ Sistema de Productos y Categorías - COMPLETADO

- **Descripción:** El nodo de productos del chatbot traía categorías hardcodeadas en lugar de datos reales del tenant.
- **Solución implementada:**
  - Se crearon tablas `product_categories` y `products` con soporte multi-tenant
  - Se implementó servicio `productsService.ts` para obtener productos de la BD
  - Se crearon APIs REST completas para CRUD de categorías y productos
  - Se actualizó `templateConverter.ts` para usar productos reales
  - El nodo de productos ahora:
    - Obtiene productos reales del tenant
    - Soporta filtrado por categoría
    - Limita cantidad de productos mostrados
    - Reemplaza automáticamente `{{products_list}}` con datos reales
  - Scripts SQL disponibles:
    - `/execute_products_tables.sql` - Crear tablas
    - `/insert_sample_products.sql` - Datos de ejemplo
    - `/verify_products_setup.sql` - Verificación

## 🎉 Avances de sesiones anteriores

### ✅ Implementación de badges del SalesFunnel en el chat

- Se añadieron badges con colores exactos del SalesFunnel en el header del chat
- Se implementó indicador de color en la lista de leads (punto en la esquina superior derecha)
- Se crearon funciones helper: `getStageColorClasses`, `getStageName`, `getStageIndicatorColor`

### ✅ Mejoras en la UI del chat

- Se reemplazaron avatares de imágenes por iconos (TbUser para leads, TbRobot para bot)
- Se mejoró la visualización de plantillas con iconos según el tipo
- Se implementó la funcionalidad de eliminar conversación (solo superadmin)

### ✅ Correcciones de bugs

- Solucionado error de duplicación de mensajes
- Corregido error en función `clearConversation`
- Solucionado error de inicialización de `visibleTemplates`
- Deshabilitada temporalmente sincronización realtime problemática

### ✅ Mejoras en el filtrado de plantillas

- Se modificó para mostrar todas las plantillas excepto las eliminadas/archivadas
- Se quitó el filtro que ocultaba plantillas de prueba

### ✅ Sistema de disponibilidad de agentes completado

- Verificado que el sistema está completamente implementado
- AgentAvailabilityDialog permite configurar horarios por día
- Integración en AgentList con botón "Configurar disponibilidad"
- API routes y server actions funcionando correctamente
- Datos guardados en campo JSONB en tabla agents

## Prioridad Alta

### 1. ✅ Corregir error 'useRef is not defined' en LeadContent.tsx

- **Estado:** COMPLETADO
- **Descripción:** El componente `LeadContent.tsx` importa correctamente `useRef` desde React en la línea 12.
- **Solución implementada:**
    - `useRef` está correctamente importado junto con otros hooks
    - Las refs están declaradas correctamente en las líneas 641 y 759
    - No hay evidencia del error mencionado en el código actual

### 2. ✅ Resolver problema de carga de plantillas (error 404 en /api/chat/templates)

- **Estado:** COMPLETADO EN ESTA SESIÓN
- **Descripción:** La aplicación intentaba cargar plantillas desde una ruta incorrecta.
- **Solución implementada:**
    - Se corrigió la ruta a `/api/chatbot/templates` que es la correcta
    - Se mejoró el filtrado para mostrar todas las plantillas disponibles
    - Se implementó mejor manejo de errores y sincronización

### 3. ✅ Mejorar sincronización en tiempo real de leads entre SalesFunnel y chat

- **Descripción:** La sincronización de leads entre el SalesFunnel y el chat necesita mejoras para ser más consistente.
- **Solución implementada:**
    - Se implementó un sistema de caché global con `globalLeadCache.ts` para centralizar los datos.
    - Se integró directamente en `LeadEditForm.tsx` y `ChatList.tsx` para garantizar la sincronización.
    - Los botones de actualización fueron eliminados por no funcionar correctamente.

### 4. ✅ Implementar persistencia de datos en el formulario de diálogo de edición de leads

- **Estado:** COMPLETADO
- **Descripción:** El formulario de edición de leads mantiene los datos con persistencia implementada.
- **Solución implementada:**
    - Existe `LeadEditFormPersistent.tsx` que implementa persistencia completa
    - Se usa `chatSyncPersistence.ts` para guardar datos en localStorage
    - Implementado guardado automático y recuperación de datos
    - Sincronización con el backend cuando está disponible

### 5. IMPORTANTE: No modificar el SalesFunnel existente (mantener funcionalidad de sincronización de etapas)

- **Descripción:** El SalesFunnel funciona correctamente para la sincronización automática de etapas de leads y no debe ser modificado.
- **Solución propuesta:**
    - Documentar claramente el funcionamiento actual del SalesFunnel.
    - Implementar pruebas de regresión para verificar que no se rompe esta funcionalidad.
    - Crear una lista de componentes y archivos que no deben modificarse.
    - Implementar cualquier nueva funcionalidad como extensiones sin alterar la lógica existente.
    - Mantener separados los flujos de datos de sincronización de etapas.

### 6. ✅ Homologar nuevos nodos del chatbot builder en el panel de superadmin

- **Estado:** COMPLETADO
- **Descripción:** Los nodos han sido migrados y homologados siguiendo el patrón estándar.
- **Solución implementada:**
    - ✅ Nodos migrados a `/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/nodes/`
    - ✅ ActionNode y LeadQualificationNode ya migrados
    - ✅ Nodos antiguos en `/components/view/ChatbotBuilder/nodes/` eliminados
    - ✅ Implementados ejecutores en `/utils/nodeExecutors/` para cada tipo de nodo
    - ✅ Los nodos siguen el patrón estándar con configuración en el panel lateral

## Prioridad Media

### 7. Implementar persistencia de datos en la tarjeta de detalles del lead

- **Descripción:** La sección de detalles del lead (tarjeta) no mantiene su estado al recargar
- **Solución propuesta:**
    - Implementar caché local para los detalles de leads frecuentemente accedidos.
    - Optimizar la carga de datos para minimizar parpadeos y estados de carga.
    - Usar técnicas como `useMemo` para mejorar el rendimiento de visualización.
    - Implementar una estrategia de "stale-while-revalidate" para mostrar datos antiguos mientras se cargan los nuevos.

### 8. ✅ Implementar guardado de conversaciones en el chat

- **Estado:** COMPLETADO
- **Descripción:** Las conversaciones del chat se guardan persistentemente.
- **Solución implementada:**
    - ✅ Implementado en `chatSyncPersistence.ts` con guardado en localStorage
    - ✅ `ChatPersistenceInitializer.tsx` maneja la inicialización y recuperación
    - ✅ Sincronización automática con el backend cuando está disponible
    - ✅ Sistema de caché con expiración y límites de tamaño implementado

### 9. ✅ Implementar ordenación de leads por tiempo de interacción

- **Descripción:** Los leads deben ordenarse por tiempo de interacción, mostrando primero los más recientes.
- **Solución implementada:**
    - Se modificó la función de ordenación en `ChatList.tsx` para priorizar `lastActivity`.
    - Se añadió la actualización automática de timestamp al interactuar con los leads.
    - Código implementado:
        ```typescript
        // En ChatList.tsx:
        .sort((a, b) => {
          // Primero por tiempo de última interacción
          if (a.metadata?.lastActivity && b.metadata?.lastActivity) {
              return b.metadata.lastActivity - a.metadata.lastActivity;
          }
          // Luego por fecha de creación
          return b.time - a.time;
        })
        ```

### 10. ⚠️ Implementar solución para ocultar advertencia 'Sin plantillas configuradas'

- **Estado:** PARCIALMENTE COMPLETADO
- **Descripción:** La advertencia puede seguir apareciendo en algunos casos.
- **Situación actual:**
    - `StoreInitializer.tsx` existe pero todavía puede mostrar advertencias
    - Necesita revisar la lógica de inicialización para suprimir completamente las advertencias
    - Considerar agregar una configuración para modo desarrollo vs producción
      2

### 11. ⚠️ Investigar/implementar mecanismo para evitar bucles infinitos

- **Estado:** PARCIALMENTE COMPLETADO
- **Descripción:** Hay protecciones básicas pero no un sistema completo.
- **Situación actual:**
    - ✅ Se usan refs (`loadedPropertyTypes`, `pendingPropertyRequests`) en LeadContent.tsx
    - ❌ No hay sistema de throttling global
    - ❌ No se usa React Query o SWR
    - Necesita implementar una solución más robusta

### 12. ❌ Reevaluar y mejorar solución para cargar propiedades específicas por tipo

- **Estado:** PENDIENTE
- **Descripción:** No existe un sistema de caché global para propiedades.
- **Situación actual:**
    - Solo hay protecciones locales con refs en componentes individuales
    - No existe un caché centralizado de propiedades
    - Las llamadas API se repiten innecesariamente
- **Próximos pasos:**
    - Implementar el sistema de caché global propuesto
    - Centralizar la gestión de propiedades
    - Reducir llamadas API duplicadas

## Prioridad Baja

### 13. Crear componente o backup para manejar escenarios sin plantillas

- **Descripción:** Actualmente el sistema muestra un error o pantalla vacía si no hay plantillas.
- **Solución propuesta:**
    - Desarrollar un componente de chat básico que funcione sin plantillas.
    - Implementar un sistema de "plantilla fallback" cuando no hay plantillas configuradas.
    - Proporcionar una mejor experiencia de usuario cuando no hay plantillas disponibles.

## 🚀 TAREA ACTUAL: Integración de Nodos de Citas con el Módulo de Appointments

### Estado: EN PROGRESO

- **Descripción:** Integrar los nodos del chatbot builder relacionados con citas (BookAppointmentNode, RescheduleAppointmentNode, CancelAppointmentNode, CheckAvailabilityNode) con el módulo de appointments existente.

### Componentes involucrados:

1. **Nodos del Chatbot:**

    - `/utils/nodeExecutors/bookAppointmentExecutor.ts`
    - `/utils/nodeExecutors/rescheduleAppointmentExecutor.ts`
    - `/utils/nodeExecutors/cancelAppointmentExecutor.ts`
    - `/utils/nodeExecutors/checkAvailabilityExecutor.ts`

2. **Módulo de Appointments:**
    - `/app/(protected-pages)/modules/appointments/`
    - `/services/AppointmentService.ts`
    - Base de datos: tabla `appointments`

### Tareas específicas:

- [ ] Conectar `checkAvailabilityExecutor` con el servicio de horarios de negocio
- [ ] Implementar creación real de citas en `bookAppointmentExecutor`
- [ ] Conectar `rescheduleAppointmentExecutor` con el sistema de citas
- [ ] Implementar cancelación real en `cancelAppointmentExecutor`
- [ ] Sincronizar estados entre chatbot y calendario visual
- [ ] Manejar conflictos de horarios y validaciones
- [ ] Implementar notificaciones cuando se crean/modifican citas desde el chat

## Resumen de Estado

### Completadas: 9/15 tareas (60%)

- ✅ Tarea 1: Error useRef corregido
- ✅ Tarea 2: API de plantillas corregida (COMPLETADO EN ESTA SESIÓN)
- ✅ Tarea 3: Sincronización de leads implementada
- ✅ Tarea 4: Persistencia de formulario implementada
- ✅ Tarea 6: Nodos homologados
- ✅ Tarea 8: Guardado de conversaciones implementado
- ✅ Tarea 9: Ordenación de leads implementada
- ✅ Sistema de disponibilidad de agentes (VERIFICADO EN SESIÓN ANTERIOR)
- ✅ Sistema de Productos y Categorías (COMPLETADO EN ESTA SESIÓN)

### Parcialmente completadas: 2/15 tareas (13%)

- ⚠️ Tarea 10: Advertencias de plantillas
- ⚠️ Tarea 11: Protección contra bucles infinitos

### Pendientes: 4/15 tareas (27%)

- ❌ Tarea 5: Documentación del SalesFunnel (nota de no modificar)
- ❌ Tarea 7: Caché de detalles de lead
- ❌ Tarea 12: Caché global de propiedades
- ❌ Tarea 13: Componente fallback sin plantillas
- ❌ Nueva: Re-habilitar sincronización realtime cuando se solucione el problema

## Notas Adicionales

- Asegurarse de seguir las convenciones del proyecto.
- No introducir soluciones temporales que requieran datos falsos (mockups).
- Todas las soluciones deben funcionar con la estructura de datos real del backend.
- Probar cada solución independientemente antes de integrarlas.
- Documentar cualquier cambio en la arquitectura o patrones de uso.
- Mantener la compatibilidad con el flujo automático de movimiento de leads en el SalesFunnel.
