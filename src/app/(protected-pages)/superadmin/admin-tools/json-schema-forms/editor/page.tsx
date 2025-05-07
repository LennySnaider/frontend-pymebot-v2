/**
 * frontend/src/app/(protected-pages)/superadmin/admin-tools/json-schema-forms/editor/page.tsx
 * Página dedicada para editar esquemas JSON
 * @version 1.0.0
 * @updated 2025-05-01
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import JsonSchemaFullPageEditor from '../_components/JsonSchemaFullPageEditor'
import { Notification } from '@/components/ui/Notification'
import { toast } from '@/components/ui/toast'
import Loading from '@/components/shared/Loading'

const JsonSchemaEditorPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const schemaId = searchParams.get('id')
  const isNewSchema = !schemaId
  
  // Obtener información de autenticación
  const { isAuthenticated, isSuperAdmin, isLoading: authLoading } = useAuth()

  // Estado para los datos del esquema
  const [loading, setLoading] = useState(true)
  const [currentSchema, setCurrentSchema] = useState<any>(null)
  const [schemaInEditor, setSchemaInEditor] = useState<Record<string, any>>({
    type: 'object',
    properties: {},
  })

  // Cargar datos del esquema si es edición
  // Redireccionar si no es superadmin
  useEffect(() => {
    if (!authLoading && !isSuperAdmin()) {
      toast.push(
        <Notification title="Acceso denegado" type="danger">
          No tienes permisos para acceder a este recurso.
        </Notification>
      )
      router.push('/dashboard')
    }
  }, [authLoading, isSuperAdmin, router])

  useEffect(() => {
    const loadSchema = async () => {
      // Si está cargando autenticación o no es superadmin, no cargar datos
      if (authLoading || !isSuperAdmin()) {
        return
      }

      setLoading(true)
      
      if (isNewSchema) {
        // Si es un nuevo esquema, inicializamos con valores por defecto
        setCurrentSchema(null)
        setSchemaInEditor({
          type: 'object',
          properties: {},
        })
        setLoading(false)
        return
      }

      try {
        // En una implementación real, aquí se cargarían los datos desde la API
        // Por ahora, simulamos un esquema de ejemplo
        const mockSchema = {
          id: schemaId,
          name: 'Formulario de Contacto',
          description: 'Esquema para formularios de contacto general',
          category: 'form',
          isPublic: true,
          createdAt: '2025-04-25T10:00:00',
          updatedAt: '2025-04-25T10:00:00',
          usage: 42,
          schema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Nombre completo'
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'Correo electrónico'
              },
              subject: {
                type: 'string',
                description: 'Asunto del mensaje'
              },
              message: {
                type: 'string',
                description: 'Mensaje o consulta'
              }
            },
            required: ['name', 'email', 'message']
          }
        }

        setCurrentSchema(mockSchema)
        setSchemaInEditor(mockSchema.schema)
      } catch (error) {
        console.error('Error loading schema:', error)
        toast.push(
          <Notification title="Error" type="danger">
            No se pudo cargar el esquema.
          </Notification>
        )
      } finally {
        setLoading(false)
      }
    }

    loadSchema()
  }, [schemaId, isNewSchema])

  // Manejar cambios en el editor de esquemas
  const handleSchemaChange = (schema: Record<string, any>) => {
    setSchemaInEditor(schema)
  }

  // Manejar el envío del formulario
  const handleSubmit = (data: any) => {
    // En una implementación real, aquí se enviarían los datos a la API
    console.log('Submitting form data:', {
      ...data,
      schema: schemaInEditor
    })

    // Mostrar notificación de éxito
    toast.push(
      <Notification title={isNewSchema ? 'Esquema creado' : 'Esquema actualizado'} type="success">
        El esquema se ha {isNewSchema ? 'creado' : 'actualizado'} correctamente.
      </Notification>
    )

    // Redirigir a la lista de esquemas
    router.push('/superadmin/admin-tools/json-schema-forms')
  }

  // Manejar cancelación
  const handleCancel = () => {
    router.push('/superadmin/admin-tools/json-schema-forms')
  }

  if (loading || authLoading) {
    return <Loading loading={true} />
  }
  
  // No mostrar nada si no es superadmin
  if (!isSuperAdmin()) {
    return null
  }

  return (
    <JsonSchemaFullPageEditor
      currentSchema={currentSchema}
      schemaInEditor={schemaInEditor}
      onSchemaChange={handleSchemaChange}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  )
}

export default JsonSchemaEditorPage
