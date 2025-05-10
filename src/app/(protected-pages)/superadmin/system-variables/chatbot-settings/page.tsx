'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormItem, Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from '@/utils/hooks/useTranslation';
import { SystemVariablesService } from '@/services/SystemVariablesService';
import { FaComments, FaCog } from 'react-icons/fa';

const ChatbotSettingsPage: React.FC = () => {
  const t = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [chatbotConfig, setChatbotConfig] = useState({
    CHATBOT_DEFAULT_GREETING: '',
    CHATBOT_DEFAULT_FAREWELL: '',
    CHATBOT_DEFAULT_ERROR_MESSAGE: '',
    CHATBOT_DEFAULT_WAIT_MESSAGE: '',
    CHATBOT_OPENAI_MODEL: '',
    CHATBOT_TEMPERATURE: '',
    CHATBOT_MAX_TOKENS: '',
  });

  // Cargar configuración actual
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        
        const service = SystemVariablesService.getInstance();
        const variables = await service.getVariables([
          'CHATBOT_DEFAULT_GREETING',
          'CHATBOT_DEFAULT_FAREWELL',
          'CHATBOT_DEFAULT_ERROR_MESSAGE',
          'CHATBOT_DEFAULT_WAIT_MESSAGE',
          'CHATBOT_OPENAI_MODEL',
          'CHATBOT_TEMPERATURE',
          'CHATBOT_MAX_TOKENS',
        ]);
        
        setChatbotConfig({
          CHATBOT_DEFAULT_GREETING: variables.CHATBOT_DEFAULT_GREETING || '¡Hola! Soy el asistente virtual. ¿En qué puedo ayudarte hoy?',
          CHATBOT_DEFAULT_FAREWELL: variables.CHATBOT_DEFAULT_FAREWELL || 'Gracias por contactarnos. ¡Que tengas un excelente día!',
          CHATBOT_DEFAULT_ERROR_MESSAGE: variables.CHATBOT_DEFAULT_ERROR_MESSAGE || 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente más tarde.',
          CHATBOT_DEFAULT_WAIT_MESSAGE: variables.CHATBOT_DEFAULT_WAIT_MESSAGE || 'Un momento por favor, estoy procesando tu solicitud...',
          CHATBOT_OPENAI_MODEL: variables.CHATBOT_OPENAI_MODEL || 'gpt-4',
          CHATBOT_TEMPERATURE: variables.CHATBOT_TEMPERATURE || '0.7',
          CHATBOT_MAX_TOKENS: variables.CHATBOT_MAX_TOKENS || '2048',
        });
      } catch (error) {
        console.error('Error cargando configuración del chatbot:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChatbotConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar configuración
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const service = SystemVariablesService.getInstance();
      
      // Guardar cada variable
      for (const [key, value] of Object.entries(chatbotConfig)) {
        await service.setVariable(key, value);
      }
      
      alert('Configuración del chatbot guardada correctamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración del chatbot');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Configuración del Chatbot</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Mensajes Predeterminados</h2>
        
        <Form onSubmit={handleSubmit}>
          <FormItem
            label="Mensaje de Bienvenida"
            className="mb-4"
          >
            <Input
              as="textarea"
              rows={3}
              name="CHATBOT_DEFAULT_GREETING"
              value={chatbotConfig.CHATBOT_DEFAULT_GREETING}
              onChange={handleChange}
              placeholder="¡Hola! Soy el asistente virtual..."
            />
          </FormItem>
          
          <FormItem
            label="Mensaje de Despedida"
            className="mb-4"
          >
            <Input
              as="textarea"
              rows={3}
              name="CHATBOT_DEFAULT_FAREWELL"
              value={chatbotConfig.CHATBOT_DEFAULT_FAREWELL}
              onChange={handleChange}
              placeholder="Gracias por contactarnos..."
            />
          </FormItem>
          
          <FormItem
            label="Mensaje de Error"
            className="mb-4"
          >
            <Input
              as="textarea"
              rows={3}
              name="CHATBOT_DEFAULT_ERROR_MESSAGE"
              value={chatbotConfig.CHATBOT_DEFAULT_ERROR_MESSAGE}
              onChange={handleChange}
              placeholder="Lo siento, ha ocurrido un error..."
            />
          </FormItem>
          
          <FormItem
            label="Mensaje de Espera"
            className="mb-6"
          >
            <Input
              as="textarea"
              rows={3}
              name="CHATBOT_DEFAULT_WAIT_MESSAGE"
              value={chatbotConfig.CHATBOT_DEFAULT_WAIT_MESSAGE}
              onChange={handleChange}
              placeholder="Un momento por favor..."
            />
          </FormItem>
          
          <h2 className="text-lg font-medium my-4">Configuración de IA</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <FormItem
              label="Modelo de OpenAI"
              className="mb-4"
            >
              <Input
                type="text"
                name="CHATBOT_OPENAI_MODEL"
                value={chatbotConfig.CHATBOT_OPENAI_MODEL}
                onChange={handleChange}
                placeholder="gpt-4"
              />
            </FormItem>
            
            <FormItem
              label="Temperatura"
              helperText="Valor entre 0.0 y 1.0"
              className="mb-4"
            >
              <Input
                type="number"
                name="CHATBOT_TEMPERATURE"
                value={chatbotConfig.CHATBOT_TEMPERATURE}
                onChange={handleChange}
                min="0"
                max="1"
                step="0.1"
              />
            </FormItem>
            
            <FormItem
              label="Máximo de Tokens"
              className="mb-4"
            >
              <Input
                type="number"
                name="CHATBOT_MAX_TOKENS"
                value={chatbotConfig.CHATBOT_MAX_TOKENS}
                onChange={handleChange}
                min="256"
                max="8192"
                step="256"
              />
            </FormItem>
          </div>
          
          <Button
            type="submit"
            variant="solid"
            disabled={saving}
            icon={saving ? <Spinner size={20} /> : <FaCog />}
            className="w-full sm:w-auto"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </Form>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-2">Información</h2>
        <p className="text-gray-600 mb-4">
          Esta configuración establece los mensajes y parámetros predeterminados utilizados por el sistema de chatbot.
        </p>
        
        <h3 className="font-medium mb-1">Sobre los Parámetros de IA:</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li><strong>Modelo:</strong> Define el modelo de IA a utilizar (ejemplo: gpt-4, gpt-3.5-turbo).</li>
          <li><strong>Temperatura:</strong> Controla la aleatoriedad de las respuestas. Valores más bajos (cercanos a 0) generan respuestas más deterministas y conservadoras, mientras que valores más altos (cercanos a 1) generan respuestas más creativas y diversas.</li>
          <li><strong>Máximo de Tokens:</strong> Limita la longitud de las respuestas generadas. Un valor mayor permite respuestas más extensas pero consume más recursos.</li>
        </ul>
      </Card>
    </div>
  );
};

export default ChatbotSettingsPage;