/**
 * frontend/src/app/(protected-pages)/superadmin/notification-builder/_store/systemNotificationsStore.ts
 * Zustand store para gestionar el estado de las plantillas de notificaciones del sistema (SUPERADMIN)
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { create } from 'zustand'
import { createClient } from '@supabase/supabase-js'
import { showError } from '@/utils/notifications' // Import notification utility

// Interfaz para canales de notificación
export type NotificationChannel = 'email' | 'sms' | 'push' | 'internal' | 'webhook';

// Interfaz para plantillas de notificación
export interface NotificationTemplate {
    id: string
    name: string
    description: string
    subject?: string
    body: string
    channel: NotificationChannel
    is_active: boolean
    variables?: string[]
    conditions?: Record<string, unknown>
    is_system: boolean
    created_at: string
    updated_at: string
}

// Exportar la interfaz del estado
export interface SystemNotificationsState {
    templates: NotificationTemplate[]
    loading: boolean
    error: string | null
    fetchTemplates: () => Promise<void>
    addTemplate: (newTemplate: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
    updateTemplate: (templateId: string, updatedData: Partial<NotificationTemplate>) => Promise<void>
    deleteTemplate: (templateId: string) => Promise<void>
    toggleTemplateStatus: (templateId: string, isActive: boolean) => Promise<void>
}

// Cliente Supabase (considerar centralizar)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Crear cliente con headers personalizados
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Prefer': 'return=representation'
        },
    },
})

// Mock data para plantillas de notificación
const mockTemplates: NotificationTemplate[] = [
    {
        id: '1',
        name: 'Bienvenida a Nuevo Usuario',
        description: 'Correo de bienvenida enviado a nuevos usuarios al registrarse',
        subject: 'Bienvenido/a a PymeBot',
        body: 'Hola {{user_name}},\n\nBienvenido/a a PymeBot. Estamos encantados de tenerte con nosotros.\n\nSaludos,\nEl equipo de {{company_name}}',
        channel: 'email',
        is_active: true,
        variables: ['user_name', 'company_name'],
        is_system: true,
        created_at: '2025-04-01T00:00:00.000Z',
        updated_at: '2025-04-28T00:00:00.000Z'
    },
    {
        id: '2',
        name: 'Recordatorio de Cita',
        description: 'SMS enviado 24 horas antes de una cita programada',
        body: 'Recordatorio: Tiene una cita mañana a las {{appointment_time}}. Para cancelar o reprogramar, llame al {{support_phone}}.',
        channel: 'sms',
        is_active: true,
        variables: ['appointment_time', 'support_phone'],
        is_system: false,
        created_at: '2025-04-10T00:00:00.000Z',
        updated_at: '2025-04-28T00:00:00.000Z'
    },
    {
        id: '3',
        name: 'Notificación de Nuevo Mensaje',
        description: 'Notificación interna cuando se recibe un nuevo mensaje',
        subject: 'Nuevo mensaje',
        body: 'Ha recibido un nuevo mensaje de {{sender_name}}.',
        channel: 'internal',
        is_active: true,
        variables: ['sender_name'],
        is_system: true,
        created_at: '2025-04-15T00:00:00.000Z',
        updated_at: '2025-04-28T00:00:00.000Z'
    },
    {
        id: '4',
        name: 'Evento Webhook de Pago',
        description: 'Notificación webhook enviada cuando se completa un pago',
        body: '{"event": "payment_completed", "amount": {{payment_amount}}, "currency": "{{currency}}", "customer_id": "{{customer_id}}"}',
        channel: 'webhook',
        is_active: false,
        variables: ['payment_amount', 'currency', 'customer_id'],
        is_system: false,
        created_at: '2025-04-20T00:00:00.000Z',
        updated_at: '2025-04-28T00:00:00.000Z'
    }
];

export const useSystemNotificationsStore = create<SystemNotificationsState>((set) => ({
    templates: [],
    loading: false,
    error: null,

    fetchTemplates: async () => {
        set({ loading: true, error: null })
        try {
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // En una implementación real, esto sería una llamada a Supabase
            // const { data, error } = await supabase
            //    .from('notification_templates')
            //    .select('*')
            //    .order('name', { ascending: true });
            
            // Por ahora, usamos datos mock
            set({ templates: mockTemplates, loading: false })
        } catch (err) {
            console.error('Error fetching notification templates:', err)
            const errorMessage = 'No se pudieron cargar las plantillas de notificación'
            set({ error: errorMessage, loading: false })
            const message = err instanceof Error ? err.message : 'Error desconocido'
            showError(`${message}`, errorMessage, { placement: 'top-center' })
        }
    },

    addTemplate: async (newTemplateData) => {
        set({ loading: true })
        try {
            // Verificar que los datos requeridos estén presentes
            if (!newTemplateData.name || !newTemplateData.body || !newTemplateData.channel) {
                throw new Error('Faltan campos requeridos: nombre, cuerpo y canal son obligatorios')
            }
            
            // En una implementación real, esto sería una llamada a Supabase
            // const { data, error } = await supabase
            //    .from('notification_templates')
            //    .insert([newTemplateData])
            //    .select();
            
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Simular inserción de datos
            const newTemplate: NotificationTemplate = {
                ...newTemplateData,
                id: `new-${Date.now()}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            set((state) => ({
                templates: [...state.templates, newTemplate],
                loading: false
            }));
            
            return Promise.resolve();
        } catch (err) {
            console.error('Error adding notification template:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido';
            set({ loading: false, error: `Error al crear plantilla: ${message}` });
            showError(`${message}`, 'Error al crear plantilla', { placement: 'top-center' });
            return Promise.reject(err);
        }
    },

    updateTemplate: async (templateId, updatedData) => {
        set({ loading: true })
        try {
            // En una implementación real, esto sería una llamada a Supabase
            // const { data, error } = await supabase
            //    .from('notification_templates')
            //    .update(updatedData)
            //    .eq('id', templateId)
            //    .select();
            
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Actualizar en el estado local
            set((state) => ({
                templates: state.templates.map((template) => 
                    template.id === templateId 
                        ? { 
                            ...template, 
                            ...updatedData, 
                            updated_at: new Date().toISOString() 
                          } 
                        : template
                ),
                loading: false
            }));
            
            return Promise.resolve();
        } catch (err) {
            console.error('Error updating notification template:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido';
            set({ loading: false, error: `Error al actualizar plantilla: ${message}` });
            showError(`${message}`, 'Error al actualizar plantilla', { placement: 'top-center' });
            return Promise.reject(err);
        }
    },

    deleteTemplate: async (templateId) => {
        set({ loading: true })
        try {
            // En una implementación real, esto sería una llamada a Supabase
            // const { error } = await supabase
            //    .from('notification_templates')
            //    .delete()
            //    .eq('id', templateId);
            
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Actualizar en el estado local
            set((state) => ({
                templates: state.templates.filter((template) => template.id !== templateId),
                loading: false
            }));
            
            return Promise.resolve();
        } catch (err) {
            console.error('Error deleting notification template:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido';
            set({ loading: false, error: `Error al eliminar plantilla: ${message}` });
            showError(`${message}`, 'Error al eliminar plantilla', { placement: 'top-center' });
            return Promise.reject(err);
        }
    },

    toggleTemplateStatus: async (templateId, isActive) => {
        set({ loading: true })
        try {
            // En una implementación real, esto sería una llamada a Supabase
            // const { data, error } = await supabase
            //    .from('notification_templates')
            //    .update({ is_active: isActive })
            //    .eq('id', templateId)
            //    .select();
            
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Actualizar en el estado local
            set((state) => ({
                templates: state.templates.map((template) => 
                    template.id === templateId 
                        ? { 
                            ...template, 
                            is_active: isActive, 
                            updated_at: new Date().toISOString() 
                          } 
                        : template
                ),
                loading: false
            }));
            
            return Promise.resolve();
        } catch (err) {
            console.error('Error toggling notification template status:', err);
            const message = err instanceof Error ? err.message : 'Error desconocido';
            set({ loading: false, error: `Error al cambiar estado de plantilla: ${message}` });
            showError(`${message}`, 'Error al cambiar estado', { placement: 'top-center' });
            return Promise.reject(err);
        }
    }
}));
