/**
 * frontend/src/components/verticals/seguros/dashboard/Dashboard.tsx
 * Componente de dashboard para la vertical de Seguros.
 * Muestra estadísticas y widgets relevantes para gestión de corredores de seguros.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { segurosVerticalInfo } from '../index';

/**
 * Interfaz para métricas de dashboard
 */
interface DashboardMetrics {
  activePolicies: number;
  pendingRenewals: number;
  openClaims: number;
  monthlySales: number;
  pendingPayments: number;
  clientRetention: number;
}

/**
 * Props para el componente Dashboard
 */
interface DashboardProps {
  /** Datos opcionales a mostrar en el dashboard */
  metrics?: Partial<DashboardMetrics>;
}

/**
 * Dashboard principal para la vertical de Seguros
 */
export default function Dashboard({ metrics }: DashboardProps) {
  // Estado para almacenar datos del dashboard
  const [stats, setStats] = useState<DashboardMetrics>({
    activePolicies: metrics?.activePolicies || 0,
    pendingRenewals: metrics?.pendingRenewals || 0,
    openClaims: metrics?.openClaims || 0,
    monthlySales: metrics?.monthlySales || 0,
    pendingPayments: metrics?.pendingPayments || 0,
    clientRetention: metrics?.clientRetention || 0,
  });

  // Estado para controlar la carga
  const [loading, setLoading] = useState<boolean>(!metrics);

  // Efecto para cargar datos si no se proporcionaron
  useEffect(() => {
    // Si ya tenemos datos completos, no cargar
    if (
      metrics?.activePolicies !== undefined &&
      metrics?.pendingRenewals !== undefined &&
      metrics?.openClaims !== undefined &&
      metrics?.monthlySales !== undefined &&
      metrics?.pendingPayments !== undefined &&
      metrics?.clientRetention !== undefined
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
          activePolicies: 156,
          pendingRenewals: 12,
          openClaims: 8,
          monthlySales: 5275.50,
          pendingPayments: 4350.75,
          clientRetention: 92,
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
          Dashboard de {segurosVerticalInfo.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestión de pólizas, reclamaciones y renovaciones para tu correduría
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Tarjeta de Pólizas Activas */}
        <StatCard
          title="Pólizas Activas"
          value={stats.activePolicies}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          loading={loading}
          color={segurosVerticalInfo.colors?.primary || '#1565C0'}
        />

        {/* Tarjeta de Renovaciones Pendientes */}
        <StatCard
          title="Renovaciones Pendientes"
          value={stats.pendingRenewals}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color="#FF9800"
          isWarning={true}
        />

        {/* Tarjeta de Reclamaciones Abiertas */}
        <StatCard
          title="Reclamaciones Abiertas"
          value={stats.openClaims}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color="#F44336"
          isWarning={true}
        />

        {/* Tarjeta de Ventas Mensuales */}
        <StatCard
          title="Ventas Mensuales"
          value={stats.monthlySales}
          prefix="€"
          isMonetary={true}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color="#4CAF50"
        />

        {/* Tarjeta de Pagos Pendientes */}
        <StatCard
          title="Pagos Pendientes"
          value={stats.pendingPayments}
          prefix="€"
          isMonetary={true}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color="#FF9800"
          isWarning={true}
        />

        {/* Tarjeta de Retención de Clientes */}
        <StatCard
          title="Retención de Clientes"
          value={stats.clientRetention}
          suffix="%"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          loading={loading}
          color="#03A9F4"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Próximas Renovaciones */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: '#FF9800' }}>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
            Próximas Renovaciones
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Auto - Juan Pérez</span>
                <span className="text-orange-600 dark:text-orange-400 font-medium">7 días</span>
              </div>
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Hogar - María López</span>
                <span className="text-orange-600 dark:text-orange-400 font-medium">12 días</span>
              </div>
              <div className="p-2 flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Vida - Carlos Ruiz</span>
                <span className="text-orange-600 dark:text-orange-400 font-medium">15 días</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Reclamaciones Recientes */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: '#F44336' }}>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
            Reclamaciones Recientes
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Accidente Auto - Ana García</span>
                <span className="text-red-600 dark:text-red-400 font-medium">Nuevo</span>
              </div>
              <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Daños Hogar - Luis Martínez</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">En proceso</span>
              </div>
              <div className="p-2 flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Robo - Elena Sánchez</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">En proceso</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
          Próximas funcionalidades
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Esta es una versión de demostración del dashboard para la vertical de Seguros.
          En una implementación completa, se incluirán:
        </p>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
          <li>Gráficos de rendimiento por tipo de seguro</li>
          <li>Gestión completa de pólizas y documentos</li>
          <li>Sistema de recordatorios automáticos</li>
          <li>Integración con plataformas de aseguradoras</li>
          <li>Generación de informes personalizados</li>
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
            {prefix}{formattedValue}{suffix}
          </p>
        )}
      </div>
    </div>
  );
}
