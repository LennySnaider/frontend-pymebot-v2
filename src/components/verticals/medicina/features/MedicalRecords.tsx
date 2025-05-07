/**
 * frontend/src/components/verticals/medicina/features/MedicalRecords.tsx
 * Componente para gestionar historias clínicas y expedientes médicos.
 * Permite visualizar y registrar información médica de pacientes.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { PatientStatus } from './PatientCard';

/**
 * Interfaz para datos de un paciente
 */
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
}

/**
 * Tipos de consulta médica
 */
type ConsultationType = 
  'initial' | 
  'followup' | 
  'emergency' | 
  'procedure' | 
  'checkup' | 
  'vaccination' | 
  'specialist' | 
  'telehealth';

/**
 * Interfaz para signos vitales
 */
interface VitalSigns {
  height?: number; // cm
  weight?: number; // kg
  temperature?: number; // °C
  bloodPressureSystolic?: number; // mmHg
  bloodPressureDiastolic?: number; // mmHg
  heartRate?: number; // bpm
  respiratoryRate?: number; // breaths per minute
  oxygenSaturation?: number; // %
  bloodGlucose?: number; // mg/dL
}

/**
 * Interfaz para una consulta/visita médica
 */
interface MedicalConsultation {
  id: string;
  patientId: string;
  date: Date;
  consultationType: ConsultationType;
  reason: string;
  symptoms: string[];
  diagnosis: string[];
  observations: string;
  vitalSigns?: VitalSigns;
  prescriptions?: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  labOrders?: {
    testName: string;
    instructions: string;
    priority: 'routine' | 'urgent';
  }[];
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  doctorId: string;
  doctorName: string;
}

/**
 * Interfaz para antecedentes médicos
 */
interface MedicalHistory {
  patientId: string;
  allergies: {
    substance: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }[];
  chronicConditions: {
    condition: string;
    diagnosisDate?: Date;
    status: 'active' | 'controlled' | 'in_remission' | 'resolved';
    medications?: string[];
    notes?: string;
  }[];
  surgeries: {
    procedure: string;
    date?: Date;
    surgeon?: string;
    hospital?: string;
    reason?: string;
    notes?: string;
  }[];
  familyHistory: {
    relationship: string;
    condition: string;
    notes?: string;
  }[];
  immunizations: {
    vaccine: string;
    date: Date;
    dose?: string;
    notes?: string;
  }[];
  riskFactors: {
    factor: string;
    details?: string;
  }[];
  socialHistory: {
    smoking?: {
      status: 'never' | 'former' | 'current';
      amount?: string;
      yearsSmoked?: number;
      quitDate?: Date;
    };
    alcohol?: {
      status: 'never' | 'occasional' | 'moderate' | 'heavy';
      frequency?: string;
      amount?: string;
    };
    drugs?: {
      status: 'never' | 'former' | 'current';
      substances?: string[];
      frequency?: string;
    };
    occupation?: string;
    exercise?: string;
    diet?: string;
  };
}

/**
 * Props para el componente MedicalRecords
 */
interface MedicalRecordsProps {
  /** ID del paciente */
  patientId?: string;
  /** Datos del paciente (opcional) */
  patient?: Patient;
  /** Función para cargar datos del paciente */
  loadPatient?: (patientId: string) => Promise<Patient>;
  /** Función para cargar historial de consultas */
  loadConsultations?: (patientId: string) => Promise<MedicalConsultation[]>;
  /** Función para cargar antecedentes médicos */
  loadMedicalHistory?: (patientId: string) => Promise<MedicalHistory>;
  /** Función para guardar una nueva consulta */
  saveConsultation?: (consultation: Omit<MedicalConsultation, 'id'>) => Promise<MedicalConsultation>;
  /** Función para actualizar antecedentes médicos */
  updateMedicalHistory?: (patientId: string, history: Partial<MedicalHistory>) => Promise<MedicalHistory>;
  /** ID del médico actual */
  currentDoctorId?: string;
  /** Nombre del médico actual */
  currentDoctorName?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente principal para gestión de expedientes médicos
 */
export default function MedicalRecords({
  patientId,
  patient: initialPatient,
  loadPatient,
  loadConsultations,
  loadMedicalHistory,
  saveConsultation,
  updateMedicalHistory,
  currentDoctorId = '1',
  currentDoctorName = 'Dr. García',
  className = '',
}: MedicalRecordsProps) {
  // Estado para paciente
  const [patient, setPatient] = useState<Patient | null>(initialPatient || null);
  
  // Estado para consultas médicas
  const [consultations, setConsultations] = useState<MedicalConsultation[]>([]);
  
  // Estado para antecedentes médicos
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null);
  
  // Estado para control de la pestaña activa
  const [activeTab, setActiveTab] = useState<'summary' | 'consultations' | 'history' | 'new_consultation'>('summary');
  
  // Estado para control de carga
  const [loading, setLoading] = useState<boolean>(
    !initialPatient && patientId && !!loadPatient
  );
  
  // Estado para mensajes de error
  const [error, setError] = useState<string | null>(null);
  
  // Estados para formulario de nueva consulta
  const [newConsultation, setNewConsultation] = useState<Partial<MedicalConsultation>>({
    patientId: patientId || '',
    consultationType: 'followup',
    reason: '',
    symptoms: [],
    diagnosis: [],
    observations: '',
    vitalSigns: {},
    prescriptions: [],
    labOrders: [],
    doctorId: currentDoctorId,
    doctorName: currentDoctorName,
  });
  
  // Estado para síntoma que se está editando
  const [currentSymptom, setCurrentSymptom] = useState<string>('');
  
  // Estado para diagnóstico que se está editando
  const [currentDiagnosis, setCurrentDiagnosis] = useState<string>('');
  
  // Estado para medicación que se está editando
  const [currentMedication, setCurrentMedication] = useState<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  
  // Estado para orden de laboratorio que se está editando
  const [currentLabOrder, setCurrentLabOrder] = useState<{
    testName: string;
    instructions: string;
    priority: 'routine' | 'urgent';
  }>({
    testName: '',
    instructions: '',
    priority: 'routine',
  });

  // Cargar datos del paciente
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Cargar datos del paciente si no se proporcionaron
        if (!initialPatient && loadPatient) {
          const patientData = await loadPatient(patientId);
          setPatient(patientData);
        }
        
        // Cargar consultas
        if (loadConsultations) {
          const consultationsData = await loadConsultations(patientId);
          setConsultations(consultationsData);
        }
        
        // Cargar antecedentes médicos
        if (loadMedicalHistory) {
          const historyData = await loadMedicalHistory(patientId);
          setMedicalHistory(historyData);
        }
      } catch (err) {
        console.error('Error cargando datos del paciente:', err);
        setError('No se pudieron cargar los datos del paciente. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId, initialPatient, loadPatient, loadConsultations, loadMedicalHistory]);

  // Actualizar ID de paciente en el formulario cuando cambia
  useEffect(() => {
    if (patientId) {
      setNewConsultation(prev => ({ ...prev, patientId }));
    }
  }, [patientId]);

  // Manejar guardado de consulta
  const handleSaveConsultation = async () => {
    if (!patient) {
      setError('No hay paciente seleccionado');
      return;
    }
    
    try {
      // Agregar fecha actual
      const consultationData = {
        ...newConsultation,
        date: new Date(),
        patientId: patient.id,
      } as Omit<MedicalConsultation, 'id'>;
      
      if (saveConsultation) {
        // Guardar a través de la API
        const savedConsultation = await saveConsultation(consultationData);
        
        // Actualizar lista de consultas
        setConsultations(prev => [savedConsultation, ...prev]);
      } else {
        // Simulación local
        const mockConsultation: MedicalConsultation = {
          id: `temp-${Date.now()}`,
          ...consultationData,
          date: new Date(),
        };
        
        setConsultations(prev => [mockConsultation, ...prev]);
      }
      
      // Reiniciar formulario
      setNewConsultation({
        patientId: patient.id,
        consultationType: 'followup',
        reason: '',
        symptoms: [],
        diagnosis: [],
        observations: '',
        vitalSigns: {},
        prescriptions: [],
        labOrders: [],
        doctorId: currentDoctorId,
        doctorName: currentDoctorName,
      });
      
      setCurrentSymptom('');
      setCurrentDiagnosis('');
      setCurrentMedication({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      });
      setCurrentLabOrder({
        testName: '',
        instructions: '',
        priority: 'routine',
      });
      
      // Cambiar a pestaña de consultas
      setActiveTab('consultations');
      setError(null);
    } catch (err) {
      console.error('Error guardando consulta:', err);
      setError('No se pudo guardar la consulta. Por favor, intente nuevamente.');
    }
  };

  // Agregar síntoma al formulario
  const handleAddSymptom = () => {
    if (!currentSymptom.trim()) return;
    
    setNewConsultation(prev => ({
      ...prev,
      symptoms: [...(prev.symptoms || []), currentSymptom.trim()]
    }));
    
    setCurrentSymptom('');
  };

  // Eliminar síntoma del formulario
  const handleRemoveSymptom = (index: number) => {
    setNewConsultation(prev => ({
      ...prev,
      symptoms: (prev.symptoms || []).filter((_, i) => i !== index)
    }));
  };

  // Agregar diagnóstico al formulario
  const handleAddDiagnosis = () => {
    if (!currentDiagnosis.trim()) return;
    
    setNewConsultation(prev => ({
      ...prev,
      diagnosis: [...(prev.diagnosis || []), currentDiagnosis.trim()]
    }));
    
    setCurrentDiagnosis('');
  };

  // Eliminar diagnóstico del formulario
  const handleRemoveDiagnosis = (index: number) => {
    setNewConsultation(prev => ({
      ...prev,
      diagnosis: (prev.diagnosis || []).filter((_, i) => i !== index)
    }));
  };

  // Agregar prescripción al formulario
  const handleAddPrescription = () => {
    if (!currentMedication.medication.trim()) return;
    
    setNewConsultation(prev => ({
      ...prev,
      prescriptions: [...(prev.prescriptions || []), { ...currentMedication }]
    }));
    
    setCurrentMedication({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    });
  };

  // Eliminar prescripción del formulario
  const handleRemovePrescription = (index: number) => {
    setNewConsultation(prev => ({
      ...prev,
      prescriptions: (prev.prescriptions || []).filter((_, i) => i !== index)
    }));
  };

  // Agregar orden de laboratorio al formulario
  const handleAddLabOrder = () => {
    if (!currentLabOrder.testName.trim()) return;
    
    setNewConsultation(prev => ({
      ...prev,
      labOrders: [...(prev.labOrders || []), { ...currentLabOrder }]
    }));
    
    setCurrentLabOrder({
      testName: '',
      instructions: '',
      priority: 'routine',
    });
  };

  // Eliminar orden de laboratorio del formulario
  const handleRemoveLabOrder = (index: number) => {
    setNewConsultation(prev => ({
      ...prev,
      labOrders: (prev.labOrders || []).filter((_, i) => i !== index)
    }));
  };

  // Función para formatear la fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtener texto para tipo de consulta
  const getConsultationTypeText = (type: ConsultationType) => {
    const typeMap: Record<ConsultationType, string> = {
      initial: 'Primera Consulta',
      followup: 'Seguimiento',
      emergency: 'Emergencia',
      procedure: 'Procedimiento',
      checkup: 'Chequeo General',
      vaccination: 'Vacunación',
      specialist: 'Especialista',
      telehealth: 'Teleconsulta',
    };
    
    return typeMap[type] || type;
  };

  // Renderizar contenido según la pestaña activa
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (!patient) {
      return (
        <div className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Seleccione un paciente para ver su expediente médico
          </p>
        </div>
      );
    }
    
    // Pestaña de resumen
    if (activeTab === 'summary') {
      return (
        <div className="p-4">
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  <img
                    src={patient.photoUrl || '/api/placeholder/100/100'}
                    alt={patient.name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {patient.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Expediente: {patient.recordNumber}
                  </p>
                  <div className="mt-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {patient.age} años • 
                      {patient.gender === 'male' ? ' Masculino' : 
                       patient.gender === 'female' ? ' Femenino' : ' Otro'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                Información de Contacto
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono:</p>
                  <p className="text-gray-900 dark:text-white">{patient.phone}</p>
                </div>
                {patient.email && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email:</p>
                    <p className="text-gray-900 dark:text-white">{patient.email}</p>
                  </div>
                )}
                {patient.address && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dirección:</p>
                    <p className="text-gray-900 dark:text-white">{patient.address}</p>
                  </div>
                )}
              </div>
              
              {/* Resumen de historial médico */}
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                Resumen Médico
              </h4>
              
              {medicalHistory ? (
                <div className="space-y-4">
                  {/* Alergias */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <h5 className="font-medium text-gray-800 dark:text-white mb-2">Alergias</h5>
                    {medicalHistory.allergies.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {medicalHistory.allergies.map((allergy, index) => (
                          <li key={index} className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">{allergy.substance}</span>: {allergy.reaction} 
                            <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs ${
                              allergy.severity === 'severe' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                : allergy.severity === 'moderate'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {allergy.severity === 'severe' 
                                ? 'Severa' 
                                : allergy.severity === 'moderate'
                                  ? 'Moderada'
                                  : 'Leve'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Sin alergias registradas</p>
                    )}
                  </div>
                  
                  {/* Condiciones crónicas */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    <h5 className="font-medium text-gray-800 dark:text-white mb-2">Condiciones Crónicas</h5>
                    {medicalHistory.chronicConditions.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {medicalHistory.chronicConditions.map((condition, index) => (
                          <li key={index} className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">{condition.condition}</span>
                            <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs ${
                              condition.status === 'active' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                : condition.status === 'controlled'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {condition.status === 'active' 
                                ? 'Activa' 
                                : condition.status === 'controlled'
                                  ? 'Controlada'
                                  : condition.status === 'in_remission'
                                    ? 'En remisión'
                                    : 'Resuelta'}
                            </span>
                            {condition.diagnosisDate && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                Dx: {formatDate(condition.diagnosisDate)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">Sin condiciones crónicas registradas</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No hay información de historial médico disponible
                </p>
              )}
              
              {/* Últimas consultas */}
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mt-6 mb-3">
                Últimas Consultas
              </h4>
              
              {consultations.length > 0 ? (
                <div className="space-y-3">
                  {consultations.slice(0, 3).map((consultation) => (
                    <div 
                      key={consultation.id} 
                      className="border border-gray-200 dark:border-gray-700 rounded-md p-3"
                    >
                      <div className="flex justify-between">
                        <h5 className="font-medium text-gray-800 dark:text-white">
                          {getConsultationTypeText(consultation.consultationType)}
                        </h5>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(consultation.date)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        <span className="font-medium">Motivo:</span> {consultation.reason}
                      </p>
                      {consultation.diagnosis.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Diagnóstico:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {consultation.diagnosis.map((diag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs"
                              >
                                {diag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {consultations.length > 3 && (
                    <button
                      onClick={() => setActiveTab('consultations')}
                      className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-2"
                    >
                      Ver todas las consultas ({consultations.length})
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No hay consultas registradas
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Pestaña de historial de consultas
    if (activeTab === 'consultations') {
      return (
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Consultas
          </h3>
          
          {consultations.length > 0 ? (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div 
                  key={consultation.id} 
                  className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {getConsultationTypeText(consultation.consultationType)}
                      </h4>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="mr-2">
                          {formatDate(consultation.date)}
                        </span>
                        <span>
                          {new Date(consultation.date).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {consultation.doctorName}
                    </p>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Motivo de Consulta
                      </h5>
                      <p className="text-gray-900 dark:text-white">
                        {consultation.reason}
                      </p>
                    </div>
                    
                    {consultation.symptoms.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Síntomas
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {consultation.symptoms.map((symptom, index) => (
                            <span 
                              key={index}
                              className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-xs"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {consultation.diagnosis.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Diagnóstico
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {consultation.diagnosis.map((diagnosis, index) => (
                            <span 
                              key={index}
                              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs"
                            >
                              {diagnosis}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {consultation.observations && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observaciones
                        </h5>
                        <p className="text-gray-900 dark:text-white whitespace-pre-line">
                          {consultation.observations}
                        </p>
                      </div>
                    )}
                    
                    {consultation.vitalSigns && Object.keys(consultation.vitalSigns).length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Signos Vitales
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {consultation.vitalSigns.temperature && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Temperatura</p>
                              <p className="text-gray-900 dark:text-white">{consultation.vitalSigns.temperature} °C</p>
                            </div>
                          )}
                          {consultation.vitalSigns.bloodPressureSystolic && consultation.vitalSigns.bloodPressureDiastolic && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Presión Arterial</p>
                              <p className="text-gray-900 dark:text-white">{consultation.vitalSigns.bloodPressureSystolic}/{consultation.vitalSigns.bloodPressureDiastolic} mmHg</p>
                            </div>
                          )}
                          {consultation.vitalSigns.heartRate && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Frecuencia Cardíaca</p>
                              <p className="text-gray-900 dark:text-white">{consultation.vitalSigns.heartRate} bpm</p>
                            </div>
                          )}
                          {consultation.vitalSigns.respiratoryRate && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Frec. Respiratoria</p>
                              <p className="text-gray-900 dark:text-white">{consultation.vitalSigns.respiratoryRate} /min</p>
                            </div>
                          )}
                          {consultation.vitalSigns.oxygenSaturation && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sat. Oxígeno</p>
                              <p className="text-gray-900 dark:text-white">{consultation.vitalSigns.oxygenSaturation}%</p>
                            </div>
                          )}
                          {consultation.vitalSigns.weight && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Peso</p>
                              <p className="text-gray-900 dark:text-white">{consultation.vitalSigns.weight} kg</p>
                            </div>
                          )}
                          {consultation.vitalSigns.height && (
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Estatura</p>
                              <p className="text-gray-900 dark:text-white">{consultation.vitalSigns.height} cm</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Prescripciones
                        </h5>
                        <div className="space-y-2">
                          {consultation.prescriptions.map((prescription, index) => (
                            <div key={index} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                              <h6 className="font-medium text-green-900 dark:text-green-400">
                                {prescription.medication}
                              </h6>
                              <div className="grid grid-cols-2 gap-1 mt-1 text-sm">
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="text-gray-500 dark:text-gray-400">Dosis:</span> {prescription.dosage}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="text-gray-500 dark:text-gray-400">Frecuencia:</span> {prescription.frequency}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="text-gray-500 dark:text-gray-400">Duración:</span> {prescription.duration}
                                </p>
                              </div>
                              {prescription.instructions && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  <span className="text-gray-500 dark:text-gray-400">Instrucciones:</span> {prescription.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {consultation.labOrders && consultation.labOrders.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Órdenes de Laboratorio
                        </h5>
                        <div className="space-y-2">
                          {consultation.labOrders.map((labOrder, index) => (
                            <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                              <div className="flex justify-between">
                                <h6 className="font-medium text-purple-900 dark:text-purple-400">
                                  {labOrder.testName}
                                </h6>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  labOrder.priority === 'urgent'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                  {labOrder.priority === 'urgent' ? 'Urgente' : 'Rutina'}
                                </span>
                              </div>
                              {labOrder.instructions && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  <span className="text-gray-500 dark:text-gray-400">Instrucciones:</span> {labOrder.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No hay consultas registradas para este paciente
              </p>
              <button
                onClick={() => setActiveTab('new_consultation')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
              >
                Registrar Nueva Consulta
              </button>
            </div>
          )}
        </div>
      );
    }
    
    // Pestaña de antecedentes médicos
    if (activeTab === 'history') {
      return (
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Antecedentes Médicos
          </h3>
          
          {medicalHistory ? (
            <div className="space-y-6">
              {/* Alergias */}
              <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Alergias
                  </h4>
                </div>
                
                <div className="p-4">
                  {medicalHistory.allergies.length > 0 ? (
                    <div className="space-y-3">
                      {medicalHistory.allergies.map((allergy, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-3 last:pb-0">
                          <div className="flex justify-between">
                            <h5 className="font-medium text-gray-800 dark:text-white">
                              {allergy.substance}
                            </h5>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              allergy.severity === 'severe' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                : allergy.severity === 'moderate'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {allergy.severity === 'severe' 
                                ? 'Severa' 
                                : allergy.severity === 'moderate'
                                  ? 'Moderada'
                                  : 'Leve'}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">
                            <span className="font-medium">Reacción:</span> {allergy.reaction}
                          </p>
                          {allergy.notes && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                              {allergy.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No se han registrado alergias
                    </p>
                  )}
                </div>
              </div>
              
              {/* Condiciones crónicas */}
              <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Condiciones Crónicas
                  </h4>
                </div>
                
                <div className="p-4">
                  {medicalHistory.chronicConditions.length > 0 ? (
                    <div className="space-y-3">
                      {medicalHistory.chronicConditions.map((condition, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-3 last:pb-0">
                          <div className="flex justify-between">
                            <h5 className="font-medium text-gray-800 dark:text-white">
                              {condition.condition}
                            </h5>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              condition.status === 'active' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                : condition.status === 'controlled'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : condition.status === 'in_remission'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {condition.status === 'active' 
                                ? 'Activa' 
                                : condition.status === 'controlled'
                                  ? 'Controlada'
                                  : condition.status === 'in_remission'
                                    ? 'En remisión'
                                    : 'Resuelta'}
                            </span>
                          </div>
                          {condition.diagnosisDate && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                              <span className="font-medium">Fecha de diagnóstico:</span> {formatDate(condition.diagnosisDate)}
                            </p>
                          )}
                          {condition.medications && condition.medications.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Medicamentos:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {condition.medications.map((med, idx) => (
                                  <span 
                                    key={idx}
                                    className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs"
                                  >
                                    {med}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {condition.notes && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                              {condition.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No se han registrado condiciones crónicas
                    </p>
                  )}
                </div>
              </div>
              
              {/* Cirugías */}
              <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Cirugías y Procedimientos
                  </h4>
                </div>
                
                <div className="p-4">
                  {medicalHistory.surgeries.length > 0 ? (
                    <div className="space-y-3">
                      {medicalHistory.surgeries.map((surgery, index) => (
                        <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-3 last:pb-0">
                          <div className="flex justify-between">
                            <h5 className="font-medium text-gray-800 dark:text-white">
                              {surgery.procedure}
                            </h5>
                            {surgery.date && (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(surgery.date)}
                              </span>
                            )}
                          </div>
                          {surgery.hospital && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                              <span className="font-medium">Hospital:</span> {surgery.hospital}
                            </p>
                          )}
                          {surgery.surgeon && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                              <span className="font-medium">Cirujano:</span> {surgery.surgeon}
                            </p>
                          )}
                          {surgery.reason && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                              <span className="font-medium">Motivo:</span> {surgery.reason}
                            </p>
                          )}
                          {surgery.notes && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                              {surgery.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No se han registrado cirugías o procedimientos
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 shadow rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No hay antecedentes médicos registrados para este paciente
              </p>
            </div>
          )}
        </div>
      );
    }
    
    // Pestaña de nueva consulta
    if (activeTab === 'new_consultation') {
      return (
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Nueva Consulta
          </h3>
          
          <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Paciente: {patient.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Expediente: {patient.recordNumber}
                  </p>
                </div>
                <div className="mt-2 md:mt-0">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Fecha: {formatDate(new Date())}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Formulario de consulta */}
            <div className="p-4">
              <div className="space-y-6">
                {/* Tipo de consulta */}
                <div>
                  <label htmlFor="consultationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Consulta
                  </label>
                  <select
                    id="consultationType"
                    value={newConsultation.consultationType}
                    onChange={(e) => setNewConsultation(prev => ({ ...prev, consultationType: e.target.value as ConsultationType }))}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="initial">Primera Consulta</option>
                    <option value="followup">Seguimiento</option>
                    <option value="emergency">Emergencia</option>
                    <option value="procedure">Procedimiento</option>
                    <option value="checkup">Chequeo General</option>
                    <option value="vaccination">Vacunación</option>
                    <option value="specialist">Especialista</option>
                    <option value="telehealth">Teleconsulta</option>
                  </select>
                </div>
                
                {/* Motivo de consulta */}
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Motivo de Consulta
                  </label>
                  <textarea
                    id="reason"
                    value={newConsultation.reason}
                    onChange={(e) => setNewConsultation(prev => ({ ...prev, reason: e.target.value }))}
                    rows={2}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Describir motivo de la consulta"
                  ></textarea>
                </div>
                
                {/* Síntomas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Síntomas
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={currentSymptom}
                      onChange={(e) => setCurrentSymptom(e.target.value)}
                      className="block w-full rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Agregar síntoma"
                    />
                    <button
                      type="button"
                      onClick={handleAddSymptom}
                      disabled={!currentSymptom.trim()}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Agregar
                    </button>
                  </div>
                  
                  {newConsultation.symptoms && newConsultation.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newConsultation.symptoms.map((symptom, index) => (
                        <div 
                          key={index}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full text-sm flex items-center"
                        >
                          <span>{symptom}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSymptom(index)}
                            className="ml-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Diagnóstico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Diagnóstico
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={currentDiagnosis}
                      onChange={(e) => setCurrentDiagnosis(e.target.value)}
                      className="block w-full rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Agregar diagnóstico"
                    />
                    <button
                      type="button"
                      onClick={handleAddDiagnosis}
                      disabled={!currentDiagnosis.trim()}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Agregar
                    </button>
                  </div>
                  
                  {newConsultation.diagnosis && newConsultation.diagnosis.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newConsultation.diagnosis.map((diagnosis, index) => (
                        <div 
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm flex items-center"
                        >
                          <span>{diagnosis}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDiagnosis(index)}
                            className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Observaciones */}
                <div>
                  <label htmlFor="observations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    id="observations"
                    value={newConsultation.observations}
                    onChange={(e) => setNewConsultation(prev => ({ ...prev, observations: e.target.value }))}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Detalles adicionales sobre la consulta"
                  ></textarea>
                </div>
                
                {/* Signos vitales */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Signos Vitales
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="temperature" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Temperatura (°C)
                      </label>
                      <input
                        type="number"
                        id="temperature"
                        step="0.1"
                        value={newConsultation.vitalSigns?.temperature || ''}
                        onChange={(e) => setNewConsultation(prev => ({
                          ...prev,
                          vitalSigns: {
                            ...prev.vitalSigns,
                            temperature: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }))}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="heartRate" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Frecuencia Cardíaca (bpm)
                      </label>
                      <input
                        type="number"
                        id="heartRate"
                        value={newConsultation.vitalSigns?.heartRate || ''}
                        onChange={(e) => setNewConsultation(prev => ({
                          ...prev,
                          vitalSigns: {
                            ...prev.vitalSigns,
                            heartRate: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="bloodPressureSystolic" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Presión Sistólica (mmHg)
                      </label>
                      <input
                        type="number"
                        id="bloodPressureSystolic"
                        value={newConsultation.vitalSigns?.bloodPressureSystolic || ''}
                        onChange={(e) => setNewConsultation(prev => ({
                          ...prev,
                          vitalSigns: {
                            ...prev.vitalSigns,
                            bloodPressureSystolic: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="bloodPressureDiastolic" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Presión Diastólica (mmHg)
                      </label>
                      <input
                        type="number"
                        id="bloodPressureDiastolic"
                        value={newConsultation.vitalSigns?.bloodPressureDiastolic || ''}
                        onChange={(e) => setNewConsultation(prev => ({
                          ...prev,
                          vitalSigns: {
                            ...prev.vitalSigns,
                            bloodPressureDiastolic: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConsultation}
                    className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Guardar Consulta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`bg-gray-100 dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Encabezado */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Expediente Médico
        </h2>
        
        {patient && (
          <button
            onClick={() => setActiveTab('new_consultation')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Consulta
          </button>
        )}
      </div>
      
      {/* Mensajes de error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Pestañas */}
      {patient && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'summary'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('consultations')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'consultations'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Consultas
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'history'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Antecedentes
            </button>
            {activeTab === 'new_consultation' && (
              <button
                className="px-6 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              >
                Nueva Consulta
              </button>
            )}
          </nav>
        </div>
      )}
      
      {/* Contenido principal */}
      {renderContent()}
    </div>
  );
}