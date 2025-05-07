/**
 * frontend/src/server/actions/getPricingPlans.ts
 * Server Action para obtener planes de precios
 * @version 1.0.0
 * @updated 2025-06-05
 */

import { SupabaseClient } from '@/services/supabase/SupabaseClient';

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  trialAvailable: boolean;
}

interface Feature {
  id: string;
  name: string;
  highlight?: boolean;
  available?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: Feature[];
  popular?: boolean;
  addons?: Addon[];
  description: string;
  trialDays?: number;
}

/**
 * Obtiene la lista de planes de precios desde Supabase
 * @returns Lista de planes de precios con sus características
 */
export default async function getPricingPlans(): Promise<PricingPlan[]> {
  try {
    // En una implementación real, esto usaría Supabase para obtener los datos
    // const { data, error } = await SupabaseClient
    //   .from('pricing_plans')
    //   .select('*, features(*), addons(*)')
    //   .order('price->monthly', { ascending: true });
    
    // if (error) throw error;
    // return data;
    
    // Por ahora, devolvemos datos de ejemplo
    return [
      {
        id: 'free',
        name: 'Gratuito',
        price: {
          monthly: 0,
          yearly: 0,
        },
        description: 'Perfecto para comenzar con funcionalidades básicas',
        features: [
          { id: '1', name: '1 chatbot activo', highlight: true },
          { id: '2', name: '100 mensajes por mes', highlight: true },
          { id: '3', name: 'Plantillas básicas', available: true },
          { id: '4', name: 'Integración con WhatsApp', available: true },
          { id: '5', name: 'Reportes básicos', available: true },
          { id: '6', name: 'Soporte por email', available: true },
          { id: '7', name: 'Personalización avanzada', available: false },
          { id: '8', name: 'Variables del sistema', available: false },
        ],
      },
      {
        id: 'starter',
        name: 'Inicial',
        price: {
          monthly: 29,
          yearly: 290,
        },
        description: 'Para negocios pequeños que buscan automatización',
        popular: true,
        trialDays: 14,
        features: [
          { id: '1', name: '3 chatbots activos', highlight: true },
          { id: '2', name: '1,000 mensajes por mes', highlight: true },
          { id: '3', name: 'Plantillas avanzadas', available: true },
          { id: '4', name: 'Integración con WhatsApp', available: true },
          { id: '5', name: 'Reportes detallados', available: true },
          { id: '6', name: 'Soporte prioritario', available: true },
          { id: '7', name: 'Personalización avanzada', available: true },
          { id: '8', name: 'Variables del sistema', available: true },
          { id: '9', name: 'Flujos condicionales', available: false },
          { id: '10', name: 'Integraciones API', available: false },
        ],
        addons: [
          {
            id: 'addon-1',
            name: 'Mensajes adicionales',
            description: '500 mensajes adicionales por mes',
            price: 10,
            trialAvailable: false,
          },
        ],
      },
      {
        id: 'professional',
        name: 'Profesional',
        price: {
          monthly: 79,
          yearly: 790,
        },
        description: 'Para negocios en crecimiento con necesidades avanzadas',
        trialDays: 7,
        features: [
          { id: '1', name: '10 chatbots activos', highlight: true },
          { id: '2', name: '10,000 mensajes por mes', highlight: true },
          { id: '3', name: 'Todas las plantillas', available: true },
          { id: '4', name: 'Integraciones múltiples', available: true },
          { id: '5', name: 'Analíticas avanzadas', available: true },
          { id: '6', name: 'Soporte 24/7', available: true },
          { id: '7', name: 'Personalización completa', available: true },
          { id: '8', name: 'Variables del sistema', available: true },
          { id: '9', name: 'Flujos condicionales', available: true },
          { id: '10', name: 'Integraciones API', available: true },
          { id: '11', name: 'Webhooks personalizados', available: true },
        ],
        addons: [
          {
            id: 'addon-1',
            name: 'Mensajes adicionales',
            description: '1,000 mensajes adicionales por mes',
            price: 15,
            trialAvailable: false,
          },
          {
            id: 'addon-2',
            name: 'Chatbots adicionales',
            description: '3 chatbots adicionales',
            price: 20,
            trialAvailable: true,
          },
        ],
      },
      {
        id: 'enterprise',
        name: 'Empresarial',
        price: {
          monthly: 199,
          yearly: 1990,
        },
        description: 'Solución completa para grandes empresas con necesidades específicas',
        features: [
          { id: '1', name: 'Chatbots ilimitados', highlight: true },
          { id: '2', name: '50,000 mensajes por mes', highlight: true },
          { id: '3', name: 'Todas las funcionalidades', available: true },
          { id: '4', name: 'SLA garantizado', available: true },
          { id: '5', name: 'Gerente de cuenta dedicado', available: true },
          { id: '6', name: 'Personalización a medida', available: true },
          { id: '7', name: 'Capacitación y consultoría', available: true },
          { id: '8', name: 'Informes personalizados', available: true },
          { id: '9', name: 'Almacenamiento de datos ampliado', available: true },
          { id: '10', name: 'Soporte prioritario 24/7', available: true },
        ],
        addons: [
          {
            id: 'addon-1',
            name: 'Mensajes adicionales',
            description: '10,000 mensajes adicionales por mes',
            price: 100,
            trialAvailable: false,
          },
          {
            id: 'addon-2',
            name: 'Horas de consultoría',
            description: '5 horas adicionales de consultoría',
            price: 500,
            trialAvailable: false,
          },
        ],
      },
    ];
  } catch (error) {
    console.error('Error al obtener planes de precios:', error);
    return [];
  }
}