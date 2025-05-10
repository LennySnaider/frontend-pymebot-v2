'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Dialog, Input, DatePicker, TimeInput, Notification, toast, Table, Badge } from '@/components/ui';
import { DateException } from './types';
import { fetchExceptions, saveException, deleteException } from './services';
import useTranslation from '@/utils/hooks/useTranslation';

export interface ExceptionsSettingsProps {
  className?: string;
}

const ExceptionsSettings = ({ className }: ExceptionsSettingsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<DateException[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado para el nuevo registro
  const [newException, setNewException] = useState<DateException>({
    exception_date: '',
    is_closed: true,
    open_time: '09:00',
    close_time: '18:00',
    reason: '',
  });
  
  useEffect(() => {
    // Cargar excepciones al inicio
    loadExceptions();
  }, []);
  
  const loadExceptions = async () => {
    try {
      setLoading(true);
      
      // Intentar consultar directamente el endpoint
      const response = await fetch('/api/business/hours/exceptions');
      
      if (!response.ok) {
        throw new Error(`Error en respuesta: ${response.status}`);
      }
      
      const apiData = await response.json();
      
      // Asegurarnos que tenemos un array
      const exceptionsArray = Array.isArray(apiData) ? apiData : [];
      
      if (exceptionsArray.length > 0) {
        // Realizar formateo para asegurar formato correcto
        const formattedExceptions = exceptionsArray.map(exception => {
          // Formatear campos de tiempo (quitar segundos)
          const open_time = exception.open_time ? 
            exception.open_time.substring(0, 5) : 
            exception.open_time;
            
          const close_time = exception.close_time ? 
            exception.close_time.substring(0, 5) : 
            exception.close_time;
            
          return { 
            ...exception, 
            open_time, 
            close_time 
          };
        });
        
        setExceptions(formattedExceptions);
      } else {
        setExceptions([]);
      }
    } catch (error) {
      console.error('Error al cargar excepciones:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {t('appointments.settings.fetch_error')}
        </Notification>
      );
      // Establecer un array vacío para evitar que el estado sea undefined
      setExceptions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field: keyof DateException, value: any) => {
    setNewException((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const resetForm = () => {
    setNewException({
      exception_date: '',
      is_closed: true,
      open_time: '09:00',
      close_time: '18:00',
      reason: '',
    });
  };
  
  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleToggleClosed = (value: boolean) => {
    setNewException((prev) => ({
      ...prev,
      is_closed: value,
    }));
  };
  
  const handleSaveException = async () => {
    try {
      setSaving(true);
      
      // Validar fecha
      if (!newException.exception_date) {
        toast.push(
          <Notification title={t('common.error')} type="danger">
            {t('appointments.settings.exceptions.date_required')}
          </Notification>
        );
        return;
      }
      
      // Si no está cerrado, validar horas
      if (!newException.is_closed) {
        if (!newException.open_time || !newException.close_time) {
          toast.push(
            <Notification title={t('common.error')} type="danger">
              {t('appointments.settings.exceptions.hours_required')}
            </Notification>
          );
          return;
        }
      }
      
      await saveException(newException);
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.settings.exceptions.save_success')}
        </Notification>
      );
      
      // Cerrar modal y recargar datos
      handleCloseModal();
      loadExceptions();
    } catch (error: any) {
      console.error('Error al guardar excepción:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {error.message || t('appointments.settings.save_error')}
        </Notification>
      );
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteException = async (id: string) => {
    try {
      await deleteException(id);
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.settings.exceptions.delete_success')}
        </Notification>
      );
      
      // Recargar datos
      loadExceptions();
    } catch (error) {
      console.error('Error al eliminar excepción:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {t('appointments.settings.exceptions.delete_error')}
        </Notification>
      );
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };
  
  // Columnas para la tabla
  const columns = [
    {
      key: 'exception_date',
      title: t('appointments.settings.exceptions.date'),
      render: (_, row: DateException) => <span>{formatDate(row.exception_date)}</span>,
    },
    {
      key: 'status',
      title: t('appointments.settings.exceptions.status'),
      render: (_, row: DateException) => {
        // Tratar tanto booleano como string
        const isClosed = row.is_closed === true || row.is_closed === 'true';
        return (
          <Badge color={isClosed ? 'red' : 'green'}>
            {isClosed
              ? t('appointments.settings.exceptions.closed')
              : t('appointments.settings.exceptions.open')}
          </Badge>
        );
      },
    },
    {
      key: 'hours',
      title: t('appointments.settings.exceptions.hours'),
      render: (_, row: DateException) => {
        // Tratar tanto booleano como string
        const isClosed = row.is_closed === true || row.is_closed === 'true';
        
        if (isClosed) {
          return <span>-</span>;
        }
        
        // Formatear las horas si tienen segundos
        const openTime = row.open_time ? (row.open_time?.length > 5 ? row.open_time.substring(0, 5) : row.open_time) : '-';
        const closeTime = row.close_time ? (row.close_time?.length > 5 ? row.close_time.substring(0, 5) : row.close_time) : '-';
        
        return <span>{openTime} - {closeTime}</span>;
      },
    },
    {
      key: 'reason',
      title: t('appointments.settings.exceptions.reason'),
      render: (_, row: DateException) => <span>{row.reason || '-'}</span>,
    },
    {
      key: 'actions',
      title: '',
      render: (_, row: DateException) => (
        <Button
          size="sm"
          variant="twoTone"
          color="red"
          onClick={() => handleDeleteException(row.id || '')}
          disabled={!row.id}
        >
          {t('common.delete')}
        </Button>
      ),
    },
  ];
  
  return (
    <div className={className}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="mb-4 text-lg font-semibold">
            {t('appointments.settings.exceptions.title')}
          </h4>
          <p className="text-gray-500">
            {t('appointments.settings.exceptions.description')}
          </p>
        </div>
        <Button variant="solid" color="primary" onClick={handleOpenModal}>
          {t('appointments.settings.exceptions.add')}
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <div>
          {!exceptions || exceptions.length === 0 ? (
            <Card className="p-6 text-center">
              <p>{t('appointments.settings.exceptions.no_data')}</p>
            </Card>
          ) : (
            <>
              <div className="mb-2 text-sm text-gray-500">
                Mostrando {exceptions.length} excepción(es)
              </div>
              <Table 
                columns={columns} 
                data={exceptions} 
              />
            </>
          )}
        </div>
      )}
      
      {/* Modal para agregar excepción */}
      <Dialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onRequestClose={handleCloseModal}
        width={500}
      >
        <h5 className="mb-4 text-lg font-bold">
          {t('appointments.settings.exceptions.add')}
        </h5>
        
        <div className="mb-4">
          <label className="mb-2 block">{t('appointments.settings.exceptions.select_date')}</label>
          <DatePicker
            value={newException.exception_date ? new Date(newException.exception_date) : undefined}
            onChange={(date) => {
              if (date) {
                const formatted = date.toISOString().split('T')[0];
                handleInputChange('exception_date', formatted);
              }
            }}
          />
        </div>
        
        <div className="mb-4">
          <label className="mb-2 block">{t('appointments.settings.exceptions.reason')}</label>
          <Input
            value={newException.reason || ''}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder={t('appointments.settings.exceptions.reason_placeholder')}
          />
        </div>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant={newException.is_closed ? 'solid' : 'plain'}
              color={newException.is_closed ? 'red' : 'gray'}
              onClick={() => handleToggleClosed(true)}
            >
              {t('appointments.settings.exceptions.closed')}
            </Button>
            <Button
              variant={!newException.is_closed ? 'solid' : 'plain'}
              color={!newException.is_closed ? 'green' : 'gray'}
              onClick={() => handleToggleClosed(false)}
            >
              {t('appointments.settings.exceptions.open')}
            </Button>
          </div>
        </div>
        
        {!newException.is_closed && (
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block">
                {t('appointments.settings.exceptions.open_time')}
              </label>
              <TimeInput
                value={newException.open_time || ''}
                onChange={(value) => {
                  // Cuando recibimos un valor desde TimeInput, es un objeto Date
                  // pero necesitamos convertirlo a string en formato HH:MM
                  const timeString = value 
                    ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`
                    : '00:00';
                  handleInputChange('open_time', timeString);
                }}
              />
            </div>
            <div>
              <label className="mb-2 block">
                {t('appointments.settings.exceptions.close_time')}
              </label>
              <TimeInput
                value={newException.close_time || ''}
                onChange={(value) => {
                  // Cuando recibimos un valor desde TimeInput, es un objeto Date
                  // pero necesitamos convertirlo a string en formato HH:MM
                  const timeString = value 
                    ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`
                    : '00:00';
                  handleInputChange('close_time', timeString);
                }}
              />
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="plain" onClick={handleCloseModal}>
            {t('common.cancel')}
          </Button>
          <Button 
            variant="solid" 
            color="primary" 
            onClick={handleSaveException}
            loading={saving}
          >
            {t('common.save')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default ExceptionsSettings;
