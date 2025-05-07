'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Settings from './_components/Settings'
import { useSettingsStore } from './_store/settingsStore'
import type { View } from './types'

const Page = () => {
    const searchParams = useSearchParams()
    const { setCurrentView } = useSettingsStore()

    useEffect(() => {
        const category = searchParams.get('category')
        if (category && ['profile', 'business', 'business-hours', 'security', 'notification', 'billing', 'integration'].includes(category)) {
            setCurrentView(category as View)
        }
    }, [searchParams, setCurrentView])

    return <Settings />
}

export default Page
