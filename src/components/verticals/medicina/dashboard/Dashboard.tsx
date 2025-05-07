/**
 * frontend/src/components/verticals/medicina/dashboard/Dashboard.tsx
 * Componente de dashboard para la vertical de Medicina.
 * Muestra estadísticas y widgets relevantes para gestión de consultorios médicos.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { medicinaVerticalInfo } from '../index';

/**
 * Interfaz para métricas de dashboard
 */
interface DashboardMetrics {
  pendingAppointments: number;
  todayAppointments: number;
  totalPatients: number;
  newPatients: number;
  pendingPrescriptions: number;
  pendingLabResults: number;
}

/**
 * Props para el componente Dashboard
 */
interface DashboardProps {
  /** Datos opcionales a mostrar en el dashboard */
  metrics?: Partial<DashboardMetrics>;
}

/**
 * Dashboard principal para la vertical de Medicina
 */
export default function Dashboard({ metrics }: DashboardProps) {
  // Estado para almacenar datos del dashboard
  const [stats, setStats] = useState<DashboardMetrics>({
    pendingAppointments: metrics?.pendingAppointments || 0,
    todayAppointments: metrics?.todayAppointments || 0,
    totalPatients: metrics?.totalPatients || 0,
    newPatients: metrics?.newPatients || 0,
    pendingPrescriptions: metrics?.pendingPrescriptions || 0,
    pendingLabResults: metrics?.pendingLabResults || 0,
  });

  // Estado para controlar la carga
  const [loading, setLoading] = useState<boolean>(!metrics);

  // Efecto para cargar datos si no se proporcionaron
  useEffect(() => {
    // Si ya tenemos datos completos, no cargar
    if (
      metrics?.pendingAppointments !== undefined &&
      metrics?.todayAppointments !== undefined &&
      metrics?.totalPatients !== undefined &&
      metrics?.newPatients !== undefined &&
      metrics?.pendingPrescriptions !== undefined &&
      metrics?.pendingLabResults !== undefined
    ) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Simular carga de datos desde API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Datos de ejemplo
        setStats({
          pendingAppointments: 12,
          todayAppointments: 8,
          totalPatients: 425,
          newPatients: 15,
          pendingPrescriptions: 5,
          pendingLabResults: 7,
        });
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [metrics]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          Dashboard de {medicinaVerticalInfo.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestión de pacientes, citas y registros médicos
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Tarjeta de Citas Pendientes */}
        <StatCard
          title="Citas Pendientes"
          value={stats.pendingAppointments}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          loading={loading}
          color={medicinaVerticalInfo.colors?.primary || '#1976D2'}
          isWarning={stats.pendingAppointments > 10}
        />

        {/* Tarjeta de Citas de Hoy */}
        <StatCard
          title="Citas de Hoy"
          value={stats.todayAppointments}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color={medicinaVerticalInfo.colors?.secondary || '#42A5F5'}
        />

        {/* Tarjeta de Pacientes Totales */}
        <StatCard
          title="Pacientes Totales"
          value={stats.totalPatients}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          loading={loading}
          color="#3949AB"
        />

        {/* Tarjeta de Pacientes Nuevos */}
        <StatCard
          title="Pacientes Nuevos"
          value={stats.newPatients}
          suffix="este mes"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
          loading={loading}
          color="#43A047"
        />

        {/* Tarjeta de Recetas Pendientes */}
        <StatCard
          title="Recetas Pendientes"
          value={stats.pendingPrescriptions}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          loading={loading}
          color="#FF9800"
          isWarning={stats.pendingPrescriptions > 0}
        />

        {/* Tarjeta de Resultados de Laboratorio Pendientes */}
        <StatCard
          title="Resultados Pendientes"
          value={stats.pendingLabResults}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
          loading={loading}
          color="#E53935"
          isWarning={stats.pendingLabResults > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Próximas Citas */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: '#1976D2' }}>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
            Próximas Citas
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <AppointmentItem
                patient="María López"
                appointmentType="Consulta General"
                date={new Date(2025, 4, 30, 10, 0)}
                status="confirmada"
              />
              <AppointmentItem
                patient="Carlos Rodríguez"
                appointmentType="Seguimiento"
                date={new Date(2025, 4, 30, 11, 30)}
                status="confirmada"
              />
              <AppointmentItem
                patient="Ana García"
                appointmentType="Primera Consulta"
                date={new Date(2025, 4, 30, 12, 0)}
                status="pendiente"
              />
            </div>
          )}
        </div>
        
        {/* Pacientes Recientes */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: '#43A047' }}>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
            Pacientes Recientes
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <PatientItem
                name="Roberto Sánchez"
                age={45}
                lastVisit={new Date(2025, 4, 28)}
                condition="Hipertensión"
              />
              <PatientItem
                name="Laura Martínez"
                age={32}
                lastVisit={new Date(2025, 4, 27)}
                condition="Control Prenatal"
              />
              <PatientItem
                name="Miguel Fernández"
                age={58}
                lastVisit={new Date(2025, 4, 25)}
                condition="Diabetes Tipo 2"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
          Próximas funcionalidades
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Esta es una versión de demostración del dashboard para la vertical de Medicina.
          En una implementación completa, se incluirán:
        </p>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
          <li>Historial médico electrónico completo</li>
          <li>Sistema de prescripción digital</li>
          <li>Gestión de resultados de laboratorio</li>
          <li>Recordatorios automáticos para pacientes</li>
          <li>Integración con sistemas de seguros médicos</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Componente de tarjeta para estadísticas
 */
function StatCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon,
  loading = false,
  color = '#3B82F6',
  isMonetary = false,
  isWarning = false,
}: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  color?: string;
  isMonetary?: boolean;
  isWarning?: boolean;
}) {
  // Formatear valor si es monetario
  const formattedValue = isMonetary
    ? value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value.toLocaleString();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {icon && (
          <div className="rounded-full p-2" style={{ backgroundColor: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
        )}
      </div>
      
      <div className="mt-2">
        {loading ? (
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ) : (
          <p className={`text-2xl font-bold ${isWarning && value > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-gray-900 dark:text-white'}`}>
            {prefix}{formattedValue}{suffix && <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{suffix}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Componente para mostrar una cita en lista
 */
function AppointmentItem({
  patient,
  appointmentType,
  date,
  status,
}: {
  patient: string;
  appointmentType: string;
  date: Date;
  status: 'confirmada' | 'pendiente' | 'cancelada';
}) {
  // Formatear fecha y hora
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Estilos según estado
  const statusStyles = {
    confirmada: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    cancelada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="flex items-center p-2 border-b border-gray-100 dark:border-gray-800">
      <div className="flex-shrink-0 mr-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300">
          {patient.charAt(0)}
        </div>
      </div>
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900 dark:text-white">{patient}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{appointmentType}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="font-medium text-gray-900 dark:text-white">
          {formattedTime}
        </p>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${statusStyles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </div>
  );
}

/**
 * Componente para mostrar un paciente en lista
 */
function PatientItem({
  name,
  age,
  lastVisit,
  condition,
}: {
  name: string;
  age: number;
  lastVisit: Date;
  condition: string;
}) {
  // Formatear fecha
  const formattedDate = lastVisit.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  return (
    <div className="flex items-center p-2 border-b border-gray-100 dark:border-gray-800">
      <div className="flex-shrink-0 mr-3">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500 dark:text-green-300">
          {name.charAt(0)}
        </div>
      </div>
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{condition}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="font-medium text-gray-900 dark:text-white">
          {age} años
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Última visita: {formattedDate}
        </p>
      </div>
    </div>
  );
}

// Exportar el componente
export { Dashboard };