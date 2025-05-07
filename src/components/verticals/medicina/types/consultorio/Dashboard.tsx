/**
 * frontend/src/components/verticals/medicina/types/consultorio/Dashboard.tsx
 * Dashboard específico para el tipo de vertical "Consultorio Médico".
 * Personaliza la experiencia para consultorios pequeños/medianos con funciones específicas.
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useVerticalContext } from '@/contexts/VerticalContext';
import { Card } from '@/components/ui/Card';

export default function ConsultorioDashboard() {
  const { verticalCode, typeCode, typeName } = useVerticalContext();
  const [stats, setStats] = useState({
    pendingAppointments: 12,
    todayAppointments: 5,
    activePatients: 124,
    pendingPayments: 3
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard de Consultorio Médico</h1>
        <span className="text-sm bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-full">
          {typeName || 'Consultorio Médico'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Citas Pendientes</p>
          <p className="text-2xl font-semibold">{stats.pendingAppointments}</p>
        </Card>
        
        <Card className="p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Citas para Hoy</p>
          <p className="text-2xl font-semibold">{stats.todayAppointments}</p>
        </Card>
        
        <Card className="p-4 shadow-sm border-l-4 border-amber-500">
          <p className="text-sm text-gray-500">Pacientes Activos</p>
          <p className="text-2xl font-semibold">{stats.activePatients}</p>
        </Card>
        
        <Card className="p-4 shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Pagos Pendientes</p>
          <p className="text-2xl font-semibold">{stats.pendingPayments}</p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Próximas Citas</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <p className="font-medium">Juan Pérez</p>
                <p className="text-sm text-gray-500">Consulta General</p>
              </div>
              <div className="text-right">
                <p className="font-medium">10:30 AM</p>
                <p className="text-sm text-gray-500">Hoy</p>
              </div>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <p className="font-medium">María González</p>
                <p className="text-sm text-gray-500">Seguimiento</p>
              </div>
              <div className="text-right">
                <p className="font-medium">11:15 AM</p>
                <p className="text-sm text-gray-500">Hoy</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Roberto Sánchez</p>
                <p className="text-sm text-gray-500">Primera Consulta</p>
              </div>
              <div className="text-right">
                <p className="font-medium">09:00 AM</p>
                <p className="text-sm text-gray-500">Mañana</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recordatorios</h2>
          <div className="space-y-3">
            <div className="flex gap-3 items-start pb-2 border-b">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-100 dark:bg-amber-800/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887.517 3.647 1.416 5.162a.75.75 0 0 1-.574 1.209h-.937a1.25 1.25 0 0 0 0 2.5h12.19a1.25 1.25 0 0 0 0-2.5h-.938a.75.75 0 0 1-.574-1.209A9.97 9.97 0 0 0 16 8a6 6 0 0 0-6-6zm0 14.25a3.75 3.75 0 0 1-3.733-3.375h7.466A3.75 3.75 0 0 1 10 16.25z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Renovar licencia médica</p>
                <p className="text-sm text-gray-500">Vence en 14 días</p>
              </div>
            </div>
            <div className="flex gap-3 items-start pb-2 border-b">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 2a.75.75 0 0 1 .75.75v5.59l1.95-2.1a.75.75 0 1 1 1.1 1.02l-3.25 3.5a.75.75 0 0 1-1.1 0L6.2 7.26a.75.75 0 1 1 1.1-1.02l1.95 2.1V2.75A.75.75 0 0 1 10 2z" />
                  <path d="M5.273 4.5a1.25 1.25 0 0 0-1.205.918l-1.523 5.52c-.006.02-.01.041-.015.062H6a1 1 0 0 1 .894.553l.448.894a1 1 0 0 0 .894.553h3.438a1 1 0 0 0 .86-.49l.606-1.02A1 1 0 0 1 14 11h3.47a1.318 1.318 0 0 0-.015-.062l-1.523-5.52a1.25 1.25 0 0 0-1.205-.918h-.977a.75.75 0 0 1 0-1.5h.977a2.75 2.75 0 0 1 2.651 2.019l1.523 5.52c.066.239.099.485.099.732V15a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3.73c0-.246.033-.492.099-.731l1.523-5.52A2.75 2.75 0 0 1 5.273 3h.977a.75.75 0 0 1 0 1.5h-.977z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Actualizar historial de 3 pacientes</p>
                <p className="text-sm text-gray-500">Pendiente desde ayer</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Pedir insumos médicos</p>
                <p className="text-sm text-gray-500">Stock bajo de vendas y alcohol</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="p-4 border rounded-md bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/50 text-primary-800 dark:text-primary-200">
        <h2 className="text-lg font-semibold mb-2">Características específicas para consultorios</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Agenda simplificada con un solo médico o profesional</li>
          <li>Gestión de expedientes básicos para pacientes</li>
          <li>Recordatorios automáticos para pacientes</li>
          <li>Facturación simple para consultas y tratamientos</li>
          <li>Panel personalizado para consultorios pequeños/medianos</li>
        </ul>
      </div>
    </div>
  );
}