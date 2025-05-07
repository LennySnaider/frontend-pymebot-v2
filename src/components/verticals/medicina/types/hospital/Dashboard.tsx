/**
 * frontend/src/components/verticals/medicina/types/hospital/Dashboard.tsx
 * Dashboard específico para el tipo de vertical "Hospital".
 * Personaliza la experiencia para hospitales con funciones específicas.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useState } from 'react';
import { useVerticalContext } from '@/contexts/VerticalContext';
import { Card } from '@/components/ui/Card';
import Tabs from '@/components/ui/tabs';

export default function HospitalDashboard() {
  const { verticalCode, typeCode, typeName } = useVerticalContext();
  const [stats, setStats] = useState({
    occupiedBeds: 78,
    totalBeds: 120,
    inPatients: 78,
    outPatients: 34,
    scheduledSurgeries: 7,
    pendingAppointments: 23,
    emergencyWaiting: 5,
    availableDoctors: 12
  });
  
  // Calcular porcentaje de ocupación
  const occupancyRate = Math.round((stats.occupiedBeds / stats.totalBeds) * 100);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard Hospital</h1>
        <span className="text-sm bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-full">
          {typeName || 'Hospital'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Ocupación de camas</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">{stats.occupiedBeds}/{stats.totalBeds}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              occupancyRate > 90 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                : occupancyRate > 75 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {occupancyRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
            <div 
              className={`h-2.5 rounded-full ${
                occupancyRate > 90 
                  ? 'bg-red-500' 
                  : occupancyRate > 75 
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pacientes</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Internados</p>
              <p className="text-xl font-semibold">{stats.inPatients}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Ambulatorios</p>
              <p className="text-xl font-semibold">{stats.outPatients}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Cirugías Programadas</h3>
          <p className="text-2xl font-semibold">{stats.scheduledSurgeries}</p>
          <p className="text-xs text-gray-500 mt-2">Próximas 24 horas</p>
        </Card>
        
        <Card className="p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Emergencias</h3>
          <p className="text-2xl font-semibold">{stats.emergencyWaiting}</p>
          <p className="text-xs text-gray-500 mt-2">Pacientes en espera</p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <Tabs defaultValue="recent">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Actividad del Hospital</h2>
                <Tabs.TabList className="flex space-x-2">
                  <Tabs.TabNav value="recent">Reciente</Tabs.TabNav>
                  <Tabs.TabNav value="department">Por Departamento</Tabs.TabNav>
                </Tabs.TabList>
              </div>
            </div>
            
            <Tabs.TabContent value="recent" className="p-4 space-y-4">
              <div className="space-y-3">
                {[
                  { time: '08:45', dept: 'Emergencias', action: 'Nuevo ingreso', patient: 'Antonio López', severity: 'Crítico' },
                  { time: '08:32', dept: 'Maternidad', action: 'Parto completado', patient: 'Claudia Martínez', severity: 'Normal' },
                  { time: '08:15', dept: 'Traumatología', action: 'Alta médica', patient: 'Roberto Sánchez', severity: 'Leve' },
                  { time: '08:05', dept: 'Cardiología', action: 'Transferencia', patient: 'María González', severity: 'Estable' },
                  { time: '07:50', dept: 'Pediatría', action: 'Evaluación', patient: 'Juan Pérez (niño)', severity: 'Leve' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start pb-3 border-b last:border-0">
                    <div className="flex-shrink-0 w-16 text-sm text-gray-500">{activity.time}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{activity.action}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          activity.severity === 'Crítico' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                            : activity.severity === 'Estable' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {activity.severity}
                        </span>
                      </div>
                      <p className="text-sm">{activity.patient}</p>
                      <p className="text-xs text-gray-500">{activity.dept}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Tabs.TabContent>
            
            <Tabs.TabContent value="department" className="p-4">
              <div className="space-y-4">
                {[
                  { dept: 'Emergencias', patients: 12, staff: 6, status: 'Alta' },
                  { dept: 'Cardiología', patients: 18, staff: 8, status: 'Normal' },
                  { dept: 'Pediatría', patients: 15, staff: 7, status: 'Normal' },
                  { dept: 'Cirugía', patients: 8, staff: 10, status: 'Alta' },
                  { dept: 'Maternidad', patients: 14, staff: 9, status: 'Normal' }
                ].map((dept, index) => (
                  <div key={index} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{dept.dept}</p>
                      <p className="text-sm text-gray-500">{dept.patients} pacientes / {dept.staff} personal</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      dept.status === 'Alta' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {dept.status}
                    </span>
                  </div>
                ))}
              </div>
            </Tabs.TabContent>
          </Tabs>
        </Card>
        
        <Card className="shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Personal Médico</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Disponibles</p>
              <p className="text-2xl font-semibold">{stats.availableDoctors}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-semibold">32</p>
            </div>
          </div>
          
          <h3 className="font-medium text-sm mb-2">Especialidades disponibles</h3>
          <div className="space-y-2">
            {[
              { specialty: 'Cardiología', doctors: 3 },
              { specialty: 'Traumatología', doctors: 2 },
              { specialty: 'Pediatría', doctors: 4 },
              { specialty: 'Neurología', doctors: 1 },
              { specialty: 'Medicina Interna', doctors: 2 }
            ].map((specialty, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm">{specialty.specialty}</span>
                <span className="text-sm font-semibold">{specialty.doctors}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      <div className="p-4 border rounded-md bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/50 text-primary-800 dark:text-primary-200">
        <h2 className="text-lg font-semibold mb-2">Características específicas para hospitales</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Gestión de múltiples departamentos médicos</li>
          <li>Control de camas y habitaciones</li>
          <li>Administración de turnos de personal</li>
          <li>Sistema de emergencias y triaje</li>
          <li>Integración con laboratorio y farmacia interna</li>
          <li>Facturación compleja para aseguradoras</li>
        </ul>
      </div>
    </div>
  );
}