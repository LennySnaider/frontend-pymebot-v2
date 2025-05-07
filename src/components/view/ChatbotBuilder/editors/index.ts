/**
 * agentprop/src/components/view/ChatbotBuilder/editors/index.ts
 * Exportación de todos los editores de nodos para el constructor de chatbot
 * @version 1.0.0
 * @created 2025-10-04
 */

import TextNodeEditor from './TextNodeEditor'
import AINodeEditor from './AINodeEditor'
import ConditionalNodeEditor from './ConditionalNodeEditor'
import VariableEnabledTextArea from './VariableEnabledTextArea'

export {
    TextNodeEditor,
    AINodeEditor,
    ConditionalNodeEditor,
    VariableEnabledTextArea
}

// Mapping de tipos de nodos a componentes de editor
export const nodeEditors = {
    text: TextNodeEditor,
    message: TextNodeEditor,
    ai: AINodeEditor,
    ai_response: AINodeEditor,
    conditional: ConditionalNodeEditor,
    condition: ConditionalNodeEditor
}
