/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/ButtonsNodeConfig.tsx
 * Panel de configuración para nodo de botones interactivos
 * @version 1.0.0
 * @updated 2025-05-13
 */

import React from 'react'
import VariableEnabledTextArea from '@/components/view/ChatbotBuilder/editors/VariableEnabledTextArea'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

interface ButtonsNodeConfigProps {
  data: {
    label?: string
    message?: string
    waitForResponse?: boolean
    variableName?: string
    buttons?: Array<{
      text: string
      value?: string
    }>
    [key: string]: any
  }
  onChange: (field: string, value: any) => void
}

const ButtonsNodeConfig: React.FC<ButtonsNodeConfigProps> = ({
  data,
  onChange,
}) => {
  // Si no hay botones, inicializar con un array vacío
  const buttons = Array.isArray(data.buttons) ? data.buttons : []

  // Función para actualizar un botón específico
  const updateButton = (index: number, field: string, value: string) => {
    const updatedButtons = [...buttons]
    
    if (!updatedButtons[index]) {
      updatedButtons[index] = { text: '', value: '' }
    }
    
    updatedButtons[index] = { 
      ...updatedButtons[index], 
      [field]: value 
    }
    
    onChange('buttons', updatedButtons)
  }

  // Función para eliminar un botón
  const removeButton = (index: number) => {
    // Si solo queda un botón, no permitir eliminarlo
    if (buttons.length <= 1) {
      console.log('No se puede eliminar el último botón. Debe haber al menos uno.')
      return
    }

    const updatedButtons = buttons.filter((_, i) => i !== index)
    onChange('buttons', updatedButtons)
  }

  // Función para agregar un nuevo botón (máximo 3)
  const addButton = () => {
    if (buttons.length >= 3) return

    const updatedButtons = [...buttons, { text: `Opción ${buttons.length + 1}`, value: `opcion_${buttons.length + 1}` }]
    onChange('buttons', updatedButtons)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Etiqueta del nodo
        </label>
        <input
          type="text"
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
          value={data.label || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="Botones"
        />
        <p className="mt-1 text-xs text-gray-500">
          Nombre descriptivo para identificar este nodo en el editor
        </p>
      </div>

      <VariableEnabledTextArea
        label="Mensaje"
        value={data.message || ''}
        onChange={(value) => onChange('message', value)}
        placeholder="Escribe el mensaje que acompañará a los botones..."
        rows={5}
        helpText="Puedes insertar variables del sistema usando el botón 'Insertar variable'"
      />

      {containsVariables(data.message) && (
        <div className="bg-blue-50 rounded-md p-3">
          <h4 className="font-medium text-blue-800 text-sm mb-2">
            Variables detectadas
          </h4>
          <div className="bg-white border border-blue-100 rounded-md p-2">
            <SystemVariableHighlighter
              text={data.message || ''}
              className="text-sm"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Botones (máximo 3)
        </label>
        <div className="space-y-2 mb-3">
          {buttons.map((button, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-grow space-y-2">
                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 mb-1"
                  value={button.text || ''}
                  onChange={(e) => updateButton(index, 'text', e.target.value)}
                  placeholder={`Texto del botón ${index + 1}`}
                />
                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-xs bg-gray-50"
                  value={button.value || ''}
                  onChange={(e) => updateButton(index, 'value', e.target.value)}
                  placeholder={`Valor (opcional)`}
                />
              </div>
              <button
                type="button"
                className="mt-1 text-red-500 hover:text-red-700"
                onClick={() => removeButton(index)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {buttons.length < 3 && (
          <button
            type="button"
            className="w-full py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md border border-purple-200 flex items-center justify-center"
            onClick={addButton}
            disabled={buttons.length >= 3}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Agregar botón ({buttons.length}/3)
          </button>
        )}

        {buttons.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Agrega hasta 3 botones interactivos que el usuario podrá seleccionar.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Guardar respuesta en variable
        </label>
        <div className="flex items-center">
          <span className="mr-1 text-gray-500">{'{}'}</span>
          <input
            type="text"
            className="flex-grow border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
            value={data.variableName || ''}
            onChange={(e) => onChange('variableName', e.target.value)}
            placeholder="respuesta_boton"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          El texto o valor del botón seleccionado se guardará en esta variable
        </p>
      </div>

      <div className="space-y-4 my-4 border-t border-gray-200 pt-4">
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="waitForResponse"
            checked={data.waitForResponse || false}
            onChange={(e) => onChange('waitForResponse', e.target.checked)}
            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
          />
          <label
            htmlFor="waitForResponse"
            className="ml-2 block text-sm font-medium text-gray-700"
          >
            Esperar respuesta del usuario
          </label>
        </div>
        <p className="text-xs text-gray-500 ml-6">
          Si se activa, el flujo se detendrá después de este mensaje y esperará a que el usuario seleccione un botón.
        </p>

        {data.waitForResponse && (
          <div className="bg-amber-50 rounded-md p-3 mt-3">
            <div className="flex items-center">
              <span className="text-amber-600 mr-2">⌛</span>
              <p className="text-sm font-medium text-amber-800">Modo espera activado</p>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Este nodo esperará a que el usuario seleccione un botón antes de continuar con el flujo.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Retraso (ms)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
            placeholder="Retraso en milisegundos (0 = sin retraso)"
            value={data.delay?.toString() || '0'}
            onChange={(e) =>
              onChange(
                'delay',
                e.target.value ? parseInt(e.target.value, 10) : 0,
              )
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Tiempo de espera antes de mostrar este mensaje (en
            milisegundos)
          </p>
        </div>
      </div>

      <div className="bg-purple-50 rounded-md p-3">
        <h4 className="font-medium text-purple-800 text-sm mb-1">
          Información
        </h4>
        <p className="text-xs text-purple-700">
          Los botones interactivos permiten al usuario seleccionar opciones predefinidas con un solo toque.
          En WhatsApp, puedes incluir hasta 3 botones por mensaje.
        </p>
        <p className="text-xs text-purple-700 mt-1">
          Cada botón puede tener un texto visible y un valor interno opcional que se guardará en la
          variable especificada cuando el usuario lo seleccione.
        </p>
      </div>
    </div>
  )
}

export default ButtonsNodeConfig