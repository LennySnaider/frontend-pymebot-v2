/**
 * frontend/src/components/view/ChatbotBuilder/panels/node-configs/ListNodeConfig.tsx
 * Panel de configuración para nodo de listas interactivas
 * @version 1.0.0
 * @updated 2025-05-13
 */

import React from 'react'
import VariableEnabledTextArea from '@/components/view/ChatbotBuilder/editors/VariableEnabledTextArea'
import SystemVariableHighlighter from '@/components/shared/SystemVariableHighlighter'
import { containsVariables } from '@/services/SystemVariablesService'

interface ListNodeConfigProps {
  data: {
    label?: string
    message?: string
    listTitle?: string
    buttonText?: string
    waitForResponse?: boolean
    variableName?: string
    listItems?: Array<{
      text: string
      description?: string
      value?: string
    }>
    [key: string]: any
  }
  onChange: (field: string, value: any) => void
}

const ListNodeConfig: React.FC<ListNodeConfigProps> = ({
  data,
  onChange,
}) => {
  // Si no hay items, inicializar con un array vacío
  const listItems = Array.isArray(data.listItems) ? data.listItems : []

  // Función para actualizar un item específico
  const updateListItem = (index: number, field: string, value: string) => {
    const updatedItems = [...listItems]
    
    if (!updatedItems[index]) {
      updatedItems[index] = { text: '', description: '', value: '' }
    }
    
    updatedItems[index] = { 
      ...updatedItems[index], 
      [field]: value 
    }
    
    onChange('listItems', updatedItems)
  }

  // Función para eliminar un item
  const removeListItem = (index: number) => {
    // Si solo queda un item, no permitir eliminarlo
    if (listItems.length <= 1) {
      console.log('No se puede eliminar el último elemento. Debe haber al menos uno.')
      return
    }

    const updatedItems = listItems.filter((_, i) => i !== index)
    onChange('listItems', updatedItems)
  }

  // Función para agregar un nuevo item (máximo 10)
  const addListItem = () => {
    if (listItems.length >= 10) return

    const updatedItems = [...listItems, {
      text: `Opción ${listItems.length + 1}`,
      description: `Descripción de la opción ${listItems.length + 1}`,
      value: `opcion_${listItems.length + 1}`
    }]
    onChange('listItems', updatedItems)
  }

  // Función para mover un item hacia arriba
  const moveItemUp = (index: number) => {
    if (index === 0) return
    
    const updatedItems = [...listItems]
    const temp = updatedItems[index]
    updatedItems[index] = updatedItems[index - 1]
    updatedItems[index - 1] = temp
    
    onChange('listItems', updatedItems)
  }

  // Función para mover un item hacia abajo
  const moveItemDown = (index: number) => {
    if (index === listItems.length - 1) return
    
    const updatedItems = [...listItems]
    const temp = updatedItems[index]
    updatedItems[index] = updatedItems[index + 1]
    updatedItems[index + 1] = temp
    
    onChange('listItems', updatedItems)
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
          placeholder="Lista"
        />
        <p className="mt-1 text-xs text-gray-500">
          Nombre descriptivo para identificar este nodo en el editor
        </p>
      </div>

      <VariableEnabledTextArea
        label="Mensaje"
        value={data.message || ''}
        onChange={(value) => onChange('message', value)}
        placeholder="Escribe el mensaje que acompañará a la lista..."
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título de la lista
          </label>
          <input
            type="text"
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
            value={data.listTitle || ''}
            onChange={(e) => onChange('listTitle', e.target.value)}
            placeholder="Selecciona una opción"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Texto del botón
          </label>
          <input
            type="text"
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
            value={data.buttonText || ''}
            onChange={(e) => onChange('buttonText', e.target.value)}
            placeholder="Ver opciones"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opciones de la lista (máximo 10)
        </label>
        <div className="space-y-3 mb-3">
          {listItems.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-2 bg-gray-50">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Opción {index + 1}</span>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => moveItemUp(index)}
                    disabled={index === 0}
                    className={`p-1 rounded ${index === 0 ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-200'}`}
                    title="Mover arriba"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItemDown(index)}
                    disabled={index === listItems.length - 1}
                    className={`p-1 rounded ${index === listItems.length - 1 ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-200'}`}
                    title="Mover abajo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeListItem(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                  value={item.text || ''}
                  onChange={(e) => updateListItem(index, 'text', e.target.value)}
                  placeholder="Texto de la opción"
                />

                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-xs"
                  value={item.description || ''}
                  onChange={(e) => updateListItem(index, 'description', e.target.value)}
                  placeholder="Descripción (opcional)"
                />

                <input
                  type="text"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 text-xs bg-gray-100"
                  value={item.value || ''}
                  onChange={(e) => updateListItem(index, 'value', e.target.value)}
                  placeholder="Valor (opcional)"
                />
              </div>
            </div>
          ))}
        </div>

        {listItems.length < 10 && (
          <button
            type="button"
            className="w-full py-2 px-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md border border-orange-200 flex items-center justify-center"
            onClick={addListItem}
            disabled={listItems.length >= 10}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Agregar opción ({listItems.length}/10)
          </button>
        )}

        {listItems.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Agrega hasta 10 opciones que el usuario podrá seleccionar de la lista.
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
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
            value={data.variableName || ''}
            onChange={(e) => onChange('variableName', e.target.value)}
            placeholder="respuesta_lista"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          El texto o valor de la opción seleccionada se guardará en esta variable
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
          Si se activa, el flujo se detendrá después de este mensaje y esperará a que el usuario seleccione una opción.
        </p>

        {data.waitForResponse && (
          <div className="bg-amber-50 rounded-md p-3 mt-3">
            <div className="flex items-center">
              <span className="text-amber-600 mr-2">⌛</span>
              <p className="text-sm font-medium text-amber-800">Modo espera activado</p>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Este nodo esperará a que el usuario seleccione una opción antes de continuar con el flujo.
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

      <div className="bg-orange-50 rounded-md p-3">
        <h4 className="font-medium text-orange-800 text-sm mb-1">
          Información
        </h4>
        <p className="text-xs text-orange-700">
          Las listas interactivas permiten mostrar al usuario un menú de opciones para elegir.
          En WhatsApp, puedes incluir hasta 10 opciones en una lista.
        </p>
        <p className="text-xs text-orange-700 mt-1">
          Cada opción puede tener un texto principal, una descripción opcional y un valor interno
          que se guardará en la variable especificada cuando el usuario la seleccione.
        </p>
      </div>
    </div>
  )
}

export default ListNodeConfig