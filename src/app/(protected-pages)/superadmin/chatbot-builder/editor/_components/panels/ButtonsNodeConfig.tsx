/**
 * frontend/src/app/(protected-pages)/superadmin/chatbot-builder/editor/_components/panels/ButtonsNodeConfig.tsx
 * Panel de configuración para nodo de botones interactivos
 * @version 1.0.0
 * @updated 2025-05-13
 */

import React from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { PiTrashDuotone, PiPlusBold } from 'react-icons/pi'
import SystemVariableSelector from '@/components/shared/SystemVariableSelector'
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
    const updatedButtons = buttons.filter((_, i) => i !== index)
    onChange('buttons', updatedButtons)
  }

  // Función para agregar un nuevo botón (máximo 3)
  const addButton = () => {
    if (buttons.length >= 3) return
    
    const updatedButtons = [...buttons, { text: '', value: '' }]
    onChange('buttons', updatedButtons)
  }

  return (
    <Form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <FormItem label="Etiqueta del nodo">
        <Input
          value={data.label || ''}
          onChange={(e) => onChange('label', e.target.value)}
          placeholder="Botones"
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
            placeholder="Escribe el mensaje que acompañará a los botones..."
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

      <FormItem label="Botones (máximo 3)">
        <div className="space-y-2 mb-3">
          {buttons.map((button, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-grow space-y-2">
                <Input
                  value={button.text || ''}
                  onChange={(e) => updateButton(index, 'text', e.target.value)}
                  placeholder={`Texto del botón ${index + 1}`}
                  className="mb-1"
                />
                <Input
                  value={button.value || ''}
                  onChange={(e) => updateButton(index, 'value', e.target.value)}
                  placeholder={`Valor (opcional)`}
                  className="text-xs bg-gray-50"
                />
              </div>
              <Button
                variant="plain"
                color="red"
                icon={<PiTrashDuotone />}
                onClick={() => removeButton(index)}
                className="mt-1"
              />
            </div>
          ))}
        </div>

        {buttons.length < 3 && (
          <Button
            variant="default"
            color="purple"
            icon={<PiPlusBold />}
            onClick={addButton}
            className="w-full"
            disabled={buttons.length >= 3}
          >
            Agregar botón ({buttons.length}/3)
          </Button>
        )}
        
        {buttons.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Agrega hasta 3 botones interactivos que el usuario podrá seleccionar.
          </p>
        )}
      </FormItem>

      <FormItem label="Guardar respuesta en variable">
        <div className="flex items-center">
          <span className="mr-1 text-gray-500">{'{}'}</span>
          <Input
            value={data.variableName || ''}
            onChange={(e) => onChange('variableName', e.target.value)}
            placeholder="respuesta_boton"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          El texto o valor del botón seleccionado se guardará en esta variable
        </p>
      </FormItem>

      <FormItem>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="waitForResponse"
            checked={data.waitForResponse || false}
            onChange={(e) => onChange('waitForResponse', e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label
            htmlFor="waitForResponse"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Esperar respuesta
          </label>
          <span className="ml-2 text-xs text-gray-500 italic">
            {data.waitForResponse
              ? "Pausa hasta seleccionar botón"
              : "Continúa automáticamente"}
          </span>
        </div>
      </FormItem>

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
    </Form>
  )
}

export default ButtonsNodeConfig