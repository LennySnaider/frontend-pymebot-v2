/**
 * frontend/src/components/shared/safe-components/index.ts
 * Punto de entrada para los componentes seguros para hidratación.
 * Exporta todos los componentes de la biblioteca de componentes seguros.
 * @version 1.0.0
 * @updated 2025-06-05
 */

// Componente base para hidratación segura
export { default as SafeHydration } from './SafeHydration';
export type { SafeHydrationProps, FallbackType } from './SafeHydration';

// Componentes específicos para casos comunes
export { default as SafeSelect } from './SafeSelect';
export type { SafeSelectProps } from './SafeSelect';

export { default as SafeDatePicker } from './SafeDatePicker';
export type { SafeDatePickerProps } from './SafeDatePicker';

export { default as SafeChart } from './SafeChart';
export type { SafeChartProps } from './SafeChart';

export { default as SafeDynamicContent } from './SafeDynamicContent';
export type { SafeDynamicContentProps } from './SafeDynamicContent';

// Alias convenientes (usando la exportación correcta)
import SafeSelectDefault from './SafeSelect';
import SafeHydrationDefault from './SafeHydration';
export { SafeSelectDefault as Select };
export { SafeHydrationDefault as ClientOnly };
