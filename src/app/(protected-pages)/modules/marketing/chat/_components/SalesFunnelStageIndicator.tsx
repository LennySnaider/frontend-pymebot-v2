/**
 * Indicador de etapa del sales funnel en el chat
 * Muestra la etapa actual del lead con colores sincronizados
 * @version 1.0.0
 * @created 2025-05-17
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SALES_FUNNEL_STAGES, getStageById } from '@/app/(protected-pages)/superadmin/chatbot-builder/editor/types/salesFunnelIntegration';

interface SalesFunnelStageIndicatorProps {
  currentStageId?: string;
  className?: string;
  showProgress?: boolean;
  animated?: boolean;
}

const SalesFunnelStageIndicator: React.FC<SalesFunnelStageIndicatorProps> = ({
  currentStageId,
  className = '',
  showProgress = true,
  animated = true
}) => {
  const [prevStageId, setPrevStageId] = useState(currentStageId);
  const currentStage = currentStageId ? getStageById(currentStageId) : null;
  
  useEffect(() => {
    if (currentStageId !== prevStageId) {
      setPrevStageId(currentStageId);
    }
  }, [currentStageId, prevStageId]);

  if (!currentStage) return null;

  const progressPercent = ((currentStage.order / SALES_FUNNEL_STAGES.length) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Etapa del Lead:
        </span>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStageId}
            initial={animated ? { scale: 0.8, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={animated ? { scale: 0.8, opacity: 0 } : false}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentStage.color }}
            />
            <span 
              className="text-sm font-medium px-2 py-0.5 rounded-full"
              style={{ 
                backgroundColor: `${currentStage.color}20`,
                color: currentStage.color 
              }}
            >
              {currentStage.name}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {showProgress && (
        <div className="relative">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                backgroundColor: currentStage.color,
                width: animated ? `${progressPercent}%` : `${progressPercent}%`
              }}
              initial={animated ? { width: 0 } : false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          
          <div className="flex justify-between mt-1">
            {SALES_FUNNEL_STAGES.map((stage, index) => (
              <div
                key={stage.id}
                className={`flex flex-col items-center ${
                  stage.order <= currentStage.order ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    stage.order <= currentStage.order ? 'scale-110' : 'scale-90'
                  }`}
                  style={{
                    backgroundColor: stage.order <= currentStage.order ? stage.color : '#D1D5DB'
                  }}
                />
                <span className="text-xs mt-1 hidden sm:block">
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Mini version para espacios reducidos
export const SalesFunnelStageBadge: React.FC<SalesFunnelStageIndicatorProps> = ({
  currentStageId,
  className = ''
}) => {
  const currentStage = currentStageId ? getStageById(currentStageId) : null;
  
  if (!currentStage) return null;
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ 
        backgroundColor: `${currentStage.color}15`,
        color: currentStage.color,
        border: `1px solid ${currentStage.color}40`
      }}
    >
      <div 
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: currentStage.color }}
      />
      {currentStage.name}
    </div>
  );
};

export default SalesFunnelStageIndicator;