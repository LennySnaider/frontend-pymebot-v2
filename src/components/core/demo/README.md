# Sistema de Modo Demo

El Sistema de Modo Demo permite a los usuarios con rol super_admin simular diferentes planes de suscripción y verticales sin necesidad de cambiar la configuración real de la base de datos. Este modo es exclusivo para administradores del sistema.

## Características

- **Cambio entre planes**: Permite cambiar entre los planes Free, Basic, Professional y Enterprise.
- **Cambio entre verticales**: Permite explorar diferentes verticales según el plan seleccionado.
- **Simulación de límites**: Aplica los límites del plan seleccionado (usuarios, almacenamiento, tokens).
- **Visualización de módulos**: Muestra qué módulos están disponibles según el plan y la vertical.
- **Restauración automática**: Al desactivar el modo demo, se restaura automáticamente la configuración original.

## Componentes Principales

### `DemoModeController`

Componente de UI que proporciona una interfaz para controlar el modo demo. Incluye:

- Botón flotante para activar/desactivar el modo demo
- Panel lateral con opciones para seleccionar plan y vertical
- Visualización de límites y módulos disponibles

### `demoModeService`

Servicio que gestiona la lógica del modo demo:

- Activación/desactivación del modo
- Cambio entre planes
- Cambio entre verticales
- Almacenamiento de la configuración original

### `useDemoMode`

Hook para acceder al servicio desde componentes:

```jsx
import { useDemoMode } from '@/hooks/core/useDemoMode';

function MyComponent() {
  const { 
    isEnabled,
    toggleDemoMode,
    changePlan,
    changeVertical,
    getAvailablePlans,
    getAvailableVerticals
  } = useDemoMode();
  
  // Uso...
}
```

## Integración con Sistema de Permisos

El sistema de modo demo está disponible exclusivamente para usuarios con rol `super_admin`. No se creó un rol específico para el modo demo, ya que:

- El modo demo es una función de UI, no un rol real
- Solo los administradores del sistema pueden activar el modo demo
- El modo demo está diseñado para probar y demostrar funcionalidades, no para uso operativo

## Integración con Sistema de Límites

El servicio `limitsService` ha sido modificado para reconocer cuando el modo demo está activo y obtener los límites del plan demo en memoria en lugar de consultar la base de datos.

## Ejemplos de Uso

### Activar/desactivar modo demo

```jsx
import { useDemoMode } from '@/hooks/core/useDemoMode';

function DemoToggle() {
  const { isEnabled, toggleDemoMode } = useDemoMode();
  
  return (
    <button onClick={() => toggleDemoMode(!isEnabled)}>
      {isEnabled ? 'Desactivar' : 'Activar'} Modo Demo
    </button>
  );
}
```

### Cambiar entre planes

```jsx
import { useDemoMode } from '@/hooks/core/useDemoMode';

function PlanSelector() {
  const { changePlan, PLANS } = useDemoMode();
  
  return (
    <select onChange={(e) => changePlan(e.target.value)}>
      {Object.entries(PLANS).map(([key, plan]) => (
        <option key={key} value={key}>
          {plan.name}
        </option>
      ))}
    </select>
  );
}
```

## Consideraciones para Desarrollo

- El modo demo está diseñado para afectar solo la UI y las comprobaciones de permisos y límites.
- No modifica datos en la base de datos.
- Al desactivar el modo demo, se restaura automáticamente la configuración original.
- Para agregar nuevos planes o verticales, modificar las constantes en `demoModeService.ts`.