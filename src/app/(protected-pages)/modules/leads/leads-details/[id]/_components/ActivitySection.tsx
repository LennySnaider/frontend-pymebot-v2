/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-details/[id]/_components/ActivitySection.tsx
 * Sección de actividad del prospecto con soporte para internacionalización.
 * @version 1.0.0
 * @updated 2025-05-04
 */

'use client'
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/shared/Loading'
import sleep from '@/utils/sleep'
import dayjs from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import {
    PiEyeDuotone,
    PiCreditCardDuotone,
    PiTicketDuotone,
    PiPhoneOutgoingDuotone,
    PiCalendarCheckDuotone,
    PiChatCircleDuotone,
    PiHouseDuotone,
    PiUserCircleDuotone,
    PiUserPlusDuotone,
} from 'react-icons/pi'
import { useTranslations } from 'next-intl'
import useSWR from 'swr'

// Mock API function for lead activities - to be replaced with actual API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const apiGetLeadActivity = async <T,>(_params: { id: string }): Promise<T> => {
    await sleep(500)

    // Mock data
    const mockData = [
        {
            id: '1',
            date: dayjs().unix(),
            events: [
                {
                    type: 'LEAD-CREATED',
                    dateTime: dayjs().subtract(1, 'hour').unix(),
                    description: 'fue creado como nuevo prospecto',
                },
                {
                    type: 'PROPERTY-VIEW',
                    dateTime: dayjs().subtract(45, 'minute').unix(),
                    description: 'vio propiedades en la zona de Marbella',
                },
            ],
        },
        {
            id: '2',
            date: dayjs().subtract(1, 'day').unix(),
            events: [
                {
                    type: 'APPOINTMENT-SCHEDULED',
                    dateTime: dayjs()
                        .subtract(1, 'day')
                        .subtract(3, 'hour')
                        .unix(),
                    description: 'programó una cita para ver propiedades',
                },
                {
                    type: 'AGENT-ASSIGNED',
                    dateTime: dayjs()
                        .subtract(1, 'day')
                        .subtract(5, 'hour')
                        .unix(),
                    description: 'fue asignado a Carlos Rodríguez',
                },
            ],
        },
    ]

    return mockData as unknown as T
}

type Activities = {
    id: string
    date: number
    events: {
        type: string
        dateTime: number
        description: string
    }[]
}[]

const TimeLineMedia = (props: { type: string }) => {
    const { type } = props

    switch (type) {
        case 'PROPERTY-VIEW':
            return <PiEyeDuotone />
        case 'PROPERTY-INTEREST':
            return <PiHouseDuotone />
        case 'PAYMENT':
            return <PiCreditCardDuotone />
        case 'APPOINTMENT-SCHEDULED':
            return <PiCalendarCheckDuotone />
        case 'APPOINTMENT-COMPLETED':
            return <PiTicketDuotone />
        case 'CONTACT-MADE':
            return <PiPhoneOutgoingDuotone />
        case 'MESSAGE-SENT':
            return <PiChatCircleDuotone />
        case 'LEAD-CREATED':
            return <PiUserPlusDuotone />
        case 'AGENT-ASSIGNED':
            return <PiUserCircleDuotone />
        default:
            return <PiUserCircleDuotone />
    }
}

const TimeLineContent = (props: {
    type: string
    description: string
    name: string
}) => {
    const { type, description, name } = props
    const t = useTranslations('salesFunnel.leads.details.activity')

    switch (type) {
        case 'PROPERTY-VIEW':
            return (
                <div>
                    <h6 className="font-bold">{t('propertyView')}</h6>
                    <p className="font-semibold">
                        {name} {description}
                    </p>
                </div>
            )
        case 'PROPERTY-INTEREST':
            return (
                <div>
                    <h6 className="font-bold">{t('propertyInterest')}</h6>
                    <p className="font-semibold">
                        {name} {description}
                    </p>
                </div>
            )
        case 'LEAD-CREATED':
            return (
                <div>
                    <h6 className="font-bold">{t('leadCreated')}</h6>
                    <p className="font-semibold">
                        {name} {description}
                    </p>
                </div>
            )
        case 'APPOINTMENT-SCHEDULED':
            return (
                <div>
                    <h6 className="font-bold">{t('appointmentScheduled')}</h6>
                    <p className="font-semibold">
                        {name} {description}
                    </p>
                </div>
            )
        case 'APPOINTMENT-COMPLETED':
            return (
                <div>
                    <h6 className="font-bold">{t('appointmentCompleted')}</h6>
                    <p className="font-semibold">
                        {name} {description}
                    </p>
                </div>
            )
        case 'CONTACT-MADE':
            return (
                <div>
                    <h6 className="font-bold">{t('contactMade')}</h6>
                    <p className="font-semibold">
                        {name} {description}
                    </p>
                </div>
            )
        case 'MESSAGE-SENT':
            return (
                <div>
                    <h6 className="font-bold">{t('messageSent')}</h6>
                    <p className="font-semibold">
                        {name} {description}
                    </p>
                </div>
            )
        case 'AGENT-ASSIGNED':
            return (
                <div>
                    <h6 className="font-bold">{t('agentAssigned')}</h6>
                    <p className="font-semibold">
                        {name} {description}
                    </p>
                </div>
            )
        default:
            return (
                <div>
                    <h6 className="font-bold">{t('activity')}</h6>
                    <p className="font-semibold">{description}</p>
                </div>
            )
    }
}

const ActivitySection = ({
    leadName,
    id,
}: {
    leadName: string
    id: string
}) => {
    const t = useTranslations('salesFunnel.leads.details.activity')

    const { data, isLoading } = useSWR(
        ['/api/leads/activities', { id }],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, params]) => apiGetLeadActivity<Activities>(params),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
        },
    )

    const [fetchData, setFetchData] = useState(false)
    const [showNoMoreData, setShowNoMoreData] = useState(false)

    const handleLoadMore = async () => {
        setFetchData(true)
        await sleep(500)
        setShowNoMoreData(true)
        setFetchData(false)
    }

    return (
        <Loading loading={isLoading}>
            {data &&
                data.map((log) => (
                    <div key={log.id} className="mb-4">
                        <div className="mb-4 font-bold uppercase flex items-center gap-4">
                            <span className="w-[70px] heading-text">
                                {dayjs.unix(log.date).format('DD MMMM')}
                            </span>
                            <div className="border-b border-2 border-gray-200 dark:border-gray-600 border-dashed w-full"></div>
                        </div>
                        <div className="flex flex-col gap-4">
                            {isEmpty(log.events) ? (
                                <div>{t('noActivities')}</div>
                            ) : (
                                log.events.map((event, index) => (
                                    <div
                                        key={event.type + index}
                                        className="flex items-center"
                                    >
                                        <span className="font-semibold w-[100px]">
                                            {dayjs
                                                .unix(event.dateTime)
                                                .format('h:mm A')}
                                        </span>
                                        <Card
                                            className="max-w-[600px] w-full"
                                            bodyClass="py-3"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-primary text-3xl">
                                                    <TimeLineMedia
                                                        type={event.type}
                                                    />
                                                </div>
                                                <TimeLineContent
                                                    name={leadName}
                                                    type={event.type}
                                                    description={
                                                        event?.description
                                                    }
                                                />
                                            </div>
                                        </Card>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            <div className="text-center">
                {showNoMoreData ? (
                    <span className="font-semibold h-[40px] flex items-center justify-center">
                        {t('noMoreActivities')}
                    </span>
                ) : (
                    <Button loading={fetchData} onClick={handleLoadMore}>
                        {t('loadMore')}
                    </Button>
                )}
            </div>
        </Loading>
    )
}

export default ActivitySection
