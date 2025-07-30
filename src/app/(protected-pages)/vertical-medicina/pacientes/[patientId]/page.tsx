/**
 * frontend/src/app/(protected-pages)/vertical-medicina/pacientes/[patientId]/page.tsx
 * Página de detalle de paciente que integra expediente médico y documentos adjuntos.
 * Muestra información del paciente, historial médico y documentos relacionados.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  PatientCard, 
  MedicalRecords, 
  MedicalAttachments 
} from '@/components/verticals/medicina';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-components';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/cards';
import { Badge } from '@/components/ui/Badge';

// Tipos para los datos
type PatientStatus = 'active' | 'inactive' | 'pending';

interface Patient {
  id: string;
  recordNumber: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  birthDate: Date;
  phone: string;
  email?: string;
  address?: string;
  status: PatientStatus;
  photoUrl?: string;
  bloodType?: string;
  height?: number; // cm
  weight?: number; // kg
  allergies?: string[];
  insurance?: {
    provider: string;
    policyNumber: string;
    expirationDate?: Date;
  };
}

// Componente principal
export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulación de carga de datos del paciente
    const timer = setTimeout(() => {
      try {
        // Datos de ejemplo para desarrollo
        const mockPatient: Patient = {
          id: patientId,
          recordNumber: 'PAC-001',
          name: 'Carlos Rodríguez',
          age: 42,
          gender: 'male',
          birthDate: new Date(1983, 5, 15),
          phone: '555-123-4567',
          email: 'carlos.rodriguez@example.com',
          address: 'Calle Principal 123, Ciudad',
          status: 'active',
          photoUrl: '/api/placeholder/150/150',
          bloodType: 'O+',
          height: 178,
          weight: 75,
          allergies: ['Penicilina', 'Nueces'],
          insurance: {
            provider: 'Seguros Médicos S.A.',
            policyNumber: '987654321',
            expirationDate: new Date(2026, 11, 31)
          }
        };
        
        setPatient(mockPatient);
        setLoading(false);
      } catch (err) {
        console.error('Error cargando datos del paciente:', err);
        setError('No se pudieron cargar los datos del paciente. Por favor, intente nuevamente.');
        setLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [patientId]);

  // Estado del paciente con color
  const renderStatus = (status: PatientStatus) => {
    const statusMap = {
      active: { label: 'Activo', variant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      inactive: { label: 'Inactivo', variant: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      pending: { label: 'Pendiente', variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    };
    
    return (
      <Badge className={`${statusMap[status].variant}`}>
        {statusMap[status].label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">No se encontró el paciente solicitado.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link 
            href="/vertical-medicina/pacientes" 
            className="text-blue-600 hover:text-blue-800 mr-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Expediente: {patient.recordNumber}</h1>
          <div className="ml-3">
            {renderStatus(patient.status)}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Programar Cita
          </Button>
          <Button variant="outline">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Button>
        </div>
      </div>

      {/* Información del paciente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información del Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <PatientCard
              id={patient.id}
              recordNumber={patient.recordNumber}
              name={patient.name}
              age={patient.age}
              gender={patient.gender}
              birthDate={patient.birthDate}
              phone={patient.phone}
              email={patient.email}
              address={patient.address}
              status={patient.status}
              photoUrl={patient.photoUrl}
            />
            
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {patient.bloodType && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Sangre</p>
                    <p className="font-medium">{patient.bloodType}</p>
                  </div>
                )}
                {patient.height && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Estatura</p>
                    <p className="font-medium">{patient.height} cm</p>
                  </div>
                )}
                {patient.weight && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Peso</p>
                    <p className="font-medium">{patient.weight} kg</p>
                  </div>
                )}
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Alergias</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {patient.insurance && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-2">Información de Seguro</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Proveedor</p>
                      <p className="font-medium">{patient.insurance.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Número de Póliza</p>
                      <p className="font-medium">{patient.insurance.policyNumber}</p>
                    </div>
                    {patient.insurance.expirationDate && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Vencimiento</p>
                        <p className="font-medium">{patient.insurance.expirationDate.toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="lg:col-span-2">
          <Tabs defaultValue="expediente" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expediente">Expediente Médico</TabsTrigger>
              <TabsTrigger value="documentos">Documentos Adjuntos</TabsTrigger>
            </TabsList>
            <TabsContent value="expediente" className="pt-4">
              {/* Componente de Expediente Médico integrado */}
              <MedicalRecords
                patientId={patient.id}
                patient={{
                  id: patient.id,
                  recordNumber: patient.recordNumber,
                  name: patient.name,
                  age: patient.age,
                  gender: patient.gender,
                  birthDate: patient.birthDate,
                  phone: patient.phone,
                  email: patient.email,
                  address: patient.address,
                  status: patient.status,
                  photoUrl: patient.photoUrl
                }}
                loadMedicalHistory={async (patientId) => {
                  // Simulación de carga de historial médico
                  return {
                    patientId,
                    allergies: [
                      {
                        substance: 'Penicilina',
                        reaction: 'Urticaria y dificultad respiratoria',
                        severity: 'severe',
                        notes: 'Requirió atención de emergencia en 2021'
                      },
                      {
                        substance: 'Nueces',
                        reaction: 'Inflamación local',
                        severity: 'moderate',
                        notes: 'Principalmente anacardos'
                      }
                    ],
                    chronicConditions: [
                      {
                        condition: 'Hipertensión',
                        diagnosisDate: new Date(2018, 5, 10),
                        status: 'controlled',
                        medications: ['Losartán 50mg'],
                        notes: 'Control mensual'
                      }
                    ],
                    surgeries: [
                      {
                        procedure: 'Apendicectomía',
                        date: new Date(2010, 3, 15),
                        surgeon: 'Dr. Ramírez',
                        hospital: 'Hospital Central',
                        reason: 'Apendicitis aguda',
                        notes: 'Sin complicaciones'
                      }
                    ],
                    familyHistory: [
                      {
                        relationship: 'Padre',
                        condition: 'Diabetes tipo 2',
                        notes: 'Diagnosticado a los 55 años'
                      },
                      {
                        relationship: 'Madre',
                        condition: 'Hipertensión',
                        notes: 'Controlada con medicación'
                      }
                    ],
                    immunizations: [
                      {
                        vaccine: 'COVID-19',
                        date: new Date(2023, 9, 5),
                        dose: 'Refuerzo bivalente',
                        notes: 'Sin reacciones adversas'
                      },
                      {
                        vaccine: 'Influenza',
                        date: new Date(2024, 10, 15),
                        dose: 'Anual',
                        notes: 'Administrada en brazo izquierdo'
                      }
                    ],
                    riskFactors: [
                      {
                        factor: 'Antecedentes familiares de enfermedad cardíaca',
                        details: 'Padre y abuelo paterno'
                      }
                    ],
                    socialHistory: {
                      smoking: {
                        status: 'former',
                        amount: '1 paquete/día',
                        yearsSmoked: 10,
                        quitDate: new Date(2015, 1, 1)
                      },
                      alcohol: {
                        status: 'occasional',
                        frequency: 'Social',
                        amount: '2-3 bebidas/semana'
                      },
                      exercise: 'Caminata 3 veces por semana',
                      occupation: 'Ingeniero'
                    }
                  };
                }}
                loadConsultations={async (patientId) => {
                  // Simulación de carga de consultas
                  return [
                    {
                      id: 'c1',
                      patientId,
                      date: new Date(2025, 3, 15),
                      consultationType: 'followup',
                      reason: 'Control de hipertensión',
                      symptoms: ['Dolor de cabeza ocasional'],
                      diagnosis: ['Hipertensión controlada'],
                      observations: 'Paciente mantiene buen control de presión arterial. Se recomienda continuar con medicación actual.',
                      vitalSigns: {
                        temperature: 36.5,
                        bloodPressureSystolic: 135,
                        bloodPressureDiastolic: 85,
                        heartRate: 72,
                        respiratoryRate: 16,
                        oxygenSaturation: 98,
                        weight: 75,
                        height: 178
                      },
                      prescriptions: [
                        {
                          medication: 'Losartán',
                          dosage: '50mg',
                          frequency: '1 vez al día',
                          duration: '3 meses',
                          instructions: 'Tomar en la mañana con el desayuno'
                        }
                      ],
                      doctorId: '1',
                      doctorName: 'Dr. García'
                    },
                    {
                      id: 'c2',
                      patientId,
                      date: new Date(2025, 1, 20),
                      consultationType: 'checkup',
                      reason: 'Chequeo general anual',
                      symptoms: [],
                      diagnosis: ['Paciente sano', 'Hipertensión controlada'],
                      observations: 'Se realizaron estudios de laboratorio completos. Paciente en buen estado de salud general.',
                      vitalSigns: {
                        temperature: 36.7,
                        bloodPressureSystolic: 130,
                        bloodPressureDiastolic: 80,
                        heartRate: 68,
                        respiratoryRate: 14,
                        oxygenSaturation: 99,
                        weight: 76.5,
                        height: 178
                      },
                      labOrders: [
                        {
                          testName: 'Perfil lipídico',
                          instructions: 'Ayuno de 12 horas',
                          priority: 'routine'
                        },
                        {
                          testName: 'Hemograma completo',
                          instructions: 'No requiere preparación',
                          priority: 'routine'
                        }
                      ],
                      doctorId: '1',
                      doctorName: 'Dr. García'
                    }
                  ];
                }}
                saveConsultation={async (consultation) => {
                  // Simulación de guardado de consulta
                  console.log('Guardando consulta:', consultation);
                  return {
                    ...consultation,
                    id: `temp-${Date.now()}`
                  };
                }}
                currentDoctorId="1"
                currentDoctorName="Dr. García"
              />
            </TabsContent>
            <TabsContent value="documentos" className="pt-4">
              {/* Componente de Documentos Médicos integrado */}
              <MedicalAttachments
                patientId={patient.id}
                currentUserId="1"
                currentUserName="Dr. García"
                // Funciones para cargar y gestionar documentos se simulan dentro del componente
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}