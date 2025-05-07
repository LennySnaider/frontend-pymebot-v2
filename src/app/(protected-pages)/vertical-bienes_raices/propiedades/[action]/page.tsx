/**
 * frontend/src/app/(protected-pages)/vertical-bienes_raices/propiedades/[action]/page.tsx
 * Página para agregar o editar propiedades inmobiliarias.
 * Maneja formularios para creación y modificación de propiedades.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyStatus, OperationType } from '@/components/verticals/bienes_raices/features/PropertyCard';

/**
 * Parámetros recibidos en la URL
 */
interface PageProps {
  params: {
    action: string; // 'nueva' o ID de la propiedad para editar
  };
}

/**
 * Datos de formulario para propiedades
 */
interface PropertyFormData {
  id?: string;
  propertyCode: string;
  title: string;
  propertyType: string;
  city: string;
  state: string;
  price: number;
  operationType: OperationType;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: PropertyStatus;
  description: string;
  images: string[];
}

/**
 * Página para agregar o editar propiedades
 */
export default function PropertyActionPage({ params }: PageProps) {
  const router = useRouter();
  const isNew = params.action === 'nueva';
  const propertyId = isNew ? undefined : params.action;
  
  // Estado para datos del formulario
  const [formData, setFormData] = useState<PropertyFormData>({
    propertyCode: '',
    title: '',
    propertyType: 'Casa',
    city: '',
    state: '',
    price: 0,
    operationType: 'venta',
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    status: 'disponible',
    description: '',
    images: []
  });
  
  // Estado para control de carga
  const [loading, setLoading] = useState<boolean>(!isNew);
  // Estado para control de guardado
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // Estado para mensajes de error
  const [error, setError] = useState<string | null>(null);

  // Cargar datos de propiedad si estamos editando
  useEffect(() => {
    if (isNew) return;
    
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simular carga de datos de API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Datos de ejemplo
        const propertyData = {
          id: propertyId,
          propertyCode: 'VIUQ-002',
          title: 'Casa Claudia',
          propertyType: 'Casa',
          city: 'Querétaro',
          state: 'Querétaro',
          price: 7845000,
          operationType: 'venta' as OperationType,
          bedrooms: 3,
          bathrooms: 3.5,
          area: 318,
          status: 'disponible' as PropertyStatus,
          description: 'Hermosa casa con amplios espacios y excelente ubicación',
          images: ['/api/placeholder/800/600']
        };
        
        setFormData(propertyData);
      } catch (err) {
        console.error('Error cargando datos de propiedad:', err);
        setError('No se pudo cargar la información de la propiedad. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperty();
  }, [isNew, propertyId]);

  // Manejador para cambios en campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Convertir valores numéricos
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejador para envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Simular guardado en API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Datos guardados:', formData);
      
      // Navegar de vuelta al listado
      router.push('/vertical-bienes_raices/propiedades');
    } catch (err) {
      console.error('Error guardando propiedad:', err);
      setError('No se pudo guardar la propiedad. Por favor, intente nuevamente.');
      setIsSaving(false);
    }
  };

  // Manejador para cancelar y volver al listado
  const handleCancel = () => {
    router.push('/vertical-bienes_raices/propiedades');
  };

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isNew ? 'Nueva Propiedad' : 'Editar Propiedad'}
        </h1>
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancelar
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
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
      )}
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información básica */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Información Básica
            </h2>
            
            <div>
              <label htmlFor="propertyCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código de Propiedad
              </label>
              <input
                type="text"
                id="propertyCode"
                name="propertyCode"
                value={formData.propertyCode}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Propiedad
              </label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                <option value="Casa">Casa</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Local">Local Comercial</option>
                <option value="Terreno">Terreno</option>
                <option value="Oficina">Oficina</option>
                <option value="Bodega">Bodega</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="operationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Operación
              </label>
              <select
                id="operationType"
                name="operationType"
                value={formData.operationType}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="alquiler_temp">Alquiler Temporal</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Precio
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 pl-8 focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  required
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              >
                <option value="disponible">Disponible</option>
                <option value="vendida">Vendida</option>
                <option value="reservada">Reservada</option>
                <option value="alquilada">Alquilada</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>
          </div>
          
          {/* Ubicación y características */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Ubicación y Características
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Habitaciones
                </label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Baños
                </label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Área (m²)
                </label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  min="0"
                  step="1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Imágenes
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>Subir imágenes</span>
                      <input id="file-upload" name="file-upload" type="file" accept="image/*" multiple className="sr-only" />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF hasta 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 flex items-center"
          >
            {isSaving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isNew ? 'Crear Propiedad' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}