'use client'

/**
 * frontend/src/components/verticals/medicina/features/MedicalFormBuilder.tsx
 * Componente para crear y editar formularios médicos personalizados utilizando JSONSchemaEditor.
 * Permite definir la estructura de formularios para historias clínicas, evaluaciones y seguimientos.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/tabs'
import { Form, FormItem } from '@/components/ui/Form'
import { Dialog } from '@/components/ui/Dialog'
import { Notification } from '@/components/ui/Notification'
import { toast } from '@/components/ui/toast'
import { JSONSchemaEditor } from '@/components/shared'
import { Save, Plus, FileText, Eye, File, List, Database } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Ejemplos de esquemas predefinidos para formularios médicos
const templateSchemas = {
  historiaClinica: {
    type: 'object',
    properties: {
      informacionPersonal: {
        type: 'object',
        properties: {
          nombreCompleto: { type: 'string' },
          fechaNacimiento: { type: 'string', format: 'date' },
          genero: { 
            type: 'string', 
            enum: ['masculino', 'femenino', 'otro', 'prefiero no decirlo'] 
          },
          numeroIdentificacion: { type: 'string' }
        },
        required: ['nombreCompleto', 'fechaNacimiento']
      },
      antecedentes: {
        type: 'object',
        properties: {
          antecedentesFamiliares: { type: 'string' },
          antecedentesPersonales: { type: 'string' },
          alergias: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          medicacionActual: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                medicamento: { type: 'string' },
                dosis: { type: 'string' },
                frecuencia: { type: 'string' }
              }
            }
          }
        }
      },
      examenFisico: {
        type: 'object',
        properties: {
          presionArterial: { type: 'string' },
          frecuenciaCardiaca: { type: 'number' },
          temperatura: { type: 'number' },
          peso: { type: 'number' },
          talla: { type: 'number' }
        }
      }
    }
  },
  evaluacionInicialFisioterapia: {
    type: 'object',
    properties: {
      datosGenerales: {
        type: 'object',
        properties: {
          paciente: { type: 'string' },
          edad: { type: 'integer', minimum: 0 },
          motivoConsulta: { type: 'string' }
        },
        required: ['paciente', 'motivoConsulta']
      },
      dolorEscala: {
        type: 'integer',
        minimum: 0,
        maximum: 10,
        description: 'Escala de dolor (0-10)'
      },
      movilidad: {
        type: 'object',
        properties: {
          flexion: { type: 'number' },
          extension: { type: 'number' },
          rotacionInterna: { type: 'number' },
          rotacionExterna: { type: 'number' }
        }
      },
      observaciones: { type: 'string' }
    }
  }
}

// Esquema para el formulario de creación/edición de plantillas
const formTemplateSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  descripcion: z.string().optional(),
  categoria: z.string().min(1, 'Seleccione una categoría'),
})

type FormTemplateValues = z.infer<typeof formTemplateSchema>

// Categorías de formularios médicos
const categorias = [
  { value: 'historia_clinica', label: 'Historia Clínica' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'especialidad', label: 'Especialidad' },
  { value: 'consentimiento', label: 'Consentimiento Informado' },
]

interface MedicalFormTemplate {
  id: string
  nombre: string
  descripcion?: string
  categoria: string
  esquema: Record<string, any>
  fechaCreacion: string
  fechaActualizacion: string
}

const MedicalFormBuilder = () => {
  // Estado para las plantillas de formularios
  const [formTemplates, setFormTemplates] = useState<MedicalFormTemplate[]>([
    {
      id: '1',
      nombre: 'Historia Clínica General',
      descripcion: 'Formulario estándar para historia clínica de pacientes',
      categoria: 'historia_clinica',
      esquema: templateSchemas.historiaClinica,
      fechaCreacion: '2025-04-20T10:00:00',
      fechaActualizacion: '2025-04-20T10:00:00',
    },
    {
      id: '2',
      nombre: 'Evaluación de Fisioterapia',
      descripcion: 'Evaluación inicial para pacientes de fisioterapia',
      categoria: 'evaluacion',
      esquema: templateSchemas.evaluacionInicialFisioterapia,
      fechaCreacion: '2025-04-22T14:30:00',
      fechaActualizacion: '2025-04-22T14:30:00',
    },
  ])
  
  // Estado para la plantilla actual en edición
  const [currentTemplate, setCurrentTemplate] = useState<MedicalFormTemplate | null>(null)
  const [schemaInEditor, setSchemaInEditor] = useState<Record<string, any>>({})
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('templates')
  
  // Configuración del formulario de creación/edición de plantillas
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormTemplateValues>({
    resolver: zodResolver(formTemplateSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria: '',
    },
  })
  
  // Maneja la creación de una nueva plantilla
  const handleNewTemplate = () => {
    setCurrentTemplate(null)
    setSchemaInEditor({
      type: 'object',
      properties: {},
      required: [],
    })
    reset({
      nombre: '',
      descripcion: '',
      categoria: '',
    })
    setIsFormDialogOpen(true)
  }
  
  // Maneja la edición de una plantilla existente
  const handleEditTemplate = (template: MedicalFormTemplate) => {
    setCurrentTemplate(template)
    setSchemaInEditor(template.esquema)
    reset({
      nombre: template.nombre,
      descripcion: template.descripcion || '',
      categoria: template.categoria,
    })
    setIsFormDialogOpen(true)
  }
  
  // Maneja el guardado del formulario de plantilla
  const onSubmitTemplateForm = (data: FormTemplateValues) => {
    setIsFormDialogOpen(false)
    
    const now = new Date().toISOString()
    
    if (currentTemplate) {
      // Actualizar plantilla existente
      setFormTemplates((prev) =>
        prev.map((template) =>
          template.id === currentTemplate.id
            ? {
                ...template,
                nombre: data.nombre,
                descripcion: data.descripcion,
                categoria: data.categoria,
                esquema: schemaInEditor,
                fechaActualizacion: now,
              }
            : template
        )
      )
      
      toast.push(
        <Notification title="Plantilla actualizada" type="success">
          La plantilla se ha actualizado correctamente
        </Notification>
      )
    } else {
      // Crear nueva plantilla
      const newTemplate: MedicalFormTemplate = {
        id: Math.random().toString(36).substr(2, 9), // ID único simple
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        esquema: schemaInEditor,
        fechaCreacion: now,
        fechaActualizacion: now,
      }
      
      setFormTemplates((prev) => [...prev, newTemplate])
      
      toast.push(
        <Notification title="Plantilla creada" type="success">
          La nueva plantilla se ha creado correctamente
        </Notification>
      )
    }
    
    setActiveTab('templates')
  }
  
  // Maneja los cambios en el esquema JSON
  const handleSchemaChange = useCallback((schema: Record<string, any>) => {
    setSchemaInEditor(schema)
  }, [])
  
  // Maneja la selección de una plantilla para edición
  const handleSelectTemplate = (template: MedicalFormTemplate) => {
    setCurrentTemplate(template)
    setSchemaInEditor(template.esquema)
    setActiveTab('editor')
  }
  
  // Maneja el guardado del esquema actual
  const handleSaveSchema = () => {
    if (!currentTemplate) return
    
    setFormTemplates((prev) =>
      prev.map((template) =>
        template.id === currentTemplate.id
          ? {
              ...template,
              esquema: schemaInEditor,
              fechaActualizacion: new Date().toISOString(),
            }
          : template
      )
    )
    
    toast.push(
      <Notification title="Esquema guardado" type="success">
        El esquema se ha guardado correctamente
      </Notification>
    )
  }
  
  // Renderiza la lista de plantillas
  const renderTemplatesList = () => {
    return formTemplates.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectTemplate(template)}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h5 className="font-medium text-lg">{template.nombre}</h5>
                  <div className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 inline-block mt-1">
                    {categorias.find((c) => c.value === template.categoria)?.label || template.categoria}
                  </div>
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  <FileText size={18} />
                </div>
              </div>
              
              {template.descripcion && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {template.descripcion}
                </p>
              )}
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <div className="flex items-center gap-1">
                  <Database size={12} />
                  {Object.keys(template.esquema.properties || {}).length} campos
                </div>
                <div className="mt-1">
                  Actualizado: {new Date(template.fechaActualizacion).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    ) : (
      <div className="text-center p-8 border border-dashed rounded-md">
        <File size={36} className="mx-auto mb-3 text-gray-400" />
        <h5 className="font-medium text-lg mb-1">No hay plantillas de formularios</h5>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Crea tu primera plantilla para empezar a configurar formularios médicos
        </p>
        <Button variant="solid" icon={<Plus />} onClick={handleNewTemplate}>
          Crear Plantilla
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4">
          <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
            <Tabs.TabList>
              <Tabs.TabNav value="templates" icon={<List />}>
                Plantillas
              </Tabs.TabNav>
              <Tabs.TabNav value="editor" icon={<Eye />}
                            disabled={!currentTemplate}>
                Editor de Esquema
              </Tabs.TabNav>
            </Tabs.TabList>
            <Tabs.TabContent value="templates">
              <div className="pt-4 pb-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium">Plantillas de Formularios Médicos</h4>
                  <Button
                    variant="solid"
                    color="blue-600"
                    icon={<Plus />}
                    onClick={handleNewTemplate}
                  >
                    Nueva Plantilla
                  </Button>
                </div>
                
                {renderTemplatesList()}
              </div>
            </Tabs.TabContent>
            <Tabs.TabContent value="editor">
              <div className="pt-4 pb-2">
                {currentTemplate && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-lg font-medium">{currentTemplate.nombre}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {currentTemplate.descripcion}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="twoTone"
                          color="gray-600"
                          onClick={() => handleEditTemplate(currentTemplate)}
                        >
                          Editar Detalles
                        </Button>
                        <Button
                          variant="solid"
                          color="blue-600"
                          icon={<Save />}
                          onClick={handleSaveSchema}
                        >
                          Guardar Esquema
                        </Button>
                      </div>
                    </div>
                    
                    <JSONSchemaEditor
                      initialSchema={schemaInEditor}
                      onChange={handleSchemaChange}
                    />
                  </>
                )}
              </div>
            </Tabs.TabContent>
          </Tabs>
        </div>
      </Card>
      
      {/* Diálogo para crear/editar detalles de la plantilla */}
      <Dialog
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onRequestClose={() => setIsFormDialogOpen(false)}
      >
        <h5 className="mb-4 text-lg font-medium">
          {currentTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Formulario'}
        </h5>
        
        <Form onSubmit={handleSubmit(onSubmitTemplateForm)}>
          <div className="space-y-4">
            <FormItem
              label="Nombre de la Plantilla"
              invalid={Boolean(errors.nombre)}
              errorMessage={errors.nombre?.message}
            >
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            
            <FormItem
              label="Descripción"
            >
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </FormItem>
            
            <FormItem
              label="Categoría"
              invalid={Boolean(errors.categoria)}
              errorMessage={errors.categoria?.message}
            >
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Select
                    options={categorias}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormItem>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="plain" onClick={() => setIsFormDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="solid" type="submit">
              {currentTemplate ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </Form>
      </Dialog>
    </div>
  )
}

export default MedicalFormBuilder
