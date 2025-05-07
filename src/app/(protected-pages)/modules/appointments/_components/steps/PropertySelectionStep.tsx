import React from 'react'
import Select from '@/components/ui/Select'
// import Input from '@/components/ui/Input' // Descomentar si se implementa búsqueda
import Card from '@/components/ui/Card'
import Checkbox from '@/components/ui/Checkbox'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import {
    // TbUser, // No se usa porque Select no tiene prefix
    TbHome,
    // TbSearch, // Descomentar si se implementa búsqueda
    TbBed,
    TbBath,
    TbRuler,
} from 'react-icons/tb'
import type { Property, AgentOption, PropertyTypeOption } from '../types'
import type { SingleValue } from 'react-select' // Importar SingleValue

interface PropertySelectionStepProps {
    properties: Property[]
    selectedPropertyIds: string[]
    isLoadingProperties: boolean
    handlePropertySelection: (propertyId: string, checked: boolean) => void
    // handleSelectAllProperties: (filteredProperties: Property[], checked: boolean) => void; // TODO
    // propertySearchQuery: string; // TODO
    // setPropertySearchQuery: (query: string) => void; // TODO
    agentId: string
    setAgentId: (id: string) => void
    propertyType: string
    setPropertyType: (type: string) => void
    agentOptions: AgentOption[]
    propertyTypes: PropertyTypeOption[]
    formErrors: Record<string, string>
}

const PropertySelectionStep: React.FC<PropertySelectionStepProps> = ({
    properties,
    selectedPropertyIds,
    isLoadingProperties,
    handlePropertySelection,
    agentId,
    setAgentId,
    propertyType,
    setPropertyType,
    agentOptions,
    propertyTypes,
    formErrors,
}) => {
    // TODO: Implementar búsqueda/filtrado y seleccionar todo
    const filteredProperties = properties // Usar properties directamente por ahora

    return (
        <div className="space-y-4">
            {/* Selección de Agente y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label
                        htmlFor="agentSelect"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Agente Asignado <span className="text-red-500">*</span>
                    </label>
                    <Select<AgentOption> // Añadir tipo explícito
                        id="agentSelect"
                        placeholder="Seleccionar agente"
                        options={agentOptions}
                        value={agentOptions.find(
                            (opt) => opt.value === agentId,
                        )}
                        onChange={(selectedOption: SingleValue<AgentOption>) =>
                            setAgentId(selectedOption?.value || '')
                        }
                        className={formErrors.agentId ? 'border-red-500' : ''}
                    />
                    {formErrors.agentId && (
                        <p className="text-red-500 text-xs mt-1">
                            {formErrors.agentId}
                        </p>
                    )}
                </div>
                <div>
                    <label
                        htmlFor="propertyTypeSelect"
                        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Tipo de Propiedad{' '}
                        <span className="text-red-500">*</span>
                    </label>
                    <Select<PropertyTypeOption> // Añadir tipo explícito
                        id="propertyTypeSelect"
                        placeholder="Seleccionar tipo"
                        options={propertyTypes}
                        value={propertyTypes.find(
                            (opt) => opt.value === propertyType,
                        )}
                        onChange={(
                            selectedOption: SingleValue<PropertyTypeOption>,
                        ) => setPropertyType(selectedOption?.value || '')}
                        className={
                            formErrors.propertyType ? 'border-red-500' : ''
                        }
                    />
                    {formErrors.propertyType && (
                        <p className="text-red-500 text-xs mt-1">
                            {formErrors.propertyType}
                        </p>
                    )}
                </div>
            </div>

            {/* TODO: Buscador */}

            {/* Contador y Seleccionar Todo */}
            <div className="flex justify-between items-center pt-2">
                <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                    Propiedades Recomendadas
                </h3>
                {/* <Checkbox label="Seleccionar todas" /> */}
            </div>

            {formErrors.properties && (
                <p className="text-red-500 text-sm -mt-2 mb-3">
                    {' '}
                    {/* Ajustar margen */}
                    {formErrors.properties}
                </p>
            )}

            {/* Lista de Propiedades */}
            <div className="min-h-[300px] relative">
                {' '}
                {/* Altura mínima y posición relativa para el spinner */}
                {/* Overlay de Carga */}
                {isLoadingProperties && (
                    <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex justify-center items-center z-20 rounded-md">
                        <Spinner size={40} />
                    </div>
                )}
                {/* Contenido (Propiedades o Mensaje Vacío) */}
                {/* Ocultar contenido mientras carga para evitar saltos */}
                {!isLoadingProperties && filteredProperties.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 px-4">
                            No se encontraron propiedades recomendadas.
                            <br />
                            Asegúrate de haber seleccionado un agente y tipo de
                            propiedad válidos.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto p-1 border rounded-md dark:border-gray-700">
                        {filteredProperties.map((property) => (
                            <Card
                                key={property.id}
                                clickable
                                onClick={() =>
                                    handlePropertySelection(
                                        property.id,
                                        !selectedPropertyIds.includes(
                                            property.id,
                                        ),
                                    )
                                }
                                className={`transition-all relative ${
                                    selectedPropertyIds.includes(property.id)
                                        ? 'border-primary-500 dark:border-primary-500 ring-2 ring-primary-300 dark:ring-primary-700'
                                        : 'border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:bg-gray-800'
                                }`}
                            >
                                <div className="absolute top-2 left-2 z-10 bg-white dark:bg-gray-900 rounded-full p-0.5">
                                    <Checkbox
                                        checked={selectedPropertyIds.includes(
                                            property.id,
                                        )}
                                        readOnly
                                        // tabIndex prop no es necesaria o no existe en Checkbox
                                    />
                                </div>
                                <div className="relative h-40 w-full bg-gray-100 dark:bg-gray-700 rounded-t-md flex items-center justify-center overflow-hidden">
                                    {/* TODO: Mostrar imagen real si existe */}
                                    <TbHome className="text-4xl text-gray-400 dark:text-gray-500" />
                                    <div className="absolute top-2 right-2">
                                        <Badge className="capitalize bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 text-xs">
                                            {property.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 truncate mb-1">
                                        {property.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                                        {property.location?.address || ''}{' '}
                                        {property.location?.city
                                            ? `, ${property.location.city}`
                                            : ''}
                                    </p>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                                            $
                                            {property.price?.toLocaleString() ||
                                                '0'}{' '}
                                            <span className="text-xs text-gray-500">
                                                {property.currency || 'MXN'}
                                            </span>
                                        </span>
                                        <Badge className="capitalize bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 text-xs">
                                            {property.propertyType ||
                                                'Propiedad'}
                                        </Badge>
                                    </div>
                                    <div className="flex text-xs space-x-3 text-gray-600 dark:text-gray-300 border-t dark:border-gray-700 pt-2 mt-2">
                                        {property.features?.bedrooms > 0 && (
                                            <span className="flex items-center">
                                                <TbBed className="mr-1 text-gray-500" />{' '}
                                                {property.features.bedrooms}
                                            </span>
                                        )}
                                        {property.features?.bathrooms > 0 && (
                                            <span className="flex items-center">
                                                <TbBath className="mr-1 text-gray-500" />{' '}
                                                {property.features.bathrooms}
                                            </span>
                                        )}
                                        {property.features?.area && (
                                            <span className="flex items-center">
                                                <TbRuler className="mr-1 text-gray-500" />{' '}
                                                {property.features.area} m²
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PropertySelectionStep
