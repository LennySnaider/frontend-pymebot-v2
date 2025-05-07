'use client';

import { Tabs } from './Tabs';
import { TabList } from './TabList';
import { TabNav } from './TabNav';
import { TabContent } from './TabContent';

// Componentes adicionales necesarios
const TabsTrigger = TabNav;
const TabsContent = TabContent;
const TabsList = TabList;

// Exportar todo junto
export {
  Tabs,
  TabsTrigger,
  TabsContent,
  TabsList
};

// Exportación por defecto para compatibilidad
export default Tabs;