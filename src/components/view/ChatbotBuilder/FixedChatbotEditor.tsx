'use client'

/**
 * FixedChatbotEditor.tsx - Versión arreglada del editor de plantillas
 * Este componente es una versión simplificada y corregida del editor de plantillas
 * @version 1.0.0
 * @updated 2025-04-09
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/toast';

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FixedChatbotEditorProps {
  templateId: string;
  onCancel?: () => void;
}

export const FixedChatbotEditor: React.FC<FixedChatbotEditorProps> = ({ 
  templateId, 
  onCancel 
}) => {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Llave para el almacenamiento local
  const LOCAL_STORAGE_KEY = 'mock_chatbot_templates';
  
  // Efecto para cargar la plantilla al montar el componente
  useEffect(() => {
    console.log('⭐ FixedChatbotEditor: Cargando plantilla con ID:', templateId);
    loadTemplate();
  }, [templateId]);
  
  // Función para cargar la plantilla
  const loadTemplate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Paso 1: Buscar en localStorage primero (es más rápido)
      console.log('FixedChatbotEditor: Buscando en localStorage...');
      const storedTemplates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      console.log('FixedChatbotEditor: IDs en localStorage:', Object.keys(storedTemplates));
      
      if (storedTemplates[templateId]) {
        console.log('FixedChatbotEditor: Plantilla encontrada en localStorage');
        setTemplate(storedTemplates[templateId]);
        setLoading(false);
        return;
      }
      
      // Paso 2: Si no está en localStorage, buscar en Supabase
      console.log('FixedChatbotEditor: Buscando en Supabase...');
      const { data, error } = await supabase
        .from('chatbot_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error) {
        console.error('FixedChatbotEditor: Error en Supabase:', error);
        throw new Error(`No se encontró la plantilla en la base de datos: ${error.message}`);
      }
      
      if (data) {
        console.log('FixedChatbotEditor: Plantilla encontrada en Supabase');
        
        // Guardar en localStorage para futuras referencias
        storedTemplates[templateId] = data;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedTemplates));
        
        setTemplate(data);
        setLoading(false);
        return;
      }
      
      // Paso 3: Si no se encuentra en ninguna parte, crear una nueva
      console.log('FixedChatbotEditor: No se encontró la plantilla, creando una nueva');
      
      // Plantilla por defecto
      const defaultTemplate = {
        id: templateId,
        name: `Nueva Plantilla (${new Date().toLocaleTimeString()})`,
        description: 'Creada automáticamente',
        status: 'draft',
        react_flow_json: {
          nodes: [
            {
              id: 'start-node',
              type: 'start',
              position: { x: 50, y: 150 },
              data: { label: 'Inicio del flujo' },
            }
          ],
          edges: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Guardar en localStorage
      storedTemplates[templateId] = defaultTemplate;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedTemplates));
      
      // Intentar guardar en Supabase
      try {
        await supabase
          .from('chatbot_templates')
          .insert({
            id: templateId,
            name: defaultTemplate.name,
            description: defaultTemplate.description,
            react_flow_json: defaultTemplate.react_flow_json,
            status: defaultTemplate.status,
            created_at: defaultTemplate.created_at,
            updated_at: defaultTemplate.updated_at
          });
        console.log('FixedChatbotEditor: Nueva plantilla guardada en Supabase');
      } catch (insertError) {
        console.warn('FixedChatbotEditor: Error al guardar en Supabase, solo en localStorage:', insertError);
      }
      
      setTemplate(defaultTemplate);
      toast.success('Se ha creado una nueva plantilla con este ID');
      
    } catch (err) {
      console.error('FixedChatbotEditor: Error al cargar la plantilla:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al cargar la plantilla');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para guardar la plantilla
  const handleSave = async () => {
    if (!template) return;
    
    try {
      console.log('FixedChatbotEditor: Guardando plantilla...');
      
      // Actualizar fecha de modificación
      const updatedTemplate = {
        ...template,
        updated_at: new Date().toISOString()
      };
      
      // Guardar en localStorage
      const storedTemplates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      storedTemplates[templateId] = updatedTemplate;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedTemplates));
      
      // Intentar guardar en Supabase
      try {
        const { error } = await supabase
          .from('chatbot_templates')
          .upsert({
            id: templateId,
            name: updatedTemplate.name,
            description: updatedTemplate.description,
            react_flow_json: updatedTemplate.react_flow_json,
            status: updatedTemplate.status,
            updated_at: updatedTemplate.updated_at
          });
        
        if (error) {
          throw error;
        }
        console.log('FixedChatbotEditor: Guardado en Supabase exitoso');
      } catch (supabaseError) {
        console.warn('FixedChatbotEditor: Error al guardar en Supabase:', supabaseError);
      }
      
      setTemplate(updatedTemplate);
      toast.success('Plantilla guardada correctamente');
      
    } catch (err) {
      console.error('FixedChatbotEditor: Error al guardar la plantilla:', err);
      toast.error('Error al guardar la plantilla');
    }
  };
  
  // Cancelar la edición
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/concepts/chatbot');
    }
  };
  
  // Actualizar el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!template) return;
    setTemplate({
      ...template,
      name: e.target.value
    });
  };
  
  // Actualizar la descripción
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!template) return;
    setTemplate({
      ...template,
      description: e.target.value
    });
  };

  // Si hay un error
  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg shadow">
        <h3 className="text-red-800 font-bold text-lg mb-3">Error</h3>
        <p className="mb-4 text-red-600">{error}</p>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
            onClick={loadTemplate}
          >
            Reintentar
          </button>
          <button 
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            onClick={handleCancel}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Si está cargando
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Cargando plantilla...</p>
      </div>
    );
  }

  // Si no hay plantilla (caso extremadamente raro)
  if (!template) {
    return (
      <div className="bg-amber-50 p-6 rounded-lg shadow">
        <h3 className="text-amber-800 font-bold text-lg mb-3">Plantilla no disponible</h3>
        <p className="mb-4">No se pudo cargar la plantilla. Esto podría deberse a un problema temporal.</p>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              // Forzar la creación de una nueva plantilla
              const storedTemplates = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
              delete storedTemplates[templateId]; // Eliminar cualquier plantilla existente con este ID
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedTemplates));
              loadTemplate(); // Intentar cargar de nuevo (creará una nueva)
            }}
          >
            Crear Nueva Plantilla
          </button>
          <button 
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            onClick={handleCancel}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Renderizar el editor (vista normal)
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Banner de identificación */}
      <div className="bg-blue-100 text-blue-800 p-3 text-center mb-4 rounded-lg font-bold">
        EDITOR CORREGIDO - {new Date().toLocaleTimeString()}
      </div>
      
      <div className="mb-4">
        <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la plantilla
        </label>
        <input
          id="template-name"
          value={template.name}
          onChange={handleNameChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="template-description"
          value={template.description}
          onChange={handleDescriptionChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estado
        </label>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            template.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {template.status === 'published' ? 'Publicada' : 'Borrador'}
          </span>
          <span className="ml-2 text-xs text-gray-500">
            Última actualización: {new Date(template.updated_at).toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-gray-800 mb-2">Información Técnica</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500">ID:</span>
            <span className="ml-2 font-mono text-xs break-all">{template.id}</span>
          </div>
          <div>
            <span className="text-gray-500">Creada:</span>
            <span className="ml-2">{new Date(template.created_at).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Nodos:</span>
            <span className="ml-2">{template.react_flow_json?.nodes?.length || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Conexiones:</span>
            <span className="ml-2">{template.react_flow_json?.edges?.length || 0}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-yellow-800 mb-2">⚠️ Editor Simplificado</h3>
        <p className="text-sm text-yellow-700">
          Este es un editor simplificado para solucionar el problema con las plantillas. El editor visual 
          completo no está disponible en este momento. Puedes editar el nombre y la descripción, y guardar 
          la plantilla para verificar que la funcionalidad básica está funcionando.
        </p>
      </div>
      
      <div className="flex justify-end gap-3">
        <button 
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          onClick={handleCancel}
        >
          Volver
        </button>
        <button 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          onClick={handleSave}
        >
          Guardar
        </button>
        {template.status !== 'published' && (
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => {
              setTemplate({
                ...template,
                status: 'published'
              });
              // Guardar inmediatamente
              setTimeout(handleSave, 0);
            }}
          >
            Publicar
          </button>
        )}
      </div>
    </div>
  );
};

export default FixedChatbotEditor;