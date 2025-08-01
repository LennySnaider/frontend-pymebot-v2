'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select, { Option as DefaultOption } from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import {
    TbVideo,
    TbCheckbox,
    TbCoffee,
    TbCalendarStar,
    TbPresentation,
    TbBell,
} from 'react-icons/tb'
import { LuTreePalm } from 'react-icons/lu'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import uniqueId from 'lodash/uniqueId'
import { components } from 'react-select'
import type { Event } from '../types'
import type { ZodType } from 'zod'
import type { ReactNode } from 'react'
import type { ControlProps, OptionProps } from 'react-select'

export type FormSchema = {
    type: Event
    label: string
    time: number
}

type EventOption = { label: string; value: Event; color: string }

const { Control } = components

export const eventTypes: Record<
    Event,
    { label: string; icon: ReactNode; color: string }
> = {
    task: {
        label: 'task',
        icon: <TbCheckbox />,
        color: 'bg-purple-200 dark:bg-purple-200',
    },
    meeting: {
        label: 'meeting',
        icon: <TbVideo />,
        color: 'bg-sky-200 dark:bg-sky-200',
    },
    holiday: {
        label: 'holiday',
        icon: <LuTreePalm />,
        color: 'bg-amber-200 dark:bg-amber-200',
    },
    breaks: {
        label: 'break',
        icon: <TbCoffee />,
        color: 'bg-orange-200 dark:bg-orange-200',
    },
    event: {
        label: 'event',
        icon: <TbCalendarStar />,
        color: 'bg-emerald-200 dark:bg-emerald-200',
    },
    workshops: {
        label: 'workshop',
        icon: <TbPresentation />,
        color: 'bg-rose-200 dark:bg-rose-200',
    },
    reminders: {
        label: 'reminder',
        icon: <TbBell />,
        color: 'bg-teal-200 dark:bg-teal-200',
    },
}

const eventOptions: EventOption[] = [
    { label: 'task', value: 'task', color: 'bg-purple-200' },
    { label: 'meeting', value: 'meeting', color: 'bg-sky-200' },
    { label: 'breaks', value: 'breaks', color: 'bg-orange-200' },
    { label: 'event', value: 'event', color: 'bg-emerald-200' },
    { label: 'workshops', value: 'workshops', color: 'bg-rose-200' },
    { label: 'reminders', value: 'reminders', color: 'bg-teal-200' },
]

const timeOption = [
    { value: 0, label: '12:00 AM' },
    { value: 1, label: '1:00 AM' },
    { value: 2, label: '2:00 AM' },
    { value: 3, label: '3:00 AM' },
    { value: 4, label: '4:00 AM' },
    { value: 5, label: '5:00 AM' },
    { value: 6, label: '6:00 AM' },
    { value: 7, label: '7:00 AM' },
    { value: 8, label: '8:00 AM' },
    { value: 9, label: '9:00 AM' },
    { value: 10, label: '10:00 AM' },
    { value: 11, label: '11:00 AM' },
    { value: 12, label: '12:00 PM' },
    { value: 13, label: '1:00 PM' },
    { value: 14, label: '2:00 PM' },
    { value: 15, label: '3:00 PM' },
    { value: 16, label: '4:00 PM' },
    { value: 17, label: '5:00 PM' },
    { value: 18, label: '6:00 PM' },
    { value: 19, label: '7:00 PM' },
    { value: 20, label: '8:00 PM' },
    { value: 21, label: '9:00 PM' },
    { value: 22, label: '10:00 PM' },
    { value: 23, label: '11:00 PM' },
]

const CustomSelectOption = (props: OptionProps<EventOption>) => {
    return (
        <DefaultOption<EventOption>
            {...props}
            customLabel={(_, label) => (
                <span className="flex items-center gap-2">
                    <span>{label}</span>
                </span>
            )}
        />
    )
}

const CustomControl = ({ children, ...props }: ControlProps<EventOption>) => {
    const selected = props.getValue()[0]
    return (
        <Control {...props}>
            {selected && <></>}
            {children}
        </Control>
    )
}

const validationSchema = z.object({
    type: z.union([
        z.literal('meeting'),
        z.literal('task'),
        z.literal('holiday'),
        z.literal('breaks'),
        z.literal('event'),
        z.literal('workshops'),
        z.literal('reminders'),
    ]),
    label: z.string({ required_error: 'Please enter event name' }),
    time: z.number({ required_error: 'Please select a time' }),
})

const CreateEventDialog = ({
    onCreateEvent,
}: {
    onCreateEvent: (value: FormSchema & { id: string }) => void
}) => {
    const t = useTranslations('dashboard')
    const [dialogOpen, setDialogOpen] = useState(false)

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        control,
    } = useForm<FormSchema>({
        resolver: zodResolver(validationSchema),
    })

    const handleDialogClose = () => {
        reset()
        setDialogOpen(false)
    }

    const onSubmit = (value: FormSchema) => {
        onCreateEvent({
            id: uniqueId('schedule-event-'),
            ...value,
        })
        handleDialogClose()
    }

    return (
        <>
            <Button block onClick={() => setDialogOpen(true)}>
                {t('addEvent')}
            </Button>
            <Dialog
                isOpen={dialogOpen}
                onClose={handleDialogClose}
                onRequestClose={handleDialogClose}
            >
                <h4>{t('newEvent')}</h4>
                <Form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
                    <FormItem
                        label={t('eventName')}
                        invalid={Boolean(errors.label)}
                        errorMessage={errors.label?.message}
                    >
                        <Controller
                            name="label"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder={t('eventName')}
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label={t('eventType')}
                        invalid={Boolean(errors.type)}
                        errorMessage={
                            errors.type?.message && t('selectType')
                        }
                    >
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <Select<EventOption>
                                    instanceId="event-type"
                                    options={eventOptions}
                                    {...field}
                                    components={{
                                        Option: CustomSelectOption,
                                        Control: CustomControl,
                                    }}
                                    placeholder={t('eventType')}
                                    value={eventOptions.filter(
                                        (option) =>
                                            option.value === field.value,
                                    )}
                                    onChange={(option) =>
                                        field.onChange(option?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label={t('time')}
                        invalid={Boolean(errors.time)}
                        errorMessage={errors.time?.message}
                    >
                        <Controller
                            name="time"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={timeOption}
                                    {...field}
                                    placeholder={t('selectTime')}
                                    value={timeOption.filter(
                                        (option) =>
                                            option.value === field.value,
                                    )}
                                    onChange={(option) =>
                                        field.onChange(option?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <Button
                        block
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                    >
                        {t('create')}
                    </Button>
                </Form>
            </Dialog>
        </>
    )
}

export default CreateEventDialog
