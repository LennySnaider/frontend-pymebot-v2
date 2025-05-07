/**
 * frontend/src/app/(protected-pages)/superadmin/verticals/[id]/page.tsx
 * Página para editar una vertical existente.
 * Carga datos de la vertical y sus tipos, permitiendo su modificación.
 *
 * @version 1.0.0
 * @updated 2025-04-30
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { withPermissionCheck } from '@/components/hoc/withPermissionCheck';
import { useRouter, useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { supabase } from '@/services/supabase/SupabaseClient';

interface VerticalType {
  id?: string;
  name: string;
  code: string;
  description: string;
  // Para tipos ya existentes
  original_id?: string;
  // Para marcar tipos que deben eliminarse
  _delete?: boolean;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  category: string;
  icon?: File | null;
  currentIcon?: string | null;
  enabled: boolean;
  types: VerticalType[];
}

interface ValidationErrors {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  icon?: string;
  types?: string;
}

const EditVerticalPage = () => {
  const router = useRouter();
  const params = useParams();
  const verticalId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para carga inicial
  const [isLoadingVertical, setIsLoadingVertical] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    description: '',
    category: '',
    icon: null,
    currentIcon: null,
    enabled: true,
    types: []
  });

  // Estado para el formulario de tipos
  const [currentType, setCurrentType] = useState<VerticalType>({
    name: '',
    code: '',
    description: ''
  });

  // Estado de carga y errores
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [typeErrors, setTypeErrors] = useState<{name?: string; code?: string; description?: string}>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  
  // Lista predefinida de categorías comunes
  const predefinedCategories = [
    'Salud',
    'Belleza',
    'Gastronomía',
    'Retail',
    'Servicios profesionales',
    'Educación',
    'Finanzas',
    'Bienes raíces',
    'Tecnología',
    'Otra'
  ];

  // Cargar datos de la vertical al montar el componente
  useEffect(() => {
    async function loadVertical() {
      try {
        setIsLoadingVertical(true);
        setLoadError(null);
        
        // Obtener datos de la vertical
        const { data: vertical, error: verticalError } = await supabase
          .from('verticals')
          .select('*')
          .eq('id', verticalId)
          .single();
        
        if (verticalError) {
          throw new Error('Error al cargar la vertical');
        }
        
        if (!vertical) {
          throw new Error('Vertical no encontrada');
        }
        
        // Obtener tipos de la vertical
        const { data: types, error: typesError } = await supabase
          .from('vertical_types')
          .select('*')
          .eq('vertical_id', verticalId)
          .order('name');
        
        if (typesError) {
          console.error('Error al cargar tipos:', typesError);
          // No bloqueamos la carga por error en tipos
        }
        
        // Establecer datos del formulario
        setFormData({
          name: vertical.name,
          code: vertical.code,
          description: vertical.description,
          category: vertical.category || '',
          icon: null,
          currentIcon: vertical.icon,
          enabled: vertical.enabled,
          types: types || []
        });
        
        // Establecer vista previa del ícono si existe
        if (vertical.icon) {
          setIconPreview(vertical.icon);
        }
      } catch (error) {
        console.error('Error al cargar vertical:', error);
        setLoadError(error instanceof Error ? error.message : 'Error al cargar la vertical');
      } finally {
        setIsLoadingVertical(false);
      }
    }
    
    if (verticalId) {
      loadVertical();
    }
  }, [verticalId]);

  // Manejador de cambios en los campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Manejar checkbox
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error del campo
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Manejador para cambios en el código
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convertir a minúsculas y reemplazar espacios con guiones bajos
    const value = e.target.value.toLowerCase().replace(/\s+/g, '_');
    
    // Eliminar caracteres no alfanuméricos excepto guiones bajos
    const sanitizedValue = value.replace(/[^a-z0-9_]/g, '');
    
    setFormData(prev => ({
      ...prev,
      code: sanitizedValue
    }));
    
    // Limpiar error
    if (errors.code) {
      setErrors(prev => ({
        ...prev,
        code: undefined
      }));
    }
  };

  // Generar código automáticamente desde el nombre
  const handleGenerateCode = () => {
    if (formData.name) {
      const generatedCode = formData.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      setFormData(prev => ({
        ...prev,
        code: generatedCode
      }));
      
      // Limpiar error
      if (errors.code) {
        setErrors(prev => ({
          ...prev,
          code: undefined
        }));
      }
    }
  };

  // Manejador para selección de ícono
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Verificar tamaño (máximo 1MB)
      if (file.size > 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          icon: 'El ícono no debe superar 1MB'
        }));
        return;
      }
      
      // Verificar tipo (solo imágenes)
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          icon: 'El archivo debe ser una imagen'
        }));
        return;
      }
      
      // Crear URL para vista previa
      const objectUrl = URL.createObjectURL(file);
      setIconPreview(objectUrl);
      
      // Actualizar estado
      setFormData(prev => ({
        ...prev,
        icon: file
      }));
      
      // Limpiar error
      if (errors.icon) {
        setErrors(prev => ({
          ...prev,
          icon: undefined
        }));
      }
    }
  };

  // Eliminar ícono seleccionado
  const handleRemoveIcon = () => {
    setFormData(prev => ({
      ...prev,
      icon: null,
      currentIcon: null
    }));
    
    if (iconPreview) {
      // Solo revocar si es un objeto URL, no una URL de Supabase
      if (iconPreview.startsWith('blob:')) {
        URL.revokeObjectURL(iconPreview);
      }
      setIconPreview(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Manejadores para los tipos de vertical
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setCurrentType(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores
    if (typeErrors[name as keyof typeof typeErrors]) {
      setTypeErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Generar código para el tipo automáticamente
  const handleGenerateTypeCode = () => {
    if (currentType.name) {
      const generatedCode = currentType.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      setCurrentType(prev => ({
        ...prev,
        code: generatedCode
      }));
      
      // Limpiar error
      if (typeErrors.code) {
        setTypeErrors(prev => ({
          ...prev,
          code: undefined
        }));
      }
    }
  };

  // Validar datos del tipo
  const validateType = (): boolean => {
    const errors: {name?: string; code?: string; description?: string} = {};
    
    // Validar nombre
    if (!currentType.name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (currentType.name.length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    // Validar código
    if (!currentType.code.trim()) {
      errors.code = 'El código es obligatorio';
    } else if (!/^[a-z0-9_]+$/.test(currentType.code)) {
      errors.code = 'El código solo puede contener letras minúsculas, números y guiones bajos';
    }
    
    // Validar descripción
    if (!currentType.description.trim()) {
      errors.description = 'La descripción es obligatoria';
    }
    
    // Verificar si el código ya existe
    const typeExists = formData.types.some(type => 
      !type._delete && // Ignorar tipos marcados para eliminar
      type.code === currentType.code
    );
    
    if (typeExists) {
      errors.code = 'Este código ya está siendo utilizado por otro tipo';
    }
    
    setTypeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Añadir tipo
  const handleAddType = () => {
    if (!validateType()) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      types: [...prev.types, { ...currentType }]
    }));
    
    // Limpiar formulario de tipo
    setCurrentType({
      name: '',
      code: '',
      description: ''
    });
    
    // Limpiar error general de tipos
    if (errors.types) {
      setErrors(prev => ({
        ...prev,
        types: undefined
      }));
    }
  };

  // Eliminar tipo
  const handleRemoveType = (index: number) => {
    setFormData(prev => {
      const updatedTypes = [...prev.types];
      
      // Si el tipo ya existe en la BD, marcarlo para eliminación
      if (updatedTypes[index].id) {
        updatedTypes[index] = {
          ...updatedTypes[index],
          _delete: true
        };
      } else {
        // Si es un tipo nuevo, simplemente eliminarlo del array
        updatedTypes.splice(index, 1);
      }
      
      return {
        ...prev,
        types: updatedTypes
      };
    });
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.length > 50) {
      newErrors.name = 'El nombre no debe superar 50 caracteres';
    }
    
    // Validar código
    if (!formData.code.trim()) {
      newErrors.code = 'El código es obligatorio';
    } else if (formData.code.length < 3) {
      newErrors.code = 'El código debe tener al menos 3 caracteres';
    } else if (formData.code.length > 30) {
      newErrors.code = 'El código no debe superar 30 caracteres';
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'El código solo puede contener letras minúsculas, números y guiones bajos';
    }
    
    // Validar descripción
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    } else if (formData.description.length > 200) {
      newErrors.description = 'La descripción no debe superar 200 caracteres';
    }
    
    // Validar categoría
    if (!formData.category.trim()) {
      newErrors.category = 'La categoría es obligatoria';
    }
    
    // Validar tipos
    const activeTypes = formData.types.filter(type => !type._delete);
    if (activeTypes.length === 0) {
      newErrors.types = 'Debes tener al menos un tipo para la vertical';
    }
    
    // Actualizar errores y retornar resultado
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // 1. Verificar si el código ya existe (si cambió)
      if (formData.code !== formData.code) {
        const { data: existingVertical, error: checkError } = await supabase
          .from('verticals')
          .select('id')
          .eq('code', formData.code)
          .neq('id', verticalId)
          .maybeSingle();
        
        if (checkError) {
          throw new Error('Error al verificar el código de vertical');
        }
        
        if (existingVertical) {
          setErrors(prev => ({
            ...prev,
            code: `El código "${formData.code}" ya está en uso`
          }));
          setIsSubmitting(false);
          return;
        }
      }
      
      // 2. Subir ícono si se seleccionó uno nuevo
      let iconUrl = formData.currentIcon;
      
      if (formData.icon) {
        const fileName = `vertical_icons/${formData.code}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(fileName, formData.icon, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          throw new Error('Error al subir el ícono');
        }
        
        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(fileName);
        
        iconUrl = urlData.publicUrl;
      }
      
      // 3. Actualizar vertical
      const { error: updateError } = await supabase
        .from('verticals')
        .update({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          category: formData.category,
          icon: iconUrl,
          enabled: formData.enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', verticalId);
      
      if (updateError) {
        throw new Error('Error al actualizar la vertical');
      }
      
      // 4. Gestionar tipos de vertical
      
      // 4.1 Tipos a eliminar
      const typesToDelete = formData.types
        .filter(type => type._delete && type.id)
        .map(type => type.id);
      
      if (typesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('vertical_types')
          .delete()
          .in('id', typesToDelete);
        
        if (deleteError) {
          console.error('Error al eliminar tipos:', deleteError);
          // No bloqueamos por errores en tipos
        }
      }
      
      // 4.2 Tipos nuevos a insertar
      const newTypes = formData.types
        .filter(type => !type._delete && !type.id)
        .map(type => ({
          vertical_id: verticalId,
          name: type.name,
          code: type.code,
          description: type.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      
      if (newTypes.length > 0) {
        const { error: insertError } = await supabase
          .from('vertical_types')
          .insert(newTypes);
        
        if (insertError) {
          console.error('Error al insertar nuevos tipos:', insertError);
          // No bloqueamos por errores en tipos
        }
      }
      
      // 4.3 Tipos existentes a actualizar
      const typesToUpdate = formData.types
        .filter(type => !type._delete && type.id)
        .map(type => ({
          id: type.id,
          name: type.name,
          code: type.code,
          description: type.description,
          updated_at: new Date().toISOString()
        }));
      
      for (const type of typesToUpdate) {
        const { error: updateTypeError } = await supabase
          .from('vertical_types')
          .update({
            name: type.name,
            code: type.code,
            description: type.description,
            updated_at: type.updated_at
          })
          .eq('id', type.id);
        
        if (updateTypeError) {
          console.error(`Error al actualizar tipo ${type.id}:`, updateTypeError);
          // No bloqueamos por errores en tipos
        }
      }
      
      // Redirigir a la lista de verticales
      router.push('/superadmin/verticals');
    } catch (error) {
      console.error('Error al actualizar vertical:', error);
      setServerError('Error al actualizar la vertical. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancelar y volver a la lista
  const handleCancel = () => {
    router.push('/superadmin/verticals');
  };

  // Si está cargando inicialmente
  if (isLoadingVertical) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center">
        <Spinner size="lg" color="primary" text="Cargando vertical..." />
      </div>
    );
  }

  // Si hay error al cargar
  if (loadError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 dark:text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Error al cargar la vertical</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{loadError}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.refresh()}
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Reintentar
            </button>
            <Link
              href="/superadmin/verticals"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Volver a la lista
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Editar Vertical: {formData.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Modifica los detalles de la vertical y sus tipos
        </p>
      </div>
      
      {/* Formulario */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error del servidor */}
          {serverError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400">{serverError}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Ej. Salón de Belleza"
                className={`w-full rounded-md border ${errors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>
            
            {/* Código */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="code"
                  name="code"
                  placeholder="Ej. salon_belleza"
                  className={`w-full rounded-l-md border ${errors.code ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  value={formData.code}
                  onChange={handleCodeChange}
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Generar
                </button>
              </div>
              {errors.code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.code}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Identificador único utilizado en URLs y APIs.
              </p>
            </div>
            
            {/* Descripción */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Breve descripción de la vertical de negocio"
                className={`w-full rounded-md border ${errors.description ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                value={formData.description}
                onChange={handleChange}
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>
            
            {/* Categoría */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                className={`w-full rounded-md border ${errors.category ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar categoría</option>
                {predefinedCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
              )}
            </div>
            
            {/* Estado */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.enabled}
                onChange={handleChange}
              />
              <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Vertical habilitada
              </label>
              <p className="ml-4 text-xs text-gray-500 dark:text-gray-400">
                Las verticales deshabilitadas no están disponibles para los tenants.
              </p>
            </div>
            
            {/* Ícono */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ícono de la vertical
              </label>
              
              <div className="flex items-start space-x-4">
                {/* Vista previa */}
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {iconPreview ? (
                    <img 
                      src={iconPreview} 
                      alt="Vista previa" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                
                {/* Controles */}
                <div className="flex-1">
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="icon"
                      name="icon"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleIconChange}
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-2 rounded-md border border-primary-200 dark:border-primary-800 text-sm hover:bg-primary-100 dark:hover:bg-primary-800/30 transition-colors"
                    >
                      {formData.currentIcon ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </button>
                    
                    {iconPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveIcon}
                        className="ml-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Formato recomendado: PNG o SVG. Tamaño máximo: 1MB.
                  </p>
                  
                  {errors.icon && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.icon}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección de Tipos de Vertical */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Tipos de Vertical <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Gestiona los diferentes tipos de negocio que pueden existir dentro de esta vertical.
              Un tenant puede tener uno o más tipos asociados.
            </p>
            
            {errors.types && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-400">{errors.types}</p>
              </div>
            )}
            
            {/* Lista de tipos añadidos */}
            <div className="mb-6 bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tipos ({formData.types.filter(t => !t._delete).length})
              </h4>
              
              {formData.types.filter(t => !t._delete).length > 0 ? (
                <div className="space-y-3">
                  {formData.types.filter(t => !t._delete).map((type, index) => {
                    // Encontrar el índice real en el array original para poder eliminarlo correctamente
                    const realIndex = formData.types.findIndex(t => 
                      t.id === type.id || (t.code === type.code && !t.id && !t._delete)
                    );
                    
                    return (
                      <div 
                        key={type.id || `new-${index}`}
                        className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <div className="flex items-baseline">
                            <h5 className="text-sm font-medium text-gray-800 dark:text-white">
                              {type.name}
                            </h5>
                            <span className="ml-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                              {type.code}
                            </span>
                            {type.id && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                                Existente
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {type.description}
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveType(realIndex)}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                          title="Eliminar tipo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-md p-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    No hay tipos definidos para esta vertical.
                  </p>
                </div>
              )}
            </div>
            
            {/* Formulario para añadir tipos */}
            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Añadir nuevo tipo
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre del tipo */}
                <div>
                  <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="typeName"
                    name="name"
                    placeholder="Ej. Salón de Belleza"
                    className={`w-full rounded-md border ${typeErrors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    value={currentType.name}
                    onChange={handleTypeChange}
                  />
                  {typeErrors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{typeErrors.name}</p>
                  )}
                </div>
                
                {/* Código del tipo */}
                <div>
                  <label htmlFor="typeCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Código <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="typeCode"
                      name="code"
                      placeholder="Ej. salon_belleza"
                      className={`w-full rounded-l-md border ${typeErrors.code ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                      value={currentType.code}
                      onChange={(e) => {
                        // Sanitizar el código
                        const value = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                        setCurrentType(prev => ({ ...prev, code: value }));
                        
                        // Limpiar error
                        if (typeErrors.code) {
                          setTypeErrors(prev => ({ ...prev, code: undefined }));
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateTypeCode}
                      className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Generar
                    </button>
                  </div>
                  {typeErrors.code && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{typeErrors.code}</p>
                  )}
                </div>
                
                {/* Descripción del tipo */}
                <div className="md:col-span-2">
                  <label htmlFor="typeDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="typeDescription"
                    name="description"
                    rows={2}
                    placeholder="Breve descripción del tipo de negocio"
                    className={`w-full rounded-md border ${typeErrors.description ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500`}
                    value={currentType.description}
                    onChange={handleTypeChange}
                  />
                  {typeErrors.description && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{typeErrors.description}</p>
                  )}
                </div>
              </div>
              
              {/* Botón para añadir tipo */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddType}
                  className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
                >
                  Añadir Tipo
                </button>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && <Spinner size="sm" className="mr-2" />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Proteger la página con verificación de permisos
export default withPermissionCheck(EditVerticalPage, {
  requiredRole: 'super_admin',
  redirectUnauthorized: true,
  redirectUrl: '/app/unauthorized'
});
