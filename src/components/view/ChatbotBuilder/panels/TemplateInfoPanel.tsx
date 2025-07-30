'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/panels/TemplateInfoPanel.tsx
 * Panel para configurar información general de la plantilla de chatbot
 * @version 1.1.0
 * @updated 2025-04-08
 */

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from '@/components/ui/toast'
import {
    PiX,
    PiInfo,
    PiSpeakerHigh,
    PiMicrophone,
    PiPencil,
    PiPlus,
} from 'react-icons/pi'
import { v4 as uuidv4 } from 'uuid'

// Inicialización de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Vertical {
    id: string
    name: string
    description?: string
    created_at?: string
}

interface TemplateData {
    id: string
    name: string
    description: string
    status: 'draft' | 'published'
    vertical_id?: string
    created_at?: string
    updated_at?: string
    [key: string]: unknown
}

interface TemplateInfoPanelProps {
    templateData: TemplateData
    onUpdate: (newData: TemplateData) => void
    onClose: () => void
}

// Función auxiliar para mostrar mensajes de error
const showError = (message: string) => {
    toast.push(message)
}

// Función auxiliar para mostrar mensajes de éxito
const showSuccess = (message: string) => {
    toast.push(message)
}

const TemplateInfoPanel: React.FC<TemplateInfoPanelProps> = ({
    templateData,
    onUpdate,
    onClose,
}) => {
    const [verticals, setVerticals] = useState<Vertical[]>([])
    const [loading, setLoading] = useState(false)
    const [showNewIndustryModal, setShowNewIndustryModal] = useState(false)
    const [newIndustryName, setNewIndustryName] = useState('')
    const [newIndustryDescription, setNewIndustryDescription] = useState('')
    const [savingIndustry, setSavingIndustry] = useState(false)

    // Cargar verticals (categorías de plantillas)
    useEffect(() => {
        const fetchVerticals = async () => {
            setLoading(true)

            try {
                const { data, error } = await supabase
                    .from('verticals')
                    .select('id, name, description')
                    .order('name')

                if (error) throw error

                setVerticals(data || [])
            } catch (error) {
                console.error('Error loading verticals:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchVerticals()
    }, [])

    // Manejar cambios en los campos
    const handleChange = async (field: keyof TemplateData, value: unknown) => {
        // Validar que el nombre no esté vacío
        if (field === 'name' && typeof value === 'string' && !value.trim()) {
            // No permitir nombres vacíos, pero dejar que el usuario siga editando
            return
        }

        const updatedData = {
            ...templateData,
            [field]: value,
        }

        // Asegurarnos de que la actualización se refleje de inmediato en la UI
        onUpdate(updatedData)

        // Para cualquier campo, guardar tanto en localStorage como en Supabase para asegurar persistencia
        try {
            // Primero guardar en localStorage para respuesta instantánea
            const LOCAL_STORAGE_KEY = 'mock_chatbot_templates'
            const storedTemplates = JSON.parse(
                localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
            )

            if (storedTemplates[templateData.id]) {
                // Preservar todos los datos existentes y solo actualizar el campo específico
                const updatedTemplate = {
                    ...storedTemplates[templateData.id],
                    [field]: value,
                    updated_at: new Date().toISOString(),
                }

                // Actualizar en localStorage
                storedTemplates[templateData.id] = updatedTemplate
                localStorage.setItem(
                    LOCAL_STORAGE_KEY,
                    JSON.stringify(storedTemplates),
                )

                // Luego intentar guardar también en Supabase con manejo de errores mejorado
                try {
                    // Configurar los datos a guardar
                    const updateData = {
                        [field]: value,
                        updated_at: new Date().toISOString(),
                    }

                    // Guardar en Supabase de manera asíncrona
                    const { error } = await supabase
                        .from('chatbot_templates')
                        .update(updateData)
                        .eq('id', templateData.id)

                    if (error) {
                        console.warn(
                            `Error al actualizar ${field} en Supabase:`,
                            error,
                        )
                        // Si hay error, mostrar un mensaje pero no interrumpir la experiencia
                        if (field === 'name' || field === 'description') {
                            showError(`Error al guardar: ${error.message}`)
                        }
                    } else if (field === 'name') {
                        // Solo notificar para el campo nombre para no molestar al usuario
                        showSuccess('Nombre actualizado y guardado')
                    }
                } catch (supabaseError) {
                    console.warn(
                        `Error al actualizar ${field} en Supabase:`,
                        supabaseError,
                    )
                    showError('Error de conexión al guardar')
                }
            }
        } catch (error) {
            console.warn(`Error al actualizar ${field} en localStorage:`, error)
            showError('Error al guardar los cambios')
        }
    }

    // Crear nueva industria
    const handleCreateIndustry = async () => {
        if (!newIndustryName.trim()) {
            showError('El nombre de la industria es obligatorio')
            return
        }

        setSavingIndustry(true)

        try {
            const newId = uuidv4()
            const newIndustry: Vertical = {
                id: newId,
                name: newIndustryName.trim(),
                description: newIndustryDescription.trim() || undefined,
                created_at: new Date().toISOString(),
            }

            // Guardar en Supabase
            const { error } = await supabase
                .from('verticals')
                .insert(newIndustry)

            if (error) {
                console.error('Error al crear industria:', error)
                showError(`Error al crear industria: ${error.message}`)
                return
            }

            // Actualizar la lista local
            setVerticals([...verticals, newIndustry])

            // Seleccionar la nueva industria
            handleChange('vertical_id', newId)

            // Limpiar el formulario y cerrar el modal
            setNewIndustryName('')
            setNewIndustryDescription('')
            setShowNewIndustryModal(false)

            showSuccess('Industria creada correctamente')
        } catch (error) {
            console.error('Error al crear industria:', error)
            showError('Error al crear industria')
        } finally {
            setSavingIndustry(false)
        }
    }

    return (
        <div className="w-80 h-full bg-white border-l border-gray-200 overflow-y-auto shadow-md chatbot-builder-template-panel">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <div className="flex justify-between items-center p-4">
                    <h3 className="text-lg font-medium text-gray-800">
                        Información de la plantilla
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Cerrar"
                    >
                        <PiX className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-4 pb-2 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                    <span className="text-sm text-gray-500">
                        ID: {templateData.id}
                    </span>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div className="bg-blue-50 text-blue-600 rounded-md p-3 mb-4 flex items-start">
                    <PiInfo className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p>
                            <strong>Nota:</strong> Los cambios en la información
                            de la plantilla se guardan automáticamente.
                        </p>
                        <p className="mt-1 text-xs">
                            Los campos críticos como el nombre se guardan al
                            escribir. Para cambiar el estado de la plantilla de borrador a publicado, 
                            utilice los botones en la sección &quot;Estado&quot;.
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de la plantilla{' '}
                        <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <input
                            id="template-name-input"
                            type="text"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20 pr-10"
                            value={templateData.name || ''}
                            onChange={(e) =>
                                handleChange('name', e.target.value)
                            }
                            onBlur={(e) => {
                                if (!e.target.value.trim()) {
                                    showError(
                                        'El nombre de la plantilla no puede estar vacío',
                                    )
                                    handleChange('name', 'Nueva plantilla')
                                } else {
                                    // Asegurarse de que el nombre se guarde explícitamente al perder el foco
                                    handleChange('name', e.target.value.trim())
                                }
                            }}
                            placeholder="Nombre descriptivo (requerido)"
                        />
                        <button
                            className="absolute right-2 text-gray-500 hover:text-primary"
                            onClick={() => {
                                const input = document.getElementById(
                                    'template-name-input',
                                ) as HTMLInputElement
                                if (input) {
                                    input.focus()
                                    input.select() // Seleccionar todo el texto
                                }
                            }}
                            title="Editar nombre"
                        >
                            <PiPencil className="h-5 w-5" />
                        </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        El nombre se guarda automáticamente
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <textarea
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                        value={templateData.description || ''}
                        onChange={(e) =>
                            handleChange('description', e.target.value)
                        }
                        placeholder="Descripción de la funcionalidad de esta plantilla"
                        rows={4}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            Industria
                        </label>
                        <button
                            type="button"
                            className="text-xs text-primary hover:text-primary-dark flex items-center"
                            onClick={() => setShowNewIndustryModal(true)}
                        >
                            <PiPlus className="h-4 w-4 mr-1" />
                            Añadir industria
                        </button>
                    </div>
                    {loading ? (
                        <div className="py-2 px-3 bg-gray-100 rounded-md animate-pulse">
                            Cargando industrias...
                        </div>
                    ) : (
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                            value={templateData.vertical_id || ''}
                            onChange={(e) =>
                                handleChange('vertical_id', e.target.value)
                            }
                        >
                            <option value="">Sin industria</option>
                            {verticals.map((vertical) => (
                                <option key={vertical.id} value={vertical.id}>
                                    {vertical.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        Selecciona la industria a la que pertenece esta
                        plantilla.
                    </p>
                </div>

                {/* Sección de capacidades vocales */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                        Capacidades de voz
                    </h3>
                    <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                <PiSpeakerHigh className="h-3 w-3 mr-1" />
                                TTS
                            </span>
                            <span className="text-sm">
                                Síntesis de voz disponible
                            </span>
                        </div>
                        <div className="flex items-center mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                <PiMicrophone className="h-3 w-3 mr-1" />
                                STT
                            </span>
                            <span className="text-sm">
                                Reconocimiento de voz
                            </span>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                            <p>
                                Esta plantilla puede utilizar capacidades de voz
                                a través de la integración con Hailo Minimax.
                            </p>
                            <p className="mt-1">
                                Para usar estas funciones, utiliza los nodos
                                específicos de voz disponibles en el
                                constructor.
                            </p>
                        </div>

                        <div className="mt-3">
                            <h4 className="text-xs font-medium text-gray-700 mb-1">
                                Voces disponibles:
                            </h4>
                            <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc">
                                <li>Femenina (español) - 2 variantes</li>
                                <li>Masculina (español) - 2 variantes</li>
                                <li>Ritmo y tono ajustables</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                    </label>
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center px-3 py-2 rounded-md bg-gray-50">
                            <span
                                className={`inline-block w-3 h-3 rounded-full mr-2 ${
                                    templateData.status === 'published'
                                        ? 'bg-green-500'
                                        : 'bg-amber-500'
                                }`}
                            ></span>
                            <span className="text-sm text-gray-700">
                                {templateData.status === 'published'
                                    ? 'Publicada'
                                    : 'Borrador'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <button
                                type="button"
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                    templateData.status === 'draft'
                                        ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                                onClick={() => handleChange('status', 'published')}
                                disabled={templateData.status === 'published'}
                            >
                                {templateData.status === 'published' ? 'Ya publicada' : 'Publicar plantilla'}
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                    templateData.status === 'published'
                                        ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500'
                                        : 'bg-gray-100 text-gray-400'
                                }`}
                                onClick={() => handleChange('status', 'draft')}
                                disabled={templateData.status === 'draft'}
                            >
                                Volver a borrador
                            </button>
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        {templateData.status === 'published'
                            ? 'Esta plantilla está disponible para que los tenants la activen.'
                            : 'Esta plantilla está en modo borrador y no es visible para los tenants.'}
                    </p>
                </div>

                {templateData.created_at && (
                    <div className="px-3 py-2 bg-gray-50 rounded-md">
                        <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-1">Creada:</span>
                            <span>
                                {new Date(
                                    templateData.created_at,
                                ).toLocaleString()}
                            </span>
                        </div>
                        {templateData.updated_at && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                <span className="mr-1">
                                    Última actualización:
                                </span>
                                <span>
                                    {new Date(
                                        templateData.updated_at,
                                    ).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal para crear nueva industria */}
            {showNewIndustryModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>
                        &#8203;
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Añadir nueva industria
                                        </h3>
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nombre{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                                                    value={newIndustryName}
                                                    onChange={(e) =>
                                                        setNewIndustryName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Nombre de la industria"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Descripción
                                                </label>
                                                <textarea
                                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-20"
                                                    value={
                                                        newIndustryDescription
                                                    }
                                                    onChange={(e) =>
                                                        setNewIndustryDescription(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Descripción de la industria (opcional)"
                                                    rows={3}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm ${
                                        savingIndustry
                                            ? 'opacity-75 cursor-not-allowed'
                                            : ''
                                    }`}
                                    onClick={handleCreateIndustry}
                                    disabled={savingIndustry}
                                >
                                    {savingIndustry
                                        ? 'Guardando...'
                                        : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() =>
                                        setShowNewIndustryModal(false)
                                    }
                                    disabled={savingIndustry}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TemplateInfoPanel
