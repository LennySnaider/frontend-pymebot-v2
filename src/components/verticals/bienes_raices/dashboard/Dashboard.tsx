/**
 * frontend/src/components/verticals/bienes_raices/dashboard/Dashboard.tsx
 * Componente de dashboard para la vertical de Bienes Raíces.
 * Muestra estadísticas y widgets relevantes para gestión inmobiliaria.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { bienesRaicesVerticalInfo } from '../index';

/**
 * Interfaz para métricas de dashboard
 */
interface DashboardMetrics {
  activeListings: number;
  pendingAppointments: number;
  activeLeads: number;
  monthlySales: number;
  averagePrice: number;
  daysOnMarket: number;
}

/**
 * Props para el componente Dashboard
 */
interface DashboardProps {
  /** Datos opcionales a mostrar en el dashboard */
  metrics?: Partial<DashboardMetrics>;
}

/**
 * Dashboard principal para la vertical de Bienes Raíces
 */
export default function Dashboard({ metrics }: DashboardProps) {
  // Estado para almacenar datos del dashboard
  const [stats, setStats] = useState<DashboardMetrics>({
    activeListings: metrics?.activeListings || 0,
    pendingAppointments: metrics?.pendingAppointments || 0,
    activeLeads: metrics?.activeLeads || 0,
    monthlySales: metrics?.monthlySales || 0,
    averagePrice: metrics?.averagePrice || 0,
    daysOnMarket: metrics?.daysOnMarket || 0,
  });

  // Estado para controlar la carga
  const [loading, setLoading] = useState<boolean>(!metrics);

  // Efecto para cargar datos si no se proporcionaron
  useEffect(() => {
    // Si ya tenemos datos completos, no cargar
    if (
      metrics?.activeListings !== undefined &&
      metrics?.pendingAppointments !== undefined &&
      metrics?.activeLeads !== undefined &&
      metrics?.monthlySales !== undefined &&
      metrics?.averagePrice !== undefined &&
      metrics?.daysOnMarket !== undefined
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
          activeListings: 42,
          pendingAppointments: 8,
          activeLeads: 23,
          monthlySales: 3,
          averagePrice: 245000,
          daysOnMarket: 45,
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
          Dashboard de {bienesRaicesVerticalInfo.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestión de propiedades, clientes y citas para tu agencia inmobiliaria
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Tarjeta de Propiedades Activas */}
        <StatCard
          title="Propiedades Activas"
          value={stats.activeListings}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
          loading={loading}
          color={bienesRaicesVerticalInfo.colors?.primary || '#00796B'}
        />

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
          color="#FF9800"
          isWarning={stats.pendingAppointments > 5}
        />

        {/* Tarjeta de Leads Activos */}
        <StatCard
          title="Leads Activos"
          value={stats.activeLeads}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          loading={loading}
          color="#3F51B5"
        />

        {/* Tarjeta de Ventas Mensuales */}
        <StatCard
          title="Ventas Mensuales"
          value={stats.monthlySales}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color="#4CAF50"
        />

        {/* Tarjeta de Precio Promedio */}
        <StatCard
          title="Precio Promedio"
          value={stats.averagePrice}
          prefix="€"
          isMonetary={true}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color="#673AB7"
        />

        {/* Tarjeta de Días en Mercado */}
        <StatCard
          title="Días en Mercado"
          value={stats.daysOnMarket}
          suffix=" días"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          loading={loading}
          color="#607D8B"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Propiedades Recientes */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: '#00796B' }}>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
            Propiedades Recientes
          </h3>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <PropertyItem
                title="Apartamento en Centro"
                address="Calle Principal 123, Madrid"
                price={185000}
                type="Venta"
                thumbnail="/api/placeholder/80/60"
              />
              <PropertyItem
                title="Chalet adosado"
                address="Av. del Parque 45, Barcelona"
                price={350000}
                type="Venta"
                thumbnail="/api/placeholder/80/60"
              />
              <PropertyItem
                title="Local comercial"
                address="Plaza Mayor 7, Valencia"
                price={1200}
                type="Alquiler"
                isRental={true}
                thumbnail="/api/placeholder/80/60"
              />
            </div>
          )}
        </div>
        
        {/* Próximas Citas */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 border-l-4" style={{ borderLeftColor: '#FF9800' }}>
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
                client="Carlos Rodríguez"
                property="Apartamento en Centro"
                date={new Date(2025, 4, 30, 10, 30)}
                type="Visita"
              />
              <AppointmentItem
                client="Laura Martínez"
                property="Chalet adosado"
                date={new Date(2025, 4, 30, 16, 0)}
                type="Visita"
              />
              <AppointmentItem
                client="Miguel López"
                property="Local comercial"
                date={new Date(2025, 5, 2, 12, 0)}
                type="Firma"
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
          Esta es una versión de demostración del dashboard para la vertical de Bienes Raíces.
          En una implementación completa, se incluirán:
        </p>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
          <li>Mapa interactivo de propiedades</li>
          <li>Gestión documental para contratos</li>
          <li>Sistema de seguimiento de leads</li>
          <li>Comparativas de mercado por zona</li>
          <li>Integración con portales inmobiliarios</li>
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

/**
 * Componente para mostrar una propiedad en lista
 */
function PropertyItem({
  title,
  address,
  price,
  type,
  isRental = false,
  thumbnail,
}: {
  title: string;
  address: string;
  price: number;
  type: string;
  isRental?: boolean;
  thumbnail: string;
}) {
  // Formatear precio como moneda
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(price);

  return (
    <div className="flex items-center p-2 border-b border-gray-100 dark:border-gray-800">
      <div className="flex-shrink-0 w-20 h-15 mr-3">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover rounded"
        />
      </div>
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{address}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="font-medium text-gray-900 dark:text-white">
          {formattedPrice}{isRental ? '/mes' : ''}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">{type}</p>
      </div>
    </div>
  );
}

/**
 * Componente para mostrar una cita en lista
 */
function AppointmentItem({
  client,
  property,
  date,
  type,
}: {
  client: string;
  property: string;
  date: Date;
  type: string;
}) {
  // Formatear fecha y hora
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex items-center p-2 border-b border-gray-100 dark:border-gray-800">
      <div className="flex-shrink-0 mr-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300">
          {client.charAt(0)}
        </div>
      </div>
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900 dark:text-white">{client}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{property}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="font-medium text-gray-900 dark:text-white">
          {formattedTime}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formattedDate} • {type}
        </p>
      </div>
    </div>
  );
}