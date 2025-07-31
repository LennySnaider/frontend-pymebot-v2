/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-scrum/utils.ts
 * Utilidades para el módulo de gestión de leads inmobiliarios.
 * Incluye funciones para crear UIDs, objetos lead, y etapas del funnel.
 * Mejorado para asegurar coherencia entre UI y DB, y mejor manejo de miembros.
 *
 * @version 2.3.0
 * @updated 2025-04-14
 */

import type {
    Ticket,
    Lead,
    FunnelStage,
    Appointment,
    PropertyType,
} from './types'

// Genera un UUID v4 estándar, compatible con PostgreSQL
export const createUID = (): string => {
    // Siempre generar un UUID v4 válido para PostgreSQL para compatibilidad con la base de datos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

export const formatBudget = (budget?: number): string => {
    if (!budget && budget !== 0) return 'N/A'

    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
    }).format(budget)
}

export const formatDate = (date: string | number | Date): string => {
    if (!date) return 'N/A'

    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(date))
}

export const formatTime = (time: string): string => {
    if (!time) return 'N/A'

    // Si ya tiene formato HH:MM, devolverlo tal cual
    if (/^\d{1,2}:\d{2}$/.test(time)) {
        return time
    }

    // Intentar convertir a formato de 24 horas
    try {
        const [hours, minutes] = time.split(':').map(Number)
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    } catch (e) {
        return time
    }
}

export const createCardObject = (): Ticket => {
    return {
        id: createUID(),
        name: 'Untitled Card',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        cover: '',
        members: [],
        labels: ['Task'],
        attachments: [],
        comments: [],
        dueDate: null,
    }
}

export interface LeadFormData {
    name?: string
    email?: string
    phone?: string
    description?: string
    interest?: 'alto' | 'medio' | 'bajo' | string
    propertyType?: string
    budget?: string
    preferredZones?: string[]
    bedroomsNeeded?: string
    bathroomsNeeded?: string
    operation?: string
    source?: string
    notes?: string
    nextContactDate?: number | null
    selectedProperties?: string[]
}

/**
 * Crea un objeto Lead para usarse en la interfaz de usuario a partir de datos del formulario.
 * Mejorado para asegurar consistencia de datos entre la UI y la BD, incluyendo manejo de miembros.
 *
 * @param formData - Datos del formulario de lead
 * @param members - Agentes asignados al lead (Importante: debe ser un array completo de objetos Member)
 * @param stage - Etapa del lead en el funnel ('new', 'prospecting', etc.)
 * @returns Objeto Lead listo para usar en la UI
 */
export const createLeadObject = (
    formData: LeadFormData = {},
    members: any[] = [],
    stage: string = 'new',
): Lead => {
    // Generar un ID único para este lead
    const id = createUID()

    // Verificar que los miembros tengan todas las propiedades necesarias
    const validMembers = members.map((member) => {
        // Verificamos la existencia de cada propiedad y proporcionamos valores por defecto
        return {
            id: member.id || createUID(),
            name: member.name || 'Agente',
            email: member.email || '',
            img: member.img || '/img/avatars/default.png', // Imagen por defecto
        }
    })

    // Convertir el nivel de interés a etiquetas para mostrar en la UI
    const interestLabels = formData.interest
        ? [interestToLabel(formData.interest)]
        : ['Media prioridad']

    // Asegurarnos que siempre tenemos 'Nuevo contacto' como etiqueta
    const labels = ['Nuevo contacto', ...interestLabels]
        // Eliminar duplicados si hay
        .filter((label, index, self) => self.indexOf(label) === index)

    // Crear el lead con todos los datos necesarios
    return {
        id,
        name: formData.name || 'Nuevo Prospecto',
        description:
            formData.description || 'Información del prospecto inmobiliario.',
        cover: '',
        members: validMembers, // Usar miembros validados
        labels,
        attachments: [],
        comments: [],
        dueDate: formData.nextContactDate || null,
        stage, // Usamos el stage proporcionado, por defecto 'new'
        metadata: {
            email: formData.email,
            phone: formData.phone,
            interest:
                (formData.interest as 'alto' | 'medio' | 'bajo') || 'medio',
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
            leadStatus: stage, // Asegurar que leadStatus coincide con stage
            lastContactDate: Date.now(),
            nextContactDate: formData.nextContactDate || undefined,
            agentNotes: formData.notes,
            selectedProperties: formData.selectedProperties || ['no-property'],
            original_ui_id: id, // Guardar el ID original de la UI para referencias
        } as any,
        contactCount: 0,
        createdAt: Date.now(),
        email: formData.email,
        phone: formData.phone,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
    }
}

// Crear un objeto de cita predeterminado
export const createAppointmentObject = (
    leadId: string,
    agentId: string = 'agent1',
): Appointment => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)

    return {
        id: `app-${createUID()}`,
        leadId,
        date: tomorrow.toISOString(),
        time: '10:00',
        location: 'Oficina principal',
        propertyType: 'Apartamento',
        agentId,
        status: 'scheduled',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
}

export const taskLabelColors: Record<string, string> = {
    'Live issue': 'bg-rose-200 dark:bg-rose-200 dark:text-gray-900',
    Task: 'bg-blue-200 dark:bg-blue-200 dark:text-gray-900',
    Bug: 'bg-amber-200 dark:bg-amber-200 dark:text-gray-900',
    'Low priority': 'bg-purple-200 dark:bg-purple-200 dark:text-gray-900',
}

export const leadLabelColors: Record<string, string> = {
    'Alta prioridad': 'bg-rose-100 dark:bg-rose-300/40 dark:text-gray-900',
    'Media prioridad': 'bg-amber-100 dark:bg-amber-300/40 dark:text-gray-900',
    'Baja prioridad': 'bg-purple-100 dark:bg-purple-300/40 dark:text-gray-900',
    'Nuevo contacto': 'bg-blue-100 dark:bg-blue-300/40 dark:text-gray-900',
    Compra: 'bg-emerald-200 dark:bg-emerald-300/40 dark:text-gray-900',
    Alquiler: 'bg-indigo-200 dark:bg-indigo-300/40 dark:text-gray-900',
    Inversión: 'bg-violet-200 dark:bg-violet-300/40 dark:text-gray-900',
    Comercial: 'bg-orange-200 dark:bg-orange-300/40 dark:text-gray-900',
    'Cita agendada': 'bg-cyan-200 dark:bg-cyan-300/40 dark:text-gray-900',
    Calificado: 'bg-lime-200 dark:bg-lime-300/40 dark:text-gray-900',
    Negociando: 'bg-yellow-200 dark:bg-yellow-300/40 dark:text-gray-900',
    Cerrado: 'bg-gray-200 dark:bg-gray-200 dark:text-gray-900',
    'Segunda vivienda': 'bg-teal-200 dark:bg-teal-300/40 dark:text-gray-900',
    'Opción compra': 'bg-pink-200 dark:bg-pink-300/40 dark:text-gray-900',
}

export const labelList = ['Task', 'Bug', 'Live issue', 'Low priority']

export const leadLabelList = [
    'Alta prioridad',
    'Media prioridad',
    'Baja prioridad',
    'Nuevo contacto',
    'Compra',
    'Alquiler',
    'Inversión',
    'Comercial',
    'Cita agendada',
    'Calificado',
    'Negociación',
    'Segunda vivienda',
    'Opción compra',
]

// Definición de las etapas del funnel de ventas inmobiliario
export const defaultFunnelStages: FunnelStage[] = [
    {
        id: 'new', // Cambiado a 'new' para ser coherente con la BD
        name: 'Nuevo',
        description: 'Leads recién creados',
        order: 0,
        color: '#1abc9c',
    },
    {
        id: 'prospecting',
        name: 'Adquisición',
        description: 'Nuevos leads adquiridos',
        order: 1,
        color: '#3498db',
    },
    {
        id: 'qualification',
        name: 'Prospección',
        description: 'Leads siendo contactados y evaluados',
        order: 2,
        color: '#9b59b6',
    },
    {
        id: 'meeting',
        name: 'Calificación',
        description: 'Leads con interés confirmado',
        order: 3,
        color: '#f1c40f',
    },
    {
        id: 'proposal',
        name: 'Oportunidad',
        description: 'Propuestas presentadas',
        order: 4,
        color: '#e67e22',
    },
]

// Opciones para el formulario de leads
export const leadFormOptions = {
    propertyTypes: [
        { value: 'Apartamento', label: 'Apartamento' },
        { value: 'Casa', label: 'Casa' },
        { value: 'Local Comercial', label: 'Local Comercial' },
        { value: 'Oficina', label: 'Oficina' },
        { value: 'Terreno', label: 'Terreno' },
        { value: 'Nave Industrial', label: 'Nave Industrial' },
    ],
    leadSources: [
        { value: 'Web', label: 'Página Web' },
        { value: 'Facebook', label: 'Facebook' },
        { value: 'Instagram', label: 'Instagram' },
        { value: 'Referido', label: 'Referido' },
        { value: 'Portal', label: 'Portal Inmobiliario' },
        { value: 'LinkedIn', label: 'LinkedIn' },
        { value: 'Cartelería', label: 'Cartelería' },
        { value: 'Email', label: 'Email Marketing' },
    ],
    leadStatus: [
        { value: 'new', label: 'Nuevo' }, // Cambiado de 'nuevo' a 'new'
        { value: 'prospecting', label: 'Prospección' },
        { value: 'qualification', label: 'Calificación' },
        { value: 'meeting', label: 'Reunión' },
        { value: 'proposal', label: 'Propuesta' },
        { value: 'closed', label: 'Cerrado' },
        { value: 'lost', label: 'Perdido' },
    ],
    interestLevels: [
        { value: 'alto', label: 'Alto' },
        { value: 'medio', label: 'Medio' },
        { value: 'bajo', label: 'Bajo' },
    ],
    appointmentStatus: [
        { value: 'scheduled', label: 'Programada' },
        { value: 'confirmed', label: 'Confirmada' },
        { value: 'rescheduled', label: 'Reprogramada' },
        { value: 'cancelled', label: 'Cancelada' },
        { value: 'completed', label: 'Completada' },
    ],
    agents: [
        { value: 'agent1', label: 'Carlos Rodríguez' },
        { value: 'agent2', label: 'Ana Martínez' },
        { value: 'agent3', label: 'Miguel Sánchez' },
        { value: 'agent4', label: 'Laura González' },
        { value: 'agent5', label: 'Javier López' },
    ],
}

// Mapeo de nombres de columnas antiguas a nuevas
export const columnNameMap = {
    'To Do': 'Nuevo',
    'In Progress': 'Adquisición',
    'To Review': 'Prospección',
    Completed: 'Calificación',
    toDo: 'new',
    inProgress: 'prospecting',
    toReview: 'qualification',
    completed: 'meeting',
}

// Función para convertir un nivel de interés a etiqueta
export const interestToLabel = (interest: string | undefined): string => {
    switch (interest) {
        case 'alto':
            return 'Alta prioridad'
        case 'medio':
            return 'Media prioridad'
        case 'bajo':
            return 'Baja prioridad'
        default:
            return 'Media prioridad'
    }
}
