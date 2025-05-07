/**
 * frontend/src/app/(protected-pages)/modules/leads/leads-details/[id]/_components/LeadDetails.tsx
 * Componente de detalles del prospecto con tabs para información general, propiedades y actividad
 * 
 * @version 1.0.0
 * @updated 2025-07-04
 */

'use client'

import { useTranslations } from 'next-intl'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import ProfileSection from './ProfileSection'
import PropertiesSection from './PropertiesSection'
import ActivitySection from './ActivitySection'
import type { Lead } from '../types'

type LeadDetailsProps = {
    data: Lead
}

const { TabNav, TabList, TabContent } = Tabs

const LeadDetails = ({ data }: LeadDetailsProps) => {
    const t = useTranslations()
    
    return (
        <div className="flex flex-col xl:flex-row gap-4">
            <div className="min-w-[330px] 2xl:min-w-[400px]">
                <ProfileSection data={data} />
            </div>
            <Card className="w-full">
                <Tabs defaultValue="properties">
                    <TabList>
                        <TabNav value="properties">{t('salesFunnel.details.propertiesTab')}</TabNav>
                        <TabNav value="activity">{t('salesFunnel.details.activityTab')}</TabNav>
                    </TabList>
                    <div className="p-4">
                        <TabContent value="properties">
                            <PropertiesSection data={data} />
                        </TabContent>
                        <TabContent value="activity">
                            <ActivitySection
                                leadName={data.name}
                                id={data.id}
                            />
                        </TabContent>
                    </div>
                </Tabs>
            </Card>
        </div>
    )
}

export default LeadDetails