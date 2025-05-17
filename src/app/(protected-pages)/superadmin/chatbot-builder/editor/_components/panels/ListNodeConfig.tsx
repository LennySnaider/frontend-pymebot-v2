/**
 * frontend/src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/panels/ListNodeConfig.tsx
 * Panel de configuración para nodo de listas interactivas
 * @version 1.0.0
 * @updated 2025-05-13
 */

import React from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { PiTrashDuotone, PiPlusBold, PiArrowsDownUpBold } from 'react-icons/pi'
import SystemVariableSelector from '@/components/shared/SystemVariableSelector'
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
    const updatedItems = listItems.filter((_, i) => i !== index)
    onChange('listItems', updatedItems)
  }

  // Función para agregar un nuevo item (máximo 10)
  const addListItem = () => {
    if (listItems.length >= 10) return
    
    const updatedItems = [...listItems, { text: '', description: '', value: '' }]
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
    <Form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <FormItem label="Etiqueta del nodo">
        <Input
          value={data.label || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="Lista"
        />
        <p className="mt-1 text-xs text-gray-500">
          Nombre descriptivo para identificar este nodo en el editor
        </p>
      </FormItem>

      <FormItem label="Mensaje">
        <div className="relative">
          <textarea
            className="w-full h-24 p-2 border border-gray-300 rounded-md"
            value={data.message || ''}
            onChange={(e) => onChange('message', e.target.value)}
            placeholder="Escribe el mensaje que acompañará a la lista..."
          />
          <div className="flex justify-end mt-2">
            <SystemVariableSelector
              onSelectVariable={(variable) => {
                const textarea = document.activeElement as HTMLTextAreaElement
                if (textarea && textarea.tagName === 'TEXTAREA') {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const newValue =
                    data.message.substring(0, start) +
                    variable +
                    data.message.substring(end)
                  onChange('message', newValue)
                } else {
                  onChange('message', (data.message || '') + variable)
                }
              }}
              buttonLabel="+ {{...}}"
              tooltipText="Insertar variable"
              className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-md text-sm flex items-center"
            />
          </div>
        </div>
        {containsVariables(data.message) && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <p className="text-xs font-medium text-blue-700 mb-1">
              Vista previa con variables:
            </p>
            <SystemVariableHighlighter
              text={data.message || ''}
              className="text-sm"
            />
          </div>
        )}
      </FormItem>

      <div className="grid grid-cols-2 gap-3">
        <FormItem label="Título de la lista">
          <Input
            value={data.listTitle || ''}
            onChange={(e) => onChange('listTitle', e.target.value)}
            placeholder="Selecciona una opción"
          />
        </FormItem>
        
        <FormItem label="Texto del botón">
          <Input
            value={data.buttonText || ''}
            onChange={(e) => onChange('buttonText', e.target.value)}
            placeholder="Ver opciones"
          />
        </FormItem>
      </div>

      <FormItem label="Opciones de la lista (máximo 10)">
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
                    <PiArrowsDownUpBold className="h-4 w-4 transform rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItemDown(index)}
                    disabled={index === listItems.length - 1}
                    className={`p-1 rounded ${index === listItems.length - 1 ? 'text-gray-400' : 'text-gray-600 hover:bg-gray-200'}`}
                    title="Mover abajo"
                  >
                    <PiArrowsDownUpBold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeListItem(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <PiTrashDuotone className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  value={item.text || ''}
                  onChange={(e) => updateListItem(index, 'text', e.target.value)}
                  placeholder="Texto de la opción"
                />
                
                <Input
                  value={item.description || ''}
                  onChange={(e) => updateListItem(index, 'description', e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="text-xs"
                />
                
                <Input
                  value={item.value || ''}
                  onChange={(e) => updateListItem(index, 'value', e.target.value)}
                  placeholder="Valor (opcional)"
                  className="text-xs bg-gray-100"
                />
              </div>
            </div>
          ))}
        </div>

        {listItems.length < 10 && (
          <Button
            variant="default"
            color="orange"
            icon={<PiPlusBold />}
            onClick={addListItem}
            className="w-full"
            disabled={listItems.length >= 10}
          >
            Agregar opción ({listItems.length}/10)
          </Button>
        )}
        
        {listItems.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Agrega hasta 10 opciones que el usuario podrá seleccionar de la lista.
          </p>
        )}
      </FormItem>

      <FormItem label="Guardar respuesta en variable">
        <div className="flex items-center">
          <span className="mr-1 text-gray-500">{'{}'}</span>
          <Input
            value={data.variableName || ''}
            onChange={(e) => onChange('variableName', e.target.value)}
            placeholder="respuesta_lista"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          El texto o valor de la opción seleccionada se guardará en esta variable
        </p>
      </FormItem>

      <FormItem>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="waitForResponse"
            checked={data.waitForResponse || false}
            onChange={(e) => onChange('waitForResponse', e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <label
            htmlFor="waitForResponse"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Esperar respuesta
          </label>
          <span className="ml-2 text-xs text-gray-500 italic">
            {data.waitForResponse
              ? "Pausa hasta seleccionar opción"
              : "Continúa automáticamente"}
          </span>
        </div>
      </FormItem>

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
    </Form>
  )
}

export default ListNodeConfig