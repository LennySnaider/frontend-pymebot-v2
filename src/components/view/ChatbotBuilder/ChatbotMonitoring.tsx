/**
 * frontend/src/components/view/ChatbotBuilder/ChatbotMonitoring.tsx
 * Componente para monitorear el rendimiento y uso de chatbots
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect } from 'react'
import { Card, Button, Select, DatePicker, Avatar } from '@/components/ui'
import { 
    PiArrowCounterClockwiseBold, 
    PiChartLineDuotone,
    PiChartBarDuotone,
    PiChatCircleTextBold,
    PiUserCircleBold,
    PiRobotDuotone
} from 'react-icons/pi'
import chatbotTemplateService, { 
    ChatbotActivation 
} from '@/services/chatbot/chatbotTemplateService'
import Iconify from '@/components/shared/Iconify'

interface ChatbotMonitoringProps {
    tenantId: string
}

// Datos simulados para el monitoreo
interface MonitoringData {
    totalConversations: number
    activeConversations: number
    successRate: number
    averageMessageCount: number
    messagesPerDay: Array<{ date: string, count: number }>
    topQuestions: Array<{ question: string, count: number }>
    conversationsByChannel: Array<{ channel: string, count: number }>
    conversationLengths: Array<{ length: string, percentage: number }>
    recentConversations: Array<{
        id: string
        user: string
        channel: string
        startTime: string
        messages: number
        status: 'active' | 'completed' | 'abandoned'
    }>
}

const mockData: MonitoringData = {
    totalConversations: 1243,
    activeConversations: 18,
    successRate: 87.4,
    averageMessageCount: 8.2,
    messagesPerDay: [
        { date: '2025-04-08', count: 320 },
        { date: '2025-04-09', count: 346 },
        { date: '2025-04-10', count: 358 },
        { date: '2025-04-11', count: 410 },
        { date: '2025-04-12', count: 380 },
        { date: '2025-04-13', count: 295 },
        { date: '2025-04-14', count: 425 },
    ],
    topQuestions: [
        { question: "¿Cuál es el horario de atención?", count: 56 },
        { question: "¿Cómo puedo agendar una cita?", count: 42 },
        { question: "¿Cuáles son sus precios?", count: 38 },
        { question: "¿Tienen servicio a domicilio?", count: 31 },
        { question: "¿Cómo puedo contactar con un agente?", count: 27 },
    ],
    conversationsByChannel: [
        { channel: "WhatsApp", count: 674 },
        { channel: "Web Chat", count: 456 },
        { channel: "Telegram", count: 113 },
    ],
    conversationLengths: [
        { length: "1-3 mensajes", percentage: 28 },
        { length: "4-6 mensajes", percentage: 35 },
        { length: "7-10 mensajes", percentage: 22 },
        { length: "11+ mensajes", percentage: 15 },
    ],
    recentConversations: [
        {
            id: "conv-123456",
            user: "+34 600 12 34 56",
            channel: "WhatsApp",
            startTime: "2025-04-15T11:34:12Z",
            messages: 8,
            status: "active"
        },
        {
            id: "conv-123457",
            user: "maria@ejemplo.com",
            channel: "Web Chat",
            startTime: "2025-04-15T10:42:56Z",
            messages: 12,
            status: "completed"
        },
        {
            id: "conv-123458",
            user: "+34 611 98 76 54",
            channel: "WhatsApp",
            startTime: "2025-04-15T09:22:33Z",
            messages: 5,
            status: "abandoned"
        },
        {
            id: "conv-123459",
            user: "usuario_123",
            channel: "Telegram",
            startTime: "2025-04-15T08:19:42Z",
            messages: 15,
            status: "completed"
        },
        {
            id: "conv-123460",
            user: "carlos@ejemplo.com",
            channel: "Web Chat",
            startTime: "2025-04-14T22:14:08Z",
            messages: 3,
            status: "abandoned"
        }
    ]
};

const ChatbotMonitoring: React.FC<ChatbotMonitoringProps> = ({
    tenantId
}) => {
    // Estados
    const [loading, setLoading] = useState(true)
    const [activations, setActivations] = useState<ChatbotActivation[]>([])
    const [selectedActivation, setSelectedActivation] = useState<string>('all')
    const [dateRange, setDateRange] = useState<[Date, Date]>([
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 días atrás
        new Date() // Hoy
    ])
    const [monitoringData, setMonitoringData] = useState<MonitoringData>(mockData)
    
    // Cargar datos iniciales
    useEffect(() => {
        loadData()
    }, [tenantId])
    
    // Cargar activaciones
    const loadData = async () => {
        try {
            setLoading(true)
            
            // Cargar activaciones (sólo las activas)
            const activationsData = await chatbotTemplateService.getTenantActivations(tenantId)
            const activeActivations = activationsData.filter(act => act.is_active)
            setActivations(activeActivations)
            
            // En un entorno real, cargaríamos los datos de monitoreo aquí
            // basados en el tenant_id, la activación seleccionada y el rango de fechas
            
            // Simular carga
            setTimeout(() => {
                setMonitoringData(mockData)
                setLoading(false)
            }, 800)
        } catch (error) {
            console.error('Error al cargar datos de monitoreo:', error)
            setLoading(false)
        }
    }
    
    // Actualizar datos cuando cambian filtros
    useEffect(() => {
        if (!loading) {
            // Reiniciar carga
            setLoading(true)
            
            // En un entorno real, aquí haríamos una nueva consulta con los filtros actualizados
            
            // Simular carga
            setTimeout(() => {
                // Podríamos ajustar los datos mock según los filtros
                setMonitoringData({
                    ...mockData,
                    // Ajustar algunos valores para simular el cambio de filtros
                    totalConversations: selectedActivation === 'all' 
                        ? mockData.totalConversations 
                        : Math.floor(mockData.totalConversations / 2),
                    activeConversations: selectedActivation === 'all'
                        ? mockData.activeConversations
                        : Math.floor(mockData.activeConversations / 3)
                })
                setLoading(false)
            }, 600)
        }
    }, [selectedActivation, dateRange])
    
    // Formatear fecha
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }
    
    // Formatear hora
    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    
    return (
        <div className="space-y-6">
            <Card bodyClass="p-0">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Monitoreo de Chatbots
                        </h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <Select
                                className="min-w-[200px]"
                                size="sm"
                                options={[
                                    { value: 'all', label: 'Todos los chatbots' },
                                    ...activations.map(act => ({
                                        value: act.id,
                                        label: act.template?.name || `Chatbot ${act.id.slice(0, 6)}`
                                    }))
                                ]}
                                value={selectedActivation}
                                onChange={(value) => setSelectedActivation(value as string)}
                            />
                            <DatePicker.RangePicker
                                size="sm"
                                value={dateRange}
                                onChange={(dates) => setDateRange(dates as [Date, Date])}
                            />
                            <Button
                                size="sm"
                                variant="default"
                                color="gray"
                                icon={<PiArrowCounterClockwiseBold className="text-lg" />}
                                onClick={loadData}
                            >
                                Actualizar
                            </Button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4">
                    {loading ? (
                        <div className="py-10 px-4 text-center">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                                <div className="h-4 w-64 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Tarjetas de resumen */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-500 text-sm">Total conversaciones</p>
                                                <h3 className="text-2xl font-bold mt-1">
                                                    {monitoringData.totalConversations.toLocaleString()}
                                                </h3>
                                            </div>
                                            <span className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                <PiChatCircleTextBold className="text-lg" />
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {dateRange[0].toLocaleDateString()} - {dateRange[1].toLocaleDateString()}
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-500 text-sm">Conversaciones activas</p>
                                                <h3 className="text-2xl font-bold mt-1">
                                                    {monitoringData.activeConversations}
                                                </h3>
                                            </div>
                                            <span className="p-2 bg-green-100 rounded-lg text-green-600">
                                                <PiUserCircleBold className="text-lg" />
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            En este momento
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-500 text-sm">Tasa de éxito</p>
                                                <h3 className="text-2xl font-bold mt-1">
                                                    {monitoringData.successRate}%
                                                </h3>
                                            </div>
                                            <span className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                                <PiChartBarDuotone className="text-lg" />
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Consultas resueltas satisfactoriamente
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-500 text-sm">Promedio de mensajes</p>
                                                <h3 className="text-2xl font-bold mt-1">
                                                    {monitoringData.averageMessageCount}
                                                </h3>
                                            </div>
                                            <span className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                                <PiChartLineDuotone className="text-lg" />
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Mensajes por conversación
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            
                            {/* Gráficos/Visualizaciones */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2">
                                    <div className="p-4 border-b border-gray-200">
                                        <h3 className="font-medium">Mensajes por día</h3>
                                    </div>
                                    <div className="p-4 h-64 flex items-center justify-center">
                                        {/* En un componente real, aquí iría un gráfico */}
                                        <div className="w-full h-full flex flex-col">
                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                <span>Mensajes</span>
                                                <span>Últimos 7 días</span>
                                            </div>
                                            <div className="flex-1 flex items-end space-x-2">
                                                {monitoringData.messagesPerDay.map((day, index) => (
                                                    <div key={index} className="flex-1 flex flex-col items-center">
                                                        <div 
                                                            className="w-full bg-blue-500 rounded-t" 
                                                            style={{ 
                                                                height: `${(day.count / 500) * 100}%`,
                                                                maxHeight: '100%'
                                                            }}
                                                        ></div>
                                                        <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                                                            {day.date.slice(5)} {/* Solo mostrar MM-DD */}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card>
                                    <div className="p-4 border-b border-gray-200">
                                        <h3 className="font-medium">Conversaciones por canal</h3>
                                    </div>
                                    <div className="p-4">
                                        <div className="space-y-4">
                                            {monitoringData.conversationsByChannel.map((item, index) => (
                                                <div key={index}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>{item.channel}</span>
                                                        <span className="font-medium">{item.count}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div 
                                                            className={`h-2.5 rounded-full ${
                                                                index === 0 ? 'bg-green-500' : 
                                                                index === 1 ? 'bg-blue-500' : 'bg-indigo-500'
                                                            }`}
                                                            style={{ 
                                                                width: `${(item.count / monitoringData.totalConversations) * 100}%` 
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <div className="p-4 border-b border-gray-200">
                                        <h3 className="font-medium">Preguntas más frecuentes</h3>
                                    </div>
                                    <div className="p-4">
                                        <div className="space-y-4">
                                            {monitoringData.topQuestions.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full text-xs text-gray-600 font-medium">
                                                            {index + 1}
                                                        </span>
                                                        <span className="text-sm">{item.question}</span>
                                                    </div>
                                                    <span className="text-sm font-medium">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card>
                                    <div className="p-4 border-b border-gray-200">
                                        <h3 className="font-medium">Duración de conversaciones</h3>
                                    </div>
                                    <div className="p-4">
                                        <div className="space-y-4">
                                            {monitoringData.conversationLengths.map((item, index) => (
                                                <div key={index}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>{item.length}</span>
                                                        <span className="font-medium">{item.percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div 
                                                            className={`h-2.5 rounded-full ${
                                                                index === 0 ? 'bg-blue-300' : 
                                                                index === 1 ? 'bg-blue-500' : 
                                                                index === 2 ? 'bg-blue-700' : 'bg-blue-900'
                                                            }`}
                                                            style={{ width: `${item.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            
                            <Card>
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="font-medium">Conversaciones recientes</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Usuario
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Canal
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Inicio
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mensajes
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Estado
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {monitoringData.recentConversations.map((conversation) => (
                                                <tr key={conversation.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <Avatar size={32} shape="circle" className="mr-2">
                                                                <PiUserCircleBold className="text-lg" />
                                                            </Avatar>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {conversation.user}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{conversation.channel}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {formatDate(conversation.startTime)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatTime(conversation.startTime)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {conversation.messages}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            conversation.status === 'active' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : conversation.status === 'completed'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {conversation.status === 'active' 
                                                                ? 'Activa' 
                                                                : conversation.status === 'completed'
                                                                ? 'Completada'
                                                                : 'Abandonada'
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Button
                                                            size="xs"
                                                            variant="default"
                                                            color="blue"
                                                        >
                                                            Ver detalles
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default ChatbotMonitoring