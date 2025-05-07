/**
 * frontend/src/app/(protected-pages)/modules/appointments/_components/ui/StepIndicator.tsx
 * Componente para mostrar indicadores de progreso en flujos multi-paso con diseño minimalista.
 * 
 * @version 1.2.0
 * @updated 2025-04-28
 */

import React from 'react';

interface StepIndicatorProps {
    step: number;
    currentStep: number;
    totalSteps: number;
}

/**
 * Indicador visual de progreso para flujos de trabajo multi-paso
 * Diseño simplificado con círculos numerados y líneas conectoras
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({ 
    step, 
    currentStep, 
    totalSteps 
}) => {
    // El diseño actual siempre muestra solo 2 pasos en la barra de progreso
    // independientemente del totalSteps real
    const isActive = step === currentStep;
    const isCompleted = step < currentStep;
    
    return (
        <div className="flex items-center justify-center">
            {/* Indicador de paso (círculo) */}
            <div 
                className={`w-7 h-7 flex items-center justify-center rounded-full 
                    transition-colors duration-200
                    ${isActive 
                        ? 'bg-blue-600 text-white' 
                        : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-500'}`}
            >
                {step}
            </div>
            
            {/* Línea conectora (excepto para el último paso) */}
            {step < 2 && (
                <div className={`h-px w-12 mx-1 bg-gray-200`} />
            )}
        </div>
    );
};

export default StepIndicator;