/**
 * frontend/src/components/core/demo/DemoModeController.tsx
 * Componente para controlar el modo demo y cambiar entre planes y verticales.
 * @version 1.0.0
 * @created 2025-06-05
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Drawer, Button, Select, Switcher, Badge, Tag, Tooltip } from '@/components/ui';
import Option from '@/components/ui/Select/Option';
import { demoModeService, DEMO_PLANS, DEMO_VERTICALS } from '@/services/core/demoModeService';
import { useTenantStore } from '@/stores/core/tenantStore';
import usePermissions from '@/lib/core/permissions';

interface DemoModeControllerProps {
  children?: React.ReactNode;
}

const DemoModeController: React.FC<DemoModeControllerProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [selectedVertical, setSelectedVertical] = useState<string>('medicina');
  const [availableVerticals, setAvailableVerticals] = useState<string[]>([]);
  
  const router = useRouter();
  const { data: session } = useSession();
  const { role } = usePermissions();
  const { currentTenant } = useTenantStore();
  
  // Solo super_admin puede acceder al modo demo
  const canShowDemoPanel = role === 'super_admin';
  
  // Efecto para sincronizar estado con el servicio
  useEffect(() => {
    if (demoModeService.isEnabled !== isEnabled) {
      setIsEnabled(demoModeService.isEnabled);
    }
    
    // Actualizar verticales disponibles
    const verticals = demoModeService.getAvailableVerticals();
    setAvailableVerticals(verticals || []);
    
    // Si la vertical seleccionada no está disponible, seleccionar la primera
    if (verticals && verticals.length > 0 && !verticals.includes(selectedVertical)) {
      setSelectedVertical(verticals[0]);
    }
  }, [isEnabled, selectedPlan]);
  
  // Manejar cambio en el switch de activación
  const handleToggleDemoMode = (checked: boolean) => {
    demoModeService.toggleDemoMode(checked, role);
    setIsEnabled(checked);
    
    // Si se activa, establecer plan professional por defecto
    if (checked) {
      setSelectedPlan('professional');
      // Actualizar verticales disponibles
      const verticals = demoModeService.getAvailableVerticals();
      setAvailableVerticals(verticals || []);
      if (verticals && verticals.length > 0) {
        setSelectedVertical(verticals[0]);
      }
    }
  };
  
  // Manejar cambio de plan
  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
    demoModeService.changeDemoPlan(value as any);
    
    // Actualizar verticales disponibles
    const verticals = demoModeService.getAvailableVerticals();
    setAvailableVerticals(verticals || []);
    
    // Si la vertical seleccionada no está disponible, seleccionar la primera
    if (verticals && verticals.length > 0 && !verticals.includes(selectedVertical)) {
      setSelectedVertical(verticals[0]);
    }
  };
  
  // Manejar cambio de vertical
  const handleVerticalChange = (value: string) => {
    setSelectedVertical(value);
    if (demoModeService.changeActiveVertical(value)) {
      // Navegar a la nueva vertical
      router.push(`/vertical-${value}`);
    }
  };
  
  // Si el usuario no tiene permiso para ver el panel demo, solo mostrar el children
  if (!canShowDemoPanel) {
    return <>{children}</>;
  }
  
  // Renderizar el panel flotante y el botón para abrirlo
  return (
    <>
      {children}
      
      {/* Botón flotante para abrir el panel */}
      <Button
        className="fixed right-5 bottom-5 z-50 rounded-full"
        size="sm"
        variant={isEnabled ? "solid" : "plain"}
        color={isEnabled ? "amber" : "gray"}
        onClick={() => setIsOpen(true)}
        icon={
          <Badge content={isEnabled ? "ON" : "OFF"} color={isEnabled ? "amber" : "gray"}>
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm3-8h-2V7h-2v4H9v2h2v4h2v-4h2v-2z"/>
            </svg>
          </Badge>
        }
      >
        Demo
      </Button>
      
      {/* Panel de control */}
      <Drawer
        title="Modo Demostración"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="right"
        width={320}
      >
        <div className="p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Activar Modo Demo</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Simular diferentes planes y verticales
                </p>
              </div>
              <Switcher checked={isEnabled} onChange={handleToggleDemoMode} color="amber" />
            </div>
          </div>
          
          {isEnabled && (
            <>
              <hr className="my-4 border-t border-gray-200 dark:border-gray-700" />
              
              {/* Selector de Plan */}
              <div className="mb-6">
                <h5 className="font-medium mb-2">Plan</h5>
                <Select
                  value={selectedPlan}
                  className="w-full"
                  onChange={handlePlanChange}
                  size="sm"
                >
                  {Object.entries(DEMO_PLANS).map(([key, plan]) => (
                    <option value={key} key={key}>
                      {plan.name}
                    </option>
                  ))}
                </Select>
                
                {/* Detalles del plan seleccionado */}
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedPlan && DEMO_PLANS[selectedPlan]?.limits && (
                      <>
                        <Tag>
                          {DEMO_PLANS[selectedPlan].limits?.users} Usuarios
                        </Tag>
                        <Tag>
                          {DEMO_PLANS[selectedPlan].limits?.storage} GB
                        </Tag>
                        <Tag>
                          {DEMO_PLANS[selectedPlan].limits?.tokens} Tokens
                        </Tag>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Selector de Vertical */}
              <div className="mb-6">
                <h5 className="font-medium mb-2">Vertical</h5>
                <Select
                  value={selectedVertical}
                  className="w-full"
                  onChange={handleVerticalChange}
                  size="sm"
                  disabled={availableVerticals.length === 0}
                >
                  {availableVerticals.map((vertical) => (
                    <option value={vertical} key={vertical}>
                      {vertical.charAt(0).toUpperCase() + vertical.slice(1)}
                    </option>
                  ))}
                </Select>
                
                {/* Módulos disponibles en esta vertical */}
                <div className="mt-2">
                  <h6 className="text-xs text-gray-500 mb-1">Módulos disponibles:</h6>
                  <div className="flex flex-wrap gap-1">
                    {selectedVertical && DEMO_VERTICALS[selectedVertical]?.map((module) => {
                      // Verificar si el módulo está habilitado según el plan
                      const isEnabled = DEMO_PLANS[selectedPlan]?.features.some(feature => 
                        feature === `feature_${module}` || 
                        feature === `feature_${module}_basic` ||
                        feature === `feature_${module}_advanced`
                      );
                      
                      return (
                        <Tooltip title={isEnabled ? "Habilitado" : "No disponible en este plan"} key={module}>
                          <Tag color={isEnabled ? "emerald" : "gray"}>
                            {module}
                          </Tag>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <hr className="my-4 border-t border-gray-200 dark:border-gray-700" />
              
              {/* Plan actual */}
              <div>
                <h5 className="font-medium mb-2">Estado Actual</h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {isEnabled ? (
                    <>
                      <span className="font-medium">Modo Demo Activo</span>
                      <br />
                      <span>Plan: {DEMO_PLANS[selectedPlan]?.name}</span>
                      <br />
                      <span>Vertical: {selectedVertical}</span>
                    </>
                  ) : (
                    "Modo Demo Desactivado"
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </Drawer>
    </>
  );
};

export default DemoModeController;