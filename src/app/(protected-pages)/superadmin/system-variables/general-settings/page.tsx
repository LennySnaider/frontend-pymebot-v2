'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormItem, Form } from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Table } from '@/components/ui/Table';
import { useTranslation } from '@/utils/hooks/useTranslation';
import { SystemVariablesService, SystemVariable } from '@/services/SystemVariablesService';
import { FaCog, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const GeneralSettingsPage: React.FC = () => {
  const t = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const [variables, setVariables] = useState<SystemVariable[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentVariable, setCurrentVariable] = useState<Partial<SystemVariable>>({
    name: '',
    display_name: '',
    type: 'string',
    default_value: '',
    description: '',
  });

  // Cargar variables
  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = async () => {
    try {
      setLoading(true);
      const service = SystemVariablesService.getInstance();
      const allVariables = await service.getAllVariables();
      
      // Filtrar variables que no pertenezcan a categorías específicas
      const generalVariables = allVariables.filter(variable => 
        !variable.name.startsWith('CHATBOT_') &&
        !variable.name.startsWith('RESEND_') &&
        !variable.name.startsWith('DEFAULT_BUSINESS_') &&
        !variable.name.startsWith('USER_') &&
        !variable.name.startsWith('PAYMENT_')
      );
      
      setVariables(generalVariables);
    } catch (error) {
      console.error('Error cargando variables:', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentVariable(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Abrir formulario para añadir nueva variable
  const handleAddNew = () => {
    setCurrentVariable({
      name: '',
      display_name: '',
      type: 'string',
      default_value: '',
      description: '',
    });
    setFormMode('add');
    setShowForm(true);
  };

  // Abrir formulario para editar variable existente
  const handleEdit = (variable: SystemVariable) => {
    setCurrentVariable({
      ...variable
    });
    setFormMode('edit');
    setShowForm(true);
  };

  // Guardar variable (nueva o editada)
  const handleSave = async () => {
    try {
      if (!currentVariable.name || !currentVariable.display_name) {
        alert('Por favor completa los campos obligatorios');
        return;
      }

      const service = SystemVariablesService.getInstance();
      
      // Si estamos en modo edición, primero eliminamos la variable original
      if (formMode === 'edit' && currentVariable.id) {
        // Aquí podría ir lógica para actualizar una variable existente si hay un endpoint específico
      }
      
      // Guardar la variable con su valor
      await service.setVariable(
        currentVariable.name!,
        currentVariable.default_value || ''
      );
      
      // Recargar lista
      await loadVariables();
      
      // Cerrar formulario
      setShowForm(false);
      setCurrentVariable({
        name: '',
        display_name: '',
        type: 'string',
        default_value: '',
        description: '',
      });
      
    } catch (error) {
      console.error('Error guardando variable:', error);
      alert('Error al guardar la variable');
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    setShowForm(false);
    setCurrentVariable({
      name: '',
      display_name: '',
      type: 'string',
      default_value: '',
      description: '',
    });
  };

  if (loading && variables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Variables Generales del Sistema</h1>
        <Button
          variant="solid"
          icon={<FaPlus />}
          onClick={handleAddNew}
        >
          Nueva Variable
        </Button>
      </div>
      
      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">
            {formMode === 'add' ? 'Añadir Nueva Variable' : 'Editar Variable'}
          </h2>
          
          <Form layout="vertical">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem
                label="Nombre"
                required
                className="mb-4"
              >
                <Input
                  name="name"
                  value={currentVariable.name}
                  onChange={handleInputChange}
                  placeholder="SYSTEM_VARIABLE_NAME"
                  disabled={formMode === 'edit'}
                />
              </FormItem>
              
              <FormItem
                label="Nombre para mostrar"
                required
                className="mb-4"
              >
                <Input
                  name="display_name"
                  value={currentVariable.display_name}
                  onChange={handleInputChange}
                  placeholder="Nombre legible de la variable"
                />
              </FormItem>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem
                label="Tipo"
                className="mb-4"
              >
                <select
                  name="type"
                  value={currentVariable.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="string">Texto (string)</option>
                  <option value="number">Número (number)</option>
                  <option value="boolean">Booleano (boolean)</option>
                  <option value="json">JSON</option>
                </select>
              </FormItem>
              
              <FormItem
                label="Valor predeterminado"
                className="mb-4"
              >
                <Input
                  name="default_value"
                  value={currentVariable.default_value}
                  onChange={handleInputChange}
                  placeholder="Valor por defecto"
                />
              </FormItem>
            </div>
            
            <FormItem
              label="Descripción"
              className="mb-6"
            >
              <Input
                as="textarea"
                rows={3}
                name="description"
                value={currentVariable.description}
                onChange={handleInputChange}
                placeholder="Descripción de la variable y su uso"
              />
            </FormItem>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="solid"
                onClick={handleSave}
              >
                {formMode === 'add' ? 'Crear Variable' : 'Actualizar Variable'}
              </Button>
              
              <Button
                type="button"
                variant="default"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
            </div>
          </Form>
        </Card>
      )}
      
      {variables.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Nombre para mostrar</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((variable) => (
                  <tr key={variable.id}>
                    <td className="font-mono">{variable.name}</td>
                    <td>{variable.display_name}</td>
                    <td>{variable.type}</td>
                    <td>
                      {variable.is_sensitive 
                        ? '••••••••••••' 
                        : (variable.default_value || <span className="text-gray-400">Sin valor</span>)}
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Button
                          size="xs"
                          variant="default"
                          icon={<FaEdit />}
                          onClick={() => handleEdit(variable)}
                        >
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500 mb-4">No hay variables generales configuradas</p>
          <Button
            variant="solid"
            icon={<FaPlus />}
            onClick={handleAddNew}
          >
            Añadir Primera Variable
          </Button>
        </Card>
      )}
      
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-medium mb-2">Información</h2>
        <p className="text-gray-600 mb-4">
          Las variables generales del sistema son utilizadas por diversas funcionalidades que no encajan en categorías específicas.
        </p>
        
        <h3 className="font-medium mb-1">Buenas prácticas:</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>Use nombres en mayúsculas con guiones bajos (ej: SYSTEM_LOCALE).</li>
          <li>Proporcione descripciones claras para cada variable.</li>
          <li>Marque como sensibles aquellas variables que contengan secretos o tokens.</li>
          <li>Utilice prefijos consistentes para agrupar variables relacionadas.</li>
        </ul>
      </Card>
    </div>
  );
};

export default GeneralSettingsPage;