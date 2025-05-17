'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/VoiceConfigPanel.tsx
 * Panel de configuración para chatbots con capacidades de voz
 * @version 1.0.0
 * @updated 2025-04-15
 */

import React, { useState, useEffect } from 'react'
import { 
    Button, 
    FormContainer, 
    FormItem, 
    Input, 
    Select, 
    Slider,
    Switcher,
    Tabs,
    Notification,
    Card,
    Avatar,
    toast
} from '@/components/ui'
import { PiCheckBold, PiRobotBold, PiMagicWandBold, PiPlayBold, PiMicrophoneBold } from 'react-icons/pi'
import VoicePreview from './VoicePreview'

interface VoiceConfigPanelProps {
    activationId: string
    onSave?: (config: any) => void
    onPreview?: () => void
    initialConfig?: any
}

const VoiceConfigPanel: React.FC<VoiceConfigPanelProps> = ({
    activationId,
    onSave,
    onPreview,
    initialConfig = {}
}) => {
    // Estados para la configuración
    const [config, setConfig] = useState({
        botName: initialConfig.botName || 'Customer Service Agent',
        welcomeMessage: initialConfig.welcomeMessage || 'Por favor, envía un mensaje de voz...',
        primaryColor: initialConfig.primaryColor || '#1e6f50',
        secondaryColor: initialConfig.secondaryColor || '#2a8868',
        textColor: initialConfig.textColor || '#ffffff',
        enableVoiceResponse: initialConfig.enableVoiceResponse ?? true,
        voiceType: initialConfig.voiceType || 'female',
        voiceStyle: initialConfig.voiceStyle || 'default',
        voiceSpeed: initialConfig.voiceSpeed || 1.0,
        voiceLanguage: initialConfig.voiceLanguage || 'es-ES',
        maxRecordingTime: initialConfig.maxRecordingTime || 60,
        voiceActivationPhrase: initialConfig.voiceActivationPhrase || '',
        personalityPrompt: initialConfig.personalityPrompt || 'Eres un asistente virtual amable y servicial. Responde de forma concisa y clara.'
    })
    
    // Estado para la previsualización
    const [showPreview, setShowPreview] = useState(false)
    
    // Opciones para selects
    const voiceTypeOptions = [
        { value: 'female', label: 'Femenina' },
        { value: 'male', label: 'Masculina' },
        { value: 'neutral', label: 'Neutral' }
    ]
    
    const voiceStyleOptions = [
        { value: 'default', label: 'Estándar' },
        { value: 'friendly', label: 'Amigable' },
        { value: 'professional', label: 'Profesional' },
        { value: 'casual', label: 'Casual' }
    ]
    
    const languageOptions = [
        { value: 'es-ES', label: 'Español (España)' },
        { value: 'es-MX', label: 'Español (México)' },
        { value: 'es-AR', label: 'Español (Argentina)' },
        { value: 'es-CO', label: 'Español (Colombia)' },
        { value: 'en-US', label: 'Inglés (EE.UU.)' },
        { value: 'en-GB', label: 'Inglés (Reino Unido)' },
        { value: 'pt-BR', label: 'Portugués (Brasil)' },
        { value: 'fr-FR', label: 'Francés' },
        { value: 'de-DE', label: 'Alemán' },
        { value: 'it-IT', label: 'Italiano' }
    ]
    
    // Manejar cambios en los campos
    const handleChange = (key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [key]: value
        }))
    }
    
    // Guardar configuración
    const handleSave = () => {
        if (onSave) {
            onSave(config)
        }
        
        toast.push(
            <Notification title="Éxito" type="success">
                La configuración de voz se ha guardado correctamente
            </Notification>
        )
    }
    
    // Generar configuración automática con IA
    const handleGenerateWithAI = () => {
        // Simulación - en producción llamaría a una API de IA
        setTimeout(() => {
            setConfig({
                ...config,
                personalityPrompt: 'Eres un asistente virtual experto en atención al cliente, amigable pero profesional. Tus respuestas son claras, concisas y siempre centradas en resolver las consultas del usuario de manera eficiente. Mantienes un tono cordial y empático en todo momento.',
                welcomeMessage: '¡Hola! Soy tu asistente virtual. Puedes hablarme o escribirme tu consulta. ¿En qué puedo ayudarte hoy?'
            })
            
            toast.push(
                <Notification title="Éxito" type="success">
                    Se ha generado una nueva personalidad con IA
                </Notification>
            )
        }, 1500)
    }
    
    // Probar la voz seleccionada
    const handleTestVoice = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Hola, soy tu asistente virtual. ¿En qué puedo ayudarte?')
            utterance.lang = config.voiceLanguage
            utterance.rate = config.voiceSpeed
            
            // Seleccionar voz
            const voices = window.speechSynthesis.getVoices()
            const voicesByLang = voices.filter(voice => voice.lang.includes(config.voiceLanguage.split('-')[0]))
            
            if (voicesByLang.length > 0) {
                // Buscar según género si está disponible
                const genderVoices = voicesByLang.filter(voice => 
                    config.voiceType === 'female' ? voice.name.toLowerCase().includes('female') : 
                    config.voiceType === 'male' ? voice.name.toLowerCase().includes('male') : 
                    true
                )
                
                utterance.voice = genderVoices.length > 0 ? genderVoices[0] : voicesByLang[0]
            }
            
            window.speechSynthesis.speak(utterance)
        } else {
            toast.push(
                <Notification title="Advertencia" type="warning">
                    Tu navegador no soporta la síntesis de voz
                </Notification>
            )
        }
    }
    
    return (
        <div className="space-y-6">
            <Tabs defaultValue="general">
                <div className="mb-4">
                    <Tabs.TabNav value="general" label="General" />
                    <Tabs.TabNav value="voice" label="Voz" />
                    <Tabs.TabNav value="ai" label="Personalidad" />
                    <Tabs.TabNav value="advanced" label="Avanzado" />
                </div>
                
                <Tabs.TabContent value="general">
                    <FormContainer>
                        <FormItem
                            label="Nombre del bot"
                            labelClass="font-medium mb-1.5"
                            extra="Nombre que se mostrará en la cabecera del chat"
                        >
                            <Input
                                value={config.botName}
                                onChange={e => handleChange('botName', e.target.value)}
                                placeholder="Customer Service Agent"
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Mensaje de bienvenida"
                            labelClass="font-medium mb-1.5"
                            extra="Mensaje inicial que se muestra al usuario"
                        >
                            <Input
                                value={config.welcomeMessage}
                                onChange={e => handleChange('welcomeMessage', e.target.value)}
                                placeholder="Por favor, envía un mensaje de voz..."
                            />
                        </FormItem>
                        
                        <FormItem
                            label="Colores de la interfaz"
                            labelClass="font-medium mb-1.5"
                        >
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm mb-1 block">Color primario</label>
                                    <div className="flex items-center">
                                        <div 
                                            className="w-8 h-8 rounded mr-2"
                                            style={{backgroundColor: config.primaryColor}}
                                        ></div>
                                        <Input
                                            value={config.primaryColor}
                                            onChange={e => handleChange('primaryColor', e.target.value)}
                                            placeholder="#1e6f50"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-sm mb-1 block">Color secundario</label>
                                    <div className="flex items-center">
                                        <div 
                                            className="w-8 h-8 rounded mr-2"
                                            style={{backgroundColor: config.secondaryColor}}
                                        ></div>
                                        <Input
                                            value={config.secondaryColor}
                                            onChange={e => handleChange('secondaryColor', e.target.value)}
                                            placeholder="#2a8868"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-sm mb-1 block">Color de texto</label>
                                    <div className="flex items-center">
                                        <div 
                                            className="w-8 h-8 rounded mr-2"
                                            style={{backgroundColor: config.textColor}}
                                        ></div>
                                        <Input
                                            value={config.textColor}
                                            onChange={e => handleChange('textColor', e.target.value)}
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>
                            </div>
                        </FormItem>
                    </FormContainer>
                </Tabs.TabContent>
                
                <Tabs.TabContent value="voice">
                    <Card className="mb-4">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium">Configuración de voz</h3>
                                <Switcher
                                    checked={config.enableVoiceResponse}
                                    onChange={checked => handleChange('enableVoiceResponse', checked)}
                                />
                            </div>
                            
                            {config.enableVoiceResponse ? (
                                <FormContainer>
                                    <FormItem
                                        label="Tipo de voz"
                                        labelClass="font-medium mb-1.5"
                                    >
                                        <Select
                                            options={voiceTypeOptions}
                                            value={config.voiceType}
                                            onChange={value => handleChange('voiceType', value)}
                                        />
                                    </FormItem>
                                    
                                    <FormItem
                                        label="Estilo de voz"
                                        labelClass="font-medium mb-1.5"
                                    >
                                        <Select
                                            options={voiceStyleOptions}
                                            value={config.voiceStyle}
                                            onChange={value => handleChange('voiceStyle', value)}
                                        />
                                    </FormItem>
                                    
                                    <FormItem
                                        label="Idioma"
                                        labelClass="font-medium mb-1.5"
                                    >
                                        <Select
                                            options={languageOptions}
                                            value={config.voiceLanguage}
                                            onChange={value => handleChange('voiceLanguage', value)}
                                        />
                                    </FormItem>
                                    
                                    <FormItem
                                        label="Velocidad de habla"
                                        labelClass="font-medium mb-1.5"
                                    >
                                        <div className="flex items-center">
                                            <Slider
                                                className="w-full mr-4"
                                                value={config.voiceSpeed}
                                                onChange={value => handleChange('voiceSpeed', value)}
                                                min={0.5}
                                                max={2}
                                                step={0.1}
                                            />
                                            <span className="min-w-[50px] text-right">
                                                {config.voiceSpeed}x
                                            </span>
                                        </div>
                                    </FormItem>
                                    
                                    <div className="mt-4">
                                        <Button
                                            icon={<PiPlayBold />}
                                            variant="default"
                                            color="blue"
                                            onClick={handleTestVoice}
                                        >
                                            Probar voz
                                        </Button>
                                    </div>
                                </FormContainer>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <PiMicrophoneBold className="mx-auto mb-2 text-gray-400 text-xl" />
                                    <p>Las respuestas de voz están desactivadas</p>
                                </div>
                            )}
                        </div>
                    </Card>
                    
                    <Card>
                        <div className="p-4">
                            <h3 className="font-medium mb-4">Configuración de reconocimiento de voz</h3>
                            <FormContainer>
                                <FormItem
                                    label="Tiempo máximo de grabación"
                                    labelClass="font-medium mb-1.5"
                                    extra="Tiempo máximo en segundos para cada grabación de voz"
                                >
                                    <div className="flex items-center">
                                        <Slider
                                            className="w-full mr-4"
                                            value={config.maxRecordingTime}
                                            onChange={value => handleChange('maxRecordingTime', value)}
                                            min={15}
                                            max={120}
                                            step={5}
                                        />
                                        <span className="min-w-[50px] text-right">
                                            {config.maxRecordingTime}s
                                        </span>
                                    </div>
                                </FormItem>
                                
                                <FormItem
                                    label="Frase de activación"
                                    labelClass="font-medium mb-1.5"
                                    extra="Opcional: frase que activará el bot por voz (ej: 'Hey bot!')"
                                >
                                    <Input
                                        value={config.voiceActivationPhrase}
                                        onChange={e => handleChange('voiceActivationPhrase', e.target.value)}
                                        placeholder="Dejar vacío para desactivar"
                                    />
                                </FormItem>
                            </FormContainer>
                        </div>
                    </Card>
                </Tabs.TabContent>
                
                <Tabs.TabContent value="ai">
                    <Card>
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium">Personalidad del asistente de voz</h3>
                                <Button
                                    icon={<PiMagicWandBold />}
                                    variant="default"
                                    color="indigo"
                                    onClick={handleGenerateWithAI}
                                >
                                    Generar con IA
                                </Button>
                            </div>
                            
                            <FormContainer>
                                <FormItem
                                    label="Prompt de personalidad"
                                    labelClass="font-medium mb-1.5"
                                    extra="Instrucciones que definen cómo debe comportarse el asistente"
                                >
                                    <Input
                                        textArea
                                        value={config.personalityPrompt}
                                        onChange={e => handleChange('personalityPrompt', e.target.value)}
                                        placeholder="Eres un asistente virtual amable y servicial..."
                                        rows={6}
                                    />
                                </FormItem>
                            </FormContainer>
                            
                            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start mb-3">
                                    <Avatar shape="circle" className="mr-3">
                                        <PiRobotBold />
                                    </Avatar>
                                    <div>
                                        <h4 className="font-medium text-sm mb-1">Personalidad actual</h4>
                                        <p className="text-sm text-gray-600">
                                            {config.personalityPrompt.length > 150 
                                                ? config.personalityPrompt.substring(0, 150) + '...' 
                                                : config.personalityPrompt}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Tabs.TabContent>
                
                <Tabs.TabContent value="advanced">
                    <Card>
                        <div className="p-4">
                            <h3 className="font-medium mb-4">Configuración avanzada</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-blue-700 mb-2">Nota importante</h4>
                                <p className="text-blue-600 text-sm">
                                    La configuración avanzada puede afectar al rendimiento y consumo de recursos del chatbot.
                                    Estos ajustes solo deben ser modificados por usuarios experimentados.
                                </p>
                            </div>
                            
                            <p className="text-center text-gray-500 p-8">
                                La configuración avanzada estará disponible en próximas actualizaciones.
                            </p>
                        </div>
                    </Card>
                </Tabs.TabContent>
            </Tabs>
            
            <div className="flex justify-between">
                <Button
                    variant="default"
                    color="blue"
                    onClick={() => setShowPreview(!showPreview)}
                >
                    {showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
                </Button>
                
                <Button
                    variant="solid"
                    icon={<PiCheckBold />}
                    onClick={handleSave}
                >
                    Guardar configuración
                </Button>
            </div>
            
            {showPreview && (
                <VoicePreview
                    config={{
                        botName: config.botName,
                        welcomeMessage: config.welcomeMessage,
                        primaryColor: config.primaryColor,
                        secondaryColor: config.secondaryColor,
                        textColor: config.textColor
                    }}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    )
}

export default VoiceConfigPanel