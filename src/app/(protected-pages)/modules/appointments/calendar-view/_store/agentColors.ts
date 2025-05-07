/**
 * frontend/src/app/(protected-pages)/modules/appointments/calendar-view/_store/agentColors.ts
 * Utilidad para asignar colores consistentes a los agentes en el calendario.
 *
 * @version 1.0.0
 * @updated 2025-04-20
 */

// Paleta de colores para los agentes
// Colores exactos de la plantilla ECME
const AGENT_COLOR_PALETTE = [
    '#bce9fb', // Azul claro
    '#bee9d3', // Verde claro
    '#ccbbfc', // Lila
    '#fbddd9', // Rosa claro
    '#ffc6ab', // Melocotón
    '#ffd993', // Amarillo
    '#ebebeb', // Gris claro
    // Segunda ronda de colores con variaciones de opacidad
    '#aee0f5', // Azul claro variante
    '#aee0c5', // Verde claro variante
    '#c0aef8', // Lila variante
    '#f7c8c4', // Rosa claro variante
    '#f7b99e', // Melocotón variante
    '#f7cf85', // Amarillo variante
    '#dddddd', // Gris claro variante
]

// Caché para mantener la asignación de colores consistente
const colorCache: Record<string, string> = {}
let colorIndex = 0

/**
 * Obtiene un color para un agente específico.
 * El mismo agente siempre obtendrá el mismo color durante la sesión.
 *
 * @param agentId - ID del agente
 * @returns Color en formato hexadecimal
 */
export function getAgentColor(agentId: string): string {
    // Si el agente ya tiene un color asignado, devolver ese
    if (colorCache[agentId]) {
        return colorCache[agentId]
    }

    // Asignar un nuevo color desde la paleta
    const color = AGENT_COLOR_PALETTE[colorIndex % AGENT_COLOR_PALETTE.length]
    colorIndex++

    // Guardar en caché para uso futuro
    colorCache[agentId] = color

    return color
}

/**
 * Obtiene todos los colores actualmente asignados a agentes
 *
 * @returns Registro de id de agente a color
 */
export function getAllAgentColors(): Record<string, string> {
    return { ...colorCache }
}

/**
 * Restablece la caché de colores
 */
export function resetAgentColors(): void {
    Object.keys(colorCache).forEach((key) => {
        delete colorCache[key]
    })
    colorIndex = 0
}

export default {
    getAgentColor,
    getAllAgentColors,
    resetAgentColors,
}
