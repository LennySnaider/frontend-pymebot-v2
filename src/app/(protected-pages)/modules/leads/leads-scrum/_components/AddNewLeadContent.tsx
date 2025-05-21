/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/AddNewLeadContent.tsx
 * Formulario para crear un nuevo lead inmobiliario en el funnel de ventas.
 * Simplificado para su uso en primer contacto y con chatbot.
 *
 * @version 3.2.0
 * @updated 2025-04-14
 */

'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import DatePicker from '@/components/ui/DatePicker'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import Avatar from '@/components/ui/Avatar'
import Steps from '@/components/ui/Steps'
import { useSalesFunnelStore } from '../_store/salesFunnelStore'
import { createUID, leadFormOptions } from '../utils'
import { useTranslations } from 'next-intl'
import { toast } from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import type { FormEvent } from 'react'
import type { Lead, Member } from '../types'

interface MemberOption {
    value: string
    label: React.ReactNode
    img?: string
    name?: string
    email?: string
}

interface FormData {
    name: string
    email: string
    phone: string
    description: string
    interest: string
    propertyType: string
    budget: string
    preferredZones: string[]
    bedroomsNeeded: string
    bathroomsNeeded: string
    operation: string
    source: string
    notes: string
    nextContactDate: number | null
}

// Función para crear un objeto Lead a partir de los datos del formulario
const createLeadFromFormData = (
    formData: FormData,
    members: Member[],
    stage: string,
): Lead => {
    // Usar UUID v4 estándar sin parámetro para obtener un formato compatible con PostgreSQL
    const id = createUID()
    
    // Convertir nextContactDate a formato ISO si es un timestamp
    let nextContactDateIso = null;
    if (formData.nextContactDate) {
        if (typeof formData.nextContactDate === 'number') {
            // Convertir timestamp a ISO string para compatibilidad con PostgreSQL
            nextContactDateIso = new Date(formData.nextContactDate).toISOString();
        } else {
            nextContactDateIso = formData.nextContactDate;
        }
    }

    return {
        id,
        name: formData.name || 'Nuevo Prospecto',
        description:
            formData.description || 'Información del prospecto inmobiliario.',
        cover: '',
        members,
        labels: ['Nuevo contacto'],
        attachments: [],
        comments: [],
        dueDate: formData.nextContactDate || undefined,
        stage, // Usamos el stage proporcionado ('new' en lugar de 'prospecting')
        metadata: {
            email: formData.email,
            phone: formData.phone,
            interest: (formData.interest as any) || 'medio',
            source: formData.source,
            budget: formData.budget ? parseFloat(formData.budget) : undefined,
            propertyType: formData.propertyType,
            preferredZones: formData.preferredZones,
            bedroomsNeeded: formData.bedroomsNeeded
                ? parseInt(formData.bedroomsNeeded, 10)
                : undefined,
            bathroomsNeeded: formData.bathroomsNeeded
                ? parseFloat(formData.bathroomsNeeded)
                : undefined,
            leadStatus: stage,
            lastContactDate: new Date().toISOString(), // Usar formato ISO en lugar de timestamp
            nextContactDate: nextContactDateIso, // Usar la versión ISO convertida
            agentNotes: formData.notes,
        },
        contactCount: 0,
        createdAt: Date.now(), // Esto es para UI, no va directamente a DB
        email: formData.email,
        phone: formData.phone,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        // Añadir el next_contact_date en formato ISO para enviarlo a la API
        next_contact_date: nextContactDateIso
    }
}

// Función para mostrar notificaciones toast
const showToast = (
    message: string,
    type: 'success' | 'danger' | 'warning' | 'info' = 'success',
) => {
    if (typeof window !== 'undefined') {
        toast.push(
            <Notification
                title={
                    type === 'success'
                        ? 'Éxito'
                        : type === 'danger'
                          ? 'Error'
                          : type === 'warning'
                            ? 'Advertencia'
                            : 'Información'
                }
                type={type}
            >
                {message}
            </Notification>,
            { placement: 'top-center' },
        )
    }
}

const AddNewLeadContent = () => {
    const t = useTranslations('salesFunnel')

    // Acceder al store del funnel
    const {
        dialogOpen,
        dialogView,
        closeDialog,
        columns,
        updateColumns,
        boardMembers,
    } = useSalesFunnelStore()

    // Estado para el paso actual del formulario
    const [currentStep, setCurrentStep] = useState(0)

    // Estado del formulario
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        description: '',
        interest: '',
        propertyType: '',
        budget: '',
        preferredZones: [],
        bedroomsNeeded: '',
        bathroomsNeeded: '',
        operation: '',
        source: '',
        notes: '',
        nextContactDate: null,
    })

    // Estado para los miembros seleccionados
    const [selectedMembers, setSelectedMembers] = useState<MemberOption[]>([])

    // Convertir miembros a opciones para el selector
    const memberOptions: MemberOption[] = boardMembers.map((member) => ({
        value: member.id,
        label: (
            <div className="flex items-center gap-2">
                <Avatar size={20} shape="circle" src={member.img} />
                <span>{member.name}</span>
            </div>
        ),
        img: member.img,
        name: member.name,
        email: member.email,
    }))

    // Pasos del formulario
    const steps = [
        {
            title: 'Información Básica',
            description: 'Datos del prospecto',
        },
        {
            title: 'Información Inmobiliaria',
            description: 'Preferencias generales',
        },
        {
            title: 'Seguimiento',
            description: 'Asignación y próximos pasos',
        },
    ]

    // Funciones para navegar entre pasos
    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    // Manejar cambios en los inputs de texto
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Manejar cambios en selects y otros elementos
    const handleSelectChange = (name: string, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Manejar selección de miembros
    const handleMemberChange = (value: any, option: any) => {
        setSelectedMembers(Array.isArray(option) ? option : [])
    }

    // Manejar cambio de fecha de contacto
    const handleDateChange = (date: Date | null) => {
        setFormData((prev) => ({
            ...prev,
            nextContactDate: date?.getTime() || null,
        }))
    }

    // Enviar formulario
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()

        try {
            // Verificar que todos los campos requeridos estén completos
            if (!formData.name.trim()) {
                showToast('El nombre del prospecto es obligatorio', 'danger')
                return
            }

            // Verificar que si estamos en el último paso
            if (currentStep < steps.length - 1) {
                nextStep()
                return
            }

            // Convertir miembros seleccionados al formato esperado
            const members = selectedMembers.map((member) => ({
                id: member.value as string,
                name: member.name || '',
                email: member.email || '',
                img: member.img || '',
            }))

            // Asegurar que la etapa sea SIEMPRE 'new'
            const newLead = createLeadFromFormData(formData, members, 'new')

            // Forzar que la etapa siempre sea 'new' independientemente del valor que venga
            newLead.stage = 'new'

            // Asegurarnos de que metadata.leadStatus esté sincronizado con stage
            if (newLead.metadata) {
                newLead.metadata.leadStatus = newLead.stage
            }

            // Preparar los datos para enviar a la API asegurando que las fechas estén en formato ISO
            const apiData = {
                ...newLead,
                // Asegurar que next_contact_date está en formato ISO
                next_contact_date: newLead.next_contact_date,
                // Asegurar que las fechas en metadata también estén en formato ISO
                metadata: {
                    ...newLead.metadata,
                    // La fecha de último contacto siempre en ISO
                    lastContactDate: typeof newLead.metadata?.lastContactDate === 'number' 
                        ? new Date(newLead.metadata.lastContactDate).toISOString() 
                        : newLead.metadata?.lastContactDate,
                    // La fecha de próximo contacto siempre en ISO
                    nextContactDate: newLead.metadata?.nextContactDate
                }
            };

            console.log(
                'Enviando lead a la API:',
                JSON.stringify(apiData, null, 2),
            )

            // Guardar en la base de datos mediante API
            const response = await fetch('/api/leads/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData),
            })

            const responseData = await response.json()

            if (!response.ok) {
                // Usar console.warn en lugar de console.error para evitar mensajes alarmantes
                console.warn('Respuesta no exitosa del servidor:', 
                    typeof responseData === 'object' && Object.keys(responseData).length === 0 
                        ? 'Objeto vacío {}' : responseData
                );
                
                // No lanzar error, mostrar toast y continuar
                showToast(
                    'No se pudo guardar el lead. Por favor, intente nuevamente.',
                    'danger',
                );
                
                // Salir temprano sin lanzar error
                return;
            }

            console.log('Respuesta del servidor:', responseData)

            // Si la respuesta es exitosa, actualizamos el store
            // Aseguramos que exista la columna 'new'
            if (!columns['new']) {
                columns['new'] = []
            }

            // Añadimos el nuevo lead con etapa 'new' asegurada
            const leadWithConfirmedStage = { ...newLead, stage: 'new' }

            updateColumns({
                ...columns,
                new: [...columns['new'], leadWithConfirmedStage],
            })

            // Notificar éxito
            showToast('Lead creado correctamente', 'success')

            // Cerrar el diálogo
            closeDialog()
        } catch (error) {
            // Usar console.warn en lugar de console.error para evitar mensajes alarmantes
            console.warn('Error controlado al crear lead:', 
                typeof error === 'object' && Object.keys(error).length === 0 ? 'Objeto vacío {}' : error
            );
            
            showToast(
                'No se pudo guardar el lead. Por favor, intente nuevamente.',
                'danger',
            )
        }
    }

    // Componente de paso 1: Información básica
    const renderBasicInfoStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('name', { defaultValue: 'Nombre' })} *
                </label>
                <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('namePlaceholder', {
                        defaultValue: 'Nombre del cliente',
                    })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('interest', {
                        defaultValue: 'Nivel de interés',
                    })}
                </label>
                <Select
                    options={leadFormOptions.interestLevels}
                    value={formData.interest}
                    onChange={(value) => handleSelectChange('interest', value)}
                    placeholder={t('interestPlaceholder', {
                        defaultValue: 'Seleccionar nivel',
                    })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('email', { defaultValue: 'Email' })}
                </label>
                <Input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('emailPlaceholder', {
                        defaultValue: 'Email del cliente',
                    })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('phone', { defaultValue: 'Teléfono' })}
                </label>
                <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t('phonePlaceholder', {
                        defaultValue: 'Teléfono del cliente',
                    })}
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                    {t('description', { defaultValue: 'Descripción' })}
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t('descriptionPlaceholder', {
                        defaultValue: 'Descripción de la necesidad del cliente',
                    })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-500 dark:bg-gray-800"
                    rows={3}
                />
            </div>
        </div>
    )

    // Componente de paso 2: Información inmobiliaria simplificada
    const renderPropertyInfoStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('operation', { defaultValue: 'Operación' })}
                </label>
                <Select
                    options={[
                        { value: 'compra', label: 'Compra' } as any,
                        { value: 'renta', label: 'Renta' } as any,
                        { value: 'inversion', label: 'Inversión' } as any,
                    ]}
                    value={formData.operation}
                    onChange={(value) =>
                        handleSelectChange('operation', value)
                    }
                    placeholder={t('operationPlaceholder', {
                        defaultValue: 'Tipo de operación',
                    })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('propertyType', {
                        defaultValue: 'Tipo de propiedad',
                    })}
                </label>
                <Select
                    options={leadFormOptions.propertyTypes}
                    value={formData.propertyType}
                    onChange={(value) =>
                        handleSelectChange('propertyType', value)
                    }
                    placeholder={t('propertyTypePlaceholder', {
                        defaultValue: 'Seleccionar tipo',
                    })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('budget', { defaultValue: 'Presupuesto' })}
                </label>
                <Input
                    name="budget"
                    type="number"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder={t('budgetPlaceholder', {
                        defaultValue: 'Presupuesto aproximado',
                    })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('source', { defaultValue: 'Fuente del lead' })}
                </label>
                <Select
                    options={leadFormOptions.leadSources}
                    value={formData.source}
                    onChange={(value) =>
                        handleSelectChange('source', value)
                    }
                    placeholder={t('sourcePlaceholder', {
                        defaultValue: 'Origen del contacto',
                    })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('bedrooms', { defaultValue: 'Habitaciones' })}
                </label>
                <Input
                    name="bedroomsNeeded"
                    type="number"
                    min="0"
                    value={formData.bedroomsNeeded}
                    onChange={handleInputChange}
                    placeholder={t('bedroomsPlaceholder', {
                        defaultValue: 'Número de habitaciones',
                    })}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('bathrooms', { defaultValue: 'Baños' })}
                </label>
                <Input
                    name="bathroomsNeeded"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.bathroomsNeeded}
                    onChange={handleInputChange}
                    placeholder={t('bathroomsPlaceholder', {
                        defaultValue: 'Número de baños',
                    })}
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                    {t('preferredZones', {
                        defaultValue: 'Zonas preferidas',
                    })}
                </label>
                <Select
                    options={[
                        { value: 'norte', label: 'Zona Norte' } as any,
                        { value: 'sur', label: 'Zona Sur' } as any,
                        { value: 'este', label: 'Zona Este' } as any,
                        { value: 'oeste', label: 'Zona Oeste' } as any,
                        { value: 'centro', label: 'Centro' } as any,
                    ]}
                    value={formData.preferredZones}
                    onChange={(value) =>
                        handleSelectChange('preferredZones', value)
                    }
                    placeholder={t('zonesPlaceholder', {
                        defaultValue: 'Seleccionar zonas',
                    })}
                    isMulti
                />
            </div>
        </div>
    )

    // Componente de paso 3: Información de seguimiento
    const renderFollowupInfoStep = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('assignedAgent', {
                        defaultValue: 'Agente asignado',
                    })}
                </label>
                <Select
                    options={memberOptions as any}
                    value={selectedMembers.map((m) => m.value)}
                    onChange={handleMemberChange}
                    placeholder={t('agentPlaceholder', {
                        defaultValue: 'Seleccionar agente',
                    })}
                    isMulti
                />
                {selectedMembers.length > 0 && (
                    <div className="mt-2">
                        <UsersAvatarGroup
                            avatarProps={{ size: 25 }}
                            users={selectedMembers.map((m) => ({
                                id: m.value as string,
                                name: m.name || '',
                                img: m.img || '',
                            }))}
                        />
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {t('nextContact', {
                        defaultValue: 'Próximo contacto',
                    })}
                </label>
                <DatePicker
                    value={
                        formData.nextContactDate
                            ? new Date(formData.nextContactDate)
                            : null
                    }
                    onChange={handleDateChange}
                    placeholder={t('datePlaceholder', {
                        defaultValue: 'Seleccionar fecha',
                    })}
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                    {t('notes', { defaultValue: 'Notas del agente' })}
                </label>
                <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder={t('notesPlaceholder', {
                        defaultValue: 'Notas internas sobre el lead',
                    })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:outline-none focus:ring focus:border-blue-500 dark:bg-gray-800"
                    rows={3}
                />
            </div>
        </div>
    )

    // Renderizar el contenido según el paso actual
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderBasicInfoStep()
            case 1:
                return renderPropertyInfoStep()
            case 2:
                return renderFollowupInfoStep()
            default:
                return renderBasicInfoStep()
        }
    }

    const renderStepButtons = () => {
        return (
            <div className="flex justify-between mt-6">
                <div>
                    {currentStep > 0 && (
                        <Button variant="plain" onClick={prevStep}>
                            {t('appointment.previous', {
                                defaultValue: 'Anterior',
                            })}
                        </Button>
                    )}
                </div>
                <div>
                    <Button
                        className="mr-2"
                        variant="plain"
                        onClick={closeDialog}
                    >
                        {t('cancel', { defaultValue: 'Cancelar' })}
                    </Button>
                    {currentStep < steps.length - 1 ? (
                        <Button variant="solid" onClick={nextStep}>
                            {t('appointment.next', {
                                defaultValue: 'Siguiente',
                            })}
                        </Button>
                    ) : (
                        <Button variant="solid" onClick={handleSubmit}>
                            {t('create', { defaultValue: 'Crear lead' })}
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Dialog
            isOpen={dialogOpen && dialogView === 'NEW_LEAD'}
            onClose={closeDialog}
            onRequestClose={closeDialog}
            closable
            width={800}
        >
            <h5 className="mb-4 flex items-center gap-2">
                {t('title', { defaultValue: 'Añadir nuevo lead' })}
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                    {t('newLead', { defaultValue: 'Nuevo' })}
                </span>
            </h5>

            {/* Componente Steps para mostrar progreso */}
            <div className="mb-6">
                <Steps current={currentStep}>
                    {steps.map((step, index) => (
                        <Steps.Item
                            key={index}
                            title={step.title}
                            description={step.description}
                        />
                    ))}
                </Steps>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    if (currentStep === steps.length - 1) {
                        handleSubmit(e)
                    } else {
                        nextStep()
                    }
                }}
            >
                {renderStepContent()}
                {renderStepButtons()}
            </form>
        </Dialog>
    )
}

export default AddNewLeadContent
