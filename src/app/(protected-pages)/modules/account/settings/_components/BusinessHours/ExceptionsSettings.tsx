'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Dialog, Input, DatePicker, TimeInput, Notification, toast } from '@/components/ui';
import Table from '@/components/ui/Table';
import { Tr, Th, Td, THead, TBody } from '@/components/ui/Table';
import Tag from '@/components/ui/Tag';
import { DateException } from './types';

// Función temporal para traducciones mientras solucionamos el problema
const mockTranslation = (key: string) => {
  const translations: Record<string, string> = {
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'appointments.settings.fetch_error': 'Error al obtener las excepciones',
    'appointments.settings.save_error': 'Error al guardar la excepción',
    'appointments.settings.exceptions.title': 'Excepciones de Horario',
    'appointments.settings.exceptions.description': 'Configure días especiales como feriados o días con horarios diferentes.',
    'appointments.settings.exceptions.add': 'Añadir Excepción',
    'appointments.settings.exceptions.date': 'Fecha',
    'appointments.settings.exceptions.status': 'Estado',
    'appointments.settings.exceptions.hours': 'Horario',
    'appointments.settings.exceptions.reason': 'Motivo',
    'appointments.settings.exceptions.no_data': 'No hay excepciones configuradas',
    'appointments.settings.exceptions.select_date': 'Seleccionar fecha',
    'appointments.settings.exceptions.reason_placeholder': 'Ej. Día festivo, Evento especial',
    'appointments.settings.exceptions.closed': 'Cerrado',
    'appointments.settings.exceptions.open': 'Horario especial',
    'appointments.settings.exceptions.open_time': 'Hora de apertura',
    'appointments.settings.exceptions.close_time': 'Hora de cierre',
    'appointments.settings.exceptions.date_required': 'La fecha es obligatoria',
    'appointments.settings.exceptions.hours_required': 'Los horarios son obligatorios si está abierto',
    'appointments.settings.exceptions.save_success': 'Excepción guardada con éxito',
    'appointments.settings.exceptions.delete_success': 'Excepción eliminada con éxito',
    'appointments.settings.exceptions.delete_error': 'Error al eliminar la excepción'
  };
  
  return translations[key] || key.split('.').pop() || key;
};

const ExceptionsSettings = () => {
  const t = mockTranslation;
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<DateException[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    fetchExceptions();
  }, []);
  
  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business/hours/exceptions');
      
      if (!response.ok) {
        toast.push(
          <Notification title={t('common.error')} type="danger">
            {t('appointments.settings.fetch_error')}
          </Notification>
        );
        throw new Error('Error al obtener excepciones');
      }
      
      const data = await response.json();
      
      // Asegurarnos que tenemos un array, incluso si es vacío
      const exceptionsArray = Array.isArray(data) ? data : [];
      
      if (exceptionsArray.length > 0) {
        // Asegurarnos que los campos open_time y close_time estén formateados correctamente
        const formattedExceptions = exceptionsArray.map(exception => {
          // Si open_time tiene formato HH:MM:SS, convertirlo a HH:MM
          const open_time = exception.open_time ? 
            exception.open_time.substring(0, 5) : 
            exception.open_time;
            
          // Si close_time tiene formato HH:MM:SS, convertirlo a HH:MM
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
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar excepciones:', error);
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
      
      const response = await fetch('/api/business/hours/exceptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newException),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar excepción');
      }
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.settings.exceptions.save_success')}
        </Notification>
      );
      
      // Cerrar modal y recargar datos
      handleCloseModal();
      fetchExceptions();
    } catch (error: any) {
      console.error('Error al guardar excepción:', error);
      toast.push(
        <Notification title={t('common.error')} type="danger">
          {error.message || t('appointments.settings.save_error')}
        </Notification>
      );
    }
  };
  
  const handleDeleteException = async (id: string) => {
    try {
      const response = await fetch(`/api/business/hours/exceptions?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar excepción');
      }
      
      toast.push(
        <Notification title={t('common.success')} type="success">
          {t('appointments.settings.exceptions.delete_success')}
        </Notification>
      );
      
      // Recargar datos
      fetchExceptions();
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
      // Verificar si es una fecha válida
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
        const isClosed = row.is_closed === true || row.is_closed === 'true';
        return isClosed ? (
          <Tag className="text-red-600 bg-red-100 dark:text-red-100 dark:bg-red-500/20 border-0">
            {t('appointments.settings.exceptions.closed')}
          </Tag>
        ) : (
          <Tag className="text-emerald-600 bg-emerald-100 dark:text-emerald-100 dark:bg-emerald-500/20 border-0">
            {t('appointments.settings.exceptions.open')}
          </Tag>
        );
      },
    },
    {
      key: 'hours',
      title: t('appointments.settings.exceptions.hours'),
      render: (_, row: DateException) => {
        // Asegurar que is_closed se trate tanto como boolean como string
        const isClosed = row.is_closed === true || row.is_closed === 'true';
        
        // Si está cerrado, mostrar un guion
        if (isClosed) {
          return <span>-</span>;
        }
        
        // Formatear las horas (quitar segundos si existen)
        const openTime = row.open_time ? row.open_time.substring(0, 5) : '-';
        const closeTime = row.close_time ? row.close_time.substring(0, 5) : '-';
        
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
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="mb-4 text-lg font-semibold">
            {t('appointments.settings.exceptions.title')}
          </h4>
          <p className="text-gray-500">
            {t('appointments.settings.exceptions.description')}
          </p>
        </div>
        <Button 
          variant="solid" 
          color="primary" 
          onClick={handleOpenModal}
        >
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
            <div className="w-full overflow-x-auto">
              <Table>
                <THead>
                  <Tr>
                    {columns.map((column, idx) => (
                      <Th key={idx}>
                        {column.title}
                      </Th>
                    ))}
                  </Tr>
                </THead>
                <TBody>
                  {exceptions.map((row, rowIndex) => (
                    <Tr key={row.id || rowIndex}>
                      {columns.map((column, colIndex) => (
                        <Td key={`${rowIndex}-${colIndex}`}>
                          {column.render ? column.render('', row) : row[column.key as keyof DateException]}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
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
          <Button 
            variant="plain" 
            onClick={handleCloseModal}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            variant="solid" 
            color="primary" 
            onClick={handleSaveException}
          >
            {t('common.save')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
};

export default ExceptionsSettings;