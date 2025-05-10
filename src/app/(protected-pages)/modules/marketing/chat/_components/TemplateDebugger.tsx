'use client'

/**
 * frontend/src/app/(protected-pages)/modules/marketing/chat/_components/TemplateDebugger.tsx
 * Componente para diagnosticar problemas con plantillas de chatbot
 * @version 1.0.0
 * @updated 2025-05-11
 */

import React, { useState, useEffect } from 'react'
import { useChatStore } from '../_store/chatStore'
import { Button } from '@/components/ui'
import Dialog from '@/components/ui/Dialog'

interface ValidationResult {
  id: string
  name: string
  isValid: boolean
  message: string | null
  validationDetails: any
}

const TemplateDebugger = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ValidationResult[]>([])
  const [open, setOpen] = useState(false)
  const templates = useChatStore((state) => state.templates)
  const activeTemplateId = useChatStore((state) => state.activeTemplateId)
  
  const validateAllTemplates = async () => {
    setIsLoading(true)
    try {
      const validationResults = []
      
      // Validar todas las plantillas disponibles
      for (const template of templates) {
        try {
          const response = await fetch(`/api/chatbot/validate-template?id=${template.id}`)
          if (response.ok) {
            const data = await response.json()
            validationResults.push(data)
          } else {
            console.error(`Error al validar plantilla ${template.id}:`, response.statusText)
            validationResults.push({
              id: template.id,
              name: template.name,
              isValid: false,
              message: null,
              validationDetails: { error: `Error HTTP: ${response.status} ${response.statusText}` }
            })
          }
        } catch (error) {
          console.error(`Error al validar plantilla ${template.id}:`, error)
          validationResults.push({
            id: template.id,
            name: template.name,
            isValid: false,
            message: null,
            validationDetails: { error: error instanceof Error ? error.message : 'Error desconocido' }
          })
        }
      }
      
      setResults(validationResults)
    } catch (error) {
      console.error('Error general en validación:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    if (open) {
      validateAllTemplates()
    }
  }, [open, templates])
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 h-8"
        onClick={() => setOpen(true)}
      >
        Diagnosticar
      </Button>

      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        width={800}
        contentClassName="max-h-[90vh] overflow-y-auto"
      >
        <h4 className="font-bold text-lg mb-4">Diagnóstico de Plantillas</h4>

        <div className="mt-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
            <h4 className="font-semibold mb-2">Información General</h4>
            <p>Total de plantillas: {templates.length}</p>
            <p>Plantilla activa: {templates.find(t => t.id === activeTemplateId)?.name || 'Ninguna'}</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Validando plantillas...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={validateAllTemplates} size="sm">
                Actualizar diagnóstico
              </Button>

              {results.map((result) => (
                <div
                  key={result.id}
                  className={`border p-4 rounded-md ${
                    result.isValid ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{result.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        result.isValid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {result.isValid ? 'Válida' : 'Inválida'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    ID: <code className="bg-gray-100 px-1 rounded">{result.id}</code>
                  </div>

                  {result.isValid ? (
                    <div className="mt-2">
                      <h4 className="font-medium text-sm">Primer mensaje encontrado:</h4>
                      <div className="bg-white p-2 rounded border border-gray-200 mt-1 text-sm">
                        {result.message}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Origen: {result.validationDetails?.messageSource}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <h4 className="font-medium text-sm text-red-700">Error:</h4>
                      <div className="bg-red-100 p-2 rounded border border-red-200 mt-1 text-sm">
                        {result.validationDetails?.error || 'Error desconocido'}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Detalles técnicos
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto max-h-48">
                        {JSON.stringify(result.validationDetails, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>
    </>
  )
}

export default TemplateDebugger