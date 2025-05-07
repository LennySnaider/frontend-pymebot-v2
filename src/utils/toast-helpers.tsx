/**
 * frontend/src/utils/toast-helpers.tsx
 * Utilidades para el manejo de notificaciones toast de manera consistente en la aplicación
 * @version 1.1.0
 * @updated 2025-06-05
 */

import { toast } from '@/components/ui'
import { Notification } from '@/components/ui'
import React from 'react'

// Interfaz para las opciones de toast
interface ToastOptions {
    duration?: number
    placement?: 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end' | 'top-full' | 'bottom-full'
    offsetX?: number | string
    offsetY?: number | string
    transitionType?: 'scale' | 'fade'
    block?: boolean
}

// Interfaz para las opciones de notificación
interface NotificationOptions {
    title?: string
    duration?: number
    closable?: boolean
    customIcon?: React.ReactNode | string
}

/**
 * Muestra una notificación de éxito
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales de notificación
 * @param toastOptions Opciones de posicionamiento del toast
 */
export const showSuccess = (
    message: string, 
    options: NotificationOptions = {}, 
    toastOptions: ToastOptions = {}
) => {
    const { title = 'Éxito', ...restOptions } = options;
    try {
        toast.push(
            <Notification 
                type="success" 
                title={title} 
                {...restOptions}
            >
                {message}
            </Notification>,
            toastOptions
        );
    } catch (error) {
        console.error('Error al mostrar notificación de éxito:', error);
    }
};

/**
 * Muestra una notificación de error
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales de notificación
 * @param toastOptions Opciones de posicionamiento del toast
 */
export const showError = (
    message: string, 
    options: NotificationOptions = {}, 
    toastOptions: ToastOptions = {}
) => {
    const { title = 'Error', ...restOptions } = options;
    try {
        toast.push(
            <Notification 
                type="danger" 
                title={title} 
                {...restOptions}
            >
                {message}
            </Notification>,
            toastOptions
        );
    } catch (error) {
        console.error('Error al mostrar notificación de error:', error);
        // Fallback si falla el toast
        console.error(`[ERROR NOTIFICATION]: ${message}`);
    }
};

/**
 * Muestra una notificación informativa
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales de notificación
 * @param toastOptions Opciones de posicionamiento del toast
 */
export const showInfo = (
    message: string, 
    options: NotificationOptions = {}, 
    toastOptions: ToastOptions = {}
) => {
    const { title = 'Información', ...restOptions } = options;
    try {
        toast.push(
            <Notification 
                type="info" 
                title={title} 
                {...restOptions}
            >
                {message}
            </Notification>,
            toastOptions
        );
    } catch (error) {
        console.error('Error al mostrar notificación informativa:', error);
    }
};

/**
 * Muestra una notificación de advertencia
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales de notificación
 * @param toastOptions Opciones de posicionamiento del toast
 */
export const showWarning = (
    message: string, 
    options: NotificationOptions = {}, 
    toastOptions: ToastOptions = {}
) => {
    const { title = 'Advertencia', ...restOptions } = options;
    try {
        toast.push(
            <Notification 
                type="warning" 
                title={title} 
                {...restOptions}
            >
                {message}
            </Notification>,
            toastOptions
        );
    } catch (error) {
        console.error('Error al mostrar notificación de advertencia:', error);
    }
};

// Objeto principal para usar directamente
export const toastHelpers = {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning
};

export default toastHelpers;