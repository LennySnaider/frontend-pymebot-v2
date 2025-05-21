'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { PiSquaresFourDuotone } from 'react-icons/pi'
import NodeWrapper from './NodeWrapper'

const ButtonsNode = ({ data, selected }: NodeProps) => {
  // Asegurar que siempre hay un array de botones y limitar a 3
  const buttons = Array.isArray(data.buttons) ? data.buttons.slice(0, 3) : []

  // Posiciones dinámicas para los handles de salida basadas en la cantidad de botones
  const getHandlePositions = (count: number) => {
    const positions = []

    // Si no hay botones o no se espera respuesta, el handle va directo a la derecha
    if (count === 0 || !data.waitForResponse) {
      return [{ y: '50%', x: Position.Right }]
    }

    // Distribuir handles uniformemente
    const offset = 100 / (count + 1)
    for (let i = 1; i <= count; i++) {
      positions.push({
        y: `${i * offset}%`,
        x: Position.Right,
      })
    }

    return positions
  }

  const handlePositions = getHandlePositions(buttons.length)

  return (
    <NodeWrapper 
      selected={selected} 
      salesStageId={data.salesStageId}
      className="min-w-[180px]"
      borderColor="border-purple-200 dark:border-purple-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PiSquaresFourDuotone className="text-purple-500 text-xl mr-2" />
          <span className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            {data.label || 'Botones'}
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

      {/* Mostrar los botones configurados */}
      <div className="mt-2 space-y-1">
        {buttons.length > 0 ? (
          buttons.map((button, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1 px-2 py-1 bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 text-xs rounded-md border border-purple-200 dark:border-purple-700">
                {button.text || `Botón ${index + 1}`}
              </div>
              {data.waitForResponse && (
                <div className="flex items-center ml-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-purple-500 text-white text-xs">
                    {index + 1}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">Sin botones configurados</div>
        )}

      </div>

      {data.variableName && (
        <div className="mt-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Variable: </span>
          <span className="text-purple-600 dark:text-purple-400 font-medium">
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
        className="w-2 h-2 !bg-purple-500"
      />

      {/* Si no espera respuesta, solo mostramos un handle de salida */}
      {!data.waitForResponse ? (
        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-purple-500"
        />
      ) : (
        /* Si espera respuesta, mostramos handles para cada botón */
        handlePositions.map((position, index) => (
          <Handle
            key={index}
            id={`handle-${index}`}
            type="source"
            position={position.x}
            className="w-2 h-2 !bg-purple-500"
            style={{ top: position.y }}
          />
        ))
      )}
    </NodeWrapper>
  )
}

export default memo(ButtonsNode)