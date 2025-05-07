/**
 * frontend/src/components/verticals/salon/features/ServicesList.tsx
 * Componente para mostrar y gestionar la lista de servicios ofrecidos por el salón.
 * Permite filtrar por categoría y seleccionar servicios.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * Interfaz para datos de un servicio
 */
interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // En minutos
  categoryId: string;
  active: boolean;
  imageUrl?: string;
}

/**
 * Interfaz para datos de una categoría de servicios
 */
interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  order?: number;
}

/**
 * Interfaz para las propiedades del componente ServicesList
 */
interface ServicesListProps {
  /** Lista de servicios a mostrar */
  services: Service[];
  /** Lista de categorías disponibles */
  categories?: ServiceCategory[];
  /** ID del servicio seleccionado inicialmente */
  selectedServiceId?: string;
  /** ID de la categoría seleccionada inicialmente */
  selectedCategoryId?: string;
  /** Función llamada al seleccionar un servicio */
  onSelectService?: (serviceId: string) => void;
  /** Función llamada al seleccionar una categoría */
  onSelectCategory?: (categoryId: string) => void;
  /** Clases CSS adicionales */
  className?: string;
  /** Determina si mostrar precios */
  showPrices?: boolean;
  /** Determina si mostrar duración */
  showDuration?: boolean;
  /** Modo de visualización: 'grid' o 'list' */
  displayMode?: 'grid' | 'list';
}

/**
 * Componente para mostrar y gestionar la lista de servicios
 */
export default function ServicesList({
  services,
  categories = [],
  selectedServiceId,
  selectedCategoryId,
  onSelectService,
  onSelectCategory,
  className = '',
  showPrices = true,
  showDuration = true,
  displayMode = 'grid'
}: ServicesListProps) {
  // Estado para ID del servicio seleccionado
  const [activeServiceId, setActiveServiceId] = useState<string | undefined>(selectedServiceId);
  // Estado para ID de la categoría seleccionada
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(selectedCategoryId);
  
  // Callback para seleccionar un servicio
  const handleSelectService = useCallback((serviceId: string) => {
    setActiveServiceId(serviceId);
    
    if (onSelectService) {
      onSelectService(serviceId);
    }
  }, [onSelectService]);
  
  // Callback para seleccionar una categoría
  const handleSelectCategory = useCallback((categoryId?: string) => {
    setActiveCategoryId(categoryId);
    setActiveServiceId(undefined);
    
    if (onSelectCategory) {
      onSelectCategory(categoryId || '');
    }
  }, [onSelectCategory]);
  
  // Filtrar servicios por categoría
  const filteredServices = useMemo(() => {
    if (!activeCategoryId) return services;
    return services.filter(service => service.categoryId === activeCategoryId);
  }, [services, activeCategoryId]);
  
  return (
    <div className={className}>
      {/* Filtro de categorías (si hay categorías disponibles) */}
      {categories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Filtrar por categoría
          </h3>
          <div className="flex flex-wrap gap-2">
            {/* Botón para mostrar todos los servicios */}
            <button
              onClick={() => handleSelectCategory(undefined)}
              className={`
                px-3 py-1.5 text-sm rounded-md transition-colors
                ${!activeCategoryId
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }
              `}
            >
              Todos
            </button>
            
            {/* Botón para cada categoría */}
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleSelectCategory(category.id)}
                className={`
                  px-3 py-1.5 text-sm rounded-md transition-colors
                  ${activeCategoryId === category.id
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Lista de servicios */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          No hay servicios disponibles {activeCategoryId ? 'en esta categoría' : ''}
        </div>
      ) : (
        <div className={`
          ${displayMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-3'
          }
        `}>
          {filteredServices.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={activeServiceId === service.id}
              onClick={() => handleSelectService(service.id)}
              showPrice={showPrices}
              showDuration={showDuration}
              displayMode={displayMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Interfaz para las propiedades del componente ServiceCard
 */
interface ServiceCardProps {
  /** Datos del servicio a mostrar */
  service: Service;
  /** Indica si el servicio está seleccionado */
  isSelected?: boolean;
  /** Función llamada al hacer clic en la tarjeta */
  onClick?: () => void;
  /** Determina si mostrar precio */
  showPrice?: boolean;
  /** Determina si mostrar duración */
  showDuration?: boolean;
  /** Modo de visualización: 'grid' o 'list' */
  displayMode?: 'grid' | 'list';
}

/**
 * Componente para mostrar tarjeta de un servicio
 */
function ServiceCard({
  service,
  isSelected = false,
  onClick,
  showPrice = true,
  showDuration = true,
  displayMode = 'grid'
}: ServiceCardProps) {
  // Formatear precio como moneda
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(service.price);
  
  // Formatear duración
  const formattedDuration = service.duration >= 60
    ? `${Math.floor(service.duration / 60)}h ${service.duration % 60 > 0 ? `${service.duration % 60}min` : ''}`
    : `${service.duration} min`;
  
  // Renderizar como tarjeta en grid
  if (displayMode === 'grid') {
    return (
      <div
        onClick={onClick}
        className={`
          rounded-lg border p-4 cursor-pointer transition-colors
          ${isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
      >
        {service.imageUrl && (
          <div className="mb-3 rounded-md overflow-hidden">
            <img
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-32 object-cover"
            />
          </div>
        )}
        
        <h3 className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
          {service.name}
        </h3>
        
        {service.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {service.description}
          </p>
        )}
        
        <div className="mt-2 flex justify-between items-end">
          {showDuration && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formattedDuration}
            </span>
          )}
          
          {showPrice && (
            <span className="font-medium text-gray-900 dark:text-white">
              {formattedPrice}
            </span>
          )}
        </div>
      </div>
    );
  }
  
  // Renderizar como item en lista
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center border rounded-md p-3 cursor-pointer transition-colors
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
    >
      {service.imageUrl && (
        <div className="flex-shrink-0 w-12 h-12 mr-4">
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-full h-full object-cover rounded-md"
          />
        </div>
      )}
      
      <div className="flex-grow">
        <h3 className={`font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
          {service.name}
        </h3>
        
        {service.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            {service.description}
          </p>
        )}
      </div>
      
      <div className="flex-shrink-0 ml-4 text-right">
        {showPrice && (
          <div className="font-medium text-gray-900 dark:text-white">
            {formattedPrice}
          </div>
        )}
        
        {showDuration && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {formattedDuration}
          </div>
        )}
      </div>
    </div>
  );
}