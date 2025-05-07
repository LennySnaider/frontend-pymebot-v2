/**
 * frontend/src/components/verticals/seguros/index.ts
 * Archivo de exportación para todos los componentes de la vertical Seguros.
 * Centraliza las importaciones para facilitar el registro de componentes.
 * @version 1.0.0
 * @updated 2025-04-29
 */

// Importar componentes
import Dashboard from './dashboard/Dashboard';
import PolicyCard from './features/PolicyCard';
import ClientsList from './features/ClientsList';
import ClaimsManager from './features/ClaimsManager';
import InsuranceQuotes from './features/InsuranceQuotes';

// Exportar todos los componentes
export {
  Dashboard,
  PolicyCard,
  ClientsList,
  ClaimsManager,
  InsuranceQuotes
};

// Exportar información de la vertical para registro
export const segurosVerticalInfo = {
  id: 'seguros',
  name: 'Seguros',
  code: 'seguros',
  description: 'Gestión completa para agencias y corredores de seguros',
  icon: 'shield-check',
  enabled: true,
  category: 'finance',
  order: 1,
  features: ['policies', 'clients', 'claims', 'quotes', 'renewals', 'reports'],
  colors: {
    primary: '#1565C0',
    secondary: '#42A5F5',
    accent: '#BBDEFB',
  },
};