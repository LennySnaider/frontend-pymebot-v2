/**
 * frontend/src/app/(protected-pages)/vertical-medicina/page.tsx
 * Página principal para la vertical de medicina.
 * Muestra un dashboard con resumen de pacientes, citas y actividad reciente.
 * @version 2.0.0
 * @updated 2025-04-30
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/cards';
import Tabs from '@/components/ui/tabs';
import { useVerticalContext } from '@/contexts/VerticalContext';
import VerticalTypeSelector from '@/components/core/vertical/VerticalTypeSelector';
import { useVerticalModule } from '@/hooks/core/useVerticalModule';

export default function MedicinaPage() {
  const [loading, setLoading] = useState(true);
  const { verticalCode, typeCode, typeName } = useVerticalContext();
  
  // Cargar el dashboard específico del tipo de vertical o el genérico si no hay tipo
  const {
    Component: DashboardComponent,
    loading: loadingComponent,
    error: loadingError
  } = useVerticalModule(
    'medicina',
    'Dashboard',
    { typeCode: typeCode }
  );
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingAppointments: 0,
    recentPatients: []
  });

  // Mostrar un mensaje cuando cambia el tipo de vertical
  const [showTypeChangeMessage, setShowTypeChangeMessage] = useState(false);
  const [lastTypeCode, setLastTypeCode] = useState<string | undefined>(typeCode);
  
  useEffect(() => {
    if (typeCode !== lastTypeCode && lastTypeCode !== undefined) {
      setShowTypeChangeMessage(true);
      // Ocultar mensaje después de 3 segundos
      const timer = setTimeout(() => {
        setShowTypeChangeMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    setLastTypeCode(typeCode);
  }, [typeCode, lastTypeCode]);

  useEffect(() => {
    // Simulación de carga de datos
    const timer = setTimeout(() => {
      setStats({
        totalPatients: 156,
        appointmentsToday: 8,
        pendingAppointments: 12,
        recentPatients: [
          { id: '1', name: 'Carlos Rodríguez', date: new Date() },
          { id: '2', name: 'María González', date: new Date(Date.now() - 86400000) },
          { id: '3', name: 'Juan Pérez', date: new Date(Date.now() - 172800000) },
        ]
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading && loadingComponent) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Médico</h1>
        
        {/* Selector de tipo de vertical */}
        <VerticalTypeSelector verticalCode="medicina" compact />
      </div>
      
      {/* Mensaje de cambio de tipo */}
      {showTypeChangeMessage && (
        <div className="mb-4 p-3 rounded-md bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300 animate-fade-in-out">
          Visualizando dashboard para {typeName || `tipo ${typeCode}`}
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-gray-500 mt-1">+3 nuevos esta semana</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appointmentsToday}</div>
            <p className="text-xs text-gray-500 mt-1">2 completadas, 6 pendientes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Pendientes</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-gray-500 mt-1">Próximos 7 días</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <Tabs.TabList className="grid w-full grid-cols-3">
          <Tabs.TabNav value="dashboard">Dashboard</Tabs.TabNav>
          <Tabs.TabNav value="patients">Pacientes</Tabs.TabNav>
          <Tabs.TabNav value="appointments">Citas</Tabs.TabNav>
        </Tabs.TabList>
        <Tabs.TabContent value="dashboard" className="pt-4">
          {loadingError ? (
            <Card className="p-4 bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/50">
              <h3 className="font-medium text-red-800 dark:text-red-300 mb-2">Error al cargar el dashboard</h3>
              <p className="text-sm text-red-700 dark:text-red-400">{loadingError.message}</p>
            </Card>
          ) : DashboardComponent ? (
            <DashboardComponent />
          ) : (
            <Card className="p-4">
              <h3 className="font-medium mb-2">No se encontró un dashboard específico</h3>
              <p className="text-sm text-gray-500">El tipo seleccionado no tiene un dashboard personalizado.</p>
            </Card>
          )}
        </Tabs.TabContent>
        <Tabs.TabContent value="patients" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentPatients.map(patient => (
                  <div key={patient.id} className="flex items-center p-3 border rounded-md">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{patient.name}</h4>
                      <p className="text-xs text-gray-500">Última visita: {patient.date.toLocaleDateString()}</p>
                    </div>
                    <Link 
                      href={`/vertical-medicina/pacientes/${patient.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver
                    </Link>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link 
                  href="/vertical-medicina/pacientes"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Ver todos los pacientes
                </Link>
              </div>
            </CardContent>
          </Card>
        </Tabs.TabContent>
        <Tabs.TabContent value="appointments" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Citas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">No hay citas programadas para las próximas horas.</p>
            </CardContent>
          </Card>
        </Tabs.TabContent>
      </Tabs>
    </div>
  );
}