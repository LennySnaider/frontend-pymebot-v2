'use client'

import Checkbox from '@/components/ui/Checkbox'
import Radio from '@/components/ui/Radio'
import Switcher from '@/components/ui/Switcher'
import { apiGetSettingsNotification } from '@/services/AccontsService'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import { TbMessageCircleCheck } from 'react-icons/tb'
import type { GetSettingsNotificationResponse } from '../types'

type EmailNotificationFields =
    | 'newsAndUpdate'
    | 'tipsAndTutorial'
    | 'offerAndPromotion'
    | 'followUpReminder'

const emailNotificationOption: {
    label: string
    value: EmailNotificationFields
    desc: string
}[] = [
    {
        label: 'Noticias y actualizaciones',
        value: 'newsAndUpdate',
        desc: 'Novedades sobre productos y actualizaciones de características',
    },
    {
        label: 'Consejos y tutoriales',
        value: 'tipsAndTutorial',
        desc: 'Consejos y trucos para aumentar tu eficiencia de rendimiento',
    },
    {
        label: 'Ofertas y promociones',
        value: 'offerAndPromotion',
        desc: 'Promociones sobre precios de productos y descuentos recientes',
    },
    {
        label: 'Recordatorios de seguimiento',
        value: 'followUpReminder',
        desc: 'Recibir notificación de todos los recordatorios que se han creado',
    },
]

const notifyMeOption: {
    label: string
    value: string
    desc: string
}[] = [
    {
        label: 'Todos los mensajes nuevos',
        value: 'allNewMessage',
        desc: 'Enviar notificaciones al canal por cada mensaje nuevo',
    },
    {
        label: 'Solo menciones',
        value: 'mentionsOnly',
        desc: 'Solo alertarme en el canal si alguien me menciona en un mensaje',
    },
    {
        label: 'Nada',
        value: 'nothing',
        desc: 'No notificarme nada',
    },
]

const SettingsNotification = () => {
    const {
        data = {
            email: [],
            desktop: false,
            unreadMessageBadge: false,
            notifymeAbout: '',
        },
        mutate,
    } = useSWR<GetSettingsNotificationResponse>(
        '/api/settings/notification/',
        () =>
            apiGetSettingsNotification<GetSettingsNotificationResponse>().then(
                (res) => res,
            ),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const handleEmailNotificationOptionChange = (values: string[]) => {
        const newData = cloneDeep(data)
        newData.email = values
        mutate(newData, false)
    }

    const handleEmailNotificationOptionCheckAll = (value: boolean) => {
        const newData = cloneDeep(data)
        if (value) {
            newData.email = [
                'newsAndUpdate',
                'tipsAndTutorial',
                'offerAndPromotion',
                'followUpReminder',
            ]
        } else {
            newData.email = []
        }

        mutate(newData, false)
    }

    const handleDesktopNotificationCheck = (value: boolean) => {
        const newData = cloneDeep(data)
        newData.desktop = value
        mutate(newData, false)
    }

    const handleUnreadMessagebadgeCheck = (value: boolean) => {
        const newData = cloneDeep(data)
        newData.unreadMessageBadge = value
        mutate(newData, false)
    }

    const handleNotifyMeChange = (value: string) => {
        const newData = cloneDeep(data)
        newData.notifymeAbout = value
        mutate(newData, false)
    }

    return (
        <div>
            <h4>Notificaciones</h4>
            <div className="mt-2">
                <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-gray-600">
                    <div>
                        <h5>Habilitar notificaciones de escritorio</h5>
                        <p>
                            Decide si deseas recibir notificaciones de nuevos
                            mensajes y actualizaciones
                        </p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.desktop}
                            onChange={handleDesktopNotificationCheck}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-gray-600">
                    <div>
                        <h5>Habilitar insignia de notificaciones no leídas</h5>
                        <p>
                            Mostrar un indicador rojo en el icono de notificación
                            cuando tengas mensajes no leídos
                        </p>
                    </div>
                    <div>
                        <Switcher
                            checked={data.unreadMessageBadge}
                            onChange={handleUnreadMessagebadgeCheck}
                        />
                    </div>
                </div>
                <div className="py-6 border-b border-gray-200 dark:border-gray-600">
                    <h5>Habilitar insignia de notificaciones no leídas</h5>
                    <div className="mt-4">
                        <Radio.Group
                            vertical
                            className="flex flex-col gap-6"
                            value={data.notifymeAbout}
                            onChange={handleNotifyMeChange}
                        >
                            {notifyMeOption.map((option) => (
                                <div key={option.value} className="flex gap-4">
                                    <div className="mt-1.5">
                                        <Radio value={option.value} />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="mt-1">
                                            <TbMessageCircleCheck className="text-lg" />
                                        </div>
                                        <div>
                                            <h6>{option.label}</h6>
                                            <p>{option.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Radio.Group>
                    </div>
                </div>
                <div className="flex items-center justify-between py-6">
                    <div>
                        <h5>Notificaciones por correo electrónico</h5>
                        <p>
                            La plataforma puede enviarte notificaciones por correo electrónico
                            para cualquier mensaje directo nuevo
                        </p>
                    </div>
                    <div>
                        <Switcher
                            checked={!!data.email && data.email.length > 0}
                            onChange={handleEmailNotificationOptionCheckAll}
                        />
                    </div>
                </div>
                <Checkbox.Group
                    vertical
                    className="flex flex-col gap-6"
                    value={data.email || []}
                    onChange={handleEmailNotificationOptionChange}
                >
                    {emailNotificationOption.map((option) => (
                        <div key={option.value} className="flex gap-4">
                            <div className="mt-1.5">
                                <Checkbox value={option.value} />
                            </div>
                            <div>
                                <h6>{option.label}</h6>
                                <p>{option.desc}</p>
                            </div>
                        </div>
                    ))}
                </Checkbox.Group>
            </div>
        </div>
    )
}

export default SettingsNotification
