/**
 * frontend/src/components/view/ChatBox/components/VoiceChat/AudioVisualization.tsx
 * Componente para mostrar visualizaciones de audio en el VoiceChat
 * @version 1.0.0
 * @updated 2025-04-28
 */

'use client'

import React from 'react'
import classNames from '@/utils/classNames'

interface ThemeColors {
    visualizer: string
    lightBg: string
    customColors: {
        button: string
        secondary: string
    } | null
}

interface AudioVisualizationProps {
    type: 'waveform' | 'equalizer' | 'circle_pulse' | 'none'
    isRecording: boolean
    isPlaying: boolean
    theme: ThemeColors
}

const AudioVisualization: React.FC<AudioVisualizationProps> = ({
    type,
    isRecording,
    isPlaying,
    theme
}) => {
    // Renderizar la visualización de audio según el tipo seleccionado
    switch (type) {
        case 'waveform':
            return (
                <div className="flex items-center justify-center space-x-1 h-16 px-2">
                    {[...Array(15)].map((_, i) => {
                        // Crear un objeto de estilo combinado para evitar duplicación
                        const barStyle = {
                            animationDelay: `${i * 0.07}s`,
                            ...(theme.customColors
                                ? {
                                    backgroundColor:
                                        theme.customColors.button,
                                }
                                : {}),
                        }

                        return (
                            <div
                                key={i}
                                className={classNames(
                                    'w-1.5 rounded-full',
                                    theme.customColors
                                        ? ''
                                        : theme.visualizer,
                                    isRecording
                                        ? 'recording-bar'
                                        : isPlaying
                                            ? 'playing-bar'
                                            : 'h-1 opacity-40',
                                )}
                                style={barStyle}
                            />
                        )
                    })}
                </div>
            )
            
        case 'equalizer':
            return (
                <div className="flex items-end justify-center space-x-1 h-16 px-2">
                    {[...Array(12)].map((_, i) => {
                        const barStyle = {
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: `${0.8 + Math.random() * 0.6}s`,
                            ...(theme.customColors
                                ? {
                                    backgroundColor:
                                        theme.customColors.button,
                                }
                                : {}),
                        }

                        return (
                            <div
                                key={i}
                                className={classNames(
                                    'w-2 rounded-t-sm',
                                    theme.customColors
                                        ? ''
                                        : theme.visualizer,
                                    isRecording
                                        ? 'equalizer-recording'
                                        : isPlaying
                                            ? 'equalizer-playing'
                                            : 'h-1 opacity-40',
                                )}
                                style={barStyle}
                            />
                        )
                    })}
                </div>
            )
            
        case 'circle_pulse':
            return (
                <div className="relative flex items-center justify-center h-16 w-16">
                    <div
                        className={classNames(
                            'absolute rounded-full',
                            theme.customColors ? '' : theme.lightBg,
                            isRecording || isPlaying ? 'circle-pulse' : '',
                        )}
                        style={{
                            height: '85%',
                            width: '85%',
                            opacity: isRecording || isPlaying ? 0.6 : 0.3,
                            ...(theme.customColors
                                ? {
                                    backgroundColor: `${theme.customColors.secondary}80`,
                                }
                                : {}),
                        }}
                    />
                    <div
                        className={classNames(
                            'relative rounded-full flex items-center justify-center',
                            theme.customColors ? '' : theme.lightBg,
                            'h-12 w-12',
                        )}
                        style={
                            theme.customColors
                                ? {
                                    backgroundColor: `${theme.customColors.secondary}80`,
                                }
                                : {}
                        }
                    >
                        <span
                            className={classNames(
                                'block text-xl',
                                theme.customColors ? '' : 'text-green-400',
                                isRecording || isPlaying
                                    ? 'animate-pulse'
                                    : '',
                            )}
                            style={
                                theme.customColors
                                    ? { color: theme.customColors.button }
                                    : {}
                            }
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                                <path d="M17.66 6.34a8 8 0 0 1 0 11.31" />
                                <path d="M6.34 6.34a8 8 0 0 1 11.32 0" />
                                <path d="M8.46 8.46a5 5 0 0 1 7.07 0" />
                            </svg>
                        </span>
                    </div>
                </div>
            )
            
        case 'none':
        default:
            return null
    }
}

export default AudioVisualization
