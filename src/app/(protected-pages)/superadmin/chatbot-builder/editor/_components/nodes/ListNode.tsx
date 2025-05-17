'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiListNumbersDuotone } from 'react-icons/pi'

const ListNode = ({ data, selected }: NodeProps) => {
  // Asegurar que siempre hay un array de opciones y limitar a 10 para la visualización
  const listItems = Array.isArray(data.listItems) ? data.listItems.slice(0, 10) : []

  // Posiciones dinámicas para los handles de salida basadas en la cantidad de opciones
  const getHandlePositions = (count: number) => {
    const positions = []

    // Si no hay opciones o no se espera respuesta, el handle va directo a la derecha
    if (count === 0 || !data.waitForResponse) {
      return [{ y: '50%', x: Position.Right }]
    }

    // Si hay muchas opciones, limitamos a mostrar solo los primeros 5 handles
    // para evitar que queden muy juntos (visualmente confuso)
    const displayCount = Math.min(count, 5)

    // Distribuir handles uniformemente
    const offset = 100 / (displayCount + 1)
    for (let i = 1; i <= displayCount; i++) {
      positions.push({
        y: `${i * offset}%`,
        x: Position.Right,
      })
    }

    return positions
  }

  const handlePositions = getHandlePositions(listItems.length)

  return (
    <div className={`px-4 py-2 rounded-lg shadow-md border-2 ${selected ? 'border-blue-500' : 'border-orange-200 dark:border-orange-700'} bg-white dark:bg-gray-800 min-w-[180px]`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiListNumbersDuotone className="text-orange-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            {data.label || 'Lista'}
            {data.mode === 'auto' && (
              <span className="ml-2 text-xs bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-1.5 py-0.5 rounded-full">
                AUTO
              </span>
            )}
          </span>
        </div>
        {/* Indicador visual de flujo continuo o pausa */}
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          data.waitForResponse
            ? 'bg-amber-100 text-amber-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {data.waitForResponse ? 'Espera' : 'Continuo'}
        </span>
      </div>
      <div className="mt-2 bg-gray-50 dark:bg-gray-700 p-2 rounded text-sm text-gray-700 dark:text-gray-300 max-w-[250px] break-words">
        {data.message || 'Texto del mensaje...'}
      </div>

      {/* Mostrar título de la lista */}
      {data.listTitle && (
        <div className="mt-1 bg-orange-50 dark:bg-orange-900/20 p-1 rounded text-xs font-medium text-orange-700 dark:text-orange-300">
          {data.listTitle}
        </div>
      )}

      {/* Mostrar las opciones de la lista */}
      <div className="mt-1 max-h-64 overflow-y-auto pr-2">
        {listItems.length > 0 ? (
          <div className="space-y-1">
            {listItems.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-1 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-xs rounded-md border border-orange-200 dark:border-orange-700">
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.text || `Opción ${index + 1}`}
                  </span>
                </div>
                {data.waitForResponse && index < 5 && (
                  <div className="flex items-center ml-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-orange-500 text-white text-xs">
                      {index + 1}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic p-1">Sin opciones configuradas</div>
        )}
      </div>

      {listItems.length > 5 && data.waitForResponse && (
        <div className="mt-1 text-xs text-orange-500">
          <span className="bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Conexiones: {Math.min(listItems.length, 5)}/{listItems.length}
          </span>
        </div>
      )}


      {data.variableName && (
        <div className="mt-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Variable: </span>
          <span className="text-orange-600 dark:text-orange-400 font-medium">
            ${data.variableName}
          </span>
        </div>
      )}

      {data.delay > 0 && (
        <div className="mt-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Retraso: </span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {data.delay}ms
          </span>
        </div>
      )}

      {/* Handle de entrada (a la izquierda) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 !bg-orange-500"
      />

      {/* Si no espera respuesta, solo mostramos un handle de salida */}
      {!data.waitForResponse ? (
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-orange-500"
        />
      ) : (
        /* Si espera respuesta, mostramos handles para cada opción (limitado) */
        handlePositions.map((position, index) => (
          <Handle
            key={index}
            id={`handle-${index}`}
            type="source"
            position={position.x}
            className="w-2 h-2 !bg-orange-500"
            style={{ top: position.y }}
          />
        ))
      )}
    </div>
  )
}

export default memo(ListNode)