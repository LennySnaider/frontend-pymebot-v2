'use client';

/**
 * Archivo de compatibilidad para Tabs
 * Este archivo proporciona exportaciones consistentes del componente Tabs
 * y sus subcomponentes, resolviendo problemas de sensibilidad a mayúsculas/minúsculas.
 */

import { 
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabList,
  TabNav,
  TabContent,
  type TabsProps,
  type TabListProps,
  type TabNavProps,
  type TabContentProps
} from './tabs-components';

// Exportar todo para mantener compatibilidad con diferentes patrones
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabList,
  TabNav,
  TabContent,
  type TabsProps,
  type TabListProps,
  type TabNavProps,
  type TabContentProps
};

// Exportación por defecto para compatibilidad
export default Tabs;