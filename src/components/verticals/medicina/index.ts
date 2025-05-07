/**
 * frontend/src/components/verticals/medicina/index.ts
 * Archivo de exportación para todos los componentes de la vertical Medicina.
 * Centraliza las importaciones para facilitar el registro de componentes.
 * @version 1.0.0
 * @updated 2025-04-30
 */

// Importar componentes
import Dashboard from './dashboard/Dashboard';
import PatientCard from './features/PatientCard';
import AppointmentScheduler from './features/AppointmentScheduler';
import MedicalRecords from './features/MedicalRecords';
import MedicalAttachments from './features/MedicalAttachments';
import MedicalFormBuilder from './features/MedicalFormBuilder';

// Exportar todos los componentes
export {
  Dashboard,
  PatientCard,
  AppointmentScheduler,
  MedicalRecords,
  MedicalAttachments,
  MedicalFormBuilder
};

// Exportar información de la vertical para registro
export const medicinaVerticalInfo = {
  id: 'medicina',
  name: 'Medicina',
  code: 'medicina',
  description: 'Gestión completa para consultorios médicos y profesionales de la salud',
  icon: 'stethoscope',
  enabled: true,
  category: 'health',
  order: 1,
  features: ['patients', 'appointments', 'medical_records', 'medical_attachments', 'prescriptions', 'billing', 'lab_results', 'form_builder'],
  colors: {
    primary: '#1976D2',
    secondary: '#42A5F5',
    accent: '#BBDEFB',
  },
};