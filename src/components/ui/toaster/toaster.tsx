/**
 * frontend/src/components/ui/toaster/toaster.tsx
 * Componente Toaster para mostrar notificaciones en la interfaz
 * @version 1.0.0
 * @updated 2025-06-05
 */

'use client'

import React, { useState, useEffect } from 'react'
import toast from '../toast/toast'
import type { ToastProps } from '../toast/ToastWrapper'
import classNames from 'classnames'

export interface ToasterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  className?: string
}

export function Toaster({ 
  position = 'top-right',
  className
}: ToasterProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Mapeo de posiciones al formato esperado por el componente toast
  const positionMap: Record<string, string> = {
    'top-right': 'top-end',
    'top-left': 'top-start',
    'bottom-right': 'bottom-end',
    'bottom-left': 'bottom-start',
    'top-center': 'top-center',
    'bottom-center': 'bottom-center'
  }

  useEffect(() => {
    setIsMounted(true)
    
    // Configurar el toaster con la posición especificada
    const toastOptions: ToastProps = {
      placement: positionMap[position] as any,
      offsetX: 30,
      offsetY: 30,
      transitionType: 'scale'
    }
    
    // Crear un wrapper de toast con las opciones especificadas
    toast.push('', toastOptions)
    
    return () => {
      toast.removeAll()
    }
  }, [position])

  if (!isMounted) {
    return null
  }

  return (
    <div 
      id="toast-container" 
      className={classNames(
        'fixed z-50',
        position.includes('top') ? 'top-0' : 'bottom-0',
        position.includes('right') ? 'right-0' : 
        position.includes('left') ? 'left-0' : 'left-1/2 transform -translate-x-1/2',
        className
      )}
    />
  )
}

export default Toaster