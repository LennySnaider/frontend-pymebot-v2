'use client'

import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Switcher from '@/components/ui/Switcher'
import Dialog from '@/components/ui/Dialog'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import useSWR from 'swr'
import {
    TbCircleCheckFilled,
    TbRosetteDiscountCheckFilled,
} from 'react-icons/tb'
import { apiGetSettingsIntergration } from '@/services/AccontsService'
import type { GetSettingsIntegrationResponse, Integration } from '../types'

const SettingIntegration = () => {
    const [selectedIntegration, setSelectedIntegration] = useState<{
        integration: Partial<Integration>
        dialogOpen: boolean
    }>({
        integration: {},
        dialogOpen: false,
    })

    const { data = [], mutate } = useSWR(
        '/api/settings/integration/',
        () => apiGetSettingsIntergration<GetSettingsIntegrationResponse>(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const handleToggle = (bool: boolean, id: string) => {
        const newData = structuredClone(data)
        mutate(
            newData.map((app) => {
                if (app.id === id) {
                    app.active = bool
                }
                return app
            }),
            false,
        )
    }

    const handleDialogClose = () => {
        setSelectedIntegration({
            integration: {},
            dialogOpen: false,
        })
    }

    return (
        <div>
            <h4>Integraciones</h4>
            <p>Mejora tu flujo de trabajo utilizando estas integraciones</p>
            <div className="mt-4">
                {data.map((app, index) => (
                    <div
                        key={app.id}
                        className={classNames(
                            'flex items-center justify-between py-6 border-gray-200 dark:border-gray-700',
                            !isLastChild(data, index) && 'border-b',
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <Avatar
                                className="bg-transparent dark:bg-transparent p-2 border-2 border-gray-200 dark:border-gray-700"
                                size={50}
                                src={app.img}
                                shape="round"
                            />
                            <div>
                                <h6 className="font-bold">{app.name}</h6>
                                <span>{app.desc}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="plain"
                                onClick={() =>
                                    setSelectedIntegration({
                                        dialogOpen: true,
                                        integration: app,
                                    })
                                }
                            >
                                Más información
                            </Button>
                            <Switcher
                                checked={app.active}
                                onChange={(val) => handleToggle(val, app.id)}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <Dialog
                isOpen={selectedIntegration.dialogOpen}
                onClose={handleDialogClose}
                onRequestClose={handleDialogClose}
            >
                <div className="flex items-center gap-3">
                    <Avatar
                        className="bg-transparent dark:bg-transparent p-2 border-2 border-gray-200 dark:border-gray-600"
                        size={55}
                        src={selectedIntegration.integration.img}
                        shape="round"
                    />
                    <div>
                        <div className="flex items-center gap-1">
                            <h6 className="font-bold">
                                {selectedIntegration.integration.name}
                            </h6>
                            <TbRosetteDiscountCheckFilled className="text-primary text-lg" />
                        </div>
                        <span className="flex gap-2">
                            <span>{selectedIntegration.integration.type}</span>
                        </span>
                    </div>
                </div>
                <div className="mt-6">
                    <span className="font-bold heading-text">Descripción General</span>
                    <p className="mt-2">
                        Esta integración permite optimizar tu flujo de trabajo conectando 
                        servicios esenciales con nuestra plataforma. Disfruta de una 
                        experiencia fluida mientras automatizas tareas repetitivas y 
                        mejoras la productividad de tu equipo.
                    </p>
                    <div className="mt-6">
                        <span className="font-bold heading-text">
                            Características Principales:
                        </span>
                        <ul className="list-disc mt-4 flex flex-col gap-3">
                            <li className="flex gap-2">
                                <TbCircleCheckFilled className="text-xl text-emerald-500" />
                                <span>
                                    Sincronización automática de datos entre plataformas.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <TbCircleCheckFilled className="text-xl text-emerald-500" />
                                <span>
                                    Flujos de trabajo personalizables según tus necesidades.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <TbCircleCheckFilled className="text-xl text-emerald-500" />
                                <span>
                                    Alertas y notificaciones en tiempo real.
                                </span>
                            </li>
                            <li className="flex gap-2">
                                <TbCircleCheckFilled className="text-xl text-emerald-500" />
                                <span>
                                    Análisis detallado del rendimiento de la integración.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className=" mt-6">
                    <Button block onClick={handleDialogClose}>
                        Entendido
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default SettingIntegration
