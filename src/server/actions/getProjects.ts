/**
 * frontend/src/server/actions/getProjects.ts
 * Server Action para obtener la lista de proyectos
 * @version 1.0.0
 * @updated 2025-06-05
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient';

interface Member {
  id: string;
  name: string;
  email: string;
  img: string;
}

interface Project {
  id: string;
  name: string;
  category: string;
  desc: string;
  attachmentCount: number;
  totalTask: number;
  completedTask: number;
  progress: number;
  dueDate: number; // timestamp
  status: string;
  member: Member[];
}

/**
 * Obtiene la lista de proyectos desde Supabase
 * @returns Lista de proyectos con sus detalles
 */
export default async function getProjects(): Promise<Project[]> {
  try {
    // En una implementación real, esto usaría Supabase
    // const { data, error } = await SupabaseClient
    //   .from('projects')
    //   .select('*, members(*)')
    //   .order('created_at', { ascending: false });
    
    // if (error) throw error;
    // return data;
    
    // Por ahora, retornamos datos de ejemplo
    return [
      {
        id: '1',
        name: 'Desarrollo de Chatbot para Agente Inmobiliario',
        category: 'Desarrollo',
        desc: 'Chatbot personalizado para automatizar conversaciones con clientes potenciales interesados en propiedades',
        attachmentCount: 12,
        totalTask: 36,
        completedTask: 28,
        progress: 78,
        dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 días en el futuro
        status: 'En Progreso',
        member: [
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
            name: 'Carlos Rodríguez',
            email: 'carlos@pymebot.com',
            img: '/img/avatars/thumb-3.jpg'
          }
        ]
      },
      {
        id: '2',
        name: 'Integración con WhatsApp Business API',
        category: 'Integración',
        desc: 'Integración del sistema con WhatsApp Business API para permitir comunicaciones con clientes a través de esta plataforma',
        attachmentCount: 8,
        totalTask: 24,
        completedTask: 20,
        progress: 83,
        dueDate: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 días en el futuro
        status: 'En Progreso',
        member: [
          {
            id: '2',
            name: 'María González',
            email: 'maria@pymebot.com',
            img: '/img/avatars/thumb-2.jpg'
          },
          {
            id: '4',
            name: 'Ana Martínez',
            email: 'ana@pymebot.com',
            img: '/img/avatars/thumb-4.jpg'
          }
        ]
      },
      {
        id: '3',
        name: 'Dashboard de Análisis de Conversaciones',
        category: 'Analítica',
        desc: 'Desarrollo de un dashboard para visualizar métricas y análisis de las conversaciones con clientes a través del chatbot',
        attachmentCount: 5,
        totalTask: 18,
        completedTask: 6,
        progress: 33,
        dueDate: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 días en el futuro
        status: 'Pendiente',
        member: [
          {
            id: '1',
            name: 'Juan Pérez',
            email: 'juan@pymebot.com',
            img: '/img/avatars/thumb-1.jpg'
          },
          {
            id: '5',
            name: 'Roberto López',
            email: 'roberto@pymebot.com',
            img: '/img/avatars/thumb-5.jpg'
          }
        ]
      },
      {
        id: '4',
        name: 'Optimización de Flujos de Conversación',
        category: 'Desarrollo',
        desc: 'Mejora de los flujos de conversación existentes para aumentar la tasa de conversión y mejorar la experiencia del usuario',
        attachmentCount: 3,
        totalTask: 12,
        completedTask: 12,
        progress: 100,
        dueDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 días en el pasado
        status: 'Completado',
        member: [
          {
            id: '3',
            name: 'Carlos Rodríguez',
            email: 'carlos@pymebot.com',
            img: '/img/avatars/thumb-3.jpg'
          },
          {
            id: '4',
            name: 'Ana Martínez',
            email: 'ana@pymebot.com',
            img: '/img/avatars/thumb-4.jpg'
          },
          {
            id: '6',
            name: 'Patricia Gómez',
            email: 'patricia@pymebot.com',
            img: '/img/avatars/thumb-6.jpg'
          }
        ]
      },
      {
        id: '5',
        name: 'Sistema de Notificaciones Automatizadas',
        category: 'Desarrollo',
        desc: 'Implementación de un sistema de notificaciones automatizadas para alertar a los agentes sobre nuevas oportunidades y seguimientos',
        attachmentCount: 7,
        totalTask: 28,
        completedTask: 14,
        progress: 50,
        dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 días en el futuro
        status: 'En Progreso',
        member: [
          {
            id: '2',
            name: 'María González',
            email: 'maria@pymebot.com',
            img: '/img/avatars/thumb-2.jpg'
          },
          {
            id: '5',
            name: 'Roberto López',
            email: 'roberto@pymebot.com',
            img: '/img/avatars/thumb-5.jpg'
          }
        ]
      }
    ];
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return [];
  }
}