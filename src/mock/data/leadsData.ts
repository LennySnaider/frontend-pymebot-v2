/**
 * frontend/src/mock/data/leadsData.ts
 * Datos de ejemplo para el módulo de gestión de leads inmobiliarios.
 * Define leads inmobiliarios para diferentes etapas del funnel de ventas.
 * Reorganizado para usar las nuevas etapas: Nuevos, Prospectando, Calificación y Oportunidad.
 *
 * @version 3.0.1
 * @updated 2025-04-14
 */

import { Lead, Member } from '@/app/(protected-pages)/modules/leads/leads-scrum/types'

// Año actual para fechas
const y = new Date().getFullYear()

// Miembros comunes (agentes inmobiliarios)
export const boardMembers: Member[] = [
    {
        id: '1',
        name: 'Carlos Mendoza',
        email: 'cmendoza@agentprop.com',
        img: '/img/avatars/thumb-1.jpg',
    },
    {
        id: '2',
        name: 'Marta Rivas',
        email: 'mrivas@agentprop.com',
        img: '/img/avatars/thumb-2.jpg',
    },
    {
        id: '3',
        name: 'Alejandro Torres',
        email: 'atorres@agentprop.com',
        img: '/img/avatars/thumb-3.jpg',
    },
    {
        id: '4',
        name: 'Sofía Blanco',
        email: 'sblanco@agentprop.com',
        img: '/img/avatars/thumb-4.jpg',
    },
    {
        id: '5',
        name: 'Eduardo Gómez',
        email: 'egomez@agentprop.com',
        img: '/img/avatars/thumb-5.jpg',
    },
    {
        id: '8',
        name: 'Laura Vega',
        email: 'lvega@agentprop.com',
        img: '/img/avatars/thumb-8.jpg',
    },
]

// Leads en estado "Nuevos" (Recién ingresados al sistema)
const newLeads: Lead[] = [
    {
        id: 'lead-001',
        name: 'Juan Pérez',
        description: 'Interesado en apartamentos de 2 habitaciones en zona norte. Presupuesto aproximado: $150,000. Contacto inicial a través de anuncio en Facebook.',
        members: [boardMembers[0], boardMembers[1]],
        labels: ['Alta prioridad', 'Compra', 'Nuevo contacto'],
        dueDate: new Date(y, 3, 15).getTime(),
        metadata: {
            email: 'juanperez@gmail.com',
            phone: '+34 612 345 678',
            interest: 'alto',
            source: 'Facebook',
            budget: 150000,
            propertyType: 'Apartamento',
            preferredZones: ['Zona Norte', 'Centro'],
            bedroomsNeeded: 2,
            bathroomsNeeded: 1,
            leadStatus: 'nuevo',
            lastContactDate: new Date(y, 3, 5).getTime(),
            nextContactDate: new Date(y, 3, 15).getTime(),
        },
        cover: '',
        attachments: [],
        comments: [],
        createdAt: new Date(y, 3, 5).getTime(),
        contactCount: 0,
        columnId: 'new'
    },
    {
        id: 'lead-002',
        name: 'María López',
        description: 'Busca casa con jardín para familia con niños. Zona residencial tranquila. Presupuesto hasta $250,000.',
        members: [boardMembers[2]],
        labels: ['Media prioridad', 'Compra', 'Nuevo contacto'],
        dueDate: new Date(y, 3, 20).getTime(),
        metadata: {
            email: 'marialopez@outlook.com',
            phone: '+34 623 456 789',
            interest: 'medio',
            source: 'Referido',
            budget: 250000,
            propertyType: 'Casa',
            preferredZones: ['Zona Residencial', 'Afueras'],
            bedroomsNeeded: 3,
            bathroomsNeeded: 2,
            leadStatus: 'nuevo',
            lastContactDate: new Date(y, 3, 8).getTime(),
            nextContactDate: new Date(y, 3, 20).getTime(),
        },
        cover: '',
        attachments: [],
        comments: [],
        createdAt: new Date(y, 3, 8).getTime(),
        contactCount: 0,
        columnId: 'new'
    }
]

// Leads en estado "Prospectando" (Contacto inicial)
const prospectingLeads: Lead[] = [
    {
        id: 'lead-003',
        name: 'Roberto Sánchez',
        description: 'Inversor buscando propiedades para alquilar. Interesado en múltiples unidades si el precio es adecuado.',
        members: [boardMembers[0], boardMembers[4]],
        labels: ['Alta prioridad', 'Inversión', 'Contactado'],
        dueDate: new Date(y, 3, 18).getTime(),
        metadata: {
            email: 'roberto.inversiones@empresa.com',
            phone: '+34 634 567 890',
            interest: 'alto',
            source: 'Página web',
            budget: 500000,
            propertyType: 'Varios',
            preferredZones: ['Centro', 'Zona Comercial'],
            leadStatus: 'contactado',
            lastContactDate: new Date(y, 3, 10).getTime(),
            nextContactDate: new Date(y, 3, 18).getTime(),
            agentNotes: 'Cliente con historial de inversiones previas. Posibilidad de venta múltiple.'
        },
        cover: '',
        attachments: [],
        comments: [
            {
                id: 'comment-003',
                name: 'Eduardo Gómez',
                src: '/img/avatars/thumb-5.jpg',
                message: 'He preparado un dossier con varias propiedades que pueden interesarle. Agendar reunión cuanto antes.',
                date: new Date(y, 3, 10),
            },
        ],
        createdAt: new Date(y, 3, 10).getTime(),
        contactCount: 1,
        columnId: 'prospecting'
    },
    {
        id: 'lead-004',
        name: 'Carmen Rodríguez',
        description: 'Pareja joven buscando su primera vivienda. Preferiblemente cerca de transporte público.',
        members: [boardMembers[1]],
        labels: ['Media prioridad', 'Compra', 'Contactado'],
        dueDate: new Date(y, 3, 25).getTime(),
        metadata: {
            email: 'carmen.rodriguez@gmail.com',
            phone: '+34 645 678 901',
            interest: 'medio',
            source: 'Instagram',
            budget: 180000,
            propertyType: 'Apartamento',
            preferredZones: ['Centro', 'Zona Universitaria'],
            bedroomsNeeded: 2,
            bathroomsNeeded: 1,
            leadStatus: 'contactado',
            lastContactDate: new Date(y, 3, 12).getTime(),
            nextContactDate: new Date(y, 3, 25).getTime(),
        },
        cover: '',
        attachments: [],
        comments: [
            {
                id: 'comment-004',
                name: 'Marta Rivas',
                src: '/img/avatars/thumb-2.jpg',
                message: 'Primer contacto realizado, interesados en conocer opciones disponibles.',
                date: new Date(y, 3, 12),
            },
        ],
        createdAt: new Date(y, 3, 7).getTime(),
        contactCount: 1,
        columnId: 'prospecting'
    }
]

// Leads en estado "Calificación" (Evaluación de interés y capacidad)
const qualificationLeads: Lead[] = [
    {
        id: 'lead-005',
        name: 'Javier Martínez',
        description: 'Busca local comercial para montar restaurante. Mínimo 200m² con posibilidad de terraza.',
        members: [boardMembers[3]],
        labels: ['Alta prioridad', 'Comercial', 'Calificado'],
        dueDate: new Date(y, 3, 22).getTime(),
        metadata: {
            email: 'javier@restaurantemartinez.com',
            phone: '+34 656 789 012',
            interest: 'alto',
            source: 'Referido',
            budget: 350000,
            propertyType: 'Local Comercial',
            preferredZones: ['Zona Comercial', 'Centro'],
            leadStatus: 'calificado',
            lastContactDate: new Date(y, 3, 14).getTime(),
            nextContactDate: new Date(y, 3, 22).getTime(),
            agentNotes: 'Cliente necesita local con salida de humos y licencia de restauración.'
        },
        cover: '/img/others/img-15.jpg',
        attachments: [
            {
                id: 'attach-001',
                name: 'plano_local.jpg',
                src: '/img/others/img-15.jpg',
                size: '2.4MB',
                type: 'image',
                uploadDate: new Date(y, 3, 14).getTime(),
            },
        ],
        comments: [
            {
                id: 'comment-005',
                name: 'Sofía Blanco',
                src: '/img/avatars/thumb-4.jpg',
                message: 'Cliente con capacidad económica verificada. Posibilidad real de compra en los próximos 3 meses.',
                date: new Date(y, 3, 14),
            },
        ],
        createdAt: new Date(y, 3, 9).getTime(),
        contactCount: 3,
        columnId: 'qualification'
    },
    {
        id: 'lead-006',
        name: 'Ana Gómez',
        description: 'Busca apartamento de lujo en primera línea de playa. Presupuesto flexible para la propiedad adecuada.',
        members: [boardMembers[4]],
        labels: ['Alta prioridad', 'Compra', 'Calificado'],
        dueDate: new Date(y, 3, 23).getTime(),
        metadata: {
            email: 'ana.gomez@example.com',
            phone: '+34 678 901 234',
            interest: 'alto',
            source: 'Portal Inmobiliario',
            budget: 450000,
            propertyType: 'Apartamento',
            preferredZones: ['Playa', 'Puerto'],
            bedroomsNeeded: 3,
            bathroomsNeeded: 2,
            leadStatus: 'calificado',
            lastContactDate: new Date(y, 3, 16).getTime(),
            nextContactDate: new Date(y, 3, 23).getTime(),
        },
        cover: '',
        attachments: [
            {
                id: 'attach-002',
                name: 'propuesta_apartamento.pdf',
                src: '',
                size: '3.2MB',
                type: 'document',
                uploadDate: new Date(y, 3, 16).getTime(),
            },
        ],
        comments: [
            {
                id: 'comment-006',
                name: 'Eduardo Gómez',
                src: '/img/avatars/thumb-5.jpg',
                message: 'Cliente calificado. Verificada capacidad financiera y compromiso real de compra.',
                date: new Date(y, 3, 16),
            },
        ],
        createdAt: new Date(y, 3, 11).getTime(),
        contactCount: 4,
        columnId: 'qualification'
    }
]

// Leads en estado "Oportunidad" (Listos para agendar cita)
const opportunityLeads: Lead[] = [
    {
        id: 'lead-007',
        name: 'Fernando Gómez',
        description: 'Interesado en apartamento en la playa. Uso como segunda vivienda, posible alquiler vacacional.',
        members: [boardMembers[4], boardMembers[0]],
        labels: ['Alta prioridad', 'Segunda vivienda', 'Oportunidad'],
        dueDate: new Date(y, 3, 16).getTime(),
        metadata: {
            email: 'fgomez@empresa.es',
            phone: '+34 667 890 123',
            interest: 'alto',
            source: 'Portal Inmobiliario',
            budget: 220000,
            propertyType: 'Apartamento',
            preferredZones: ['Playa', 'Puerto'],
            bedroomsNeeded: 2,
            bathroomsNeeded: 2,
            leadStatus: 'oportunidad',
            lastContactDate: new Date(y, 3, 14).getTime(),
            nextContactDate: new Date(y, 3, 16).getTime(),
            agentNotes: 'Cliente listo para ver propiedades. Programar visitas lo antes posible.'
        },
        cover: '',
        attachments: [],
        comments: [
            {
                id: 'comment-007',
                name: 'Eduardo Gómez',
                src: '/img/avatars/thumb-5.jpg',
                message: 'Cliente muy interesado. Esperando disponibilidad para agendar visita a las propiedades seleccionadas.',
                date: new Date(y, 3, 14),
            },
        ],
        createdAt: new Date(y, 3, 5).getTime(),
        contactCount: 5,
        columnId: 'opportunity'
    },
    {
        id: 'lead-008',
        name: 'Lucía Fernández',
        description: 'Interesada en alquiler de oficina para estudio de arquitectura. 5 años mínimo de contrato.',
        members: [boardMembers[1]],
        labels: ['Media prioridad', 'Alquiler', 'Comercial', 'Oportunidad'],
        dueDate: new Date(y, 3, 19).getTime(),
        metadata: {
            email: 'lucia@arquitectosasociados.com',
            phone: '+34 678 901 234',
            interest: 'medio',
            source: 'LinkedIn',
            budget: 1200,
            propertyType: 'Oficina',
            preferredZones: ['Zona Empresarial', 'Centro'],
            leadStatus: 'oportunidad',
            lastContactDate: new Date(y, 3, 15).getTime(),
            nextContactDate: new Date(y, 3, 19).getTime(),
        },
        cover: '',
        attachments: [],
        comments: [
            {
                id: 'comment-008',
                name: 'Marta Rivas',
                src: '/img/avatars/thumb-2.jpg',
                message: 'Cliente lista para agendar citas para ver oficinas. Tiene disponibilidad jueves y viernes.',
                date: new Date(y, 3, 15),
            },
        ],
        createdAt: new Date(y, 3, 8).getTime(),
        contactCount: 4,
        columnId: 'opportunity'
    }
]

// Leads en estado "Confirmado" (Cita confirmada - irán a otra vista)
const confirmedLeads: Lead[] = [
    {
        id: 'lead-009',
        name: 'Antonio Vargas',
        description: 'Cita confirmada para ver 3 propiedades en la urbanización Los Pinos. Jueves a las 17:00.',
        members: [boardMembers[2], boardMembers[3]],
        labels: ['Alta prioridad', 'Compra', 'Cita confirmada'],
        dueDate: new Date(y, 3, 30).getTime(),
        metadata: {
            email: 'antonio.vargas@gmail.com',
            phone: '+34 689 012 345',
            interest: 'alto',
            source: 'Cartelería',
            budget: 320000,
            propertyType: 'Casa',
            preferredZones: ['Urbanización'],
            bedroomsNeeded: 4,
            bathroomsNeeded: 3,
            leadStatus: 'confirmado',
            lastContactDate: new Date(y, 3, 16).getTime(),
            nextContactDate: new Date(y, 3, 30).getTime(),
            appointmentDate: new Date(y, 3, 26).getTime(),
            appointmentType: 'presencial',
            appointmentLocation: 'Urbanización Los Pinos',
            appointmentNotes: 'Cliente muy interesado en la casa modelo Berlín de 4 habitaciones.'
        },
        cover: '',
        attachments: [],
        comments: [
            {
                id: 'comment-009',
                name: 'Alejandro Torres',
                src: '/img/avatars/thumb-3.jpg',
                message: 'Cita confirmada para el jueves. Cliente muy motivado para comprar en esta urbanización.',
                date: new Date(y, 3, 16),
            },
        ],
        createdAt: new Date(y, 3, 1).getTime(),
        contactCount: 6,
        columnId: 'confirmed'
    }
]

// Leads en estado "Cerrado" (Proceso finalizado - irán a otra vista)
const closedLeads: Lead[] = [
    {
        id: 'lead-010',
        name: 'Patricia Herrera',
        description: 'Alquiler de apartamento de lujo. Contrato de 3 años con opción a compra.',
        members: [boardMembers[0]],
        labels: ['Media prioridad', 'Alquiler', 'Opción compra', 'Cerrado'],
        dueDate: new Date(y, 3, 28).getTime(),
        metadata: {
            email: 'patricia.herrera@outlook.com',
            phone: '+34 690 123 456',
            interest: 'medio',
            source: 'Instagram',
            budget: 1800,
            propertyType: 'Apartamento',
            preferredZones: ['Centro', 'Zona Premium'],
            bedroomsNeeded: 3,
            bathroomsNeeded: 2,
            leadStatus: 'cerrado',
            lastContactDate: new Date(y, 3, 17).getTime(),
            nextContactDate: new Date(y, 3, 28).getTime(),
            closingDate: new Date(y, 3, 17).getTime(),
            closingType: 'exitoso',
            dealValue: 1800 * 36,
            closingNotes: 'Contrato firmado por 3 años. Opción de compra después del primer año.'
        },
        cover: '',
        attachments: [],
        comments: [
            {
                id: 'comment-010',
                name: 'Carlos Mendoza',
                src: '/img/avatars/thumb-1.jpg',
                message: 'Contrato firmado. Entrega de llaves programada para el próximo lunes.',
                date: new Date(y, 3, 17),
            },
        ],
        createdAt: new Date(y, 3, 4).getTime(),
        contactCount: 6,
        columnId: 'closed'
    }
]

// Datos completos del funnel de ventas inmobiliario
export const salesFunnelData: Record<string, Lead[]> = {
    'new': newLeads,
    'prospecting': prospectingLeads,
    'qualification': qualificationLeads,
    'opportunity': opportunityLeads,
    'confirmed': confirmedLeads,
    'closed': closedLeads
}

// Estructura para la vista en formato tabla (todas las leads, incluidas las confirmadas y cerradas)
export const leadsTable = [
    ...newLeads,
    ...prospectingLeads,
    ...qualificationLeads,
    ...opportunityLeads,
    ...confirmedLeads,
    ...closedLeads
]

// Función para obtener todos los miembros disponibles
export const getAllMembers = (): Member[] => boardMembers

// Obtener datos para inicializar el funnel
export const getSalesTeam = () => {
    return {
        activeAgents: boardMembers,
        allAgents: boardMembers
    }
}

// Definición de las etapas del funnel para la UI
export const defaultFunnelStages = [
    { id: 'new', name: 'Nuevos', color: '#4169E1' },
    { id: 'prospecting', name: 'Prospectando', color: '#3498db' },
    { id: 'qualification', name: 'Calificación', color: '#f39c12' },
    { id: 'opportunity', name: 'Oportunidad', color: '#2ecc71' }
]

// Función para obtener datos del funnel de ventas
export const getSalesFunnelData = () => {
    return {
        columns: salesFunnelData,
        boardMembers: getSalesTeam(),
        funnelStages: defaultFunnelStages
    }
}

// Para obtener leads confirmados (para la vista especializada)
export const getConfirmedLeads = () => confirmedLeads

// Para obtener leads cerrados (para la vista especializada)
export const getClosedLeads = () => closedLeads

// Mantiene compatibilidad con el sistema antiguo
export const leadsEmbudo = salesFunnelData
export const leadsTabla = leadsTable
export const getProjectMembers = getSalesTeam
export const getLeadsData = getSalesFunnelData

// Mapeo de nombres de columnas antiguas a nuevas para hacer la transición más suave
export const columnNameMap = {
    'toDo': 'new',
    'inProgress': 'prospecting',
    'toReview': 'qualification',
    'completed': 'opportunity'
}

// Para mantener compatibilidad con el sistema antiguo
export const scrumboardData = {
    'toDo': newLeads,
    'inProgress': prospectingLeads,
    'toReview': qualificationLeads,
    'completed': opportunityLeads
}