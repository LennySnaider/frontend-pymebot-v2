/**
 * frontend/src/app/(protected-pages)/superadmin/chatbot-builder/page.tsx
 * Página para el constructor visual de chatbots (SUPERADMIN)
 * @version 1.1.0
 * @updated 2025-04-09
 */

'use client'

import React, { useState, useRef } from 'react' // Added useRef
import { useTranslation } from '@/utils/hooks/useTranslation'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js' // Added supabase
import { v4 as uuidv4 } from 'uuid' // Added uuid
import HeaderBreadcrumbs from '@/components/shared/HeaderBreadcrumbs'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import { Button } from '@/components/ui'
import { toast } from '@/components/ui/toast'
import { Drawer } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import SharedChatbotTemplatesList from '@/components/view/ChatbotBuilder/SharedChatbotTemplatesList'
import { initializeChatbotDB } from '@/utils/setupChatbotTemplatesDB'
import {
    PiPlusBold,
    PiArrowDownBold, // Added icon
    PiLightbulbDuotone,
    PiWrenchDuotone,
    PiRobotDuotone,
    PiArrowCounterClockwiseBold,
    PiQuestionBold,
} from 'react-icons/pi'

// Supabase and localStorage setup (copied from SharedChatbotTemplatesList)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)
const LOCAL_STORAGE_KEY = 'mock_chatbot_templates' // Key for localStorage

// Define Template interface if needed by handleFileChange (optional, basic validation used)
// interface Template { ... }

const ChatbotBuilderPage = () => {
    const t = useTranslation('nav')
    const router = useRouter()

    // Estado para controlar la carga de plantillas
    const [dbReady, setDbReady] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all') // Added filter state
    const fileInputRef = useRef<HTMLInputElement>(null) // Added file input ref

    // Estado para controlar el drawer de información
    const [infoDrawerOpen, setInfoDrawerOpen] = useState(false)

    // Verificar que la base de datos esté lista
    React.useEffect(() => {
        const checkDatabase = async () => {
            try {
                const ready = await initializeChatbotDB()
                setDbReady(ready)
            } catch (error) {
                console.error('Error al inicializar la base de datos:', error)
                setDbReady(false)
            }
        }

        checkDatabase()
    }, [])

    // Función para forzar la recarga de plantillas
    const refreshTemplates = () => {
        setRefreshTrigger((prev) => prev + 1)
    }

    // Función para crear una nueva plantilla
    const handleCreateTemplate = () => {
        router.push('/superadmin/chatbot-builder/editor')
    }

    // Función para editar plantilla
    const handleEditTemplate = (templateId: string) => {
        router.push(`/superadmin/chatbot-builder/editor?id=${templateId}`)
    }

    // Manejar importación de plantilla (copied from SharedChatbotTemplatesList)
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string
                const importedTemplate = JSON.parse(content)

                // Validar estructura básica
                if (!importedTemplate.name) {
                    throw new Error(
                        'El archivo no contiene una plantilla válida',
                    )
                }

                // Crear un ID nuevo
                const newId = uuidv4()

                // Crear plantilla
                const newTemplate = {
                    ...importedTemplate,
                    id: newId,
                    name: `${importedTemplate.name} (Importada)`,
                    status: 'draft', // Default status for imported
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }

                // Guardar en localStorage
                try {
                    const storedTemplates = JSON.parse(
                        localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
                    )
                    storedTemplates[newId] = newTemplate
                    localStorage.setItem(
                        LOCAL_STORAGE_KEY,
                        JSON.stringify(storedTemplates),
                    )
                } catch (localError) {
                    // Removed : any
                    console.warn(
                        'Error al guardar en localStorage:',
                        localError,
                    )
                }

                // Intentar guardar en Supabase
                try {
                    await supabase
                        .from('chatbot_templates')
                        .insert({
                            id: newId,
                            name: newTemplate.name,
                            description: newTemplate.description,
                            status: newTemplate.status,
                            react_flow_json: newTemplate.react_flow_json,
                            created_at: newTemplate.created_at,
                            updated_at: newTemplate.updated_at,
                        })
                        .then(({ error: insertError }) => {
                            if (insertError) {
                                console.warn(
                                    'Error al guardar importada en Supabase:',
                                    insertError,
                                )
                                // Optionally: Remove from localStorage if Supabase fails?
                            } else {
                                console.log(
                                    'Plantilla importada guardada en Supabase',
                                )
                            }
                        })
                } catch (supabaseError) {
                    // Removed : any
                    console.warn(
                        'Error al llamar a Supabase para importar:',
                        supabaseError,
                    )
                }

                // Actualizar la lista llamando a refreshTemplates
                refreshTemplates() // Changed from setTemplates
                toast.push(
                    <Notification type="success" closable duration={3000}>
                        Plantilla importada correctamente
                    </Notification>
                )
            } catch (error) {
                // Removed : any
                console.error('Error al importar plantilla:', error)
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Verifique el formato.'
                toast.push(
                    <Notification type="danger" closable duration={5000}>
                        Error al importar la plantilla: {errorMessage}
                    </Notification>
                )
            }

            // Limpiar input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }

        reader.readAsText(file)
    }

    return (
        <>
            <HeaderBreadcrumbs
                heading={t('superadmin.chatbotBuilder')}
                links={[
                    { name: t('dashboard.dashboard'), href: '/home' },
                    { name: t('superadmin.tools') },
                    { name: t('superadmin.chatbotBuilder') },
                ]}
                action={
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<PiPlusBold className="text-lg" />}
                            onClick={handleCreateTemplate}
                        >
                            Nueva Plantilla
                        </Button>
                        <Button
                            shape="circle"
                            variant="plain"
                            size="sm"
                            icon={<PiQuestionBold className="text-lg" />}
                            onClick={() => setInfoDrawerOpen(true)}
                        />
                    </div>
                }
            />

            <AdaptiveCard
                className="mb-6 dark:bg-gray-800 dark:border-gray-700"
                bodyClass="p-0"
                header={{
                    content: <h4>Plantillas de Chatbot</h4>,
                    extra: (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="default"
                                color="gray"
                                icon={
                                    <PiArrowCounterClockwiseBold className="text-lg" />
                                }
                                onClick={refreshTemplates}
                            >
                                Actualizar
                            </Button>
                            {/* Botones movidos desde SharedChatbotTemplatesList */}
                            <Button
                                onClick={() =>
                                    setFilter(
                                        filter === 'all' ? 'published' : 'all',
                                    )
                                }
                                size="sm"
                                variant="default" // Match style of other buttons here
                                color="gray" // Match style of other buttons here
                            >
                                {filter === 'all'
                                    ? 'Mostrar publicadas'
                                    : 'Mostrar todas'}
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleFileChange}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                size="sm"
                                variant="default" // Match style of other buttons here
                                color="gray" // Match style of other buttons here
                                icon={<PiArrowDownBold />}
                            >
                                Importar
                            </Button>
                        </div>
                    ),
                }}
            >
                {dbReady ? (
                    <SharedChatbotTemplatesList
                        isAdmin={true}
                        onCreateNew={handleCreateTemplate}
                        onEdit={handleEditTemplate}
                        basePath="/superadmin/chatbot-builder"
                        key={`templates-list-${refreshTrigger}`} // Forzar recreación del componente al refrescar
                    />
                ) : (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        <PiRobotDuotone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>
                            No se pudo conectar con la base de datos de
                            plantillas. Verifique la configuración e intente
                            nuevamente.
                        </p>
                        <Button
                            className="mt-4"
                            variant="default"
                            color="blue"
                            onClick={() => setDbReady(true)}
                        >
                            Reintentar
                        </Button>
                    </div>
                )}
            </AdaptiveCard>

            {/* Drawer de información */}
            <Drawer
                title="Constructor Visual de Chatbots"
                isOpen={infoDrawerOpen}
                onClose={() => setInfoDrawerOpen(false)}
                onRequestClose={() => setInfoDrawerOpen(false)}
                width={580}
            >
                <div className="p-4">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-primary/10 p-3 rounded-lg">
                            <PiRobotDuotone className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-600 mb-6">
                                Crea y gestiona plantillas de chatbot que podrán
                                ser activadas por los tenants. Usa este
                                constructor visual para diseñar flujos de
                                conversación interactivos.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                <PiLightbulbDuotone className="w-5 h-5 mr-2 text-amber-500" />
                                Funciones Disponibles
                            </h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-6 list-disc">
                                <li>Crea nodos interactivos con React Flow</li>
                                <li>
                                    Configura respuestas de IA con variables
                                    dinámicas
                                </li>
                                <li>
                                    Añade flujos de decisión basados en entrada
                                    del usuario
                                </li>
                                <li>Integra servicios de TTS y STT</li>
                                <li>Conecta con servicios externos y APIs</li>
                            </ul>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                <PiWrenchDuotone className="w-5 h-5 mr-2 text-blue-500" />
                                Administración
                            </h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 pl-6 list-disc">
                                <li>
                                    Publica plantillas para uso de los tenants
                                </li>
                                <li>
                                    Controla versiones y actualiza plantillas
                                    existentes
                                </li>
                                <li>
                                    Define variables que los tenants pueden
                                    personalizar
                                </li>
                                <li>
                                    Establece límites de tokens para planes de
                                    suscripción
                                </li>
                                <li>
                                    Monitoriza el uso por tenant y plantilla
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            variant="solid"
                            onClick={() => setInfoDrawerOpen(false)}
                        >
                            Entendido
                        </Button>
                    </div>
                </div>
            </Drawer>
        </>
    )
}

export default ChatbotBuilderPage
