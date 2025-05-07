'use client';

/**
 * frontend/src/app/(protected-pages)/superadmin/module-editor/_components/JsonSchemaEditor.tsx
 * Editor visual para esquemas JSON de configuración de módulos.
 * Permite definir la estructura de configuración que utilizará cada módulo.
 * @version 1.0.0
 * @updated 2025-04-30
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CodeEditor from '@/components/shared/CodeEditor';
import Tabs from '@/components/ui/Tabs';
const { TabNav, TabList, TabContent } = Tabs;
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormItem from '@/components/ui/Form/FormItem';
import { toast } from '@/components/ui/toast';
import { Notification } from '@/components/ui/Notification';
import { TbPlus, TbTrash, TbArrowUp, TbArrowDown, TbRotate } from 'react-icons/tb';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { SafeSelect } from '@/components/shared/safe-components';

// Tipos de campo soportados
const getFieldTypes = (t: any) => [
  { label: t('moduleEditor.string'), value: 'string' },
  { label: t('moduleEditor.number'), value: 'number' },
  { label: t('moduleEditor.boolean'), value: 'boolean' },
  { label: t('moduleEditor.object'), value: 'object' },
  { label: t('moduleEditor.array'), value: 'array' },
  { label: t('moduleEditor.enum'), value: 'enum' },
];

// Interfaces
interface SchemaField {
  name: string;
  type: string;
  title?: string; 
  description?: string;
  required?: boolean;
  default?: any;
  properties?: Record<string, SchemaField>; // Para objetos
  items?: SchemaField; // Para arrays
  enum?: string[]; // Para enums
  options?: Array<{label: string, value: string}>; // Para enums con labels
}

interface JsonSchemaEditorProps {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}

/**
 * Editor visual para esquemas JSON de configuración
 */
export default function JsonSchemaEditor({ value, onChange }: JsonSchemaEditorProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [rawJson, setRawJson] = useState<string>('{}');
  const t = useTranslations();
  
  // Obtener tipos de campo usando las traducciones
  const fieldTypes = useMemo(() => getFieldTypes(t), [t]);

  // Inicializar campos a partir del valor recibido
  useEffect(() => {
    try {
      const jsonStr = JSON.stringify(value, null, 2);
      
      // Solo actualizar si el JSON ha cambiado realmente
      if (jsonStr !== rawJson) {
        setRawJson(jsonStr);
        
        // Solo parsear si hay estructura real y propiedades
        if (Object.keys(value).length > 0 && value.properties) {
          const schema = value;
          const newFields: SchemaField[] = [];
          
          // Convertir propiedades del esquema en campos para el editor visual
          Object.entries(schema.properties).forEach(([key, fieldConfig]: [string, any]) => {
            const field: SchemaField = {
              name: key,
              type: fieldConfig.type,
              title: fieldConfig.title || key,
              description: fieldConfig.description || '',
              required: schema.required?.includes(key) || false,
              default: fieldConfig.default,
            };
            
            // Manejar propiedades específicas según el tipo
            if (fieldConfig.type === 'object' && fieldConfig.properties) {
              field.properties = fieldConfig.properties;
            } else if (fieldConfig.type === 'array' && fieldConfig.items) {
              field.items = fieldConfig.items;
            } else if (fieldConfig.enum) {
              field.enum = fieldConfig.enum;
              field.options = fieldConfig.options;
            }
            
            newFields.push(field);
          });
          
          // Actualizar los campos solo si han cambiado
          setFields(newFields);
        }
        
        // Limpiar errores si todo está bien
        if (jsonError) {
          setJsonError(null);
        }
      }
    } catch (error) {
      console.error('Error parsing JSON schema:', error);
      setJsonError('Invalid JSON schema');
    }
  }, [value, rawJson, jsonError]); // Quitamos fields de las dependencias

  // Crear esquema JSON a partir de campos visuales
  const updateJsonFromFields = useCallback(() => {
    // Evitar actualizaciones si no hay campos
    if (fields.length === 0) return;
    try {
      const schema: Record<string, any> = {
        type: 'object',
        properties: {},
        required: [],
      };
      
      fields.forEach(field => {
        schema.properties[field.name] = {
          type: field.type,
          title: field.title || field.name,
        };
        
        if (field.description) {
          schema.properties[field.name].description = field.description;
        }
        
        if (field.default !== undefined) {
          schema.properties[field.name].default = field.default;
        }
        
        // Manejar propiedades específicas según el tipo
        if (field.type === 'object' && field.properties) {
          schema.properties[field.name].properties = field.properties;
        } else if (field.type === 'array' && field.items) {
          schema.properties[field.name].items = field.items;
        } else if (field.type === 'enum' && field.enum) {
          schema.properties[field.name].enum = field.enum;
          if (field.options) {
            schema.properties[field.name].options = field.options;
          }
        }
        
        // Añadir a required si es necesario
        if (field.required) {
          schema.required.push(field.name);
        }
      });
      
      // Si no hay campos requeridos, eliminar el array
      if (schema.required.length === 0) {
        delete schema.required;
      }
      
      const jsonStr = JSON.stringify(schema, null, 2);
      
      // Solo actualizar si es necesario
      if (jsonStr !== rawJson) {
        setRawJson(jsonStr);
        onChange(schema);
      }
      
    } catch (error) {
      console.error('Error updating JSON from fields:', error);
      toast.push(
        <Notification title="Error" type="danger">
          Error al actualizar el esquema JSON
        </Notification>
      );
    }
  }, [fields, onChange, rawJson]);

  // Actualizar JSON raw al cambiar campos visuales
  useEffect(() => {
    // Evitar actualizaciones innecesarias si los campos están vacíos
    if (fields.length > 0) {
      // Actualizar el JSON solo si realmente cambiaron los campos
      const timer = setTimeout(() => {
        updateJsonFromFields();
      }, 100); // Pequeño retraso para evitar actualizaciones demasiado frecuentes
      
      return () => clearTimeout(timer);
    }
  }, [fields, updateJsonFromFields]);

  // Actualizar campos visuales al cambiar JSON raw
  const handleJsonChange = useCallback((jsonString: string) => {
    // Solo actualizar si realmente cambió el JSON
    if (jsonString !== rawJson) {
      try {
        const parsedJson = JSON.parse(jsonString);
        setRawJson(jsonString);
        onChange(parsedJson);
        setJsonError(null);
      } catch (error) {
        setRawJson(jsonString);
        setJsonError('Invalid JSON');
      }
    }
  }, [onChange, rawJson]);

  // Añadir nuevo campo
  const handleAddField = useCallback(() => {
    const newField: SchemaField = {
      name: `field_${fields.length + 1}`,
      type: 'string',
      title: `Field ${fields.length + 1}`,
      description: '',
      required: false,
    };
    
    setFields(prev => [...prev, newField]);
  }, [fields.length]);
  
  // Eliminar campo
  const handleRemoveField = useCallback((index: number) => {
    setFields(prev => {
      const newFields = [...prev];
      newFields.splice(index, 1);
      return newFields;
    });
  }, []);
  
  // Actualizar campo
  const handleUpdateField = useCallback((index: number, updatedField: Partial<SchemaField>) => {
    setFields(prev => {
      const newFields = [...prev];
      const oldField = newFields[index];
      newFields[index] = { ...oldField, ...updatedField };
      
      // Si el tipo cambió, reiniciar propiedades específicas
      if (updatedField.type && updatedField.type !== oldField.type) {
        if (updatedField.type === 'object') {
          newFields[index].properties = {};
          delete newFields[index].items;
          delete newFields[index].enum;
          delete newFields[index].options;
        } else if (updatedField.type === 'array') {
          newFields[index].items = { type: 'string' };
          delete newFields[index].properties;
          delete newFields[index].enum;
          delete newFields[index].options;
        } else if (updatedField.type === 'enum') {
          newFields[index].enum = ['option1', 'option2'];
          newFields[index].options = [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' },
          ];
          delete newFields[index].properties;
          delete newFields[index].items;
        } else {
          delete newFields[index].properties;
          delete newFields[index].items;
          delete newFields[index].enum;
          delete newFields[index].options;
        }
      }
      
      return newFields;
    });
  }, []);
  
  // Mover campo hacia arriba
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setFields(prev => {
      const newFields = [...prev];
      const temp = newFields[index];
      newFields[index] = newFields[index - 1];
      newFields[index - 1] = temp;
      return newFields;
    });
  }, []);
  
  // Mover campo hacia abajo
  const handleMoveDown = useCallback((index: number) => {
    setFields(prev => {
      if (index === prev.length - 1) return prev;
      const newFields = [...prev];
      const temp = newFields[index];
      newFields[index] = newFields[index + 1];
      newFields[index + 1] = temp;
      return newFields;
    });
  }, []);

  // Sincronizar con vista JSON
  const handleSyncFromJson = useCallback(() => {
    try {
      const parsedJson = JSON.parse(rawJson);
      onChange(parsedJson);
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON');
      toast.push(
        <Notification title="Error" type="danger">
          El esquema JSON no es válido
        </Notification>
      );
    }
  }, [rawJson, onChange]);

  return (
    <div className="w-full">
      <Tabs defaultValue="visual">
        <TabList className="mb-4">
          <TabNav value="visual">{t('moduleEditor.visual_editor')}</TabNav>
          <TabNav value="json">{t('moduleEditor.json_editor')}</TabNav>
        </TabList>
        
        <div className="p-4">
          <TabContent value="visual">
          <div className="space-y-6">
            {fields.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-lg border-gray-300 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400">
                  {t('moduleEditor.no_fields_defined')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormItem label={t('moduleEditor.field_name')} className="mb-0">
                        <Input
                          value={field.name}
                          onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                          placeholder="field_name"
                        />
                      </FormItem>
                      
                      <FormItem label={t('moduleEditor.field_type')} className="mb-0">
                        <SafeSelect
                          options={fieldTypes}
                          value={fieldTypes.find(t => t.value === field.type)}
                          onChange={(option) => handleUpdateField(index, { type: option?.value || 'string' })}
                        />
                      </FormItem>
                      
                      <FormItem label={t('moduleEditor.display_title')} className="mb-0">
                        <Input
                          value={field.title || ''}
                          onChange={(e) => handleUpdateField(index, { title: e.target.value })}
                          placeholder="Display name for this field"
                        />
                      </FormItem>
                      
                      <FormItem label={t('moduleEditor.required')} className="mb-0">
                        <div className="flex items-center h-full pt-2">
                          <input
                            type="checkbox"
                            className="h-5 w-5"
                            checked={field.required || false}
                            onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                          />
                          <span className="ml-2">{t('moduleEditor.this_field_is_required')}</span>
                        </div>
                      </FormItem>
                      
                      <FormItem label={t('moduleEditor.description')} className="md:col-span-2 mb-0">
                        <Input
                          value={field.description || ''}
                          onChange={(e) => handleUpdateField(index, { description: e.target.value })}
                          placeholder={t('moduleEditor.help_text_for_this_field')}
                        />
                      </FormItem>
                      
                      <FormItem label={t('moduleEditor.default_value')} className="md:col-span-2 mb-0">
                        <Input
                          value={field.default !== undefined ? String(field.default) : ''}
                          onChange={(e) => {
                            // Convertir al tipo correcto
                            let value = e.target.value;
                            if (field.type === 'number') {
                              value = value === '' ? '' : Number(value);
                            } else if (field.type === 'boolean') {
                              value = value === 'true';
                            }
                            handleUpdateField(index, { default: value });
                          }}
                          placeholder="Default value"
                        />
                      </FormItem>
                      
                      {/* Campos adicionales según el tipo */}
                      {field.type === 'enum' && (
                        <div className="md:col-span-2">
                          <FormItem label={t('moduleEditor.enum_options')} className="mb-0">
                            <div className="space-y-2">
                              {field.enum?.map((option, optIndex) => (
                                <div key={optIndex} className="flex gap-2">
                                  <Input
                                    value={field.options?.[optIndex]?.label || option}
                                    onChange={(e) => {
                                      const newOptions = [...(field.options || [])];
                                      newOptions[optIndex] = {
                                        value: field.enum?.[optIndex] || '',
                                        label: e.target.value
                                      };
                                      
                                      handleUpdateField(index, { options: newOptions });
                                    }}
                                    placeholder="Label"
                                    className="flex-1"
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const newEnum = [...(field.enum || [])];
                                      newEnum[optIndex] = e.target.value;
                                      
                                      const newOptions = [...(field.options || [])];
                                      newOptions[optIndex] = {
                                        label: field.options?.[optIndex]?.label || '',
                                        value: e.target.value
                                      };
                                      
                                      handleUpdateField(index, { 
                                        enum: newEnum,
                                        options: newOptions
                                      });
                                    }}
                                    placeholder="Value"
                                    className="flex-1"
                                  />
                                  <Button
                                    icon={<TbTrash />}
                                    variant="plain"
                                    onClick={() => {
                                      const newEnum = [...(field.enum || [])];
                                      newEnum.splice(optIndex, 1);
                                      
                                      const newOptions = [...(field.options || [])];
                                      newOptions.splice(optIndex, 1);
                                      
                                      handleUpdateField(index, { 
                                        enum: newEnum,
                                        options: newOptions
                                      });
                                    }}
                                    customColorClass={() => 'text-error hover:text-error'}
                                  />
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="plain"
                                icon={<TbPlus />}
                                onClick={() => {
                                  const newOption = `option${(field.enum?.length || 0) + 1}`;
                                  const newEnum = [...(field.enum || []), newOption];
                                  const newOptions = [...(field.options || []), {
                                    label: `Option ${(field.enum?.length || 0) + 1}`,
                                    value: newOption
                                  }];
                                  
                                  handleUpdateField(index, { 
                                    enum: newEnum,
                                    options: newOptions
                                  });
                                }}
                              >
                                {t('moduleEditor.add_option')}
                              </Button>
                            </div>
                          </FormItem>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="plain"
                          icon={<TbArrowUp />}
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        />
                        <Button
                          size="sm"
                          variant="plain"
                          icon={<TbArrowDown />}
                          onClick={() => handleMoveDown(index)}
                          disabled={index === fields.length - 1}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="plain"
                        icon={<TbTrash />}
                        onClick={() => handleRemoveField(index)}
                        customColorClass={() => 'text-error hover:text-error'}
                      >
                        {t('moduleEditor.remove')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="flex justify-center">
              <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={handleAddField}
              >
                {t('moduleEditor.add_field')}
              </Button>
            </div>
          </div>
          </TabContent>
          
          <TabContent value="json">
          <div className="space-y-4">
            <CodeEditor
              value={rawJson}
              onChange={handleJsonChange}
              language="json"
              height="600px"
              className="rounded-lg border border-gray-200 dark:border-gray-700"
            />
            
            {jsonError && (
              <div className="text-error text-sm">
                {t('moduleEditor.invalid_json')}
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                variant="solid"
                icon={<TbRotate />}
                onClick={handleSyncFromJson}
                disabled={!!jsonError}
              >
                {t('moduleEditor.apply_json_changes')}
              </Button>
            </div>
          </div>
          </TabContent>
        </div>
      </Tabs>
    </div>
  );
}
