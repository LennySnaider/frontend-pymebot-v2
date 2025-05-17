/**
 * frontend/src/app/api/chatbot/conversation/conversation-types.ts
 * Definiciones de tipos para conversaciones en el chatbot
 * @version 1.0.0
 * @updated 2025-04-08
 */

/**
 * Estados posibles para una sesión de conversación
 */
export enum SessionStatus {
    // Sesión activa, esperando mensaje del usuario o procesando uno
    ACTIVE = 'active',
    
    // Bot está esperando una entrada específica del usuario
    WAITING_INPUT = 'waiting_input',
    
    // Conversación completada normalmente
    COMPLETED = 'completed',
    
    // Sesión finalizada por tiempo de inactividad
    EXPIRED = 'expired',
    
    // Error durante el procesamiento
    FAILED = 'failed',
    
    // Conversación transferida a un agente o sistema externo
    TRANSFERRED = 'transferred'
}

/**
 * Tipos de contenido en los mensajes
 */
export enum ContentType {
    // Texto plano
    TEXT = 'text',
    
    // Imagen (base64 o URL)
    IMAGE = 'image',
    
    // Audio (base64 o URL)
    AUDIO = 'audio',
    
    // Video (base64 o URL)
    VIDEO = 'video',
    
    // Documento (PDF, DOCX, etc.)
    DOCUMENT = 'document',
    
    // Mensaje del sistema (no mostrado al usuario)
    SYSTEM = 'system',
    
    // Botones de selección
    BUTTONS = 'buttons',
    
    // Lista de selección
    LIST = 'list',
    
    // Ubicación (coordenadas)
    LOCATION = 'location',
    
    // Contacto
    CONTACT = 'contact'
}

/**
 * Tipo de transferencia para sesiones
 */
export enum TransferType {
    // Transferencia a un agente humano
    AGENT = 'agent',
    
    // Transferencia a otro sistema
    SYSTEM = 'system'
}

/**
 * Tipos de nodos en el flujo del chatbot
 */
export enum ChatbotNodeType {
    // Nodo inicial
    START = 'start',
    
    // Respuesta de texto estática
    TEXT = 'text',
    
    // Captura de datos del usuario
    INPUT = 'input',
    
    // Respuesta generada por IA
    AI = 'ai',
    
    // Decisión condicional
    CONDITIONAL = 'conditional',
    
    // Acción (API, funciones, etc.)
    ACTION = 'action',
    
    // Enrutador a otro flujo
    ROUTER = 'router',
    
    // Salida de texto a voz
    TTS = 'tts',
    
    // Entrada de voz a texto
    STT = 'stt',
    
    // Finalización del flujo
    END = 'end'
}

/**
 * Tipos de acciones en nodos de acción
 */
export enum ActionType {
    // Consulta a API externa
    API_CALL = 'api_call',
    
    // Actualizar la etapa de un lead
    UPDATE_LEAD = 'update_lead',
    
    // Crear una cita
    CREATE_APPOINTMENT = 'create_appointment',
    
    // Obtener disponibilidad para citas
    GET_AVAILABILITY = 'get_availability',
    
    // Crear o actualizar un contacto
    UPDATE_CONTACT = 'update_contact',
    
    // Enviar mensaje a webhook externo
    WEBHOOK = 'webhook',
    
    // Guardar datos en la base de datos
    DB_SAVE = 'db_save',
    
    // Ejecutar código personalizado
    CUSTOM_CODE = 'custom_code',
    
    // Enviar notificación
    NOTIFICATION = 'notification'
}

/**
 * Interfaz para mensajes en formato unificado (independiente del canal)
 */
export interface UnifiedMessage {
    // ID único del mensaje
    id?: string;
    
    // ID de la sesión de conversación
    sessionId: string;
    
    // ID del usuario/cliente
    userId: string;
    
    // Contenido del mensaje
    content: string;
    
    // Tipo de contenido
    contentType: ContentType;
    
    // Indica si proviene del usuario (true) o del bot (false)
    isFromUser: boolean;
    
    // ID del nodo que generó el mensaje (solo para mensajes del bot)
    nodeId?: string;
    
    // Timestamp de creación
    timestamp: string;
    
    // Datos adicionales específicos del tipo de mensaje
    metadata?: Record<string, any>;
}

/**
 * Interfaz para datos específicos de nodos de mensaje
 */
export interface MessageNodeData {
    // Mensaje a mostrar al usuario
    message: string;
    
    // Si true, el flujo se detiene esperando respuesta del usuario
    // Si false, el flujo continúa automáticamente al siguiente nodo (auto-flow)
    waitForResponse?: boolean;
    
    // Tiempo de espera antes de mostrar el mensaje (en segundos)
    delay?: number;
    
    // Etiqueta descriptiva del nodo
    label?: string;
    
    // Otras propiedades opcionales específicas del tipo de mensaje
    [key: string]: any;
}

/**
 * Interfaz para configuración de un nodo del chatbot
 */
export interface ChatbotNodeConfig {
    // ID único del nodo
    id: string;
    
    // Tipo de nodo
    type: ChatbotNodeType;
    
    // Título descriptivo del nodo
    title: string;
    
    // Datos de configuración específicos del tipo de nodo
    // Para nodos de mensajes, incluyendo TEXT y messageNode, debería incluir waitForResponse
    data: Record<string, any>;
    
    // Conexiones a otros nodos
    connections: {
        [key: string]: string; // { "next": "node_id", "yes": "node_id", "no": "node_id" }
    };
    
    // Posición en el editor visual
    position?: {
        x: number;
        y: number;
    };
}

/**
 * Interfaz para eventos del sistema del chatbot
 */
export interface ChatbotSystemEvent {
    // Tipo de evento
    type: 'session_start' | 'session_end' | 'transfer' | 'error' | 'timeout' | 'webhook';
    
    // ID de la sesión relacionada
    sessionId: string;
    
    // ID del tenant
    tenantId: string;
    
    // Timestamp del evento
    timestamp: string;
    
    // Datos específicos del evento
    data: Record<string, any>;
}

/**
 * Interfaz para representar una acción del usuario
 */
export interface UserAction {
    // Tipo de acción
    type: 'message' | 'button_click' | 'list_select' | 'upload' | 'location' | 'voice';
    
    // Valor o contenido de la acción
    value: string | Record<string, any>;
    
    // Metadatos adicionales
    metadata?: Record<string, any>;
}

/**
 * Interfaz para representar una sesión de conversación
 * Adaptada para coincidir con el esquema de base de datos verificado
 */
export interface ConversationSession {
    id: string
    user_channel_id: string
    channel_type: string
    session_id: string
    tenant_id: string
    active_chatbot_activation_id?: string
    current_node_id?: string
    state_data?: Record<string, any>
    status: string
    last_interaction_at: string
    created_at: string
    metadata?: Record<string, any>
}