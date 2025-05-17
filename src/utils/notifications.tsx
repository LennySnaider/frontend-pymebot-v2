'use client'

/**
 * agentprop/src/utils/notifications.tsx
 * Utilidades para mostrar notificaciones consistentes en la aplicación
 * @version 1.0.0
 * @created 2025-10-04
 */

import React from 'react'
import { toast, Notification } from '@/components/ui'

/**
 * Muestra un mensaje de éxito
 * @param message Mensaje a mostrar
 * @param title Título de la notificación (opcional, por defecto "Éxito")
 * @param toastOptions Opciones adicionales para toast.push (opcional)
 * @param notificationOptions Opciones adicionales para el componente Notification (opcional)
 */
export const showSuccess = (
    message: string,
    title = 'Éxito',
    toastOptions = {},
    notificationOptions = {},
) => {
    toast.push(
        <Notification title={title} type="success" {...notificationOptions}>
            {message}
        </Notification>,
        toastOptions,
    )
}

/**
 * Muestra un mensaje de error
 * @param message Mensaje a mostrar
 * @param title Título de la notificación (opcional, por defecto "Error")
 * @param toastOptions Opciones adicionales para toast.push (opcional)
 * @param notificationOptions Opciones adicionales para el componente Notification (opcional)
 */
export const showError = (
    message: string,
    title = 'Error',
    toastOptions = {},
    notificationOptions = {},
) => {
    toast.push(
        <Notification title={title} type="danger" {...notificationOptions}>
            {message}
        </Notification>,
        toastOptions,
    )
}

/**
 * Muestra un mensaje informativo
 * @param message Mensaje a mostrar
 * @param title Título de la notificación (opcional, por defecto "Información")
 * @param toastOptions Opciones adicionales para toast.push (opcional)
 * @param notificationOptions Opciones adicionales para el componente Notification (opcional)
 */
export const showInfo = (
    message: string,
    title = 'Información',
    toastOptions = {},
    notificationOptions = {},
) => {
    toast.push(
        <Notification title={title} type="info" {...notificationOptions}>
            {message}
        </Notification>,
        toastOptions,
    )
}

/**
 * Muestra un mensaje de advertencia
 * @param message Mensaje a mostrar
 * @param title Título de la notificación (opcional, por defecto "Advertencia")
 * @param toastOptions Opciones adicionales para toast.push (opcional)
 * @param notificationOptions Opciones adicionales para el componente Notification (opcional)
 */
export const showWarning = (
    message: string,
    title = 'Advertencia',
    toastOptions = {},
    notificationOptions = {},
) => {
    toast.push(
        <Notification title={title} type="warning" {...notificationOptions}>
            {message}
        </Notification>,
        toastOptions,
    )
}

// Exportar todas las funciones como un objeto para facilitar la importación
export const notifications = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    // Agregar métodos de compatibilidad para código existente
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
}

export default notifications