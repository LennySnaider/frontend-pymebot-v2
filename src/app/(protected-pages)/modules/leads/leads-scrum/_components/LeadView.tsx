// frontend/src/app/(protected-pages)/modules/leads/leads-scrum/_components/LeadView.tsx
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { HiOutlineCalendar } from 'react-icons/hi'
import {
    TbHome,
    TbCurrencyDollar,
    TbMail,
    TbPhone,
    TbMapPin,
    TbBuildingEstate,
} from 'react-icons/tb'
import { useTranslations } from 'next-intl'
import dayjs from 'dayjs'
import { leadLabelColors } from '../utils'
import LeadTabs from './LeadTabs'
import { Lead } from './types'

interface LeadViewProps {
    leadData: Lead
    onEdit: () => void
    updateLead: (lead: Lead) => void
}

const LeadView = ({ leadData, onEdit, updateLead }: LeadViewProps) => {
    const tBase = useTranslations('salesFunnel')

    const text = (key: string) => {
        try {
            const defaultText =
                key
                    .split('.')
                    .pop()
                    ?.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase()) || key
            return tBase(key) || defaultText
        } catch {
            return (
                key
                    .split('.')
                    .pop()
                    ?.replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase()) || key
            )
        }
    }

    const formatDate = (date: number | Date | string) => {
        let dateObj: Date
        if (typeof date === 'number') {
            dateObj = new Date(date)
        } else if (typeof date === 'string') {
            dateObj = new Date(date)
        } else {
            dateObj = date
        }
        return dayjs(dateObj).format('DD MMM YYYY')
    }

    const formatBudget = (budget?: number) => {
        if (!budget && budget !== 0) return 'N/A'
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(budget)
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-2xl font-semibold">{leadData.name}</h4>
                <Button variant="solid" onClick={onEdit}>
                    {text('leads.lead.edit')}
                </Button>
            </div>
            <div className="grid grid-cols-12 gap-4 mb-6">
                <div className="col-span-12 md:col-span-7 lg:col-span-8">
                    <div className="mb-4">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {text('leads.lead.description')}
                        </span>
                        <p className="mt-2 text-gray-700 dark:text-gray-300">
                            {leadData.description || 'Sin descripción'}
                        </p>
                    </div>
                    {leadData.labels && leadData.labels.length > 0 && (
                        <div className="mb-4">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {text('leads.lead.labels')}
                            </span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {leadData.labels.map((label, index) => (
                                    <Tag
                                        key={`${label}-${index}`}
                                        className={`mr-2 rtl:ml-2 ${
                                            leadLabelColors[label] ||
                                            'bg-blue-100 text-blue-600'
                                        }`}
                                    >
                                        {label}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}
                    {leadData.metadata && (
                        <div className="grid grid-cols-12 gap-4">
                            {leadData.metadata.propertyType && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbHome className="mr-1" />
                                        <span>
                                            {text('leads.lead.propertyType')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.propertyType}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.budget !== undefined && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbCurrencyDollar className="mr-1" />
                                        <span>{text('leads.lead.budget')}</span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {formatBudget(leadData.metadata.budget)}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.email && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbMail className="mr-1" />
                                        <span>{text('leads.lead.email')}</span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.email}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.phone && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbPhone className="mr-1" />
                                        <span>{text('leads.lead.phone')}</span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.phone}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.preferredZones &&
                                leadData.metadata.preferredZones.length > 0 && (
                                    <div className="col-span-6">
                                        <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                            <TbMapPin className="mr-1" />
                                            <span>
                                                {text(
                                                    'leads.lead.preferredZones',
                                                )}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-gray-700 dark:text-gray-300">
                                            {leadData.metadata.preferredZones.join(
                                                ', ',
                                            )}
                                        </p>
                                    </div>
                                )}
                            {leadData.metadata.bedroomsNeeded !== undefined && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbBuildingEstate className="mr-1" />
                                        <span>
                                            {text('leads.lead.bedroomsNeeded')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.bedroomsNeeded}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.bathroomsNeeded !==
                                undefined && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbBuildingEstate className="mr-1" />
                                        <span>
                                            {text('leads.lead.bathroomsNeeded')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.bathroomsNeeded}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.featuresNeeded && (
                                <div className="col-span-12">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbHome className="mr-1" />
                                        <span>
                                            {text('leads.lead.featuresNeeded')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.featuresNeeded}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.source && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbMapPin className="mr-1" />
                                        <span>{text('leads.lead.source')}</span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.source}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.interest && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbMapPin className="mr-1" />
                                        <span>
                                            {text('leads.lead.interest')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.interest}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.nextContactDate && (
                                <div className="col-span-6">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <HiOutlineCalendar className="mr-1" />
                                        <span>
                                            {text('leads.lead.nextContactDate')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {formatDate(
                                            leadData.metadata.nextContactDate,
                                        )}
                                    </p>
                                </div>
                            )}
                            {leadData.metadata.agentNotes && (
                                <div className="col-span-12">
                                    <div className="flex items-center text-gray-900 dark:text-gray-100 font-semibold">
                                        <TbHome className="mr-1" />
                                        <span>
                                            {text('leads.lead.agentNotes')}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                                        {leadData.metadata.agentNotes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="col-span-12 md:col-span-5 lg:col-span-4">
                    <LeadTabs
                        leadData={leadData}
                        mode="view"
                        updateLead={updateLead}
                    />
                </div>
            </div>
        </div>
    )
}

export default LeadView
