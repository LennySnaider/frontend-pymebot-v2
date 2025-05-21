'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Lead } from '../types'

interface LeadMoveAnimationProps {
    lead: Lead | null
    fromPosition: { x: number; y: number } | null
    toPosition: { x: number; y: number } | null
    onComplete: () => void
}

export const LeadMoveAnimation: React.FC<LeadMoveAnimationProps> = ({
    lead,
    fromPosition,
    toPosition,
    onComplete
}) => {
    const [isAnimating, setIsAnimating] = useState(false)
    
    useEffect(() => {
        if (lead && fromPosition && toPosition) {
            setIsAnimating(true)
        }
    }, [lead, fromPosition, toPosition])
    
    if (!lead || !fromPosition || !toPosition || !isAnimating) {
        return null
    }
    
    const handleAnimationComplete = () => {
        setIsAnimating(false)
        onComplete()
    }
    
    return createPortal(
        <AnimatePresence>
            {isAnimating && (
                <motion.div
                    initial={{
                        position: 'fixed',
                        left: fromPosition.x,
                        top: fromPosition.y,
                        opacity: 1,
                        scale: 1,
                        zIndex: 9999
                    }}
                    animate={{
                        left: toPosition.x,
                        top: toPosition.y,
                        opacity: [1, 1, 0.8],
                        scale: [1, 1.05, 1]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 0.8,
                        ease: "easeInOut"
                    }}
                    onAnimationComplete={handleAnimationComplete}
                    className="w-[260px] pointer-events-none"
                >
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4">
                        <div className="font-bold text-base text-gray-900 dark:text-white mb-2">
                            {lead.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            {lead.email}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}