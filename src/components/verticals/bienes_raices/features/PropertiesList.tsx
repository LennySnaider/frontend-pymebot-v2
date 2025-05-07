/**
 * frontend/src/components/verticals/bienes_raices/features/PropertiesList.tsx
 * Componente para mostrar y gestionar un listado de propiedades inmobiliarias.
 * Permite filtrado, búsqueda y diferentes modos de visualización.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import PropertyCard, { PropertyStatus, OperationType } from './PropertyCard';

/**
 * Interfaz para datos de una propiedad
 */
export interface Property {
  id: string;
  propertyCode: string;
  title: string;
  propertyType: string;
  location: {
    city: string;
    state: string;
  };
  price: number;
  operationType: OperationType;
  features: {
    bedrooms: number;
    bathrooms: number;
    area: number;
  };
  status: PropertyStatus;
  imageUrl?: string;
}

/**
 * Filtros disponibles para propiedades
 */
export interface PropertyFilters {
  status?: PropertyStatus;
  operationType?: OperationType;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minArea?: number;
  location?: string;
  propertyType?: string;
}

/**
 * Tipos de vista disponibles
 */
type ViewMode = 'grid' | 'list' | 'table';

/**
 * Interfaz para las propiedades del componente PropertiesList
 */
interface PropertiesListProps {
  /** Lista de propiedades a mostrar */
  properties?: Property[];
  /** Función para cargar propiedades desde API */
  loadProperties?: (filters?: PropertyFilters) => Promise<Property[]>;
  /** Función de callback al seleccionar una propiedad */
  onSelectProperty?: (property: Property) => void;
  /** Función de callback al editar una propiedad */
  onEditProperty?: (propertyId: string) => void;
  /** Función de callback al eliminar una propiedad */
  onDeleteProperty?: (propertyId: string) => void;
  /** Función de callback al crear una nueva propiedad */
  onCreateProperty?: () => void;
  /** Filtros iniciales */
  initialFilters?: PropertyFilters;
  /** Modo de visualización inicial */
  initialViewMode?: ViewMode;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente principal para listado de propiedades
 */
export default function PropertiesList({
  properties: initialProperties,
  loadProperties,
  onSelectProperty,
  onEditProperty,
  onDeleteProperty,
  onCreateProperty,
  initialFilters = {},
  initialViewMode = 'table',
  className = '',
}: PropertiesListProps) {
  // Estado para almacenar propiedades
  const [properties, setProperties] = useState<Property[]>(initialProperties || []);
  // Estado para controlar la carga
  const [loading, setLoading] = useState<boolean>(!initialProperties);
  // Estado para filtros activos
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  // Estado para término de búsqueda
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Estado para modo de visualización
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  // Estado para mensajes de error
  const [error, setError] = useState<string | null>(null);
  // Estado para control de selección múltiple
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Estado para control de selección de todas las propiedades
  const [selectAll, setSelectAll] = useState<boolean>(false);

  // Efecto para cargar propiedades iniciales
  useEffect(() => {
    if (initialProperties) {
      setProperties(initialProperties);
      return;
    }

    if (loadProperties) {
      fetchProperties();
    }
  }, [initialProperties]);

  // Función para cargar propiedades
  const fetchProperties = async () => {
    if (!loadProperties) return;

    setLoading(true);
    setError(null);

    try {
      const data = await loadProperties(filters);
      setProperties(data);
    } catch (err) {
      console.error('Error cargando propiedades:', err);
      setError('No se pudieron cargar las propiedades. Por favor, intente nuevamente.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para aplicar filtros
  useEffect(() => {
    // Si tenemos función de carga, actualizar con filtros
    if (loadProperties) {
      fetchProperties();
    } 
    // Si no, filtrar localmente
    else if (initialProperties) {
      const filtered = initialProperties.filter(property => {
        // Filtrar por término de búsqueda
        if (searchTerm && !property.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !property.propertyCode.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !property.location.city.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filtrar por estado
        if (filters.status && property.status !== filters.status) {
          return false;
        }
        
        // Filtrar por tipo de operación
        if (filters.operationType && property.operationType !== filters.operationType) {
          return false;
        }
        
        // Filtrar por precio mínimo
        if (filters.minPrice && property.price < filters.minPrice) {
          return false;
        }
        
        // Filtrar por precio máximo
        if (filters.maxPrice && property.price > filters.maxPrice) {
          return false;
        }
        
        // Filtrar por dormitorios mínimos
        if (filters.minBedrooms && property.features.bedrooms < filters.minBedrooms) {
          return false;
        }
        
        // Filtrar por baños mínimos
        if (filters.minBathrooms && property.features.bathrooms < filters.minBathrooms) {
          return false;
        }
        
        // Filtrar por área mínima
        if (filters.minArea && property.features.area < filters.minArea) {
          return false;
        }
        
        // Filtrar por ubicación
        if (filters.location && 
            !property.location.city.toLowerCase().includes(filters.location.toLowerCase()) &&
            !property.location.state.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
        
        // Filtrar por tipo de propiedad
        if (filters.propertyType && property.propertyType !== filters.propertyType) {
          return false;
        }
        
        return true;
      });
      
      setProperties(filtered);
    }
  }, [filters, searchTerm, initialProperties]);

  // Manejador para cambiar filtros
  const handleFilterChange = useCallback((newFilters: Partial<PropertyFilters>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  // Manejador para reset de filtros
  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
  }, []);

  // Manejador para cambiar término de búsqueda
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Manejador para selección de propiedad
  const handlePropertySelect = useCallback((property: Property) => {
    if (onSelectProperty) {
      onSelectProperty(property);
    }
  }, [onSelectProperty]);

  // Manejador para edición de propiedad
  const handlePropertyEdit = useCallback((propertyId: string) => {
    if (onEditProperty) {
      onEditProperty(propertyId);
    }
  }, [onEditProperty]);

  // Manejador para eliminación de propiedad
  const handlePropertyDelete = useCallback((propertyId: string) => {
    if (onDeleteProperty) {
      onDeleteProperty(propertyId);
    }
  }, [onDeleteProperty]);

  // Manejador para selección individual en tabla
  const handleSelectItem = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(itemId => itemId !== id);
      }
    });
  }, []);

  // Manejador para selección de todas las propiedades
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(properties.map(property => property.id));
    } else {
      setSelectedIds([]);
    }
  }, [properties]);

  // Renderizar contenido según modo de visualización
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-2 text-gray-600 dark:text-gray-400">Cargando propiedades...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    if (properties.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-md">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay propiedades</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {Object.keys(filters).length > 0 || searchTerm
              ? 'No se encontraron propiedades con los filtros aplicados'
              : 'Comienza agregando tu primera propiedad'}
          </p>
          {onCreateProperty && (
            <div className="mt-6">
              <button
                type="button"
                onClick={onCreateProperty}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar propiedad
              </button>
            </div>
          )}
        </div>
      );
    }

    // Modo de visualización en tabla
    if (viewMode === 'table') {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">
                  <div className="flex items-center">
                    <input
                      id="selectAll"
                      type="checkbox"
                      className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </div>
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Propiedad
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ubicación
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Características
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {properties.map(property => (
                <tr key={property.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      checked={selectedIds.includes(property.id)}
                      onChange={(e) => handleSelectItem(property.id, e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          className="h-10 w-10 rounded-md object-cover" 
                          src={property.imageUrl || '/api/placeholder/40/40'} 
                          alt={property.title} 
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {property.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {property.propertyCode} • {property.propertyType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{property.location.city}</div>
                    <div className="text-xs text-gray-500">{property.location.state}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(property.price)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {property.operationType === 'venta' ? 'Venta' : 
                       property.operationType === 'alquiler' ? 'Alquiler' : 'Alquiler Temporal'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex space-x-2">
                      <span>{property.features.bedrooms} hab</span>
                      <span>{property.features.bathrooms} baños</span>
                      <span>{property.features.area} m²</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${property.status === 'disponible' ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 
                        property.status === 'vendida' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400' : 
                        property.status === 'reservada' ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400' : 
                        property.status === 'alquilada' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-400' : 
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                    >
                      {property.status === 'disponible' ? 'Disponible' : 
                       property.status === 'vendida' ? 'Vendida' : 
                       property.status === 'reservada' ? 'Reservada' : 
                       property.status === 'alquilada' ? 'Alquilada' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {onSelectProperty && (
                        <button
                          onClick={() => handlePropertySelect(property)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Ver
                        </button>
                      )}
                      {onEditProperty && (
                        <button
                          onClick={() => handlePropertyEdit(property.id)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Editar
                        </button>
                      )}
                      {onDeleteProperty && (
                        <button
                          onClick={() => handlePropertyDelete(property.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Modo visualización en grid
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(property => (
            <PropertyCard
              key={property.id}
              id={property.id}
              propertyCode={property.propertyCode}
              title={property.title}
              propertyType={property.propertyType}
              location={property.location}
              price={property.price}
              operationType={property.operationType}
              features={property.features}
              status={property.status}
              imageUrl={property.imageUrl}
              onDetailsClick={onSelectProperty ? () => handlePropertySelect(property) : undefined}
              onEditClick={onEditProperty ? () => handlePropertyEdit(property.id) : undefined}
              onDeleteClick={onDeleteProperty ? () => handlePropertyDelete(property.id) : undefined}
            />
          ))}
        </div>
      );
    }

    // Modo visualización en lista
    return (
      <div className="space-y-4">
        {properties.map(property => (
          <div key={property.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-48 h-48 sm:h-auto">
                <img 
                  src={property.imageUrl || '/api/placeholder/192/192'} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{property.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {property.propertyCode} • {property.propertyType}</p>
                  </div>
                  <span className={`px-2 py-1 h-fit inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${property.status === 'disponible' ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 
                      property.status === 'vendida' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400' : 
                      property.status === 'reservada' ? 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400' : 
                      property.status === 'alquilada' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-400' : 
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}
                  >
                    {property.status === 'disponible' ? 'Disponible' : 
                      property.status === 'vendida' ? 'Vendida' : 
                      property.status === 'reservada' ? 'Reservada' : 
                      property.status === 'alquilada' ? 'Alquilada' : 'Inactiva'}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{property.location.city}, {property.location.state}</p>
                
                <div className="mt-4 flex flex-wrap gap-4">
                  <div>
                    <span className="font-medium text-lg text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(property.price)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      {property.operationType === 'venta' ? '' : '/mes'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{property.features.bedrooms} hab</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{property.features.bathrooms} baños</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{property.features.area} m²</span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  {onSelectProperty && (
                    <button
                      onClick={() => handlePropertySelect(property)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                    >
                      Ver detalles
                    </button>
                  )}
                  {onEditProperty && (
                    <button
                      onClick={() => handlePropertyEdit(property.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
                    >
                      Editar
                    </button>
                  )}
                  {onDeleteProperty && (
                    <button
                      onClick={() => handlePropertyDelete(property.id)}
                      className="px-3 py-1.5 bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-600 rounded text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Barra de acciones y herramientas */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        {/* Botón de Agregar y Buscador */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          {onCreateProperty && (
            <button
              onClick={onCreateProperty}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar propiedad
            </button>
          )}
          
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar propiedades..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Filtros y Modos de Vista */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* Filtros Rápidos */}
          <div className="hidden sm:flex items-center space-x-2">
            <select
              className="block py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange({ status: e.target.value as PropertyStatus || undefined })}
            >
              <option value="">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="vendida">Vendida</option>
              <option value="reservada">Reservada</option>
              <option value="alquilada">Alquilada</option>
              <option value="inactiva">Inactiva</option>
            </select>
            
            <select
              className="block py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              value={filters.operationType || ''}
              onChange={(e) => handleFilterChange({ operationType: e.target.value as OperationType || undefined })}
            >
              <option value="">Todos los tipos</option>
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="alquiler_temp">Alquiler Temporal</option>
            </select>
          </div>
          
          {/* Botón de Filtros Avanzados */}
          <button
            className="bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Filtros avanzados"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          
          {/* Botón de Actualizar */}
          <button
            onClick={fetchProperties}
            className="bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Actualizar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {/* Modos de Vista */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 inline-flex items-center text-sm leading-5 font-medium rounded-l-md 
                ${viewMode === 'table' ? 
                  'text-white bg-green-600 hover:bg-green-700' : 
                  'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              title="Vista de tabla"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 inline-flex items-center text-sm leading-5 font-medium 
                ${viewMode === 'list' ? 
                  'text-white bg-green-600 hover:bg-green-700' : 
                  'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-t border-b border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              title="Vista de lista"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 inline-flex items-center text-sm leading-5 font-medium rounded-r-md 
                ${viewMode === 'grid' ? 
                  'text-white bg-green-600 hover:bg-green-700' : 
                  'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              title="Vista de cuadrícula"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Chips de filtros activos */}
      {(Object.keys(filters).length > 0 || searchTerm) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {searchTerm && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700">
              <span className="mr-1 text-gray-600 dark:text-gray-300">Búsqueda:</span>
              <span className="font-medium text-gray-900 dark:text-white">{searchTerm}</span>
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {filters.status && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700">
              <span className="mr-1 text-gray-600 dark:text-gray-300">Estado:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {filters.status === 'disponible' ? 'Disponible' : 
                 filters.status === 'vendida' ? 'Vendida' : 
                 filters.status === 'reservada' ? 'Reservada' : 
                 filters.status === 'alquilada' ? 'Alquilada' : 'Inactiva'}
              </span>
              <button 
                onClick={() => handleFilterChange({ status: undefined })}
                className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {filters.operationType && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700">
              <span className="mr-1 text-gray-600 dark:text-gray-300">Operación:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {filters.operationType === 'venta' ? 'Venta' : 
                 filters.operationType === 'alquiler' ? 'Alquiler' : 'Alquiler Temporal'}
              </span>
              <button 
                onClick={() => handleFilterChange({ operationType: undefined })}
                className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {filters.minPrice && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700">
              <span className="mr-1 text-gray-600 dark:text-gray-300">Precio mín:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(filters.minPrice)}
              </span>
              <button 
                onClick={() => handleFilterChange({ minPrice: undefined })}
                className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Botón para limpiar todos los filtros */}
          {(Object.keys(filters).length > 0 || searchTerm) && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
      
      {/* Resultados */}
      {renderContent()}
      
      {/* Paginación */}
      {properties.length > 0 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex items-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">{properties.length}</span> propiedades
            </p>
          </div>
          
          <div className="flex">
            <nav className="relative z-0 inline-flex shadow-sm">
              <button
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Anterior</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                1
              </button>
              <button
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Siguiente</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}