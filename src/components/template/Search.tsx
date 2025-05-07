'use client'

import { useState, useRef, useEffect } from 'react'
import classNames from '@/utils/classNames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import ScrollBar from '@/components/ui/ScrollBar'
import navigationIcon from '@/configs/navigation-icon.config'
import {
    GUIDE_PREFIX_PATH,
    UI_COMPONENTS_PREFIX_PATH,
} from '@/constants/route.constant'
import debounce from 'lodash/debounce'
import { HiOutlineSearch, HiChevronRight, HiCalendar, HiUser, HiOfficeBuilding, HiChat, HiCog } from 'react-icons/hi'
import { PiMagnifyingGlassDuotone } from 'react-icons/pi'
import Link from 'next/link'
import Highlighter from 'react-highlight-words'

type SearchData = {
    key: string
    path: string
    title: string
    icon?: any
    iconName?: string
    category: string
    categoryTitle: string
}

type SearchResult = {
    title: string
    data: SearchData[]
}

const agentPropSearch: SearchResult[] = [
    {
        title: 'Secciones Principales',
        data: [
            {
                key: 'leads',
                path: '/concepts/leads/leads-scrum',
                title: 'Leads',
                icon: <HiUser className="text-indigo-500" />,
                category: 'crm',
                categoryTitle: 'CRM',
            },
            {
                key: 'properties',
                path: '/concepts/properties/property-list',
                title: 'Propiedades',
                icon: <HiOfficeBuilding className="text-emerald-500" />,
                category: 'inventory',
                categoryTitle: 'Inventario',
            },
            {
                key: 'appointments',
                path: '/concepts/appointments',
                title: 'Citas',
                icon: <HiCalendar className="text-amber-500" />,
                category: 'management',
                categoryTitle: 'Gestión',
            },
            {
                key: 'chatbot',
                path: '/concepts/superadmin/chatbot-builder',
                title: 'Chatbot',
                icon: <HiChat className="text-purple-500" />,
                category: 'tools',
                categoryTitle: 'Herramientas',
            },
            {
                key: 'settings',
                path: '/concepts/settings',
                title: 'Configuración',
                icon: <HiCog className="text-gray-500" />,
                category: 'system',
                categoryTitle: 'Sistema',
            },
        ],
    },
]

const ListItem = (props: {
    icon?: any
    iconName?: string
    label: string
    url: string
    isLast?: boolean
    keyWord: string
    onNavigate: () => void
}) => {
    const { icon, iconName, label, url = '', keyWord, onNavigate } = props

    return (
        <Link href={url} onClick={onNavigate}>
            <div
                className={classNames(
                    'flex items-center justify-between rounded-xl p-3 cursor-pointer user-select',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                )}
            >
                <div className="flex items-center gap-2">
                    <div
                        className={classNames(
                            'rounded-lg border-2 border-gray-200 shadow-xs text-xl group-hover:shadow-sm h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                        )}
                    >
                        {icon ? icon : (iconName && navigationIcon[iconName])}
                    </div>
                    <div className="text-gray-900 dark:text-gray-300">
                        <Highlighter
                            autoEscape
                            highlightClassName={classNames(
                                'text-primary',
                                'underline bg-transparent font-semibold dark:text-white',
                            )}
                            searchWords={[keyWord]}
                            textToHighlight={label}
                        />
                    </div>
                </div>
                <HiChevronRight className="text-lg" />
            </div>
        </Link>
    )
}

const _Search = ({ className }: { className?: string }) => {
    const [searchDialogOpen, setSearchDialogOpen] = useState(false)
    const [searchResult, setSearchResult] =
        useState<SearchResult[]>(agentPropSearch)
    const [noResult, setNoResult] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)

    const handleReset = () => {
        setNoResult(false)
        setSearchResult(agentPropSearch)
    }

    const handleSearchOpen = () => {
        setSearchDialogOpen(true)
    }

    const handleSearchClose = () => {
        setSearchDialogOpen(false)
        handleReset()
    }

    const debounceFn = debounce(handleDebounceFn, 300)

    function handleDebounceFn(query: string) {
        if (!query) {
            setSearchResult(agentPropSearch)
            setNoResult(false)
            return
        }

        // Realizar búsqueda local
        const results: SearchResult[] = []
        
        // Filtrar cada sección por la consulta
        agentPropSearch.forEach(section => {
            const filteredData = section.data.filter(item => 
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.category.toLowerCase().includes(query.toLowerCase()) ||
                item.categoryTitle.toLowerCase().includes(query.toLowerCase())
            )
            
            if (filteredData.length > 0) {
                results.push({
                    title: section.title,
                    data: filteredData
                })
            }
        })
        
        if (results.length === 0) {
            setNoResult(true)
        } else {
            setNoResult(false)
        }
        
        setSearchResult(results)
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        debounceFn(e.target.value)
    }

    useEffect(() => {
        if (searchDialogOpen) {
            const timeout = setTimeout(() => inputRef.current?.focus(), 100)
            return () => {
                clearTimeout(timeout)
            }
        }
    }, [searchDialogOpen])

    const handleNavigate = () => {
        handleSearchClose()
    }

    return (
        <>
            <div
                className={classNames(className, 'text-2xl')}
                onClick={handleSearchOpen}
            >
                <PiMagnifyingGlassDuotone />
            </div>
            <Dialog
                contentClassName="p-0"
                isOpen={searchDialogOpen}
                closable={false}
                onRequestClose={handleSearchClose}
            >
                <div>
                    <div className="px-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center">
                            <HiOutlineSearch className="text-xl" />
                            <input
                                ref={inputRef}
                                className="ring-0 outline-hidden block w-full p-4 text-base bg-transparent text-gray-900 dark:text-gray-100"
                                placeholder="Search..."
                                onChange={handleSearch}
                            />
                        </div>
                        <Button size="xs" onClick={handleSearchClose}>
                            Esc
                        </Button>
                    </div>
                    <div className="py-6 px-5">
                        <ScrollBar className=" max-h-[350px] overflow-y-auto">
                            {searchResult.map((result) => (
                                <div key={result.title} className="mb-4">
                                    <h6 className="mb-3">{result.title}</h6>
                                    {result.data.map((data, index) => (
                                        <ListItem
                                            key={data.title + index}
                                            icon={data.icon}
                                            label={data.title}
                                            url={data.path}
                                            keyWord={
                                                inputRef.current?.value || ''
                                            }
                                            onNavigate={handleNavigate}
                                        />
                                    ))}
                                </div>
                            ))}
                            {searchResult.length === 0 && noResult && (
                                <div className="my-10 text-center text-lg">
                                    <span>No results for </span>
                                    <span className="heading-text">
                                        {`'`}
                                        {inputRef.current?.value}
                                        {`'`}
                                    </span>
                                </div>
                            )}
                        </ScrollBar>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

const Search = withHeaderItem(_Search)

export default Search
