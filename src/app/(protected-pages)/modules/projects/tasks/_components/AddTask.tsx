'use client'

import { useEffect, useState, useRef } from 'react'
// import { useTranslations } from 'next-intl' // Comentado temporalmente
import classNames from '@/utils/classNames'
import Tag from '@/components/ui/Tag'
import Avatar from '@/components/ui/Avatar'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Dropdown from '@/components/ui/Dropdown'
import Badge from '@/components/ui/Badge'
import DatePicker from '@/components/ui/DatePicker'
import { labelClass } from '../utils'
import { useTasksStore } from '../_store/tasksStore'
import {
    TbPlus,
    TbCircleCheck,
    TbChevronDown,
    TbCalendar,
    TbUser,
} from 'react-icons/tb'
import dayjs from 'dayjs'
import uniqueId from 'lodash/uniqueId'
import type { Task } from '../types'

type AddTaskProps = {
    groupKey: string
    isCreatingTask: boolean
    onAddTaskClick: (key: string) => void
    onCreateTask: (task: Task) => void
}

const { TBody, Tr, Td } = Table

// Define keys for lists to map with translations (comentado temporalmente)
// const priorityKeys = ['low', 'medium', 'high'] as const
// const statusKeys = ['pending', 'inProgress'] as const // Assuming 'completed' is not used for creation

const AddTask = ({
    groupKey,
    isCreatingTask,
    onAddTaskClick,
    onCreateTask,
}: AddTaskProps) => {
    // const t = useTranslations('tasks') // Comentado temporalmente
    const inputRef = useRef<HTMLInputElement>(null)

    const [focused, setFocused] = useState(false)

    const [status, setStatus] = useState('')
    const [priority, setPriority] = useState('')
    const [assignee, setAssignee] = useState('')
    const [dueDate, setDuedate] = useState<number | null>(null)

    const { boardMembers } = useTasksStore()

    useEffect(() => {
        if (isCreatingTask) {
            inputRef.current?.focus()
        }
    }, [isCreatingTask])

    // Listas estáticas temporales
    const priorityList = [
        { key: 'Low', label: 'Baja' },
        { key: 'Medium', label: 'Media' },
        { key: 'High', label: 'Alta' },
    ]
    const statusList = [
        { key: 'Pending', label: 'Pendiente' },
        { key: 'In Progress', label: 'En Progreso' },
    ]

    const handleCreateClick = () => {
        const task: Task = {
            id: uniqueId('task_'),
            name: inputRef.current?.value || 'Tarea sin título',
            progress: status || statusList[0].key, // Use the key ("Pending" or "In Progress")
            assignee: {
                id: assignee,
                name:
                    boardMembers.find((member) => member.id === assignee)
                        ?.name || '',
                img:
                    boardMembers.find((member) => member.id === assignee)
                        ?.img || '',
            },
            priority: priority || priorityList[0].key, // Use the key ("Low", "Medium", "High")
            dueDate,
            checked: false,
        }

        onCreateTask(task)
        setStatus('')
        setPriority('')
        setAssignee('')
        setDuedate(null)
    }

    return (
        <>
            {isCreatingTask ? (
                <>
                    <div
                        className={classNames(
                            'rounded-lg transition-shadow duration-150',
                            focused && 'shadow-xl',
                        )}
                    >
                        <Table hoverable={false} overflow={false}>
                            <TBody>
                                <Tr>
                                    <Td className="w-[66px]"></Td>
                                    <Td className="w-[40px] text-2xl">
                                        <TbCircleCheck />
                                    </Td>
                                    <Td className="w-[500px]">
                                        <input
                                            ref={inputRef}
                                            className="outline-0 font-semibold w-full heading-text bg-transparent"
                                            placeholder="Introduce el nombre de la tarea"
                                            onFocus={() => setFocused(true)}
                                            onBlur={() => setFocused(false)}
                                        />
                                    </Td>
                                    <Td className="w-[150px]">
                                        <Dropdown
                                            renderTitle={
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    {status ? (
                                                        <Tag
                                                            className={`${
                                                                status // Use the original key for class lookup
                                                                    ? labelClass[
                                                                          status
                                                                      ]
                                                                    : ''
                                                            }`}
                                                        >
                                                            {/* Display translated label */}
                                                            {statusList.find(
                                                                (s) =>
                                                                    s.key ===
                                                                    status,
                                                            )?.label || status}
                                                        </Tag>
                                                    ) : (
                                                        <span className="font-semibold">
                                                            Estado
                                                        </span>
                                                    )}
                                                    <TbChevronDown className="text-lg" />
                                                </div>
                                            }
                                            placement="bottom-end"
                                        >
                                            {/* Map through translated list */}
                                            {statusList.map((statusItem) => (
                                                <Dropdown.Item
                                                    key={statusItem.key}
                                                    // Use original key for eventKey
                                                    eventKey={statusItem.key}
                                                    onSelect={setStatus}
                                                >
                                                    <div className="flex items-center">
                                                        <Badge
                                                            innerClass={`${labelClass[statusItem.key]}`} // Use key for class
                                                        />
                                                        <span className="ml-2 rtl:mr-2">
                                                            {/* Display translated label */}
                                                            {statusItem.label}
                                                        </span>
                                                    </div>
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown>
                                    </Td>
                                    <Td className="w-[150px]">
                                        <Dropdown
                                            renderTitle={
                                                <div className="flex items-center gap-1 cursor-pointer">
                                                    {priority ? (
                                                        <Tag
                                                            className={`${
                                                                priority // Use original key for class lookup
                                                                    ? labelClass[
                                                                          priority
                                                                      ]
                                                                    : ''
                                                            }`}
                                                        >
                                                            {/* Display translated label */}
                                                            {priorityList.find(
                                                                (p) =>
                                                                    p.key ===
                                                                    priority,
                                                            )?.label ||
                                                                priority}
                                                        </Tag>
                                                    ) : (
                                                        <span className="font-semibold">
                                                            Prioridad
                                                        </span>
                                                    )}
                                                    <TbChevronDown className="text-lg" />
                                                </div>
                                            }
                                            placement="bottom-end"
                                        >
                                            {/* Map through translated list */}
                                            {priorityList.map(
                                                (priorityItem) => (
                                                    <Dropdown.Item
                                                        key={priorityItem.key}
                                                        // Use original key for eventKey
                                                        eventKey={
                                                            priorityItem.key
                                                        }
                                                        onSelect={setPriority}
                                                    >
                                                        <div className="flex items-center">
                                                            <Badge
                                                                innerClass={`${labelClass[priorityItem.key]}`} // Use key for class
                                                            />
                                                            <span className="ml-2 rtl:mr-2">
                                                                {/* Display translated label */}
                                                                {
                                                                    priorityItem.label
                                                                }
                                                            </span>
                                                        </div>
                                                    </Dropdown.Item>
                                                ),
                                            )}
                                        </Dropdown>
                                    </Td>
                                    <Td className="w-[150px]">
                                        <div className="flex items-center gap-2 cursor-pointer relative max-w-[200px]">
                                            <TbCalendar className="text-xl" />
                                            <span className="font-semibold">
                                                {dueDate
                                                    ? dayjs
                                                          .unix(dueDate)
                                                          .format('DD MMM')
                                                    : 'Fecha límite'}
                                            </span>
                                            <DatePicker
                                                className="opacity-0 cursor-pointer absolute"
                                                value={dayjs
                                                    .unix(
                                                        dueDate ||
                                                            dayjs().unix(),
                                                    )
                                                    .toDate()}
                                                inputtable={false}
                                                inputPrefix={null}
                                                inputSuffix={null}
                                                clearable={false}
                                                onChange={(date) =>
                                                    setDuedate(
                                                        dayjs(
                                                            date as Date,
                                                        ).unix(),
                                                    )
                                                }
                                            />
                                        </div>
                                    </Td>
                                    <Td className="py-1">
                                        <div className="flex items-center justify-between">
                                            <Dropdown
                                                placement="bottom"
                                                renderTitle={
                                                    <div className="flex items-center gap-2 cursor-pointer">
                                                        {assignee ? (
                                                            <>
                                                                <Avatar
                                                                    shape="circle"
                                                                    size="sm"
                                                                    src={
                                                                        boardMembers.find(
                                                                            (
                                                                                member,
                                                                            ) =>
                                                                                member.id ===
                                                                                assignee,
                                                                        )?.img
                                                                    }
                                                                />
                                                                <span className="font-bold heading-text">
                                                                    {
                                                                        boardMembers.find(
                                                                            (
                                                                                member,
                                                                            ) =>
                                                                                member.id ===
                                                                                assignee,
                                                                        )?.name
                                                                    }
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <TbUser className="text-xl" />
                                                                <span className="font-semibold">
                                                                    Asignado
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                }
                                            >
                                                {boardMembers.map((member) => (
                                                    <Dropdown.Item
                                                        key={member.name}
                                                        eventKey={member.id}
                                                        onSelect={() =>
                                                            setAssignee(
                                                                member.id,
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <Avatar
                                                                    shape="circle"
                                                                    size={22}
                                                                    src={
                                                                        member.img
                                                                    }
                                                                />
                                                                <span className="ml-2 rtl:mr-2">
                                                                    {
                                                                        member.name
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown>

                                            <Button
                                                size="sm"
                                                variant="solid"
                                                onClick={handleCreateClick}
                                            >
                                                Crear
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            </TBody>
                        </Table>
                    </div>
                </>
            ) : (
                <Button
                    block
                    icon={<TbPlus />}
                    customColorClass={() =>
                        'border-dashed border-2 hover:ring-transparent bg-gray-50'
                    }
                    onClick={() => onAddTaskClick(groupKey)}
                >
                    Añadir Tarea
                </Button>
            )}
        </>
    )
}

export default AddTask
