/**
 * frontend/src/components/verticals/salon/index.ts
 * Archivo de exportación para todos los componentes de la vertical Salon.
 * Centraliza las importaciones para facilitar el registro de componentes.
 * @version 1.0.0
 * @updated 2025-04-29
 */

// Importar componentes
import Dashboard from './dashboard/Dashboard';
import AppointmentCard from './features/AppointmentCard';
import Calendar from './features/Calendar';
import ServicesList from './features/ServicesList';

// Exportar todos los componentes
export {
  Dashboard,
  AppointmentCard,
  Calendar,
  ServicesList
};

// Exportar información de la vertical para registro
export const salonVerticalInfo = {
  id: 'salon',
  name: 'Salón de Belleza',
  code: 'salon',
  description: 'Gestión completa para salones de belleza y estética',
  icon: 'scissors',
  enabled: true,
  category: 'beauty',
  order: 1,
  features: ['appointments', 'services', 'clients', 'inventory', 'marketing'],
  colors: {
    primary: '#D81B60',
    secondary: '#F06292',
    accent: '#FF94C2',
  },
};