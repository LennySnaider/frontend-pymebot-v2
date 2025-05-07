/**
 * Definición de tipos soportados para la vertical de medicina
 */
export const medicinaTipos: VerticalType[] = [
  {
    id: 'consultorio',
    code: 'consultorio',
    name: 'Consultorio Médico',
    description: 'Para consultorios privados y pequeñas clínicas',
    icon: 'stethoscope',
    enabled: true,
    features: [
      'appointments_basic',
      'patients_management',
      'medical_records_basic',
      'billing_simple'
    ],
    settings: {
      maxAppointmentsPerDay: 30,
      maxDoctors: 3,
      maxRooms: 2
    },
    // Componentes personalizados para este tipo
    overrideComponents: {
      Dashboard: ConsultorioDashboard
    }
  },
  {
    id: 'hospital',
    code: 'hospital',
    name: 'Hospital',
    description: 'Para hospitales y grandes centros médicos',
    icon: 'hospital',
    enabled: true,
    features: [
      'appointments_advanced',
      'patients_management',
      'medical_records_advanced',
      'billing_complex',
      'pharmacy',
      'laboratory',
      'rooms_management',
      'multiple_departments'
    ],
    settings: {
      maxAppointmentsPerDay: 500,
      maxDoctors: 100,
      maxRooms: 200,
      departments: [
        'emergencias',
        'cardiología',
        'traumatología',
        'pediatría'
      ]
    },
    // Componentes personalizados para este tipo
    overrideComponents: {
      Dashboard: HospitalDashboard
    }
  },
  {
    id: 'especialista',
    code: 'especialista',
    name: 'Especialista',
    description: 'Para médicos especialistas con práctica específica',
    icon: 'user-md',
    enabled: true,
    features: [
      'appointments_basic',
      'patients_management',
      'medical_records_specialty',
      'billing_simple'
    ],
    settings: {
      maxAppointmentsPerDay: 20,
      maxDoctors: 1,
      maxRooms: 1
    }
    // Sin componentes personalizados, usará los genéricos
  }
];/**
 * frontend/src/components/verticals/medicina/initializer/register.ts
 * Inicializador para la vertical de Medicina.
 * Registra los componentes específicos de medicina en el sistema.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { VerticalModule, VerticalType } from '@/lib/core/verticalRegistry';
import verticalInitService from '@/services/core/verticalInitService';

// Importar componentes específicos de la vertical
import Dashboard from '../dashboard/Dashboard';
import PatientCard from '../features/PatientCard';
import AppointmentScheduler from '../features/AppointmentScheduler';
import MedicalRecords from '../features/MedicalRecords';
import MedicalAttachments from '../features/MedicalAttachments';

// Importar dashboards específicos para cada tipo
import ConsultorioDashboard from '../types/consultorio/Dashboard';
import HospitalDashboard from '../types/hospital/Dashboard';

// Información de la vertical (puede estar en un archivo de configuración separado)
export const medicinaVerticalInfo = {
  id: 'medicina',
  name: 'Medicina',
  code: 'medicina',
  description: 'Gestión completa para consultorios médicos y profesionales de la salud',
  icon: 'stethoscope',
  enabled: true,
  category: 'health',
  order: 1,
  features: ['patients', 'appointments', 'medical_records', 'medical_attachments', 'prescriptions', 'billing', 'lab_results'],
  colors: {
    primary: '#1976D2',
    secondary: '#42A5F5',
    accent: '#BBDEFB',
  },
};

/**
 * Función asíncrona de inicialización que registra todos los componentes
 * y retorna el objeto de módulo de vertical completo.
 */
async function initializeMedicinaVertical(): Promise<VerticalModule> {
  // En un escenario real, podrías cargar datos adicionales aquí
  // como configuraciones específicas desde el backend
  
  // Crear objeto de vertical con componentes
  const verticalModule: VerticalModule = {
    ...medicinaVerticalInfo,
    // Incluir los tipos soportados
    types: medicinaTipos,
    // Establecer tipo por defecto
    defaultType: 'consultorio',
    components: {
      // Registrar todos los componentes disponibles
      Dashboard,
      PatientCard,
      AppointmentScheduler,
      MedicalRecords,
      MedicalAttachments,
      // Puedes añadir más componentes según sean implementados
    }
  };
  
  return verticalModule;
}

// Registrar el inicializador en el servicio de inicialización
verticalInitService.registerInitializer('medicina', initializeMedicinaVertical);

export default initializeMedicinaVertical;