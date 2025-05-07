/**
 * frontend/src/components/verticals/bienes_raices/index.ts
 * Archivo de exportación para todos los componentes de la vertical Bienes Raíces.
 * Centraliza las importaciones para facilitar el registro de componentes.
 * @version 1.0.0
 * @updated 2025-04-29
 */

// Importar componentes
import Dashboard from './dashboard/Dashboard';
import PropertyCard from './features/PropertyCard';
import PropertiesList from './features/PropertiesList';
import ClientsManager from './features/ClientsManager';
import AppointmentScheduler from './features/AppointmentScheduler';

// Exportar todos los componentes
export {
  Dashboard,
  PropertyCard,
  PropertiesList,
  ClientsManager,
  AppointmentScheduler
};

// Exportar información de la vertical para registro
export const bienesRaicesVerticalInfo = {
  id: 'bienes_raices',
  name: 'Bienes Raíces',
  code: 'bienes_raices',
  description: 'Gestión completa para agencias inmobiliarias y agentes independientes',
  icon: 'building',
  enabled: true,
  category: 'real-estate',
  order: 1,
  features: ['properties', 'clients', 'appointments', 'leads', 'documents', 'marketing'],
  colors: {
    primary: '#00796B',
    secondary: '#26A69A',
    accent: '#B2DFDB',
  },
};