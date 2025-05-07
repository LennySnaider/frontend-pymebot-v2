/**
 * frontend/src/components/core/VerticalComponent.tsx
 * Componente para la carga dinámica de componentes específicos de cada vertical.
 * Proporciona manejo de estados de carga, errores y fallbacks.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { Suspense, useMemo } from 'react';
import { useVerticalModule } from '@/hooks/core/useVerticalModule';

/**
 * Props para el componente VerticalComponent
 */
interface VerticalComponentProps {
  /** Código de la vertical a utilizar */
  verticalCode: string;
  
  /** Nombre del componente específico a cargar */
  componentName: string;
  
  /** Componente de fallback mientras se carga */
  fallback?: React.ReactNode;
  
  /** Props a pasar al componente cargado */
  props?: Record<string, any>;
  
  /** Función de manejo de error */
  onError?: (error: Error) => void;
  
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Componente que carga dinámicamente otros componentes desde una vertical específica
 */
export default function VerticalComponent({
  verticalCode,
  componentName,
  fallback = <DefaultFallback />,
  props = {},
  onError,
  className = '',
}: VerticalComponentProps) {
  // Usar el hook para cargar el componente dinámicamente
  const { Component, loading, error } = useVerticalModule(verticalCode, componentName);

  // Manejar errores si se proporciona un manejador
  useMemo(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Si hay un error, mostrar componente de error
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  // Si está cargando o no hay componente, mostrar fallback
  if (loading || !Component) {
    return <>{fallback}</>;
  }
  
  // Renderizar el componente con Suspense para carga diferida
  return (
    <Suspense fallback={fallback}>
      <div className={className}>
        <Component {...props} />
      </div>
    </Suspense>
  );
}

/**
 * Componente fallback por defecto durante la carga
 */
function DefaultFallback() {
  return (
    <div className="w-full h-32 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-center">
      <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

/**
 * Componente para mostrar errores
 */
function ErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-md">
      <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
        Error al cargar componente
      </h3>
      <p className="text-red-600 dark:text-red-400 text-sm">
        {error.message}
      </p>
    </div>
  );
}

/**
 * Componente contenedor para aplicar estilos específicos de la vertical
 */
export function VerticalContainer({
  verticalCode,
  children,
  className = '',
}: {
  verticalCode: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`vertical-${verticalCode} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Componente para cargar múltiples componentes de una vertical
 */
export function VerticalComponentGroup({
  verticalCode,
  components,
  containerClassName = '',
  itemClassName = '',
}: {
  verticalCode: string;
  components: Array<{name: string; props?: Record<string, any>}>;
  containerClassName?: string;
  itemClassName?: string;
}) {
  return (
    <div className={`${containerClassName}`}>
      {components.map((item, index) => (
        <div key={`${verticalCode}-${item.name}-${index}`} className={itemClassName}>
          <VerticalComponent
            verticalCode={verticalCode}
            componentName={item.name}
            props={item.props}
          />
        </div>
      ))}
    </div>
  );
}