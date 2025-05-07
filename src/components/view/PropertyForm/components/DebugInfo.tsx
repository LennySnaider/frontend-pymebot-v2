/**
 * frontend/src/components/view/PropertyForm/components/DebugInfo.tsx
 * Componente para depurar el estado del formulario de propiedades.
 * Solo visible en desarrollo.
 * 
 * @version 1.0.0
 * @updated 2025-06-24
 */

'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import Card from '@/components/ui/Card'

const DebugInfo = () => {
  const [expanded, setExpanded] = useState(false)
  const methods = useFormContext()
  const isDev = process.env.NODE_ENV === 'development'

  if (!isDev || !methods) {
    return null
  }

  const formValues = methods.getValues()

  return (
    <Card className="mt-4 bg-yellow-50 border border-yellow-200">
      <div className="flex justify-between items-center">
        <h5 className="text-yellow-700">Debug: Formulario de Propiedad</h5>
        <button
          type="button"
          className="text-sm px-2 py-1 bg-yellow-100 text-yellow-700 rounded"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <h6 className="text-sm font-medium mb-1 text-yellow-700">Valores generales:</h6>
              <ul className="text-xs">
                <li><strong>ID:</strong> {formValues.id || 'N/A'}</li>
                <li><strong>Nombre:</strong> {formValues.name || 'N/A'}</li>
                <li><strong>Código:</strong> {formValues.propertyCode || 'N/A'}</li>
                <li><strong>Tipo:</strong> {formValues.propertyType || 'N/A'}</li>
              </ul>
            </div>
            
            <div>
              <h6 className="text-sm font-medium mb-1 text-yellow-700">Ubicación:</h6>
              <ul className="text-xs">
                <li><strong>Estado:</strong> {formValues.location?.state || 'N/A'}</li>
                <li><strong>Ciudad:</strong> {formValues.location?.city || 'N/A'}</li>
                <li><strong>Colonia:</strong> {formValues.location?.colony || 'N/A'}</li>
                <li><strong>CP:</strong> {formValues.location?.zipCode || 'N/A'}</li>
                <li><strong>Dirección:</strong> {formValues.location?.address || 'N/A'}</li>
                <li><strong>Coords:</strong> {
                  formValues.location?.coordinates 
                    ? `${formValues.location.coordinates.lat}, ${formValues.location.coordinates.lng}` 
                    : 'N/A'
                }</li>
              </ul>
            </div>
          </div>
          
          <h6 className="text-sm font-medium mt-2 mb-1 text-yellow-700">Estado global del formulario:</h6>
          <div className="bg-yellow-100 p-2 rounded overflow-auto max-h-80 text-xs font-mono">
            <pre>{JSON.stringify(formValues, null, 2)}</pre>
          </div>
        </div>
      )}
    </Card>
  )
}

export default DebugInfo