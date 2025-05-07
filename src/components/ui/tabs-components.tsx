'use client';

/**
 * Archivo de compatibilidad para Tabs
 * Este archivo proporciona exportaciones consistentes del componente Tabs
 * y sus subcomponentes, resolviendo problemas de sensibilidad a mayúsculas/minúsculas.
 */

import TabsComponent from './tabs/Tabs';
import TabList from './tabs/TabList';
import TabNav from './tabs/TabNav';
import TabContent from './tabs/TabContent';
import type { TabsProps } from './tabs/Tabs';
import type { TabListProps } from './tabs/TabList';
import type { TabNavProps } from './tabs/TabNav';
import type { TabContentProps } from './tabs/TabContent';

// Exportar con los nombres de la API shadow
export const Tabs = TabsComponent;
export const TabsList = TabList;
export const TabsTrigger = TabNav;
export const TabsContent = TabContent;

// Exportar también con nombres originales para compatibilidad
export {
  TabList,
  TabNav,
  TabContent
};

// Exportar tipos
export type {
  TabsProps,
  TabListProps,
  TabNavProps,
  TabContentProps
};

// Configuración como componente compuesto
Tabs.TabList = TabList;
Tabs.TabNav = TabNav;
Tabs.TabContent = TabContent;

// También configurar componentes con nombres alternativos
Tabs.TabsList = TabList;
Tabs.TabsTrigger = TabNav;
Tabs.TabsContent = TabContent;

export default Tabs;