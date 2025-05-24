'use client'

/**
 * frontend/src/components/view/ChatbotBuilder/nodes/LeadQualificationNode.tsx
 * Nodo de chatbot para calificación de leads
 * 
 * @version 1.0.0
 * @updated 2025-06-11
 */

import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import Checkbox from '@/components/ui/Checkbox';
import { Select, Option } from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { PiUserGearBold, PiPlus, PiTrash } from 'react-icons/pi';
import SalesFunnelService from '@/services/SalesFunnelService';

interface QualificationQuestion {
  id: string;
  text: string;
  weight: number;
}

interface LeadQualificationNodeProps {
  id: string;
  data: {
    tenant_id: string;
    questions: QualificationQuestion[];
    high_score_threshold: number;
    medium_score_threshold: number;
    update_lead_stage: boolean;
    high_score_stage?: string;
    medium_score_stage?: string;
    low_score_stage?: string;
    onUpdateNodeData: (nodeId: string, data: any) => void;
  };
  selected: boolean;
}

/**
 * Componente para el nodo de calificación de leads
 */
const LeadQualificationNode: React.FC<LeadQualificationNodeProps> = ({ id, data, selected }) => {
  const {
    questions = [],
    high_score_threshold = 70,
    medium_score_threshold = 40,
    update_lead_stage = true,
    high_score_stage = 'opportunity',
    medium_score_stage = 'qualification',
    low_score_stage = 'prospecting',
    onUpdateNodeData
  } = data;
  
  // Manejadores para actualizar los datos del nodo
  const handleHighThresholdChange = useCallback((value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onUpdateNodeData(id, { ...data, high_score_threshold: numValue });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleMediumThresholdChange = useCallback((value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onUpdateNodeData(id, { ...data, medium_score_threshold: numValue });
    }
  }, [id, data, onUpdateNodeData]);
  
  const handleUpdateLeadStageChange = useCallback((checked: boolean) => {
    onUpdateNodeData(id, { ...data, update_lead_stage: checked });
  }, [id, data, onUpdateNodeData]);
  
  const handleHighScoreStageChange = useCallback((value: string) => {
    onUpdateNodeData(id, { ...data, high_score_stage: value });
  }, [id, data, onUpdateNodeData]);
  
  const handleMediumScoreStageChange = useCallback((value: string) => {
    onUpdateNodeData(id, { ...data, medium_score_stage: value });
  }, [id, data, onUpdateNodeData]);
  
  const handleLowScoreStageChange = useCallback((value: string) => {
    onUpdateNodeData(id, { ...data, low_score_stage: value });
  }, [id, data, onUpdateNodeData]);
  
  // Manejador para añadir una nueva pregunta
  const handleAddQuestion = useCallback(() => {
    const newQuestion = {
      id: `q${Date.now()}`,
      text: '¿Nueva pregunta?',
      weight: 10
    };
    
    onUpdateNodeData(id, {
      ...data,
      questions: [...questions, newQuestion]
    });
  }, [id, data, questions, onUpdateNodeData]);
  
  // Manejador para eliminar una pregunta
  const handleRemoveQuestion = useCallback((questionId: string) => {
    onUpdateNodeData(id, {
      ...data,
      questions: questions.filter(q => q.id !== questionId)
    });
  }, [id, data, questions, onUpdateNodeData]);
  
  // Manejador para actualizar el texto de una pregunta
  const handleQuestionTextChange = useCallback((questionId: string, text: string) => {
    onUpdateNodeData(id, {
      ...data,
      questions: questions.map(q => 
        q.id === questionId ? { ...q, text } : q
      )
    });
  }, [id, data, questions, onUpdateNodeData]);
  
  // Manejador para actualizar el peso de una pregunta
  const handleQuestionWeightChange = useCallback((questionId: string, weightStr: string) => {
    const weight = parseInt(weightStr, 10);
    if (!isNaN(weight) && weight >= 0) {
      onUpdateNodeData(id, {
        ...data,
        questions: questions.map(q => 
          q.id === questionId ? { ...q, weight } : q
        )
      });
    }
  }, [id, data, questions, onUpdateNodeData]);
  
  return (
    <div className={`node-wrapper ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="node-container">
        <div className="node-header bg-purple-500">
          <PiUserGearBold className="node-icon" />
          <div className="node-title">Calificación de Lead</div>
        </div>
        
        <div className="node-content">
          <div className="node-form">
            <div className="form-group">
              <label>Umbral puntuación alta:</label>
              <Input 
                type="number" 
                value={high_score_threshold.toString()} 
                onChange={e => handleHighThresholdChange(e.target.value)}
                min={0}
                max={100}
              />
            </div>
            
            <div className="form-group">
              <label>Umbral puntuación media:</label>
              <Input 
                type="number" 
                value={medium_score_threshold.toString()} 
                onChange={e => handleMediumThresholdChange(e.target.value)}
                min={0}
                max={100}
              />
            </div>
            
            <div className="form-group">
              <Checkbox
                checked={update_lead_stage}
                onChange={e => handleUpdateLeadStageChange(e.target.checked)}
              >
                Actualizar Etapa del Lead
              </Checkbox>
            </div>
            
            {update_lead_stage && (
              <>
                <div className="form-group ml-6">
                  <label>Etapa para puntuación alta:</label>
                  <Select
                    value={high_score_stage}
                    onChange={handleHighScoreStageChange}
                  >
                    <Option value="qualification">Calificación</Option>
                    <Option value="opportunity">Oportunidad</Option>
                    <Option value="confirmed">Confirmado</Option>
                  </Select>
                </div>
                
                <div className="form-group ml-6">
                  <label>Etapa para puntuación media:</label>
                  <Select
                    value={medium_score_stage}
                    onChange={handleMediumScoreStageChange}
                  >
                    <Option value="prospecting">Prospectando</Option>
                    <Option value="qualification">Calificación</Option>
                    <Option value="opportunity">Oportunidad</Option>
                  </Select>
                </div>
                
                <div className="form-group ml-6">
                  <label>Etapa para puntuación baja:</label>
                  <Select
                    value={low_score_stage}
                    onChange={handleLowScoreStageChange}
                  >
                    <Option value="new">Nuevo</Option>
                    <Option value="prospecting">Prospectando</Option>
                    <Option value="qualification">Calificación</Option>
                  </Select>
                </div>
              </>
            )}
            
            <div className="form-divider my-4"></div>
            
            <div className="form-group">
              <label className="flex justify-between items-center">
                <span>Preguntas de Calificación:</span>
                <button
                  className="btn-icon text-blue-500 hover:text-blue-700"
                  onClick={handleAddQuestion}
                >
                  <PiPlus className="w-4 h-4" />
                </button>
              </label>
              
              <div className="questions-list mt-2">
                {questions.map((question, index) => (
                  <div key={question.id} className="question-item p-2 border rounded mb-2">
                    <div className="flex justify-between items-start">
                      <label className="text-xs text-gray-500">Pregunta {index + 1}</label>
                      <button
                        className="btn-icon text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <PiTrash className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <Input
                      className="mt-1"
                      value={question.text}
                      onChange={e => handleQuestionTextChange(question.id, e.target.value)}
                    />
                    
                    <div className="flex items-center mt-1">
                      <label className="text-xs text-gray-500 mr-2">Peso:</label>
                      <Input
                        type="number"
                        className="w-16"
                        value={question.weight}
                        onChange={e => handleQuestionWeightChange(question.id, e.target.value)}
                        min={0}
                      />
                    </div>
                  </div>
                ))}
                
                {questions.length === 0 && (
                  <div className="text-center p-2 text-gray-500 text-sm">
                    No hay preguntas definidas. Haz clic en "+" para añadir.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} id="high" />
      <Handle type="source" position={Position.Bottom} id="medium" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="low" style={{ left: '75%' }} />
    </div>
  );
};

/**
 * Función para ejecutar el nodo en tiempo de ejecución del chatbot
 */
export async function executeLeadQualification(
  tenantId: string,
  conversationContext: any,
  nodeData: {
    questions: QualificationQuestion[];
    high_score_threshold: number;
    medium_score_threshold: number;
    update_lead_stage: boolean;
    high_score_stage?: string;
    medium_score_stage?: string;
    low_score_stage?: string;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Verificar que tenemos un lead
    if (!conversationContext.leadId) {
      return {
        nextNodeId: 'low',
        outputs: {
          message: "No puedo encontrar la información de tu perfil para ofrecerte una experiencia personalizada. ¿Te importaría si te hago algunas preguntas para conocer mejor tus necesidades?",
          context: conversationContext
        }
      };
    }
    
    // Calcular puntuación basada en respuestas a preguntas
    let totalScore = 0;
    let maxPossibleScore = 0;
    let answeredQuestions = 0;
    
    nodeData.questions.forEach(question => {
      const answer = conversationContext.answers?.[question.id];
      if (answer) {
        answeredQuestions++;
        if (answer.value === 'yes' || answer.value === true || answer.value === 1) {
          totalScore += question.weight;
        }
        maxPossibleScore += question.weight;
      }
    });
    
    // Si no hay suficientes respuestas, considerar como puntuación baja
    if (answeredQuestions < nodeData.questions.length * 0.5) {
      console.log(`Solo se han respondido ${answeredQuestions} de ${nodeData.questions.length} preguntas. Insuficiente para calificación alta.`);
    }
    
    // Normalizar puntuación a 100
    const normalizedScore = maxPossibleScore > 0 
      ? Math.round((totalScore / maxPossibleScore) * 100) 
      : 0;
    
    console.log(`Calificación del lead: ${normalizedScore}% (${totalScore}/${maxPossibleScore})`);
    
    // Determinar categoría basada en umbrales
    let qualificationLevel;
    let nextStage;
    
    if (normalizedScore >= nodeData.high_score_threshold) {
      qualificationLevel = 'high';
      nextStage = nodeData.high_score_stage || 'opportunity';
    } else if (normalizedScore >= nodeData.medium_score_threshold) {
      qualificationLevel = 'medium';
      nextStage = nodeData.medium_score_stage || 'qualification';
    } else {
      qualificationLevel = 'low';
      nextStage = nodeData.low_score_stage || 'prospecting';
    }
    
    // Actualizar etapa del lead si está habilitado
    if (nodeData.update_lead_stage) {
      const result = await SalesFunnelService.updateLeadStage(
        tenantId,
        conversationContext.leadId,
        nextStage,
        conversationContext.agent_id
      );
      
      if (!result.success) {
        console.error('Error al actualizar etapa del lead:', result.error);
      }
    }
    
    // Actualizar contexto con resultado de calificación
    const updatedContext = {
      ...conversationContext,
      leadQualification: {
        score: normalizedScore,
        level: qualificationLevel,
        newStage: nextStage,
        totalScore,
        maxPossibleScore,
        answeredQuestions
      }
    };
    
    // Determinar mensaje basado en nivel
    let message;
    switch (qualificationLevel) {
      case 'high':
        message = "Basado en tus respuestas, parece que nuestro servicio es ideal para tus necesidades. Me gustaría programar una cita para que hables con uno de nuestros especialistas. ¿Te gustaría que verifiquemos disponibilidad?";
        break;
      case 'medium':
        message = "Gracias por tus respuestas. Creo que podemos ayudarte, pero necesitaría un poco más de información. ¿Te interesaría programar una llamada con uno de nuestros asesores?";
        break;
      case 'low':
        message = "Gracias por completar nuestro cuestionario. Basado en tus respuestas, permíteme brindarte información adicional que podría ser útil para ti. ¿Hay algo específico que te gustaría conocer sobre nuestros servicios?";
        break;
    }
    
    return {
      nextNodeId: qualificationLevel,
      outputs: {
        message,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo LeadQualification:', error);
    return {
      nextNodeId: 'low',
      outputs: {
        message: "Gracias por responder nuestras preguntas. Permíteme conectarte con uno de nuestros asesores para ayudarte mejor.",
        context: conversationContext
      }
    };
  }
}

export default LeadQualificationNode;