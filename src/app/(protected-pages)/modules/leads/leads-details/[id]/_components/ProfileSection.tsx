/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-details/[id]/_components/ProfileSection.tsx
 * Componente para mostrar la información de perfil del prospecto
 * 
 * @version 1.0.0
 * @updated 2025-07-04
 */

'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import { HiOutlineMail, HiOutlinePhone, HiOutlineClock, HiOutlineTrash } from 'react-icons/hi'
import { HiOutlineBuildingOffice2, HiOutlineCurrencyDollar } from 'react-icons/hi2'
import { TbPencil, TbCalendarEvent } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import ActionLink from '@/components/shared/ActionLink'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { Lead } from '../types'
import { formatCurrency } from '@/utils/formatCurrency'

type ProfileSectionProps = {
    data: Lead
}

const InterestLevelBadge = ({ level }: { level: string }) => {
    const bgColor = level === 'high' 
        ? 'bg-emerald-500' 
        : level === 'medium' 
        ? 'bg-amber-400' 
        : 'bg-blue-500';
    
    return (
        <div className={`w-3 h-3 rounded-full ${bgColor}`}></div>
    );
};

const ProfileSection = ({ data }: ProfileSectionProps) => {
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = useState(false)
    
    const handleEdit = () => {
        router.push(`/modules/leads/leads-edit/${data.id}`)
    }
    
    const handleDialogOpen = () => {
        setDialogOpen(true)
    }
    
    const handleDialogClose = () => {
        setDialogOpen(false)
    }
    
    const handleDelete = () => {
        setDialogOpen(false)
        router.push('/modules/leads/leads-list')
        toast.push(
            <Notification title={'Eliminado con éxito'} type="success">
                Prospecto eliminado correctamente
            </Notification>,
        )
    }
    
    const handleScheduleAppointment = () => {
        router.push(`/modules/appointments/appointment-create?lead_id=${data.id}`)
    }
    
    const handleSendMessage = () => {
        router.push('/modules/marketing/mail')
    }

    return (
        <Card className="w-full">
            <div className="flex justify-end">
                <Tooltip title="Editar prospecto">
                    <button
                        className="close-button button-press-feedback"
                        type="button"
                        onClick={handleEdit}
                    >
                        <TbPencil />
                    </button>
                </Tooltip>
            </div>
            <div className="flex flex-col xl:justify-between h-full 2xl:min-w-[360px] mx-auto">
                <div className="flex xl:flex-col items-center gap-4 mt-6">
                    {/* Mostrar ícono de WhatsApp si el lead viene de WhatsApp */}
                    <Avatar 
                        size={90} 
                        shape="circle" 
                        src={data.source === 'whatsapp' || !data.source ? '/img/icons/whatsIcon.png' : (data.img || 'https://i.pravatar.cc/150?img=25')} 
                    />
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold">{data.name}</h4>
                            <InterestLevelBadge level={data.interest_level} />
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            <Tag className="bg-blue-100 text-blue-600">
                                {data.status}
                            </Tag>
                            <Tag className="bg-purple-100 text-purple-600">
                                {data.stage}
                            </Tag>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-y-5 gap-x-4 mt-8">
                    <div>
                        <span className="font-semibold">Email</span>
                        <p className="heading-text font-bold">
                            <ActionLink href={`mailto:${data.email}`}>
                                {data.email}
                            </ActionLink>
                        </p>
                    </div>
                    
                    <div>
                        <span className="font-semibold">Teléfono</span>
                        <p className="heading-text font-bold">
                            <ActionLink href={`tel:${data.phone}`}>
                                {data.phone}
                            </ActionLink>
                        </p>
                    </div>
                    
                    <div>
                        <span className="font-semibold">Presupuesto</span>
                        <p className="heading-text font-bold">
                            {formatCurrency(data.budget_min)} - {formatCurrency(data.budget_max)}
                        </p>
                    </div>
                    
                    <div>
                        <span className="font-semibold">Tipo de propiedad</span>
                        <p className="heading-text font-bold capitalize">
                            {data.property_type}
                        </p>
                    </div>
                    
                    {data.agent && (
                        <div>
                            <span className="font-semibold">Agente asignado</span>
                            <p className="heading-text font-bold flex items-center gap-2 mt-1">
                                <Avatar
                                    size={24}
                                    shape="circle"
                                    src={data.agent.img || "https://i.pravatar.cc/150?img=68"}
                                />
                                <ActionLink href={`/modules/agents/agent-details/${data.agent.id}`}>
                                    {data.agent.name}
                                </ActionLink>
                            </p>
                        </div>
                    )}
                    
                    <div>
                        <span className="font-semibold">Último contacto</span>
                        <p className="heading-text font-bold">
                            {data.last_contact_date ? new Date(data.last_contact_date).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    
                    <div>
                        <span className="font-semibold">Próximo contacto</span>
                        <p className="heading-text font-bold">
                            {data.next_contact_date ? new Date(data.next_contact_date).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                    
                    <div>
                        <span className="font-semibold">Fuente</span>
                        <p className="heading-text font-bold">
                            {data.source || 'Desconocido'}
                        </p>
                    </div>
                </div>
                
                {data.notes && (
                    <div className="mt-6">
                        <span className="font-semibold">Notas</span>
                        <p className="text-sm text-gray-600 mt-1">{data.notes}</p>
                    </div>
                )}
                
                <div className="flex flex-col gap-4 mt-8">
                    <Button block variant="solid" onClick={handleScheduleAppointment}>
                        Programar Cita
                    </Button>
                    <Button block onClick={handleSendMessage}>
                        Enviar Mensaje
                    </Button>
                    <Button
                        block
                        customColorClass={() =>
                            'text-error hover:border-error hover:ring-1 ring-error hover:text-error'
                        }
                        icon={<HiOutlineTrash />}
                        onClick={handleDialogOpen}
                    >
                        Eliminar
                    </Button>
                </div>
                
                <ConfirmDialog
                    isOpen={dialogOpen}
                    type="danger"
                    title="Eliminar prospecto"
                    onClose={handleDialogClose}
                    onRequestClose={handleDialogClose}
                    onCancel={handleDialogClose}
                    onConfirm={handleDelete}
                >
                    <p>
                        ¿Está seguro que desea eliminar este prospecto? Todos los registros relacionados con este prospecto también serán eliminados. Esta acción no se puede deshacer.
                    </p>
                </ConfirmDialog>
            </div>
        </Card>
    )
}

export default ProfileSection