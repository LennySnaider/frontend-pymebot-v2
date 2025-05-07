/**
 * frontend/src/app/(protected-pages)/modules/chatbot/settings/_components/WhatsAppSettings.tsx
 * Componente para configuración de WhatsApp Business API
 * 
 * @version 1.0.0
 * @created 2025-07-05
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import {
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription
} from '@/components/ui/cards'
import {
  Form,
  FormContainer,
  FormItem
} from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Dialog } from '@/components/ui/Dialog'
import { Tag } from '@/components/ui/Tag'
import { AlertCircle, Check, Copy, ExternalLink, Info, Save } from 'lucide-react'
import { supabase } from '@/services/supabase/SupabaseClient'
import { useAuth } from '@/hooks/useAuth'
import useTranslation from '@/utils/hooks/useTranslation'

/**
 * Interfaz para la configuración de WhatsApp
 */
interface WhatsAppConfig {
  welcome_message: string;
  farewell_message: string;
  business_hours_enabled: boolean;
  business_hours_message: string;
  enable_templates: boolean;
  templates: Record<string, string>;
}

/**
 * Propiedades del componente
 */
interface WhatsAppSettingsProps {
  tenantId: string;
}

/**
 * Componente para la configuración de WhatsApp
 */
const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ tenantId }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  
  // Estados para la configuración
  const [channelId, setChannelId] = useState<string | null>(null)
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [verifiedAt, setVerifiedAt] = useState<Date | null>(null)
  
  // Estado para la configuración avanzada
  const [config, setConfig] = useState<WhatsAppConfig>({
    welcome_message: 'Hola, ¿en qué puedo ayudarte?',
    farewell_message: 'Gracias por comunicarte con nosotros. ¡Hasta pronto!',
    business_hours_enabled: false,
    business_hours_message: 'Estamos fuera de horario de atención. Te responderemos en cuanto estemos disponibles.',
    enable_templates: false,
    templates: {}
  })
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [showWebhookInfo, setShowWebhookInfo] = useState(false)
  
  // Cargar la configuración existente
  useEffect(() => {
    async function loadConfig() {
      try {
        setIsLoading(true)
        
        const { data, error } = await supabase
          .from('tenant_chatbot_channels')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('channel_type', 'whatsapp')
          .limit(1)
        
        if (error) {
          throw error
        }
        
        if (data && data.length > 0) {
          const channel = data[0]
          setChannelId(channel.id)
          setPhoneNumberId(channel.channel_identifier || '')
          setPhoneNumber(channel.channel_config?.phone_number || '')
          setDisplayName(channel.display_name || '')
          setDescription(channel.description || '')
          setIsActive(channel.is_active)
          setIsVerified(channel.webhook_verified || false)
          setVerifiedAt(channel.webhook_verified_at ? new Date(channel.webhook_verified_at) : null)
          
          // Configuración avanzada
          if (channel.channel_config) {
            setConfig({
              welcome_message: channel.channel_config.welcome_message || config.welcome_message,
              farewell_message: channel.channel_config.farewell_message || config.farewell_message,
              business_hours_enabled: !!channel.channel_config.business_hours_enabled,
              business_hours_message: channel.channel_config.business_hours_message || config.business_hours_message,
              enable_templates: !!channel.channel_config.enable_templates,
              templates: channel.channel_config.templates || {}
            })
          }
        }
      } catch (err: any) {
        setError(`Error al cargar la configuración: ${err.message}`)
        console.error('Error loading WhatsApp config:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (tenantId) {
      loadConfig()
    }
  }, [tenantId])
  
  // Generar un token de verificación
  const generateVerificationToken = () => {
    const randomToken = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15)
    setVerificationToken(randomToken)
    setShowTokenDialog(true)
  }
  
  // Guardar la configuración
  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const channelConfig = {
        phone_number: phoneNumber,
        welcome_message: config.welcome_message,
        farewell_message: config.farewell_message,
        business_hours_enabled: config.business_hours_enabled,
        business_hours_message: config.business_hours_message,
        enable_templates: config.enable_templates,
        templates: config.templates,
        verification_token: verificationToken || undefined,
        access_token: accessToken || undefined
      }
      
      if (channelId) {
        // Actualizar canal existente
        const { error } = await supabase
          .from('tenant_chatbot_channels')
          .update({
            channel_identifier: phoneNumberId,
            display_name: displayName,
            description: description,
            is_active: isActive,
            channel_config: channelConfig,
            updated_at: new Date().toISOString()
          })
          .eq('id', channelId)
        
        if (error) throw error
      } else {
        // Crear nuevo canal
        const { error } = await supabase
          .from('tenant_chatbot_channels')
          .insert({
            tenant_id: tenantId,
            channel_type: 'whatsapp',
            channel_identifier: phoneNumberId,
            display_name: displayName,
            description: description,
            is_active: isActive,
            channel_config: channelConfig,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (error) throw error
      }
      
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 3000)
    } catch (err: any) {
      setError(`Error al guardar la configuración: ${err.message}`)
      console.error('Error saving WhatsApp config:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Obtener la URL base para el webhook
  const getWebhookBaseUrl = () => {
    // En producción, usar el dominio actual
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol
      const host = window.location.host
      return `${protocol}//${host}/api/chatbot/whatsapp`
    }
    
    // En servidor o SSR, usar un placeholder
    return '[URL_BASE]/api/chatbot/whatsapp'
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('Configuración de WhatsApp Business')}</CardTitle>
          <CardDescription>
            {t('Configura la integración con WhatsApp Business API para tu chatbot')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form layout="vertical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem
                label={t('ID de número de teléfono')}
                labelFor="phoneNumberId"
                extra={t('ID del número de teléfono en WhatsApp Business')}
              >
                <Input
                  id="phoneNumberId"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="123456789012345"
                />
              </FormItem>
              
              <FormItem
                label={t('Número de teléfono')}
                labelFor="phoneNumber"
                extra={t('Formato internacional con + y código de país')}
              >
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+123456789012"
                />
              </FormItem>
              
              <FormItem
                label={t('Nombre para mostrar')}
                labelFor="displayName"
              >
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('ChatBot de WhatsApp')}
                />
              </FormItem>
              
              <FormItem
                label={t('Descripción')}
                labelFor="description"
              >
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('Asistente virtual para atención al cliente')}
                />
              </FormItem>
            </div>
            
            {/* Estado de verificación */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{t('Estado del webhook')}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isVerified 
                      ? t('Webhook verificado correctamente')
                      : t('Webhook pendiente de verificación')}
                  </p>
                  {verifiedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('Verificado el')} {verifiedAt.toLocaleString()}
                    </p>
                  )}
                </div>
                <div>
                  {isVerified ? (
                    <Tag color="success" prefixCls="tag">
                      <Check size={14} className="mr-1" />
                      {t('Verificado')}
                    </Tag>
                  ) : (
                    <Tag color="warning" prefixCls="tag">
                      <AlertCircle size={14} className="mr-1" />
                      {t('No verificado')}
                    </Tag>
                  )}
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={generateVerificationToken}
                  size="sm"
                  variant="solid"
                >
                  {t('Generar token de verificación')}
                </Button>
                
                <Button
                  onClick={() => setShowWebhookInfo(true)}
                  size="sm"
                  variant="default"
                >
                  <Info size={16} className="mr-1" />
                  {t('Información de configuración')}
                </Button>
              </div>
            </div>
            
            {/* Configuración avanzada */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">{t('Configuración avanzada')}</h4>
              
              <div className="space-y-4">
                <FormItem
                  label={t('Mensaje de bienvenida')}
                  labelFor="welcome_message"
                >
                  <Input
                    id="welcome_message"
                    value={config.welcome_message}
                    onChange={(e) => setConfig({...config, welcome_message: e.target.value})}
                    placeholder={t('Hola, ¿en qué puedo ayudarte?')}
                  />
                </FormItem>
                
                <FormItem
                  label={t('Mensaje de despedida')}
                  labelFor="farewell_message"
                >
                  <Input
                    id="farewell_message"
                    value={config.farewell_message}
                    onChange={(e) => setConfig({...config, farewell_message: e.target.value})}
                    placeholder={t('Gracias por comunicarte con nosotros. ¡Hasta pronto!')}
                  />
                </FormItem>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={config.business_hours_enabled}
                    onChange={(e) => setConfig({
                      ...config, 
                      business_hours_enabled: e.target.checked
                    })}
                    id="business_hours_enabled"
                  />
                  <label 
                    htmlFor="business_hours_enabled"
                    className="cursor-pointer"
                  >
                    {t('Habilitar horario de atención')}
                  </label>
                </div>
                
                {config.business_hours_enabled && (
                  <FormItem
                    label={t('Mensaje fuera de horario')}
                    labelFor="business_hours_message"
                  >
                    <Input
                      id="business_hours_message"
                      value={config.business_hours_message}
                      onChange={(e) => setConfig({
                        ...config, 
                        business_hours_message: e.target.value
                      })}
                      placeholder={t('Estamos fuera de horario de atención. Te responderemos en cuanto estemos disponibles.')}
                    />
                  </FormItem>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={config.enable_templates}
                    onChange={(e) => setConfig({
                      ...config, 
                      enable_templates: e.target.checked
                    })}
                    id="enable_templates"
                  />
                  <label 
                    htmlFor="enable_templates"
                    className="cursor-pointer"
                  >
                    {t('Habilitar plantillas de WhatsApp')}
                  </label>
                </div>
              </div>
            </div>
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {error && (
            <div className="text-red-500 text-sm">
              <AlertCircle size={14} className="inline mr-1" />
              {error}
            </div>
          )}
          
          {isSuccess && (
            <div className="text-green-500 text-sm">
              <Check size={14} className="inline mr-1" />
              {t('Configuración guardada correctamente')}
            </div>
          )}
          
          <div className="flex space-x-2 ml-auto">
            <Button
              variant="solid"
              color="primary"
              onClick={handleSave}
              icon={<Save />}
              loading={isLoading}
              disabled={isLoading}
            >
              {t('Guardar configuración')}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Diálogo de token de verificación */}
      <Dialog
        isOpen={showTokenDialog}
        onClose={() => setShowTokenDialog(false)}
        onRequestClose={() => setShowTokenDialog(false)}
        title={t('Token de verificación de webhook')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            {t('Usa este token para verificar tu webhook en la configuración de WhatsApp Business API.')}
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md flex justify-between items-center">
            <code className="text-sm font-mono break-all">{verificationToken}</code>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(verificationToken)
              }}
              icon={<Copy size={14} />}
            >
              {t('Copiar')}
            </Button>
          </div>
          
          <div className="mt-4">
            <h5 className="font-medium mb-2">{t('Pasos para la verificación:')}</h5>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>{t('Copia el token de verificación mostrado arriba')}</li>
              <li>{t('En la configuración de WhatsApp Business API, establece la URL del webhook:')} 
                <code className="ml-1 bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono">
                  {getWebhookBaseUrl()}
                </code>
              </li>
              <li>{t('Pega el token de verificación en el campo correspondiente')}</li>
              <li>{t('Selecciona los webhooks a suscribir (messages, message_status)')}</li>
              <li>{t('Guarda la configuración')}</li>
            </ol>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={() => setShowTokenDialog(false)}
            >
              {t('Cerrar')}
            </Button>
          </div>
        </div>
      </Dialog>
      
      {/* Diálogo de información de configuración */}
      <Dialog
        isOpen={showWebhookInfo}
        onClose={() => setShowWebhookInfo(false)}
        onRequestClose={() => setShowWebhookInfo(false)}
        title={t('Información de configuración de WhatsApp')}
      >
        <div className="space-y-4">
          <div>
            <h5 className="font-medium mb-1">{t('URL del webhook:')}</h5>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md flex justify-between items-center">
              <code className="text-sm font-mono">{getWebhookBaseUrl()}</code>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(getWebhookBaseUrl())
                }}
                icon={<Copy size={14} />}
              >
                {t('Copiar')}
              </Button>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-1">{t('Token de verificación:')}</h5>
            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md flex justify-between items-center">
              <code className="text-sm font-mono">
                {verificationToken || t('(Genera un token primero)')}
              </code>
              {verificationToken && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(verificationToken)
                  }}
                  icon={<Copy size={14} />}
                >
                  {t('Copiar')}
                </Button>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
            <h5 className="font-medium text-blue-700 dark:text-blue-300 flex items-center mb-2">
              <Info size={16} className="mr-1" />
              {t('Pasos para configurar WhatsApp Business API')}
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>{t('Accede a tu página de Facebook for Business')}</li>
              <li>{t('Navega a la sección de Configuración > WhatsApp > API')}</li>
              <li>{t('Configura la URL del webhook y el token de verificación')}</li>
              <li>{t('Selecciona los webhooks "messages" y "message_status"')}</li>
              <li>{t('Guarda la configuración')}</li>
            </ol>
            
            <div className="mt-3">
              <a 
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-300 hover:underline inline-flex items-center text-sm"
              >
                {t('Consulta la documentación oficial')}
                <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={() => setShowWebhookInfo(false)}
            >
              {t('Cerrar')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default WhatsAppSettings