/**
 * frontend/src/utils/nodeExecutors/leadQualificationExecutor.ts
 * Función de ejecución para LeadQualificationNode
 * @version 1.0.0
 * @migrated 2025-05-22 - Extraído desde components/view/ChatbotBuilder/nodes/LeadQualificationNode.tsx
 */

export async function executeLeadQualification(
  tenantId: string,
  conversationContext: any,
  nodeData: {
    qualification_questions?: string[];
    scoring_criteria?: any;
    threshold_score?: number;
  }
): Promise<{ nextNodeId: string; outputs: any; }> {
  try {
    // Obtener respuestas del contexto
    const responses = conversationContext.qualificationResponses || {};
    
    // Calcular puntuación basada en respuestas
    let score = 0;
    let maxScore = 0;
    
    const questions = nodeData.qualification_questions || [
      '¿Cuál es tu presupuesto aproximado?',
      '¿En qué plazo necesitas una solución?',
      '¿Tienes autoridad para tomar decisiones de compra?',
      '¿Qué tan urgente es tu necesidad?'
    ];
    
    // Scoring simple basado en palabras clave
    questions.forEach((question, index) => {
      maxScore += 10;
      const response = responses[`q${index}`] || '';
      
      // Lógica de scoring básica
      if (response.toLowerCase().includes('urgente') || response.toLowerCase().includes('inmediato')) {
        score += 10;
      } else if (response.toLowerCase().includes('mes') || response.toLowerCase().includes('pronto')) {
        score += 7;
      } else if (response.toLowerCase().includes('evaluar') || response.toLowerCase().includes('considerar')) {
        score += 5;
      } else if (response.length > 10) {
        score += 3;
      }
    });
    
    const scorePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const threshold = nodeData.threshold_score || 60;
    const isQualified = scorePercentage >= threshold;
    
    const updatedContext = {
      ...conversationContext,
      leadScore: scorePercentage,
      isQualified,
      qualificationComplete: true,
      qualificationDate: new Date().toISOString()
    };
    
    const message = isQualified
      ? `✅ Excelente! Basado en tus respuestas, creemos que podemos ayudarte de manera efectiva.\n\nPuntuación de calificación: ${scorePercentage}%\n\n¿Te gustaría programar una llamada para discutir tu proyecto en detalle?`
      : `📝 Gracias por responder nuestras preguntas.\n\nPuntuación de calificación: ${scorePercentage}%\n\nTe enviaremos información adicional por email y nos pondremos en contacto contigo pronto.`;
    
    return {
      nextNodeId: isQualified ? 'qualified' : 'not_qualified',
      outputs: {
        message,
        context: updatedContext
      }
    };
  } catch (error) {
    console.error('Error en nodo LeadQualification:', error);
    return {
      nextNodeId: 'error',
      outputs: {
        message: "Lo siento, hubo un problema procesando tu información. Por favor, contacta directamente con nosotros.",
        context: conversationContext
      }
    };
  }
}