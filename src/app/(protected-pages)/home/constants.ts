import type { Period } from './types'

export const options: { value: Period; label: string }[] = [
    { value: 'thisMonth', label: 'monthly' },
    { value: 'thisWeek', label: 'weekly' },
    { value: 'thisYear', label: 'annually' },
]
