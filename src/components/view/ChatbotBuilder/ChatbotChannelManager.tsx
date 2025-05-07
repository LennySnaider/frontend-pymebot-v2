/**
 * frontend/src/components/view/ChatbotBuilder/ChatbotChannelManager.tsx
 * Componente para gestionar los canales de comunicación del chatbot
 * @version 1.0.1
 * @updated 2025-04-15
 */

import React, { useState, useEffect } from 'react'
import { toast } from '@/components/ui/toast'
import Notification from '@/components/ui/Notification' // Corregir importación
import {
    Button,
    Table,
    // Card, // Eliminar importación no usada
    Badge,
    Dialog,
    Input,
    Select,
    FormItem,
    FormContainer,
} from '@/components/ui'
import {
    PiPlusBold,
    PiPencilSimpleBold,
    PiTrashBold,
    PiPowerBold,
    // PiXBold, // Eliminar importación no usada
    PiRobotBold,
    // PiChatTextBold, // Eliminar importación no usada
    PiChatTeardropDotsBold,
    PiTelegramLogoBold,
    PiWhatsappLogoBold,
    PiQuestionBold,
} from 'react-icons/pi'
import chatbotTemplateService, {
    ChatbotChannel,
    ChatbotActivation,
} from '@/services/chatbot/chatbotTemplateService'
// Componentes y servicios

// Tipos específicos para integration_data
interface WhatsAppIntegrationData {
    phone_number?: string
    business_account_id?: string
}

interface WebchatIntegrationData {
    primary_color?: string
    initial_message?: string
}

interface TelegramIntegrationData {
    bot_token?: string
}

// Tipo unión para integration_data
type IntegrationData =
    | WhatsAppIntegrationData
    | WebchatIntegrationData
    | TelegramIntegrationData
    | object // Usar 'object' en lugar de '{}' para representar "cualquier objeto"

// Tipo para las opciones del Select
type SelectOption = {
    value: string
    label: string
}

interface ChatbotChannelManagerProps {
    tenantId: string
}

const ChatbotChannelManager: React.FC<ChatbotChannelManagerProps> = ({
    tenantId,
}) => {
    // Estados
    const [loading, setLoading] = useState(true)
    const [channels, setChannels] = useState<ChatbotChannel[]>([])
    const [activations, setActivations] = useState<ChatbotActivation[]>([])
    const [showDialog, setShowDialog] = useState(false)
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
    const [selectedChannel, setSelectedChannel] =
        useState<ChatbotChannel | null>(null)
    const [processing, setProcessing] = useState<string | null>(null)

    // Datos de formulario
    const [formData, setFormData] = useState<{
        name: string
        type: string
        default_activation_id?: string
        is_active: boolean
        integration_data: IntegrationData // Usar tipo específico
    }>({
        name: '',
        type: 'whatsapp', // Valor inicial por defecto
        default_activation_id: undefined,
        is_active: true,
        integration_data: {},
    })

    // Cargar datos iniciales
    useEffect(() => {
        loadData()
    }, [tenantId])

    // Cargar canales y activaciones
    const loadData = async () => {
        try {
            setLoading(true)

            // Cargar canales
            const channelsData =
                await chatbotTemplateService.getTenantChannels(tenantId)
            setChannels(channelsData)

            // Cargar activaciones (para poder asignar chatbots a canales)
            const activationsData =
                await chatbotTemplateService.getTenantActivations(tenantId)
            const activeActivations = activationsData.filter(
                (act) => act.is_active,
            )
            setActivations(activeActivations)
        } catch (error) {
            console.error('Error al cargar datos:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Error al cargar los canales
                </Notification>,
            )
        } finally {
            setLoading(false)
        }
    }

    // Abrir diálogo para crear nuevo canal
    const handleAddChannel = () => {
        setDialogMode('create')
        setSelectedChannel(null)
        setFormData({
            name: '',
            type: 'whatsapp',
            default_activation_id:
                activations.length > 0 ? activations[0].id : undefined,
            is_active: true,
            integration_data: {},
        })
        setShowDialog(true)
    }

    // Abrir diálogo para editar canal existente
    const handleEditChannel = (channel: ChatbotChannel) => {
        setDialogMode('edit')
        setSelectedChannel(channel)
        setFormData({
            name: channel.name,
            type: channel.type,
            default_activation_id: channel.default_activation_id,
            is_active: channel.is_active,
            integration_data: channel.integration_data || {},
        })
        setShowDialog(true)
    }

    // Guardar canal (creación o edición)
    const handleSaveChannel = async () => {
        try {
            // Validaciones básicas
            if (!formData.name.trim()) {
                toast.push(
                    <Notification title="Error" type="danger">
                        El nombre es obligatorio
                    </Notification>,
                )
                return
            }

            setProcessing('save')

            if (dialogMode === 'create') {
                // Crear nuevo canal
                const result = await chatbotTemplateService.createChannel(
                    tenantId,
                    formData,
                )

                if (result.success) {
                    toast.push(
                        <Notification title="Éxito" type="success">
                            Canal creado correctamente
                        </Notification>,
                    )
                    setShowDialog(false)
                    loadData() // Recargar datos
                } else {
                    // Mostrar error específico si existe
                    const errorMessage =
                        result.error?.message ||
                        'Error desconocido al crear el canal'
                    toast.push(
                        <Notification title="Error" type="danger">
                            {errorMessage}
                        </Notification>,
                    )
                    console.error(
                        'Error al crear canal (Supabase):',
                        result.error,
                    )
                }
            } else if (dialogMode === 'edit' && selectedChannel) {
                // Editar canal existente
                const success = await chatbotTemplateService.updateChannel(
                    selectedChannel.id,
                    formData,
                )

                if (success) {
                    toast.push(
                        <Notification title="Éxito" type="success">
                            Canal actualizado correctamente
                        </Notification>,
                    )
                    setShowDialog(false)
                    loadData() // Recargar datos
                } else {
                    toast.push(
                        <Notification title="Error" type="danger">
                            Error al actualizar el canal
                        </Notification>,
                    )
                }
            }
        } catch (error) {
            console.error('Error al guardar canal:', error)
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Error desconocido al guardar el canal'
            toast.push(
                <Notification title="Error" type="danger">
                    {errorMessage}
                </Notification>,
            )
        } finally {
            setProcessing(null)
        }
    }

    // Eliminar canal
    const handleDeleteChannel = async (channel: ChatbotChannel) => {
        if (
            !window.confirm(
                `¿Estás seguro de eliminar el canal ${channel.name}?`,
            )
        ) {
            return
        }

        try {
            setProcessing(channel.id)

            const success = await chatbotTemplateService.deleteChannel(
                channel.id,
            )

            if (success) {
                toast.push(
                    <Notification title="Éxito" type="success">
                        Canal eliminado correctamente
                    </Notification>,
                )
                setChannels(channels.filter((c) => c.id !== channel.id))
            } else {
                toast.push(
                    <Notification title="Error" type="danger">
                        Error al eliminar el canal
                    </Notification>,
                )
            }
        } catch (error) {
            console.error('Error al eliminar canal:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Error al eliminar el canal
                </Notification>,
            )
        } finally {
            setProcessing(null)
        }
    }

    // Cambiar estado activo/inactivo
    const handleToggleActive = async (channel: ChatbotChannel) => {
        try {
            setProcessing(channel.id)

            const success = await chatbotTemplateService.updateChannel(
                channel.id,
                { is_active: !channel.is_active },
            )

            if (success) {
                toast.push(
                    <Notification title="Éxito" type="success">
                        {`Canal ${channel.is_active ? 'desactivado' : 'activado'} correctamente`}
                    </Notification>,
                )
                setChannels(
                    channels.map((c) =>
                        c.id === channel.id
                            ? { ...c, is_active: !c.is_active }
                            : c,
                    ),
                )
            } else {
                toast.push(
                    <Notification title="Error" type="danger">
                        {`Error al ${channel.is_active ? 'desactivar' : 'activar'} el canal`}
                    </Notification>,
                )
            }
        } catch (error) {
            console.error('Error al cambiar estado del canal:', error)
            toast.push(
                <Notification title="Error" type="danger">
                    Error al cambiar el estado del canal
                </Notification>,
            )
        } finally {
            setProcessing(null)
        }
    }

    // Renderizar campos específicos según tipo de canal con type guards
    const renderTypeSpecificFields = () => {
        const integrationData = formData.integration_data // Acceder una vez

        switch (formData.type) {
            case 'whatsapp': {
                // Type guard implícito por el switch
                const whatsappData = integrationData as WhatsAppIntegrationData
                return (
                    <>
                        <FormItem
                            label="Número de teléfono"
                            labelClass="font-medium mb-1.5"
                            extra="Número asociado a WhatsApp Business"
                        >
                            <Input
                                placeholder="+34600000000"
                                value={whatsappData?.phone_number || ''} // Acceso seguro
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        integration_data: {
                                            ...formData.integration_data,
                                            phone_number: e.target.value,
                                        },
                                    })
                                }
                            />
                        </FormItem>

                        <FormItem
                            label="ID de cuenta de WhatsApp Business"
                            labelClass="font-medium mb-1.5"
                            extra="Obtenido del panel de Meta para desarrolladores"
                        >
                            <Input
                                placeholder="123456789012345"
                                value={whatsappData?.business_account_id || ''} // Acceso seguro
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        integration_data: {
                                            ...formData.integration_data,
                                            business_account_id: e.target.value,
                                        },
                                    })
                                }
                            />
                        </FormItem>
                    </>
                )
            }
            case 'webchat': {
                // Type guard implícito por el switch
                const webchatData = integrationData as WebchatIntegrationData
                return (
                    <>
                        <FormItem
                            label="Color primario"
                            labelClass="font-medium mb-1.5"
                            extra="Color principal del chat (formato hexadecimal)"
                        >
                            <Input
                                placeholder="#3b82f6"
                                value={webchatData?.primary_color || '#3b82f6'} // Acceso seguro
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        integration_data: {
                                            ...formData.integration_data,
                                            primary_color: e.target.value,
                                        },
                                    })
                                }
                            />
                        </FormItem>

                        <FormItem
                            label="Mensaje inicial"
                            labelClass="font-medium mb-1.5"
                            extra="Mensaje que se muestra en el botón de inicio"
                        >
                            <Input
                                placeholder="¿Necesitas ayuda?"
                                value={
                                    webchatData?.initial_message ||
                                    '¿Necesitas ayuda?'
                                } // Acceso seguro
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        integration_data: {
                                            ...formData.integration_data,
                                            initial_message: e.target.value,
                                        },
                                    })
                                }
                            />
                        </FormItem>
                    </>
                )
            }
            case 'telegram': {
                // Type guard implícito por el switch
                const telegramData = integrationData as TelegramIntegrationData
                return (
                    <FormItem
                        label="Token de Bot"
                        labelClass="font-medium mb-1.5"
                        extra="Token obtenido de @BotFather"
                    >
                        <Input
                            placeholder="123456789:ABCDefGhIJklMNoPQRstUVwxyZ"
                            value={telegramData?.bot_token || ''} // Acceso seguro
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    integration_data: {
                                        ...formData.integration_data,
                                        bot_token: e.target.value,
                                    },
                                })
                            }
                        />
                    </FormItem>
                )
            }
            default:
                // No mostrar nada si el tipo no coincide o integration_data está vacío
                return null
        }
    }

    // Función auxiliar para renderizar el tipo de canal con icono y badge
    const renderChannelType = (channel: ChatbotChannel) => {
        const getTypeInfo = (type: string) => {
            switch (type) {
                case 'whatsapp':
                    return {
                        icon: <PiWhatsappLogoBold className="text-green-600" />,
                        label: 'WhatsApp',
                        color: 'bg-green-100 text-green-800',
                    }
                case 'webchat':
                    return {
                        icon: (
                            <PiChatTeardropDotsBold className="text-blue-600" />
                        ),
                        label: 'Chat Web',
                        color: 'bg-blue-100 text-blue-800',
                    }
                case 'telegram':
                    return {
                        icon: (
                            <PiTelegramLogoBold className="text-indigo-600" />
                        ),
                        label: 'Telegram',
                        color: 'bg-indigo-100 text-indigo-800',
                    }
                default:
                    return {
                        icon: <PiRobotBold className="text-gray-600" />,
                        label: type,
                        color: 'bg-gray-100 text-gray-800',
                    }
            }
        }
        const typeInfo = getTypeInfo(channel.type)
        return (
            <div className="flex items-center space-x-2">
                {typeInfo.icon}
                <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
            </div>
        )
    }

    // Función auxiliar para renderizar el chatbot asignado
    const renderAssignedChatbot = (channel: ChatbotChannel) => {
        const activation = activations.find(
            (a) => a.id === channel.default_activation_id,
        )
        return activation ? (
            <div>{activation.template?.name || 'Chatbot'}</div>
        ) : (
            <div className="text-gray-400 italic">Sin asignar</div>
        )
    }

    // Función auxiliar para renderizar el estado del canal
    const renderChannelStatus = (channel: ChatbotChannel) => (
        <Badge
            className={
                channel.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
            }
        >
            {channel.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
    )

    // Función auxiliar para renderizar las acciones del canal
    const renderChannelActions = (channel: ChatbotChannel) => (
        <div className="flex items-center space-x-3">
            <Button
                size="xs"
                variant="default"
                color="blue"
                icon={<PiPencilSimpleBold />}
                onClick={() => handleEditChannel(channel)}
            >
                Editar
            </Button>
            <Button
                size="xs"
                variant="default"
                color={channel.is_active ? 'red' : 'green'}
                icon={<PiPowerBold />}
                onClick={() => handleToggleActive(channel)}
                loading={processing === channel.id}
            >
                {channel.is_active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
                size="xs"
                variant="plain"
                color="red"
                icon={<PiTrashBold />}
                onClick={() => handleDeleteChannel(channel)}
                loading={processing === channel.id}
            />
        </div>
    )

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                    Canales de Chatbot
                </h2>
                <Button
                    variant="default"
                    color="blue"
                    icon={<PiPlusBold />}
                    onClick={handleAddChannel}
                    disabled={activations.length === 0}
                >
                    Nuevo canal
                </Button>
            </div>

            {activations.length === 0 && (
                <div className="p-6 text-center">
                    <PiRobotBold className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-3 text-sm text-gray-500">
                        No tienes chatbots activos
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Debes activar al menos una plantilla de chatbot antes de
                        crear canales
                    </p>
                </div>
            )}

            {activations.length > 0 && (
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-10 px-4 text-center">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                                <div className="h-4 w-64 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ) : channels.length === 0 ? (
                        <div className="py-12 px-4 text-center">
                            <PiQuestionBold className="h-12 w-12 text-gray-400 mx-auto" />
                            <p className="mt-3 text-sm text-gray-500">
                                No hay canales configurados
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Configura un canal para comenzar a interactuar
                                con tus clientes
                            </p>
                            <Button
                                className="mt-4"
                                variant="default"
                                color="blue"
                                icon={<PiPlusBold />}
                                onClick={handleAddChannel}
                            >
                                Nuevo canal
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chatbot asignado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {channels.map((channel) => (
                                    <tr key={channel.id}>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="font-medium">
                                                    {channel.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {channel.id}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {renderChannelType(channel)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {renderAssignedChatbot(channel)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {renderChannelStatus(channel)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {renderChannelActions(channel)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </div>
            )}

            {/* Diálogo para crear/editar canal */}
            <Dialog
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
                onRequestClose={() => setShowDialog(false)}
                // title prop eliminada
            >
                <div className="p-4">
                    {/* Añadir título dentro del diálogo */}
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                        {dialogMode === 'create'
                            ? 'Nuevo canal'
                            : 'Editar canal'}
                    </h3>
                    <FormContainer>
                        <FormItem
                            label="Nombre del canal"
                            labelClass="font-medium mb-1.5"
                            extra="Un nombre descriptivo para identificar este canal"
                            invalid={formData.name.trim() === ''}
                            errorMessage="El nombre es obligatorio"
                        >
                            <Input
                                placeholder="Ej: WhatsApp Principal"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </FormItem>

                        <FormItem
                            label="Tipo de canal"
                            labelClass="font-medium mb-1.5"
                            extra="Plataforma donde se integrará el chatbot"
                        >
                            <Select<SelectOption> // Especificar tipo genérico
                                options={[
                                    // Asegurar que las opciones coincidan con SelectOption
                                    { value: 'whatsapp', label: 'WhatsApp' },
                                    { value: 'webchat', label: 'Chat Web' },
                                    { value: 'telegram', label: 'Telegram' },
                                ]}
                                // Encontrar la opción seleccionada basada en formData.type
                                value={[
                                    { value: 'whatsapp', label: 'WhatsApp' },
                                    { value: 'webchat', label: 'Chat Web' },
                                    { value: 'telegram', label: 'Telegram' },
                                ].find(
                                    (option) => option.value === formData.type,
                                )}
                                onChange={(option: SelectOption | null) => {
                                    // Tipar explícitamente el parámetro option
                                    if (option) {
                                        setFormData({
                                            ...formData,
                                            type: option.value,
                                            // Reiniciar integration_data al cambiar el tipo
                                            integration_data: {},
                                        })
                                    }
                                }}
                            />
                        </FormItem>

                        <FormItem
                            label="Chatbot asignado"
                            labelClass="font-medium mb-1.5"
                            extra="Selecciona la plantilla de chatbot que responderá en este canal"
                        >
                            <Select<SelectOption> // Especificar tipo genérico
                                options={activations.map(
                                    (act): SelectOption => ({
                                        // Asegurar que las opciones coincidan con SelectOption
                                        value: act.id,
                                        label:
                                            act.template?.name ||
                                            `Chatbot ${act.id.slice(0, 6)}`,
                                    }),
                                )}
                                // Encontrar la opción seleccionada basada en formData.default_activation_id
                                value={activations
                                    .map(
                                        (act): SelectOption => ({
                                            value: act.id,
                                            label:
                                                act.template?.name ||
                                                `Chatbot ${act.id.slice(0, 6)}`,
                                        }),
                                    )
                                    .find(
                                        (option) =>
                                            option.value ===
                                            formData.default_activation_id,
                                    )}
                                onChange={(option: SelectOption | null) => {
                                    // Tipar explícitamente el parámetro option
                                    if (option) {
                                        setFormData({
                                            ...formData,
                                            default_activation_id: option.value,
                                        })
                                    }
                                }}
                            />
                        </FormItem>

                        <FormItem
                            label="Estado"
                            labelClass="font-medium mb-1.5"
                            extra="Un canal inactivo no procesará mensajes"
                        >
                            <div className="flex items-center">
                                <label className="inline-flex items-center mr-5">
                                    <input
                                        type="radio"
                                        name="is_active"
                                        checked={formData.is_active === true}
                                        onChange={() =>
                                            setFormData({
                                                ...formData,
                                                is_active: true,
                                            })
                                        }
                                        className="form-radio h-5 w-5 text-blue-600"
                                    />
                                    <span className="ml-2">Activo</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="is_active"
                                        checked={formData.is_active === false}
                                        onChange={() =>
                                            setFormData({
                                                ...formData,
                                                is_active: false,
                                            })
                                        }
                                        className="form-radio h-5 w-5 text-blue-600"
                                    />
                                    <span className="ml-2">Inactivo</span>
                                </label>
                            </div>
                        </FormItem>

                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-md font-medium mb-4">
                                Configuración específica
                            </h3>
                            {renderTypeSpecificFields()}
                        </div>
                    </FormContainer>

                    <div className="mt-6 flex justify-end space-x-2">
                        <Button
                            variant="plain"
                            onClick={() => setShowDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="default"
                            color="blue"
                            onClick={handleSaveChannel}
                            loading={processing === 'save'}
                        >
                            {dialogMode === 'create' ? 'Crear' : 'Guardar'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    )
} // <- Add missing brace

export default ChatbotChannelManager
