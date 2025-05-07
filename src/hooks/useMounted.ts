/**
 * frontend/src/hooks/useMounted.ts
 * Hook para verificar si un componente está montado en el cliente.
 * Útil para evitar errores de hidratación en Server Side Rendering.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useState, useEffect } from 'react'

/**
 * Hook que devuelve true cuando el componente está montado en el cliente.
 * Útil para renderizado condicional que solo debe ocurrir en el cliente.
 * @returns {boolean} - true si el componente está montado en el cliente, false en caso contrario.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return mounted
}
