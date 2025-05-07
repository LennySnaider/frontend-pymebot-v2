/**
 * frontend/src/components/shared/ClientOnly.tsx
 * Componente para renderizar contenido solo en el cliente.
 * Evita problemas de hidratación entre renderizado servidor/cliente.
 *
 * @version 1.1.0
 * @updated 2025-06-10
 */

'use client'

import { useState, useEffect, ReactNode } from 'react'

/**
 * Props para el componente ClientOnly
 */
type ClientOnlyProps = {
    children: ReactNode
    fallback?: ReactNode
}

/**
 * Componente que renderiza su contenido solo cuando está en el cliente
 * Esto evita errores de hidratación cuando el contenido renderizado en el servidor
 * no coincide con el cliente debido a cosas como valores de localStorage
 */
const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
    // Estado para saber si estamos en el cliente
    const [isMounted, setIsMounted] = useState(false)

    // Tras el montaje, estamos en el cliente
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Importante: usar suppressHydrationWarning para evitar errores
    // en la consola cuando hay diferencias en el primer renderizado
    if (!isMounted) {
        return <div suppressHydrationWarning>{fallback}</div>
    }

    // Una vez montado, renderizar el contenido real
    return <>{children}</>
}

export default ClientOnly
