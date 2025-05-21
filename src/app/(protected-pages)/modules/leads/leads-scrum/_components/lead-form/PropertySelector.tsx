/**
 * PropertySelector.tsx
 * Componente mejorado para seleccionar propiedades inmobiliarias en el formulario de leads
 * Implementa búsqueda dinámica y selección múltiple de propiedades
 * 
 * @version 3.1.0
 * @updated 2025-05-20
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import { FormControl } from './types'
import { Select, Spinner, FormItem, FormContainer, Input, Badge, Tooltip } from '@/components/ui'
import { HiOutlineSearch, HiOutlineHome, HiOutlineInformationCircle } from 'react-icons/hi'
import { TbCurrencyDollar, TbBed, TbBath, TbRuler2, TbExclamationCircle } from 'react-icons/tb'
import { formatCurrency } from '@/utils/formatCurrency'
import { getRealPropertyId } from '@/utils/propertyIdResolver'

interface Property {
    id: string
    title: string
    price: number
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    area?: number
    address?: string
    city?: string
    metadata?: {
        fallback?: string
        original_tenant?: string
        [key: string]: any
    }
    isMockData?: boolean
    [key: string]: any
}

interface PropertySelectorProps {
    control: FormControl
    availableProperties: Property[]
    isLoadingProperties: boolean
    loadAvailableProperties: () => void
    handlePropertySelect: (propertyId: string) => void
}

const PropertySelector: React.FC<PropertySelectorProps> = ({
    control,
    availableProperties,
    isLoadingProperties,
    loadAvailableProperties,
    handlePropertySelect,
}) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
    const [lastLoadAttempt, setLastLoadAttempt] = useState<Date | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    // Estadísticas de las propiedades cargadas
    const propertyStats = useMemo(() => {
        if (!availableProperties || availableProperties.length === 0) {
            return { total: 0, mock: 0, fallback: 0 };
        }

        return {
            total: availableProperties.length,
            mock: availableProperties.filter(p => p.isMockData).length,
            fallback: availableProperties.filter(p => p.metadata?.fallback).length
        };
    }, [availableProperties]);

    // Efecto para filtrar propiedades cuando cambia el término de búsqueda o las propiedades disponibles
    useEffect(() => {
        if (!availableProperties || availableProperties.length === 0) {
            setFilteredProperties([]);
            return;
        }

        // Limpiar cualquier error previo de carga
        setLoadError(null);

        if (!searchTerm || searchTerm.trim() === '') {
            setFilteredProperties(availableProperties);
            return;
        }

        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = availableProperties.filter(property => {
            return (
                (property.title && property.title.toLowerCase().includes(lowerSearchTerm)) ||
                (property.address && property.address.toLowerCase().includes(lowerSearchTerm)) ||
                (property.city && property.city.toLowerCase().includes(lowerSearchTerm)) ||
                (property.propertyType && property.propertyType.toLowerCase().includes(lowerSearchTerm)) ||
                (property.description && property.description.toLowerCase().includes(lowerSearchTerm))
            );
        });

        setFilteredProperties(filtered);
    }, [searchTerm, availableProperties]);

    // Función mejorada para cargar propiedades con protección contra spam
    const handleLoadProperties = () => {
        // Evitar cargas repetidas en un corto período
        const now = new Date();
        if (lastLoadAttempt && now.getTime() - lastLoadAttempt.getTime() < 2000) {
            return; // Ignorar clics repetidos en menos de 2 segundos
        }
        
        setLastLoadAttempt(now);
        setLoadError(null);
        
        try {
            loadAvailableProperties();
        } catch (error) {
            setLoadError('Error al cargar propiedades. Intente nuevamente.');
            console.error('Error al cargar propiedades:', error);
        }
    };

    // Función para renderizar la opción del selector
    const renderPropertyOption = (property: Property) => {
        // Determinar si es una propiedad especial (mock o fallback)
        const isMock = property.isMockData === true;
        const isFallback = !!property.metadata?.fallback;
        
        return (
            <div className="flex flex-col space-y-1 py-1">
                <div className="flex items-center">
                    <div className="font-medium text-gray-900 dark:text-white mr-2">
                        {property.title}
                    </div>
                    
                    {/* Indicador de propiedad simulada */}
                    {isMock && (
                        <Tooltip title="Datos de ejemplo">
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                <TbExclamationCircle className="mr-1" />
                                Ejemplo
                            </span>
                        </Tooltip>
                    )}
                    
                    {/* Indicador de propiedad de fallback */}
                    {isFallback && !isMock && (
                        <Tooltip title="Propiedad alternativa">
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300">
                                <HiOutlineInformationCircle className="mr-1" />
                                Alternativa
                            </span>
                        </Tooltip>
                    )}
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    {property.propertyType && (
                        <span className="flex items-center">
                            <HiOutlineHome className="mr-1" /> 
                            {property.propertyType}
                        </span>
                    )}
                    {property.price && (
                        <span className="flex items-center">
                            <TbCurrencyDollar className="mr-1" /> 
                            {formatCurrency(property.price)}
                        </span>
                    )}
                    {property.bedrooms && (
                        <span className="flex items-center">
                            <TbBed className="mr-1" /> 
                            {property.bedrooms}
                        </span>
                    )}
                    {property.bathrooms && (
                        <span className="flex items-center">
                            <TbBath className="mr-1" /> 
                            {property.bathrooms}
                        </span>
                    )}
                    {property.area && (
                        <span className="flex items-center">
                            <TbRuler2 className="mr-1" /> 
                            {property.area} {property.areaUnit || 'm²'}
                        </span>
                    )}
                </div>
                
                {property.address && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {property.address}{property.city ? `, ${property.city}` : ''}
                    </div>
                )}
            </div>
        );
    };

    // Obtener el ID real de una propiedad utilizando la utilidad
    const handlePropertySelectWithResolvedId = (propertyId: string) => {
        // Encontrar la propiedad seleccionada
        const selectedProperty = availableProperties.find(p => p.id === propertyId);
        if (selectedProperty) {
            // Utilizar la función para obtener el ID real
            const realId = getRealPropertyId(selectedProperty);
            handlePropertySelect(realId);
        } else {
            // Si no se encuentra, usar el ID proporcionado directamente
            handlePropertySelect(propertyId);
        }
    };

    return (
        <FormContainer className="mb-4">
            <FormItem 
                label={
                    <div className="flex items-center justify-between w-full">
                        <span className="font-medium">Propiedades de interés</span>
                        {propertyStats.total > 0 && (
                            <Tooltip title={`${propertyStats.total} propiedades disponibles (${propertyStats.mock} simuladas, ${propertyStats.fallback} alternativas)`}>
                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    {propertyStats.total} disponibles
                                </span>
                            </Tooltip>
                        )}
                    </div>
                }
                className="w-full"
            >
                <div className="space-y-2">
                    {/* Buscador de propiedades */}
                    <div className="relative">
                        <Input
                            placeholder="Buscar propiedades por nombre, ubicación, tipo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            prefix={<HiOutlineSearch className="text-lg" />}
                            className="w-full"
                            disabled={isLoadingProperties}
                        />
                        {isLoadingProperties && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <Spinner size={20} />
                            </div>
                        )}
                    </div>

                    {/* Mensaje de error si existe */}
                    {loadError && (
                        <div className="text-xs text-red-500 mt-1 flex items-center">
                            <TbExclamationCircle className="mr-1" />
                            {loadError}
                        </div>
                    )}

                    {/* Selector de propiedades */}
                    <Controller
                        name="selectedProperties"
                        control={control}
                        defaultValue={['no-property']}
                        render={({ field }) => (
                            <Select
                                className="w-full"
                                placeholder={isLoadingProperties ? "Cargando propiedades..." : "Selecciona propiedades..."}
                                options={filteredProperties.map(property => ({
                                    value: property.id,
                                    label: property.title || property.name || `Propiedad ${property.id.slice(0, 6)}`,
                                    data: property
                                }))}
                                onChange={(selectedOptions) => {
                                    // Convertir a array si es necesario
                                    const selectedValues = Array.isArray(selectedOptions) 
                                        ? selectedOptions.map(option => option.value) 
                                        : [selectedOptions.value];
                                    
                                    field.onChange(selectedValues);
                                    
                                    // Notificar la selección con ID resuelto
                                    if (selectedValues.length > 0) {
                                        handlePropertySelectWithResolvedId(selectedValues[0]);
                                    }
                                }}
                                onDropdownOpen={() => {
                                    // Cargar propiedades si no hay
                                    if ((availableProperties.length === 0 || propertyStats.mock > 0) && !isLoadingProperties) {
                                        handleLoadProperties();
                                    }
                                }}
                                isMulti
                                value={field.value.map(value => {
                                    const property = availableProperties.find(p => p.id === value);
                                    return {
                                        value,
                                        label: property ? (property.title || property.name) : value === 'no-property' ? 'Sin propiedad específica' : value,
                                        data: property
                                    };
                                })}
                                isDisabled={isLoadingProperties}
                                formatOptionLabel={(option) => {
                                    const property = option.data || availableProperties.find(p => p.id === option.value);
                                    if (!property) return option.label;
                                    return renderPropertyOption(property);
                                }}
                            />
                        )}
                    />

                    {/* Mensajes informativos */}
                    {filteredProperties.length === 0 && !isLoadingProperties && searchTerm && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <HiOutlineInformationCircle className="mr-1" />
                            No se encontraron propiedades que coincidan con "{searchTerm}"
                        </div>
                    )}

                    {availableProperties.length === 0 && !isLoadingProperties && !searchTerm && (
                        <div className="text-xs text-gray-500 mt-1">
                            <span 
                                className="text-blue-500 cursor-pointer hover:underline flex items-center" 
                                onClick={handleLoadProperties}
                            >
                                <HiOutlineInformationCircle className="mr-1" />
                                Cargar propiedades disponibles
                            </span>
                        </div>
                    )}
                    
                    {propertyStats.total > 0 && propertyStats.mock > 0 && (
                        <div className="text-xs text-amber-500 mt-1 flex items-center">
                            <TbExclamationCircle className="mr-1" />
                            Algunas propiedades mostradas son ejemplos. Puede añadir propiedades reales desde el módulo de Propiedades.
                        </div>
                    )}
                </div>
            </FormItem>
        </FormContainer>
    );
};

export default PropertySelector;