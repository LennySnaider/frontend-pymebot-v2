/**
 * components/common/PropertySelector.tsx
 * 
 * Componente de selector de propiedades genérico y multitenant.
 * Permite seleccionar propiedades para cualquier tenant, con fallback
 * automático a propiedades destacadas o ejemplos si es necesario.
 * 
 * @version 1.0.0
 * @created 2025-05-20
 */

import React, { useEffect, useState } from 'react';
import { Select, Skeleton, Spin, message } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import PropertyService from '@/services/PropertyService';

interface PropertyOption {
  value: string;
  label: string;
  property: any;
}

interface PropertySelectorProps {
  value?: string;
  onChange?: (value: string, property?: any) => void;
  tenantId?: string;
  propertyType?: string;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  showError?: boolean;
  allowClear?: boolean;
  defaultFirst?: boolean;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({
  value,
  onChange,
  tenantId,
  propertyType = 'house',
  placeholder = 'Seleccionar propiedad',
  style,
  className,
  disabled = false,
  loading: externalLoading = false,
  showError = true,
  allowClear = false,
  defaultFirst = true
}) => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar el tenant del usuario autenticado si no se proporciona uno específico
  const effectiveTenantId = tenantId || user?.tenant_id;

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!effectiveTenantId) {
          setError('No se pudo determinar el tenant');
          setLoading(false);
          return;
        }

        // Primero intentar cargar propiedades normales
        const { success, data, error: apiError } = await PropertyService.apiGetProperties(1, 20, {
          tenant_id: effectiveTenantId,
          property_type: propertyType,
          is_active: true
        });

        if (success && data && data.properties && data.properties.length > 0) {
          // Mapear propiedades a opciones para el Select
          const options = data.properties.map(prop => ({
            value: prop.id,
            label: prop.title || `${prop.property_type || 'Propiedad'} ${prop.id.substring(0, 4)}`,
            property: prop
          }));
          
          setProperties(options);
          
          // Seleccionar la primera propiedad por defecto si no hay valor seleccionado
          if (defaultFirst && !value && options.length > 0 && onChange) {
            onChange(options[0].value, options[0].property);
          }
          
          setLoading(false);
          return;
        }

        // Si no hay propiedades o hay error, intentar obtener una propiedad destacada
        const featuredResult = await PropertyService.apiGetFeaturedProperty(effectiveTenantId, propertyType);
        
        if (featuredResult.success && featuredResult.data) {
          const property = featuredResult.data;
          const options = [{
            value: property.id,
            label: property.title || `${property.property_type || 'Propiedad'} ${property.id.substring(0, 4)}`,
            property: property
          }];
          
          setProperties(options);
          
          // Seleccionar esta propiedad por defecto si no hay valor seleccionado
          if (defaultFirst && !value && onChange) {
            onChange(options[0].value, options[0].property);
          }
        } else {
          if (showError) {
            message.warning('No se encontraron propiedades disponibles');
          }
          setError('No se encontraron propiedades');
        }
      } catch (err) {
        console.error('Error al cargar propiedades:', err);
        setError('Error al cargar propiedades');
        if (showError) {
          message.error('Error al cargar propiedades');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [effectiveTenantId, propertyType, defaultFirst, onChange, value, showError]);

  const handleChange = (propertyId: string) => {
    const selectedProperty = properties.find(p => p.value === propertyId);
    if (onChange) {
      onChange(propertyId, selectedProperty?.property);
    }
  };

  // Si está cargando, mostrar un esqueleto
  if (loading || externalLoading) {
    return (
      <div style={{ ...style, minWidth: '200px' }}>
        <Skeleton.Input active style={{ width: '100%' }} />
      </div>
    );
  }

  // Si hay un error y no hay propiedades, mostrar un Select deshabilitado con mensaje
  if (error && properties.length === 0) {
    return (
      <Select
        placeholder={error}
        disabled={true}
        style={{ ...style, minWidth: '200px' }}
        className={className}
      />
    );
  }

  return (
    <Select
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      style={{ ...style, minWidth: '200px' }}
      className={className}
      disabled={disabled || properties.length === 0}
      loading={loading}
      allowClear={allowClear}
      showSearch
      optionFilterProp="label"
      notFoundContent={
        loading ? <Spin size="small" /> : 'No se encontraron propiedades'
      }
      options={properties}
    />
  );
};

export default PropertySelector;