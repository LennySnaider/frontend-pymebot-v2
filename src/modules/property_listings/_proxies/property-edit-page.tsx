/**
 * ARCHIVO PROXY - Ejemplo para properties/property-edit/page.tsx
 * 
 * Este archivo es un ejemplo de cómo debería verse el archivo page.tsx
 * después de la migración. El archivo real debe permanecer en su ubicación
 * original e importar el componente desde la nueva estructura de módulos.
 */

import { PropertyEditView } from '@/modules/property_listings/views/edit';

export default function Page() {
  return <PropertyEditView />;
}
