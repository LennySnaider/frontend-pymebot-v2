/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/AppointmentDetails.tsx
 * Componente para mostrar los detalles de una cita y permitir acciones como cambio de estado,
 * reprogramación o cancelación.
 *
 * @version 1.0.0
 * @updated 2025-06-25
 */

'use client'

import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { 
    TbCalendar, 
    TbClock, 
    TbMapPin, 
    TbUser, 
    TbHome, 
    TbNotes, 
    TbPencil, 
    TbTrash, 
    TbCheck, 
    TbX, 
    TbBuildingSkyscraper 
} from 'react-icons/tb'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAppointmentStore } from '../_store/appointmentStore'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { formatCurrency } from '@/utils/formatCurrency'
import { getAppointmentById } from '@/server/actions/appointments/getAppointmentById'

interface AppointmentDetailsProps {
    isOpen: boolean
    onClose: () => void
    onEdit: () => void
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
    isOpen,
    onClose,
    onEdit,
}) => {
    const [isChangingStatus, setIsChangingStatus] = useState(false)
    const [notes, setNotes] = useState('')
    const [newStatus, setNewStatus] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)
    const [localAppointmentData, setLocalAppointmentData] = useState(null)
    
    const { 
        selectedAppointment: appointment, 
        availableStatuses,
        updateAppointmentStatus,
        deleteAppointment
    } = useAppointmentStore()
    
    // Cargar datos adicionales cuando se selecciona una cita
    useEffect(() => {
        if (appointment?.id && isOpen) {
            setIsLoadingDetails(true)
            console.log('AppointmentDetails: Cargando detalles para:', appointment.id)
            
            getAppointmentById(appointment.id)
                .then(data => {
                    console.log('AppointmentDetails: Datos cargados:', data)
                    setLocalAppointmentData(data)
                    setIsLoadingDetails(false)
                })
                .catch(error => {
                    console.error('AppointmentDetails: Error al cargar detalles:', error)
                    setIsLoadingDetails(false)
                })
        }
    }, [appointment?.id, isOpen])
    
    // Usar datos locales si están disponibles, sino usar appointment
    const displayAppointment = localAppointmentData || appointment
    
    if (!displayAppointment) {
        return null
    }
    
    // Función para obtener el color basado en el estado
    const getStatusColor = (status: string) => {
        const statusObj = availableStatuses.find(s => s.value === status)
        return statusObj?.color || 'blue'
    }
    
    // Formatear la fecha para mostrar
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
        } catch (e) {
            return dateStr
        }
    }
    
    // Manejar cambio de estado
    const handleStatusChange = async () => {
        if (!newStatus) {
            toast.error('Debe seleccionar un estado')
            return
        }
        
        try {
            await updateAppointmentStatus(displayAppointment.id, newStatus as any, notes)
            setIsChangingStatus(false)
            setNotes('')
            setNewStatus('')
            toast.success('Estado actualizado correctamente')
        } catch (error) {
            console.error('Error al cambiar estado:', error)
            toast.error('Error al actualizar el estado de la cita')
        }
    }
    
    // Manejar eliminación
    const handleDelete = async () => {
        setIsDeleting(true)
        
        try {
            await deleteAppointment(displayAppointment.id)
            setIsDeleting(false)
            setIsConfirmingDelete(false)
            onClose()
            toast.push(
                <Notification type="success">
                    Cita eliminada correctamente
                </Notification>,
                { placement: 'top-center' }
            )
        } catch (error) {
            console.error('Error al eliminar cita:', error)
            toast.push(
                <Notification type="danger">
                    Error al eliminar la cita
                </Notification>,
                { placement: 'top-center' }
            )
            setIsDeleting(false)
        }
    }
    
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            width={600}
        >
            <h4 className="text-lg font-semibold mb-4">Detalles de la Cita</h4>
            {isLoadingDetails ? (
                <div className="flex justify-center p-8">
                    <Spinner />
                    <span className="ml-3">Cargando detalles de la cita...</span>
                </div>
            ) : (
            <div className="p-4">
                {/* Encabezado con estado y acciones */}
                <div className="flex justify-between items-center mb-5">
                    <Badge>
                        {availableStatuses.find(s => s.value === displayAppointment.status)?.label || displayAppointment.status}
                    </Badge>
                    
                    <div className="flex space-x-2">
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<TbPencil />}
                            onClick={onEdit}
                        >
                            Editar
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<TbTrash />}
                            onClick={() => setIsConfirmingDelete(true)}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
                
                {/* Información principal */}
                <Card className="mb-4">
                    <div className="p-2">
                        <div className="flex items-center mb-4">
                            <div className="mr-3">
                                <Avatar 
                                    size={50} 
                                    shape="circle" 
                                    className="bg-indigo-100 text-indigo-600"
                                    icon={<TbCalendar className="text-2xl" />} 
                                />
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg">
                                    {displayAppointment.lead?.full_name || displayAppointment.leadName || 'Prospecto sin nombre'}
                                </h4>
                                <p className="text-gray-500">
                                    {displayAppointment.lead?.email || 'Sin correo'}
                                    {displayAppointment.lead?.phone && (
                                        <span> • {displayAppointment.lead.phone}</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4">
                            <div className="flex items-center">
                                <TbCalendar className="text-lg text-gray-500 mr-2" />
                                <span>
                                    {formatDate(displayAppointment.appointment_date)}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <TbClock className="text-lg text-gray-500 mr-2" />
                                <span>{displayAppointment.appointment_time}</span>
                            </div>
                            <div className="flex items-center">
                                <TbMapPin className="text-lg text-gray-500 mr-2" />
                                <span>{displayAppointment.location}</span>
                            </div>
                            <div className="flex items-center">
                                <TbHome className="text-lg text-gray-500 mr-2" />
                                <span>{displayAppointment.property_type || 'No especificado'}</span>
                            </div>
                            {displayAppointment.agent && (
                                <div className="flex items-center col-span-2">
                                    <TbUser className="text-lg text-gray-500 mr-2" />
                                    <div className="flex items-center">
                                        {displayAppointment.agent.profile_image ? (
                                            <Avatar 
                                                src={displayAppointment.agent.profile_image} 
                                                size={24} 
                                                className="mr-2" 
                                            />
                                        ) : (
                                            <Avatar 
                                                size={24} 
                                                className="mr-2 bg-blue-100 text-blue-600" 
                                                icon={<TbUser />} 
                                            />
                                        )}
                                        <span>{displayAppointment.agent.name || displayAppointment.agentName || 'Agente no asignado'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
                
                {/* Propiedades asociadas */}
                {displayAppointment.properties && displayAppointment.properties.length > 0 && (
                    <Card className="mb-4">
                        <div className="p-3">
                            <h5 className="font-semibold mb-3 flex items-center">
                                <TbBuildingSkyscraper className="mr-2" />
                                Propiedades a visitar
                            </h5>
                            <div className="space-y-3">
                                {displayAppointment.properties.map(property => (
                                    <div key={property.id} className="p-2 border rounded-lg hover:bg-gray-50">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{property.title || property.name}</span>
                                            <span className="text-green-600 font-medium">
                                                {formatCurrency(property.price, property.currency)}
                                            </span>
                                        </div>
                                        {property.location && (
                                            <div className="text-sm text-gray-500 flex items-center mt-1">
                                                <TbMapPin className="mr-1" />
                                                {typeof property.location === 'object' 
                                                    ? property.location.address 
                                                    : property.location
                                                }
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}
                
                {/* Notas */}
                {displayAppointment.notes && (
                    <Card className="mb-4">
                        <div className="p-3">
                            <h5 className="font-semibold mb-2 flex items-center">
                                <TbNotes className="mr-2" />
                                Notas
                            </h5>
                            <p className="text-gray-700 whitespace-pre-line">
                                {displayAppointment.notes}
                            </p>
                        </div>
                    </Card>
                )}
                
                {/* Cambiar estado */}
                {isChangingStatus ? (
                    <Card className="mb-4">
                        <div className="p-3">
                            <h5 className="font-semibold mb-3">Cambiar estado</h5>
                            <div className="space-y-3">
                                <Select
                                    placeholder="Seleccionar nuevo estado"
                                    options={availableStatuses as any}
                                    value={newStatus}
                                    onChange={(value) => setNewStatus(value as string)}
                                />
                                <Input
                                    type="textarea"
                                    placeholder="Notas sobre el cambio de estado (opcional)"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        size="sm"
                                        variant="plain"
                                        onClick={() => {
                                            setIsChangingStatus(false)
                                            setNewStatus('')
                                            setNotes('')
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        onClick={handleStatusChange}
                                    >
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <div className="mb-4">
                        <Button
                            block
                            variant="solid"
                            onClick={() => setIsChangingStatus(true)}
                        >
                            Cambiar estado
                        </Button>
                    </div>
                )}
                
                {/* Confirmación de eliminación */}
                {isConfirmingDelete && (
                    <Card className="border-red-300 mb-4">
                        <div className="p-3">
                            <h5 className="font-semibold mb-2 text-red-600">Eliminar cita</h5>
                            <p className="text-gray-700 mb-3">
                                ¿Está seguro de que desea eliminar esta cita? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    size="sm"
                                    variant="plain"
                                    disabled={isDeleting}
                                    onClick={() => setIsConfirmingDelete(false)}
                                    icon={<TbX />}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="solid"
                                    color="red"
                                    loading={isDeleting}
                                    onClick={handleDelete}
                                    icon={<TbCheck />}
                                >
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
            )}
        </Dialog>
    )
}

export default AppointmentDetails
