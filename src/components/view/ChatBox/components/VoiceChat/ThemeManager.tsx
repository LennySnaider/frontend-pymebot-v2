/**
 * frontend/src/components/view/ChatBox/components/VoiceChat/ThemeManager.tsx
 * Componente para la gestión de temas y colores del VoiceChat
 * @version 1.0.0
 * @updated 2025-04-28
 */

'use client'

import { useMemo } from 'react'

// Tipos para el tema de color
export interface ThemeColors {
    bg: string
    button: {
        primary: string
        secondary: string
    }
    text: string
    border: string
    lightBg: string
    visualizer: string
    customColors: {
        primary: string
        secondary: string
        text: string
        button: string
    } | null
}

// Props para el hook
interface ThemeManagerProps {
    primaryColor?: string
    secondaryColor?: string
    textColor?: string
    buttonColor?: string
    uiStyle?: 'modern_green' | 'modern_blue' | 'classic' | 'minimal'
}

// Hook para manejar los temas de color
export const useThemeManager = ({
    primaryColor,
    secondaryColor,
    textColor,
    buttonColor,
    uiStyle = 'modern_green'
}: ThemeManagerProps): ThemeColors => {
    // Calcular el tema basado en los colores personalizados o el estilo de UI
    return useMemo(() => {
        // Si se proporcionan colores personalizados, crear un tema con ellos
        if (primaryColor || secondaryColor || textColor || buttonColor) {
            // Crear un objeto de estilo personalizado con manejo consistente
            return {
                // Clases de Tailwind se dejan vacías para usar estilos inline cuando hay colores personalizados
                bg: '',
                button: {
                    primary: '',
                    secondary: '',
                },
                text: '',
                border: 'border',
                lightBg: '',
                visualizer: '',
                // Guardar los colores personalizados para uso inline
                customColors: {
                    primary: primaryColor || '#047857', // emerald-900 equivalente
                    secondary: secondaryColor || '#065f46', // emerald-800 equivalente
                    text: textColor || '#ffffff',
                    button: buttonColor || '#4ade80', // green-400 equivalente
                },
            }
        }

        // Si no hay colores personalizados, usar los temas predefinidos
        switch (uiStyle) {
            case 'modern_green':
                return {
                    bg: 'bg-emerald-900',
                    button: {
                        primary: 'bg-green-400 hover:bg-green-500',
                        secondary: 'bg-gray-800 hover:bg-gray-700',
                    },
                    text: 'text-white',
                    border: 'border-emerald-800',
                    lightBg: 'bg-emerald-800/50',
                    visualizer: 'bg-green-400', // Color de la visualización
                    customColors: null,
                }
            case 'modern_blue':
                return {
                    bg: 'bg-blue-900',
                    button: {
                        primary: 'bg-blue-400 hover:bg-blue-500',
                        secondary: 'bg-gray-800 hover:bg-gray-700',
                    },
                    text: 'text-white',
                    border: 'border-blue-800',
                    lightBg: 'bg-blue-800/50',
                    visualizer: 'bg-blue-400',
                    customColors: null,
                }
            case 'classic':
                return {
                    bg: 'bg-gray-100',
                    button: {
                        primary: 'bg-blue-500 hover:bg-blue-600',
                        secondary: 'bg-gray-300 hover:bg-gray-400',
                    },
                    text: 'text-gray-900',
                    border: 'border-gray-300',
                    lightBg: 'bg-gray-200/50',
                    visualizer: 'bg-blue-500',
                    customColors: null,
                }
            case 'minimal':
                return {
                    bg: 'bg-white',
                    button: {
                        primary: 'bg-black hover:bg-gray-800',
                        secondary: 'bg-gray-200 hover:bg-gray-300',
                    },
                    text: 'text-black',
                    border: 'border-gray-200',
                    lightBg: 'bg-gray-100/50',
                    visualizer: 'bg-black',
                    customColors: null,
                }
            default:
                return {
                    bg: 'bg-emerald-900',
                    button: {
                        primary: 'bg-green-400 hover:bg-green-500',
                        secondary: 'bg-gray-800 hover:bg-gray-700',
                    },
                    text: 'text-white',
                    border: 'border-emerald-800',
                    lightBg: 'bg-emerald-800/50',
                    visualizer: 'bg-green-400',
                    customColors: null,
                }
        }
    }, [primaryColor, secondaryColor, textColor, buttonColor, uiStyle])
}
