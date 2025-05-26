# Configuración de Supabase Realtime

## Error Detectado
El error que viste indica que la conexión Realtime falló. Esto es normal en el primer setup. Ahora tienes una versión robusta que maneja errores y usa polling como fallback.

## ✅ Solución Implementada

### 1. Hook Robusto con Fallback
- **Archivo**: `src/hooks/useRealtimeLeadSyncRobust.ts`
- Si Realtime falla, automáticamente usa polling cada 10 segundos
- Reintentos automáticos (máximo 3)
- Indicador visual del estado de conexión

### 2. Estados de Conexión
- 🔵 **Conectando** (azul pulsante): Intentando conectar a Realtime
- 🟢 **Conectado** (verde pulsante): Realtime funcionando perfectamente
- 🟡 **Fallback** (amarillo): Usando polling porque Realtime falló
- 🔴 **Error** (rojo): Error de conexión

## 🔧 Pasos para Habilitar Realtime (Opcional)

Si quieres que funcione el Realtime verdadero:

### 1. En Supabase Dashboard
1. Ve a tu proyecto en https://supabase.com/dashboard
2. Ve a **Database** → **Replication**
3. Busca la tabla `leads`
4. Activa **Realtime** para esa tabla

### 2. Verificar Políticas RLS
Las políticas RLS deben permitir `SELECT` en tiempo real:
```sql
-- Verificar si existe política para leads
SELECT * FROM pg_policies WHERE tablename = 'leads';

-- Si no hay política o no permite SELECT, crear una:
CREATE POLICY "Enable realtime for leads" ON "public"."leads"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);
```

### 3. Verificar Variables de Entorno
Asegúrate de que estas variables estén correctas:
```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
```

## 🚀 Qué Esperar Ahora

### Funcionamiento Actual
- **Fallback automático**: Si Realtime falla, usa polling cada 10 segundos
- **Indicador visual**: Verás un punto de color que indica el estado
- **Funcionalidad mantenida**: Los leads se sincronizan independientemente

### Logs en Consola
```
[RealtimeSync] 🚀 Inicializando sincronización de leads
[RealtimeSync] 📚 Nombres iniciales cargados: X
[RealtimeSync] 🔌 Intentando conexión Realtime para tenant: xxx
[RealtimeSync] ❌ Error en el canal Realtime
[RealtimeSync] 🔄 Iniciando polling fallback cada 10 segundos
```

### Si Realtime Funciona
```
[RealtimeSync] ✅ Realtime conectado exitosamente
[RealtimeSync] 📡 Cambio detectado: UPDATE lead_123
```

## 📊 Beneficios vs Polling Original

| Aspecto | Original | Nuevo |
|---------|----------|-------|
| Frecuencia | 1 segundo | 10 segundos (fallback) |
| Realtime | No | Sí (cuando funciona) |
| Manejo errores | No | Sí |
| Indicador visual | No | Sí |
| Reconexión | No | Automática |

## 🔍 Debugging

### Ver Estado de Conexión
El punto de color te dirá inmediatamente el estado:
- Si ves 🟡 (amarillo): Está funcionando con polling
- Si ves 🟢 (verde): ¡Realtime funcionando perfectamente!

### Forzar Sincronización
Si necesitas forzar una sincronización:
```javascript
// En la consola del navegador
window.chatListForceSync?.()
```

La implementación actual garantiza que **siempre funcione**, ya sea con Realtime o con polling optimizado.