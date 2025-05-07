'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Dialog, Input, Notification, toast, Table, Tag, Badge, Form, FormItem } from '@/components/ui';
import { AppointmentTypeConfig } from './types';

// Función temporal para traducciones mientras solucionamos el problema
const mockTranslation = (key: string) => {
  const translations: Record<string, string> = {
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'appointments.types.fetch_error': 'Error al obtener los tipos de cita',
    'appointments.types.save_error': 'Error al guardar el tipo de cita',
    'appointments.types.title': 'Tipos de Cita',
    'appointments.types.description': 'Configure los diferentes tipos de cita que ofrece su negocio.',
    'appointments.types.add': 'Añadir Tipo',
    'appointments.types.edit': 'Editar Tipo',
    'appointments.types.minutes': 'min',
    'appointments.types.no_data': 'No hay tipos de cita configurados',
    'appointments.types.active': 'Activo',
    'appointments.types.inactive': 'Inactivo',
    'appointments.types.update_success': 'Tipo de cita actualizado con éxito',
    'appointments.types.create_success': 'Tipo de cita creado con éxito',
    'appointments.types.delete_success': 'Tipo de cita eliminado con éxito',
    'appointments.types.delete_error': 'Error al eliminar el tipo de cita',
    'appointments.types.delete_conflict': 'No se puede eliminar porque tiene citas asignadas',
    'appointments.types.fields.name': 'Nombre',
    'appointments.types.fields.description': 'Descripción',
    'appointments.types.fields.duration': 'Duración',
    'appointments.types.fields.color': 'Color',
    'appointments.types.fields.buffer': 'Buffer',
    'appointments.types.fields.status': 'Estado',
    'appointments.types.fields.max_daily': 'Máximo diario',
    'appointments.types.fields.booking_url': 'URL de reserva',
    'appointments.types.fields.requires_payment': 'Requiere pago',
    'appointments.types.fields.payment_amount': 'Monto',
    'appointments.types.fields.is_active': 'Activo',
    'appointments.types.placeholders.name': 'Ej. Consulta inicial',
    'appointments.types.placeholders.description': 'Descripción breve del tipo de cita',
    'appointments.types.placeholders.booking_url': 'consulta-inicial',
    'appointments.types.placeholders.unlimited': 'Sin límite',
    'appointments.types.errors.name_required': 'El nombre es obligatorio',
    'appointments.types.errors.duration_required': 'La duración debe ser mayor que cero',
    'appointments.types.errors.buffer_non_negative': 'El buffer no puede ser negativo',
    'appointments.types.errors.max_non_negative': 'El máximo no puede ser negativo',
    'appointments.types.errors.payment_required': 'El monto es obligatorio si requiere pago'
  };
  
  return translations[key] || key.split('.').pop() || key;
};

const AppointmentTypesSettings = () => {
  // Función t para sustituir useTranslation temporalmente
  const t = mockTranslation;
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<AppointmentTypeConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Estado para el tipo de cita en edición
  const [currentType, setCurrentType] = useState<AppointmentTypeConfig>({
    name: '',
    description: '',
    duration: 30,
    color: '#4caf50',
    buffer_time: 0,
    is_active: true,
    booking_url_suffix: '',
    max_daily_appointments: null,
    requires_payment: false,
    payment_amount: null,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Cargar tipos de cita al inicio
    fetchAppointmentTypes();
  }, []);
  
  const fetchAppointmentTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments/types');
      
      if (!response.ok) {
        toast.push(
          <Notification title={t('common.error')} type="danger">
            {t('appointments.types.fetch_error')}
          </Notification>
        );
        throw new Error('Error al obtener tipos de cita');
      }
      
      const data = await response.json();
      setTypes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar tipos de cita:', error);
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof AppointmentTypeConfig, value: any) => {
    setCurrentType((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const resetForm = () => {
    setCurrentType({
      name: '',
      description: '',
      duration: 30,
      color: '#4caf50',
      buffer_time: 0,
      is_active: true,
      booking_url_suffix: '',
      max_daily_appointments: null,
      requires_payment: false,
      payment_amount: null,
    });
    setErrors({});
  };
  
  const handleOpenModal = (type?: AppointmentTypeConfig) => {
    if (type) {
      // Modo edición
      setCurrentType(type);
      setEditMode(true);
    } else {
      // Modo creación
      resetForm();
      setEditMode(false);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!currentType.name.trim()) {
      newErrors.name = t('appointments.types.errors.name_required');
    }
    
    if (currentType.duration <= 0) {
      newErrors.duration = t('appointments.types.errors.duration_required');
    }
    
    if (currentType.buffer_time < 0) {
      newErrors.buffer_time = t('appointments.types.errors.buffer_non_negative');
    }
    
    if (currentType.max_daily_appointments !== null && currentType.max_daily_appointments < 0) {
      newErrors.max_daily_appointments = t('appointments.types.errors.max_non_negative');
    }
    
    if (currentType.requires_payment && 
        (currentType.payment_amount === null || currentType.payment_amount <= 0)) {
      newErrors.payment_amount = t('appointments.types.errors.payment_required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSaveType = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
      let response;
      
      if (editMode && currentType.id) {
        // Actualizar tipo existente
        response = await fetch(`/api/appointments/types/${currentType.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentType),
        });
      } else {
        // Crear nuevo tipo
        response = await fetch('/api/appointments/types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentType),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar tipo de cita');
      }
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {editMode
            ? t('appointments.types.update_success')
            : t('appointments.types.create_success')}
        </Notification>
      );
      
      // Cerrar modal y recargar datos
      handleCloseModal();
      fetchAppointmentTypes();
    } catch (error: any) {
      console.error('Error al guardar tipo de cita:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {error.message || t('appointments.types.save_error')}
        </Notification>
      );
    }
  };
  
  const handleDeleteType = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/types/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Si hay citas asignadas, mostrar mensaje específico
        if (response.status === 409 && errorData.count) {
          toast.push(
            <Notification title={t('common.error')} type="danger">
              {t('appointments.types.delete_conflict', { count: errorData.count })}
            </Notification>
          );
          return;
        }
        
        throw new Error(errorData.error || 'Error al eliminar tipo de cita');
      }
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.types.delete_success')}
        </Notification>
      );
      
      // Recargar datos
      fetchAppointmentTypes();
    } catch (error: any) {
      console.error('Error al eliminar tipo de cita:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {error.message || t('appointments.types.delete_error')}
        </Notification>
      );
    }
  };
  
  // Columnas para la tabla
  const columns = [
    {
      key: 'name',
      title: t('appointments.types.fields.name'),
      render: (_, row: AppointmentTypeConfig) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-gray-500">{row.description}</div>
        </div>
      ),
    },
    {
      key: 'duration',
      title: t('appointments.types.fields.duration'),
      render: (_, row: AppointmentTypeConfig) => (
        <span>{row.duration} {t('appointments.types.minutes')}</span>
      ),
    },
    {
      key: 'color',
      title: t('appointments.types.fields.color'),
      render: (_, row: AppointmentTypeConfig) => (
        <div className="flex items-center space-x-2">
          <div 
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: row.color || '#cccccc' }}
          />
          <span>{row.color || '-'}</span>
        </div>
      ),
    },
    {
      key: 'buffer',
      title: t('appointments.types.fields.buffer'),
      render: (_, row: AppointmentTypeConfig) => (
        <span>
          {row.buffer_time > 0 
            ? `${row.buffer_time} ${t('appointments.types.minutes')}`
            : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      title: t('appointments.types.fields.status'),
      render: (_, row: AppointmentTypeConfig) => (
        <Badge className={row.is_active ? 'bg-green-500' : 'bg-gray-500'}>
          {row.is_active
            ? t('appointments.types.active')
            : t('appointments.types.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (_, row: AppointmentTypeConfig) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="twoTone"
            color="blue"
            onClick={() => handleOpenModal(row)}
          >
            {t('common.edit')}
          </Button>
          <Button
            size="sm"
            variant="twoTone"
            color="red"
            onClick={() => handleDeleteType(row.id || '')}
            disabled={!row.id}
          >
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="mb-4 text-lg font-semibold">
            {t('appointments.types.title')}
          </h4>
          <p className="text-gray-500">
            {t('appointments.types.description')}
          </p>
        </div>
        <Button variant="solid" color="primary" onClick={() => handleOpenModal()}>
          {t('appointments.types.add')}
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <div>
          {types.length === 0 ? (
            <Card className="p-6 text-center">
              <p>{t('appointments.types.no_data')}</p>
            </Card>
          ) : (
            <Table columns={columns} data={types} />
          )}
        </div>
      )}
      
      {/* Modal para agregar/editar tipo de cita */}
      <Dialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onRequestClose={handleCloseModal}
        width={600}
      >
        <h5 className="mb-4 text-lg font-bold">
          {editMode
            ? t('appointments.types.edit')
            : t('appointments.types.add')}
        </h5>
        
        <Form layout="vertical">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormItem
              label={t('appointments.types.fields.name')}
              invalid={!!errors.name}
              errorMessage={errors.name}
              className="md:col-span-2"
            >
              <Input
                value={currentType.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('appointments.types.placeholders.name')}
              />
            </FormItem>
            
            <FormItem
              label={t('appointments.types.fields.description')}
              className="md:col-span-2"
            >
              <Input
                value={currentType.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('appointments.types.placeholders.description')}
              />
            </FormItem>
            
            <FormItem
              label={t('appointments.types.fields.duration')}
              invalid={!!errors.duration}
              errorMessage={errors.duration}
            >
              <Input
                type="number"
                value={currentType.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                addonAfter={t('appointments.types.minutes')}
              />
            </FormItem>
            
            <FormItem
              label={t('appointments.types.fields.buffer')}
              invalid={!!errors.buffer_time}
              errorMessage={errors.buffer_time}
            >
              <Input
                type="number"
                value={currentType.buffer_time}
                onChange={(e) => handleInputChange('buffer_time', parseInt(e.target.value) || 0)}
                addonAfter={t('appointments.types.minutes')}
              />
            </FormItem>
            
            <FormItem
              label={t('appointments.types.fields.color')}
            >
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={currentType.color || '#4caf50'}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-24"
                />
                <Input
                  value={currentType.color || ''}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  placeholder="#4caf50"
                />
              </div>
            </FormItem>
            
            <FormItem
              label={t('appointments.types.fields.max_daily')}
              invalid={!!errors.max_daily_appointments}
              errorMessage={errors.max_daily_appointments}
            >
              <Input
                type="number"
                value={currentType.max_daily_appointments === null ? '' : currentType.max_daily_appointments}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  handleInputChange('max_daily_appointments', value);
                }}
                placeholder={t('appointments.types.placeholders.unlimited')}
              />
            </FormItem>
            
            <FormItem
              label={t('appointments.types.fields.booking_url')}
              className="md:col-span-2"
            >
              <Input
                value={currentType.booking_url_suffix || ''}
                onChange={(e) => handleInputChange('booking_url_suffix', e.target.value)}
                placeholder={t('appointments.types.placeholders.booking_url')}
              />
            </FormItem>
            
            <div className="md:col-span-2">
              <div className="mb-2 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={currentType.requires_payment}
                  onChange={(e) => handleInputChange('requires_payment', e.target.checked)}
                  id="requires-payment"
                />
                <label htmlFor="requires-payment">
                  {t('appointments.types.fields.requires_payment')}
                </label>
              </div>
              
              {currentType.requires_payment && (
                <FormItem
                  label={t('appointments.types.fields.payment_amount')}
                  invalid={!!errors.payment_amount}
                  errorMessage={errors.payment_amount}
                >
                  <Input
                    type="number"
                    value={currentType.payment_amount === null ? '' : currentType.payment_amount}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseFloat(e.target.value);
                      handleInputChange('payment_amount', value);
                    }}
                    addonBefore="$"
                    step="0.01"
                  />
                </FormItem>
              )}
            </div>
            
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={currentType.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  id="is-active"
                />
                <label htmlFor="is-active">
                  {t('appointments.types.fields.is_active')}
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="plain" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button variant="solid" color="primary" onClick={handleSaveType}>
              {t('common.save')}
            </Button>
          </div>
        </Form>
      </Dialog>
    </div>
  );
};

export default AppointmentTypesSettings;