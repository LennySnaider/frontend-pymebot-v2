/**
 * frontend/src/components/verticals/salon/dashboard/Dashboard.tsx
 * Componente de dashboard para la vertical de Salón de Belleza.
 * Muestra estadísticas y widgets relevantes para gestión de salones.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { salonVerticalInfo } from '../index';

/**
 * Props para el componente Dashboard
 */
interface DashboardProps {
  /** Datos opcionales a mostrar en el dashboard */
  data?: {
    appointments?: number;
    clients?: number;
    services?: number;
    revenue?: number;
  };
}

/**
 * Dashboard principal para la vertical de Salón
 */
export default function Dashboard({ data }: DashboardProps) {
  // Estado para almacenar datos del dashboard
  const [stats, setStats] = useState({
    appointments: data?.appointments || 0,
    clients: data?.clients || 0,
    services: data?.services || 0,
    revenue: data?.revenue || 0,
  });

  // Estado para controlar la carga
  const [loading, setLoading] = useState<boolean>(!data);

  // Efecto para cargar datos si no se proporcionaron
  useEffect(() => {
    // Si ya tenemos datos, no cargar
    if (data) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Simular carga de datos desde API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Datos de ejemplo
        setStats({
          appointments: 24,
          clients: 187,
          services: 8,
          revenue: 1250.75,
        });
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [data]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </span>
          Dashboard de {salonVerticalInfo.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Resumen de actividad y métricas clave para tu negocio
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta de Citas */}
        <StatCard
          title="Citas"
          value={stats.appointments}
          suffix="hoy"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          loading={loading}
          color={salonVerticalInfo.colors?.primary || '#D81B60'}
        />

        {/* Tarjeta de Clientes */}
        <StatCard
          title="Clientes"
          value={stats.clients}
          suffix="totales"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          loading={loading}
          color={salonVerticalInfo.colors?.secondary || '#F06292'}
        />

        {/* Tarjeta de Servicios */}
        <StatCard
          title="Servicios"
          value={stats.services}
          suffix="activos"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          loading={loading}
          color={salonVerticalInfo.colors?.accent || '#FF94C2'}
        />

        {/* Tarjeta de Ingresos */}
        <StatCard
          title="Ingresos"
          value={stats.revenue}
          prefix="$"
          suffix="hoy"
          isMonetary={true}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color="#4CAF50"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Próximas acciones
        </h2>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-gray-600 dark:text-gray-300">
            Esta es una versión de demostración del dashboard para la vertical de Salón de Belleza.
            En una implementación completa, aquí se mostrarían widgets adicionales como:
          </p>
          <ul className="list-disc list-inside mt-2 text-gray-600 dark:text-gray-300">
            <li>Próximas citas del día</li>
            <li>Servicios más populares</li>
            <li>Gráfico de ingresos por período</li>
            <li>Clientes recientes</li>
            <li>Notificaciones del sistema</li>
          </ul>
        </div>
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
}: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  color?: string;
  isMonetary?: boolean;
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {prefix}{formattedValue} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{suffix}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// Exportar el componente
export { Dashboard };