/**
 * frontend/src/components/view/ChatBox/components/VoiceChat/AnimationStyles.tsx
 * Componente que define los estilos de animación para el VoiceChat
 * @version 1.0.0
 * @updated 2025-04-28
 */

'use client'

import React from 'react'

// Componente para agregar los estilos CSS de las animaciones al VoiceChat
const AnimationStyles: React.FC = () => {
    return (
        <style jsx global>{`
            /* Animación para waveform durante grabación */
            @keyframes recordingPulse {
                0% {
                    height: 5px;
                }
                50% {
                    height: 20px;
                }
                100% {
                    height: 5px;
                }
            }

            /* Animación para waveform durante reproducción */
            @keyframes playingWave {
                0% {
                    height: 4px;
                }
                50% {
                    height: 13px;
                }
                100% {
                    height: 4px;
                }
            }

            /* Animación para equalizer durante grabación */
            @keyframes equalizerRecording {
                0% {
                    height: 2px;
                }
                50% {
                    height: 18px;
                }
                100% {
                    height: 2px;
                }
            }

            /* Animación para equalizer durante reproducción */
            @keyframes equalizerPlaying {
                0% {
                    height: 2px;
                }
                25% {
                    height: 8px;
                }
                50% {
                    height: 14px;
                }
                75% {
                    height: 6px;
                }
                100% {
                    height: 2px;
                }
            }

            /* Animación para círculo pulsante */
            @keyframes circlePulse {
                0% {
                    transform: scale(0.9);
                    opacity: 0.3;
                }
                50% {
                    transform: scale(1.1);
                    opacity: 0.6;
                }
                100% {
                    transform: scale(0.9);
                    opacity: 0.3;
                }
            }

            /* Aplicar estilos a los elementos */
            .recording-bar {
                animation: recordingPulse 0.7s ease-in-out infinite;
                height: 10px;
            }

            .playing-bar {
                animation: playingWave 1s ease-in-out infinite;
                height: 8px;
            }

            .equalizer-recording {
                animation: equalizerRecording 0.5s ease-in-out infinite;
                height: 10px;
            }

            .equalizer-playing {
                animation: equalizerPlaying 1.2s ease-in-out infinite;
                height: 8px;
            }

            .circle-pulse {
                animation: circlePulse 1.5s ease-in-out infinite;
            }

            /* Animación para los puntos indicadores */
            @keyframes dotPulse {
                0%,
                100% {
                    opacity: 0.3;
                    transform: scale(1);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.5);
                }
            }

            .dot-pulse {
                animation: dotPulse 1.5s ease-in-out infinite;
            }

            .dot-delay-1 {
                animation-delay: 0.3s;
            }

            .dot-delay-2 {
                animation-delay: 0.6s;
            }

            /* Animación para los puntos de carga */
            @keyframes loaderDot {
                0%,
                100% {
                    opacity: 0.3;
                }
                50% {
                    opacity: 1;
                }
            }

            .loader-dot:nth-child(1) {
                animation: loaderDot 1s ease-in-out infinite;
            }

            .loader-dot:nth-child(2) {
                animation: loaderDot 1s ease-in-out 0.33s infinite;
            }

            .loader-dot:nth-child(3) {
                animation: loaderDot 1s ease-in-out 0.66s infinite;
            }
        `}</style>
    )
}

export default AnimationStyles
