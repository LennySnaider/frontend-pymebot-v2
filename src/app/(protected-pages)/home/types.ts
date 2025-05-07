import type { ExtendedTask } from '@/components/shared/GanttChart'

export type Period = 'thisMonth' | 'thisWeek' | 'thisYear'

export type StatisticCategory = 'totalProfit' | 'totalOrder' | 'totalImpression'

export type Event =
    | 'meeting'
    | 'task'
    | 'holiday'
    | 'breaks'
    | 'event'
    | 'workshops'
    | 'reminders'

export type ChannelRevenue = Record<
    Period,
    {
        value: number
        growShrink: number
        percentage: {
            onlineStore: number
            physicalStore: number
            socialMedia: number
        }
    }
>

export type SalesTargetData = Record<
    Period,
    {
        target: number
        achieved: number
        percentage: number
    }
>

export type Product = {
    id: string
    name: string
    productCode: string
    img: string
    sales: number
    growShrink: number
}

export type CustomerDemographicData = {
    id: string
    name: string
    value: number
    coordinates: [number, number]
}

export type PeriodData = {
    value: number
    growShrink: number
    comparePeriod: string
    chartData: {
        series: {
            name: string
            data: number[]
        }[]
        date: string[]
    }
}

export type StatisticData = Record<
    StatisticCategory,
    Record<Period, PeriodData>
>

export type Order = {
    id: string
    date: string
    customer: string
    status: number
    paymentMehod: string
    paymentIdendifier: string
    totalAmount: number
}

export type GetEcommerceDashboardResponse = {
    statisticData: StatisticData
    recentOrders: Order[]
    salesTarget: SalesTargetData
    topProduct: Product[]
    customerDemographic: CustomerDemographicData[]
    revenueByChannel: ChannelRevenue
}

export type Activities = Array<{
    type: string
    dateTime: number
    ticket?: string
    status?: number
    userName: string
    userImg?: string
    comment?: string
    tags?: string[]
    files?: string[]
    assignee?: string
}>

export type Project = {
    ongoingProject: number
    projectCompleted: number
    upcomingProject: number
}

export type TaskOverviewChart = {
    onGoing: number
    finished: number
    total: number
    series: {
        name: string
        data: number[]
    }[]
    range: string[]
}

export type Task = {
    id: string
    name: string
    dueDate: number
    checked: boolean
    progress: string
    priority: string
    assignee: {
        name: string
        img: string
    }
}

export type GetProjectDashboardResponse = {
    projectOverview: Project
    taskOverview: Record<string, TaskOverviewChart>
    currentTasks: Task[]
    schedule: ExtendedTask[]
    recentActivity: Activities
}
