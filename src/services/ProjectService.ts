/**
 * frontend/src/services/ProjectService.ts
 * Servicio para operaciones relacionadas con proyectos
 * @version 1.0.0
 * @updated 2025-06-05
 */

import type { 
  GetProjectDetailsResponse, 
  GetProjectDetailsTaskResponse,
  GetProjectDetailsAttachmentResponse,
  GetProjectDetailsActitvityResponse,
  Task
} from '@/app/(protected-pages)/modules/projects/project-details/[id]/types'

// Datos de ejemplo para desarrollo
const mockProjectData: GetProjectDetailsResponse = {
  name: 'Desarrollo de Interfaz de Chatbot',
  content: 'Este proyecto tiene como objetivo crear una interfaz de usuario moderna y accesible para el sistema de chatbot integrado en PymeBot, permitiendo a los usuarios interactuar de manera efectiva con asistentes virtuales personalizados.',
  client: {
    clientName: 'PymeBot Solutions',
    skateHolder: {
      name: 'Juan Pérez',
      img: '/img/avatars/thumb-1.jpg'
    },
    projectManager: {
      name: 'María González',
      img: '/img/avatars/thumb-2.jpg'
    }
  },
  schedule: {
    startDate: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 días atrás
    dueDate: Date.now() + 20 * 24 * 60 * 60 * 1000, // 20 días adelante
    status: 'En Progreso',
    completion: 65
  }
}

const mockMembers = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@pymebot.com',
    img: '/img/avatars/thumb-1.jpg'
  },
  {
    id: '2',
    name: 'María González',
    email: 'maria@pymebot.com',
    img: '/img/avatars/thumb-2.jpg'
  },
  {
    id: '3',
    name: 'Pedro López',
    email: 'pedro@pymebot.com',
    img: '/img/avatars/thumb-3.jpg'
  },
  {
    id: '4',
    name: 'Ana Martínez',
    email: 'ana@pymebot.com',
    img: '/img/avatars/thumb-4.jpg'
  }
]

const mockTaskData: GetProjectDetailsTaskResponse = {
  'To Do': [
    {
      id: '1',
      name: 'Diseñar pantalla de bienvenida',
      description: 'Crear el diseño de la pantalla de bienvenida del chatbot',
      cover: '',
      members: [mockMembers[0], mockMembers[1]],
      labels: ['Task', 'Design'],
      dueDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
      checked: false
    },
    {
      id: '2',
      name: 'Implementar sistema de notificaciones',
      description: 'Crear sistema de notificaciones para mensajes nuevos',
      cover: '',
      members: [mockMembers[2]],
      labels: ['Task'],
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      checked: false
    }
  ],
  'In Progress': [
    {
      id: '3',
      name: 'Optimizar tiempo de respuesta del chat',
      description: 'Mejorar el tiempo de respuesta del chatbot',
      cover: '',
      members: [mockMembers[1], mockMembers[3]],
      labels: ['Live issue', 'Bug'],
      dueDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
      checked: false
    }
  ],
  'To Review': [
    {
      id: '4',
      name: 'Implementar integración con WhatsApp',
      description: 'Conectar el sistema con la API de WhatsApp',
      cover: '',
      members: [mockMembers[0]],
      labels: ['Task'],
      dueDate: Date.now() + 1 * 24 * 60 * 60 * 1000,
      checked: false
    }
  ],
  'Completed': [
    {
      id: '5',
      name: 'Configurar entorno de desarrollo',
      description: 'Preparar el entorno para el desarrollo del chatbot',
      cover: '',
      members: [mockMembers[2], mockMembers[3]],
      labels: ['Task'],
      dueDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
      checked: true
    }
  ]
}

const mockAttachments: GetProjectDetailsAttachmentResponse = {
  list: [
    {
      id: '1',
      name: 'chatbot_specs.pdf',
      fileType: 'pdf',
      size: 2500000,
      author: {
        name: 'Juan Pérez',
        email: 'juan@pymebot.com',
        img: '/img/avatars/thumb-1.jpg'
      },
      activities: [
        {
          userName: 'Juan Pérez',
          userImg: '/img/avatars/thumb-1.jpg',
          actionType: 'upload',
          timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000
        }
      ],
      uploadDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
      recent: false
    },
    {
      id: '2',
      name: 'ui_mockups.fig',
      fileType: 'figma',
      size: 5000000,
      author: {
        name: 'María González',
        email: 'maria@pymebot.com',
        img: '/img/avatars/thumb-2.jpg'
      },
      activities: [
        {
          userName: 'María González',
          userImg: '/img/avatars/thumb-2.jpg',
          actionType: 'upload',
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000
        },
        {
          userName: 'Juan Pérez',
          userImg: '/img/avatars/thumb-1.jpg',
          actionType: 'comment',
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
        }
      ],
      uploadDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      recent: true
    }
  ]
}

const mockActivities: GetProjectDetailsActitvityResponse = {
  data: [
    {
      id: '1',
      date: Date.now() - 1 * 24 * 60 * 60 * 1000,
      events: [
        {
          type: 'task-created',
          dateTime: Date.now() - 1 * 24 * 60 * 60 * 1000,
          ticket: 'Implementar integración con WhatsApp',
          userName: 'Juan Pérez',
          userImg: '/img/avatars/thumb-1.jpg'
        },
        {
          type: 'task-assigned',
          dateTime: Date.now() - 1 * 24 * 60 * 60 * 1000 + 3600000,
          ticket: 'Implementar integración con WhatsApp',
          userName: 'María González',
          userImg: '/img/avatars/thumb-2.jpg',
          assignee: 'Juan Pérez'
        }
      ]
    },
    {
      id: '2',
      date: Date.now() - 3 * 24 * 60 * 60 * 1000,
      events: [
        {
          type: 'comment',
          dateTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
          userName: 'Pedro López',
          userImg: '/img/avatars/thumb-3.jpg',
          comment: 'He encontrado un problema con el rendimiento del chatbot. Necesitamos optimizarlo urgentemente.'
        },
        {
          type: 'task-created',
          dateTime: Date.now() - 3 * 24 * 60 * 60 * 1000 + 1800000,
          ticket: 'Optimizar tiempo de respuesta del chat',
          userName: 'María González',
          userImg: '/img/avatars/thumb-2.jpg'
        }
      ]
    }
  ],
  loadable: true
}

// Implementaciones de los métodos del servicio
export const apiGetProject = async ({ id }: { id: string }): Promise<GetProjectDetailsResponse> => {
  // En una implementación real, esto haría una llamada a la API
  console.log('Obteniendo proyecto con ID:', id)
  
  // Por ahora, devolvemos datos de ejemplo
  return mockProjectData
}

export const apiGetProjectMembers = async <T>(): Promise<T> => {
  // En una implementación real, esto haría una llamada a la API
  
  // Por ahora, devolvemos datos de ejemplo
  return {
    participantMembers: mockMembers.slice(0, 2),
    allMembers: mockMembers
  } as unknown as T
}

export const apiGetScrumBoards = async <T>(): Promise<T> => {
  // En una implementación real, esto haría una llamada a la API
  
  // Por ahora, devolvemos datos de ejemplo
  return mockTaskData as unknown as T
}

export const apiGetProjectAttachments = async <T>(): Promise<T> => {
  // En una implementación real, esto haría una llamada a la API
  
  // Por ahora, devolvemos datos de ejemplo
  return mockAttachments as unknown as T
}

export const apiGetProjectActivities = async <T>(): Promise<T> => {
  // En una implementación real, esto haría una llamada a la API
  
  // Por ahora, devolvemos datos de ejemplo
  return mockActivities as unknown as T
}

export const apiUpdateProject = async (
  data: {
    id: string
    name: string
    content: string
    dueDate: number
  }
): Promise<GetProjectDetailsResponse> => {
  // En una implementación real, esto haría una llamada a la API
  console.log('Actualizando proyecto:', data)
  
  // Por ahora, devolvemos datos actualizados de ejemplo
  return {
    ...mockProjectData,
    name: data.name,
    content: data.content,
    schedule: {
      ...mockProjectData.schedule,
      dueDate: data.dueDate
    }
  }
}

export const apiCreateProject = async (data: {
  name: string
  description: string
  dueDate: number
  client: string
  members: string[]
}): Promise<{ id: string }> => {
  // En una implementación real, esto haría una llamada a la API
  console.log('Creando nuevo proyecto:', data)
  
  // Por ahora, devolvemos un ID ficticio
  return { id: Math.random().toString(36).substring(2, 15) }
}

export const apiDeleteProject = async (id: string): Promise<boolean> => {
  // En una implementación real, esto haría una llamada a la API
  console.log('Eliminando proyecto con ID:', id)
  
  // Por ahora, siempre devolvemos éxito
  return true
}

export const apiGetProjects = async (params?: {
  page?: number
  limit?: number
  query?: string
  status?: string
}): Promise<{
  data: Array<{
    id: string
    name: string
    status: string
    dueDate: number
    progress: number
    members: Array<{ id: string; name: string; img: string }>
  }>
  total: number
}> => {
  // En una implementación real, esto haría una llamada a la API con parámetros de filtrado
  console.log('Obteniendo proyectos con parámetros:', params)
  
  // Por ahora, devolvemos una lista de proyectos de ejemplo
  return {
    data: [
      {
        id: '1',
        name: 'Desarrollo de Interfaz de Chatbot',
        status: 'En Progreso',
        dueDate: Date.now() + 20 * 24 * 60 * 60 * 1000,
        progress: 65,
        members: mockMembers.slice(0, 3)
      },
      {
        id: '2',
        name: 'Integración de API de WhatsApp',
        status: 'Pendiente',
        dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        progress: 15,
        members: mockMembers.slice(1, 3)
      }
    ],
    total: 2
  }
}