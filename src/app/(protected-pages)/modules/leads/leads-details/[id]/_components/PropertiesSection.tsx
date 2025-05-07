/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-details/[id]/_components/PropertiesSection.tsx
 * Componente para mostrar las propiedades relacionadas con un prospecto
 * 
 * @version 1.0.0
 * @updated 2025-07-04
 */

'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import Tag from '@/components/ui/Tag'
import { HiOutlineHome } from 'react-icons/hi'
import { TbBuildingSkyscraper, TbMap } from 'react-icons/tb'
import { MdOutlineApartment } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/utils/formatCurrency'
import Image from 'next/image'
import { Lead } from '../types'

type PropertiesSectionProps = {
    data: Lead
}

const PropertyTypeIcon = ({ type }: { type: string }) => {
    switch (type?.toLowerCase()) {
        case 'house':
            return <HiOutlineHome className="text-lg mr-2" />
        case 'apartment':
            return <MdOutlineApartment className="text-lg mr-2" />
        case 'land':
            return <TbMap className="text-lg mr-2" />
        case 'commercial':
        case 'office':
            return <TbBuildingSkyscraper className="text-lg mr-2" />
        default:
            return <HiOutlineHome className="text-lg mr-2" />
    }
}

const PropertiesSection = ({ data }: PropertiesSectionProps) => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    
    // Datos de interés inmobiliario del lead
    const propertyInterest = {
        type: data.property_type,
        budget: {
            min: data.budget_min,
            max: data.budget_max
        },
        zones: data.preferred_zones || [],
        bedrooms: data.bedrooms_needed,
        bathrooms: data.bathrooms_needed,
        features: data.features_needed || []
    }
    
    // Citas relacionadas con propiedades
    const appointments = data.appointments || []
    
    // Propiedades de ejemplo (en producción deberían cargarse de la BD)
    const properties = [
        {
            id: '9dd01c94-8f92-4114-8a19-3404cb3ff1a9',
            name: 'Casa en Roma Norte',
            price: 3200000,
            currency: 'MXN',
            type: 'house',
            bedrooms: 3,
            bathrooms: 2,
            area: 180,
            image: '/img/others/img-13.jpg',
            status: 'available'
        },
        {
            id: 'property-2',
            name: 'Departamento en Polanco',
            price: 5500000,
            currency: 'MXN',
            type: 'apartment',
            bedrooms: 2,
            bathrooms: 2,
            area: 120,
            image: '/img/others/img-14.jpg',
            status: 'available'
        }
    ]
    
    const handleViewProperty = (id: string) => {
        router.push(`/modules/properties/property-details/${id}`)
    }
    
    const handleScheduleAppointment = () => {
        setLoading(true)
        
        // Simular creación de cita
        setTimeout(() => {
            setLoading(false)
            router.push(`/modules/appointments/appointment-create?lead_id=${data.id}`)
        }, 500)
    }
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sección de interés inmobiliario */}
            <Card className="mb-4">
                <div className="p-4">
                    <h5 className="mb-4">Interés Inmobiliario</h5>
                    
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <PropertyTypeIcon type={propertyInterest.type} />
                            <span className="font-semibold">Tipo de propiedad:</span>
                        </div>
                        <div className="ml-6">
                            <Tag className="mr-2 bg-blue-100 text-blue-600 dark:bg-blue-100 dark:text-blue-600">
                                {propertyInterest.type}
                            </Tag>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <span className="font-semibold">Presupuesto:</span>
                        </div>
                        <div className="ml-6">
                            <p>
                                {formatCurrency(propertyInterest.budget.min)} - {formatCurrency(propertyInterest.budget.max)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <span className="font-semibold">Zonas preferidas:</span>
                        </div>
                        <div className="ml-6 flex flex-wrap gap-2">
                            {propertyInterest.zones.map((zone, index) => (
                                <Tag key={index} className="bg-blue-100 text-blue-600 dark:bg-blue-100 dark:text-blue-600">
                                    {zone}
                                </Tag>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <span className="font-semibold">Características:</span>
                        </div>
                        <div className="ml-6">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p>Habitaciones: {propertyInterest.bedrooms || 'N/A'}</p>
                                </div>
                                <div>
                                    <p>Baños: {propertyInterest.bathrooms || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="mt-2 flex flex-wrap gap-2">
                                {propertyInterest.features.map((feature, index) => (
                                    <Tag key={index} className="bg-purple-100 text-purple-600 dark:bg-purple-100 dark:text-purple-600">
                                        {feature}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <Button
                            variant="solid"
                            onClick={handleScheduleAppointment}
                            loading={loading}
                        >
                            Programar Cita
                        </Button>
                    </div>
                </div>
            </Card>
            
            {/* Sección de propiedades recomendadas */}
            <Card className="mb-4">
                <div className="p-4">
                    <h5 className="mb-4">Propiedades Recomendadas</h5>
                    
                    <div className="space-y-4">
                        {properties.map((property) => (
                            <div key={property.id} className="border rounded-lg p-3 flex">
                                <div className="w-24 h-24 rounded-lg overflow-hidden relative flex-shrink-0">
                                    <Image 
                                        src={property.image} 
                                        alt={property.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="ml-3 flex-grow">
                                    <h6 className="font-semibold">{property.name}</h6>
                                    <div className="flex items-center text-sm mb-1">
                                        <PropertyTypeIcon type={property.type} />
                                        <span className="capitalize">{property.type}</span>
                                        <span className="mx-2">•</span>
                                        <span>{property.bedrooms} hab</span>
                                        <span className="mx-2">•</span>
                                        <span>{property.bathrooms} baños</span>
                                    </div>
                                    <div className="text-blue-600 font-semibold mb-2">
                                        {formatCurrency(property.price)}
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleViewProperty(property.id)}
                                    >
                                        Ver Detalles
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
            
            {/* Sección de citas programadas */}
            <Card className="lg:col-span-2">
                <div className="p-4">
                    <h5 className="mb-4">Citas Programadas</h5>
                    
                    {appointments.length > 0 ? (
                        <Table>
                            <Table.THead>
                                <Table.Tr>
                                    <Table.Th>Fecha</Table.Th>
                                    <Table.Th>Hora</Table.Th>
                                    <Table.Th>Ubicación</Table.Th>
                                    <Table.Th>Estado</Table.Th>
                                    <Table.Th>Agente</Table.Th>
                                    <Table.Th>Acciones</Table.Th>
                                </Table.Tr>
                            </Table.THead>
                            <Table.TBody>
                                {appointments.map((appointment) => (
                                    <Table.Tr key={appointment.id}>
                                        <Table.Td>
                                            {new Date(appointment.appointment_date).toLocaleDateString()}
                                        </Table.Td>
                                        <Table.Td>{appointment.appointment_time}</Table.Td>
                                        <Table.Td>{appointment.location}</Table.Td>
                                        <Table.Td>
                                            <Tag
                                                className={
                                                    appointment.status === 'scheduled'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : appointment.status === 'confirmed'
                                                        ? 'bg-green-100 text-green-600'
                                                        : appointment.status === 'completed'
                                                        ? 'bg-purple-100 text-purple-600'
                                                        : 'bg-red-100 text-red-600'
                                                }
                                            >
                                                {appointment.status}
                                            </Tag>
                                        </Table.Td>
                                        <Table.Td>
                                            {appointment.agent?.name || 'No asignado'}
                                        </Table.Td>
                                        <Table.Td>
                                            <Button
                                                size="sm"
                                                onClick={() => router.push(`/modules/appointments/appointment-details/${appointment.id}`)}
                                            >
                                                Ver
                                            </Button>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.TBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No hay citas programadas</p>
                            <Button
                                className="mt-4"
                                onClick={handleScheduleAppointment}
                            >
                                Programar Nueva Cita
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default PropertiesSection