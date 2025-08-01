'use client'

import { useState, useRef, useEffect } from 'react'
// import { useTranslations } from 'next-intl' // Comentado temporalmente
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import ScrollBar from '@/components/ui/ScrollBar'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import wildCardSearch from '@/utils/wildCardSearch'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import { useTasksStore } from '../_store/tasksStore'
import { TbSearch, TbPlus } from 'react-icons/tb'
import classNames from '@/utils/classNames'
import debounce from 'lodash/debounce'
import cloneDeep from 'lodash/cloneDeep'
import type { ChangeEvent } from 'react'
import type { Member } from '../types'

const TasksHeader = () => {
    // Comentamos la línea para evitar el error de ESLint
    // const t = useTranslations('navigation')
    const inputRef = useRef(null)

    const [dialogOpen, setDialogOpen] = useState(false)

    const { allMembers, boardMembers, updateBoardMembers } = useTasksStore()

    const [memberList, setMemberList] = useState<Member[]>([])

    useEffect(() => {
        if (allMembers.length > 1) {
            setMemberList(allMembers)
        }
    }, [allMembers])

    const debounceFn = debounce(handleDebounceFn, 500)

    function handleDebounceFn(query: string) {
        const data = wildCardSearch(allMembers, query, 'name')
        setMemberList(data as Member[])
    }

    const onSearch = (e: ChangeEvent<HTMLInputElement>) => {
        debounceFn(e.target.value)
    }

    const existingMember = (id: string) => {
        return boardMembers.some((member) => member.id === id)
    }

    const onAddMember = (member: Member) => {
        const data = cloneDeep(boardMembers)
        data.push(member)
        updateBoardMembers(data)
    }

    const onRemoveMember = (id: string) => {
        const data = cloneDeep(boardMembers).filter(
            (member) => member.id !== id,
        )
        updateBoardMembers(data)
    }

    const onDone = () => {
        setDialogOpen(false)
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3>Tareas</h3>
                <div className="flex items-center gap-2">
                    <UsersAvatarGroup
                        className="flex items-center"
                        avatarProps={{ size: 'sm' }}
                        users={boardMembers}
                    />
                    <Button
                        size="sm"
                        icon={<TbPlus />}
                        onClick={() => setDialogOpen(true)}
                    >
                        Añadir miembros
                    </Button>
                </div>
            </div>
            <Dialog
                isOpen={dialogOpen}
                width={520}
                onClose={() => setDialogOpen(false)}
                onRequestClose={() => setDialogOpen(false)}
            >
                <div>
                    <div className="text-center mb-6">
                        <h4 className="mb-1">Añadir miembros</h4>
                        <p>
                            Invita a miembros existentes del equipo a este
                            proyecto.
                        </p>
                    </div>
                    <Input
                        ref={inputRef}
                        prefix={<TbSearch className="text-lg" />}
                        placeholder="Buscar miembros..."
                        onChange={onSearch}
                    />
                    <div className="mt-4">
                        <p className="font-semibold uppercase text-xs mb-4">
                            {memberList.length} miembros disponibles
                        </p>
                        <div className="mb-6">
                            <ScrollBar
                                className={classNames('overflow-y-auto h-80')}
                            >
                                {memberList.map((member) => (
                                    <div
                                        key={member.id}
                                        className="py-3 pr-5 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                shape="circle"
                                                src={member.img}
                                            />
                                            <div>
                                                <p className="heading-text font-bold">
                                                    {member.name}
                                                </p>
                                            </div>
                                        </div>
                                        {existingMember(member.id) ? (
                                            <Button
                                                size="xs"
                                                customColorClass={() =>
                                                    'hover:border-red-500 hover:ring-red-500'
                                                }
                                                onClick={() =>
                                                    onRemoveMember(member.id)
                                                }
                                            >
                                                <span className="text-red-500">
                                                    Eliminar
                                                </span>
                                            </Button>
                                        ) : (
                                            <Button
                                                size="xs"
                                                onClick={() =>
                                                    onAddMember(member)
                                                }
                                            >
                                                Añadir
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </ScrollBar>
                        </div>
                        <Button block variant="solid" onClick={onDone}>
                            Hecho
                        </Button>
                    </div>
                </div>
            </Dialog>
        </>
    )
}

export default TasksHeader
