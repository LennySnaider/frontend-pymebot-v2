# Verificación de Integración Sales Funnel con Chatbot

Este documento explica cómo verificar que la integración entre el chatbot y el sales funnel está funcionando correctamente.

## 🔍 Pasos para Verificar la Integración

### 1. Acceder a la Página de Debug

1. Inicia sesión como Super Admin
2. En el menú de navegación, busca **Superadmin Tools** → **Debug Sales Funnel**
3. O navega directamente a: `/debug/sales-funnel-integration`

### 2. Verificar Configuración Básica

En la página de debug verás tres tarjetas principales:

#### Etapas del Sales Funnel
- Verifica que aparezcan todas las etapas con sus colores correspondientes
- Las etapas deben incluir: nuevo, contactado, interesado, oportunidad, negociacion, confirmado, cerrado, perdido

#### Templates Activos
- Verifica que los templates tengan nodos con etapas configuradas
- Si dice "0 nodos con etapa", necesitas configurar el `salesStageId` en los nodos

#### Leads Recientes
- Muestra los últimos leads con sus etapas actuales
- Útil para ver cambios en tiempo real

### 3. Ejecutar Test de Integración

1. Haz clic en el botón **"Ejecutar Test"**
2. El test realizará las siguientes acciones:
   - Verificará templates con salesStageId configurado
   - Simulará el envío de un mensaje de chat
   - Comprobará si se actualiza la etapa del lead

3. Observa el resultado:
   - ✅ **Success**: La integración funciona correctamente
   - ⚠️ **Warning**: Configuración incompleta (ej: falta salesStageId)
   - ❌ **Error**: Hay un problema con la integración

### 4. Configurar Nodos en el Chatbot Builder

Si el test muestra que no hay nodos con etapas configuradas:

1. Ve a **Superadmin Tools** → **Constructor Visual de Chatbots**
2. Abre un template para editar
3. Para cada nodo que deba cambiar la etapa del lead:
   - Selecciona el nodo
   - En el panel de propiedades, busca **"Etapa asociada"**
   - Selecciona la etapa correspondiente del sales funnel
   - Guarda los cambios

### 5. Probar con un Lead Real

1. Ve al módulo de **Chat** (`/modules/marketing/chat`)
2. Selecciona un lead para iniciar conversación
3. Interactúa con el chatbot siguiendo el flujo configurado
4. Verifica en el sales funnel (`/modules/leads/leads-scrum`) que el lead se mueva a la etapa correcta

## 🛠️ Solución de Problemas Comunes

### "No hay templates con etapas configuradas"
- Solución: Configurar salesStageId en los nodos del chatbot builder

### El lead no cambia de etapa
Verificar:
1. El nodo tiene salesStageId configurado
2. El template está activo
3. El flujo está llegando al nodo correcto
4. Los logs del backend para errores

### Error al ejecutar test
Verificar:
1. El servicio backend está funcionando
2. Las rutas de API están configuradas correctamente
3. No hay errores de CORS

## 📊 Monitoreo en Tiempo Real

Para monitorear cambios en tiempo real:

1. Abre la consola del navegador (F12)
2. Ejecuta: `window.monitorSalesFunnelChanges()`
3. Verás actualizaciones cada vez que un lead cambie de etapa
4. Presiona Ctrl+C para detener el monitoreo

## 🔐 Permisos Necesarios

- Solo usuarios con rol **SUPER_ADMIN** pueden acceder a la página de debug
- Los agentes pueden ver el sales funnel pero no la página de debug
- Los templates solo pueden ser editados por super admins

## 📝 Notas Importantes

1. **Desarrollo**: En desarrollo se usa la service key de Supabase para bypass de RLS
2. **Producción**: En producción se deben configurar políticas RLS apropiadas
3. **Seguridad**: Nunca exponer la service key en el frontend

## 🚀 Próximos Pasos

1. Configurar salesStageId en todos los nodos relevantes
2. Crear flujos de prueba para cada etapa del sales funnel
3. Implementar notificaciones cuando un lead cambie de etapa
4. Agregar métricas de conversión entre etapas

---

Para más información o soporte, contacta al equipo de desarrollo.