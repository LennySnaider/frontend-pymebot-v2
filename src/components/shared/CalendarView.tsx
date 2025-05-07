import classNames from '@/utils/classNames'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid/index.js'
import timeGridPlugin from '@fullcalendar/timegrid/index.js'
import interactionPlugin from '@fullcalendar/interaction/index.js'
import { CalendarOptions } from '@fullcalendar/core/index.js'
import { forwardRef, ForwardedRef } from 'react'

type EventColors = Record<
    string,
    {
        bg: string
        text: string
    }
>

interface CalendarViewProps extends CalendarOptions {
    wrapperClass?: string
    eventColors?: (colors: EventColors) => EventColors
}

const defaultColorList: Record<
    string,
    {
        bg: string
        text: string
    }
> = {
    red: {
        bg: 'bg-[#fbddd9]',
        text: 'text-gray-900',
    },
    orange: {
        bg: 'bg-[#ffc6ab]',
        text: 'text-gray-900',
    },
    yellow: {
        bg: 'bg-[#ffd993]',
        text: 'text-gray-900',
    },
    green: {
        bg: 'bg-[#bee9d3]',
        text: 'text-gray-900',
    },
    blue: {
        bg: 'bg-[#bce9fb]',
        text: 'text-gray-900',
    },
    purple: {
        bg: 'bg-[#ccbbfc]',
        text: 'text-gray-900',
    },
}

// Modificar para usar forwardRef y pasar la referencia a FullCalendar
const CalendarView = forwardRef(
    (props: CalendarViewProps, ref: ForwardedRef<FullCalendar>) => {
        const {
            wrapperClass,
            eventColors = () => defaultColorList,
            ...rest
        } = props

        return (
            <div className={classNames('calendar', wrapperClass)}>
                <FullCalendar
                    ref={ref} // Pasar la referencia a FullCalendar
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'title',
                        center: '',
                        right: 'prev,next', // Eliminar botones de month, week, day
                    }}
                    eventContent={(arg) => {
                        const { extendedProps } = arg.event
                        const { isEnd, isStart } = arg
                        return (
                            <div
                                className={classNames(
                                    'custom-calendar-event',
                                    extendedProps?.eventColor
                                        ? (eventColors(defaultColorList) ||
                                              defaultColorList)[
                                              extendedProps.eventColor
                                          ]?.bg || 'bg-blue-100'
                                        : 'bg-blue-100',
                                    extendedProps?.eventColor
                                        ? (eventColors(defaultColorList) ||
                                              defaultColorList)[
                                              extendedProps.eventColor
                                          ]?.text || 'text-gray-900'
                                        : 'text-gray-900',
                                    isEnd &&
                                        !isStart &&
                                        'rounded-tl-none! rounded-bl-none! !rtl:rounded-tr-none !rtl:rounded-br-none',
                                    !isEnd &&
                                        isStart &&
                                        'rounded-tr-none! rounded-br-none! !rtl:rounded-tl-none !rtl:rounded-bl-none',
                                )}
                            >
                                {!(isEnd && !isStart) && (
                                    <span>{arg.timeText}</span>
                                )}
                                <span className="font-bold ml-1 rtl:mr-1">
                                    {arg.event.title}
                                </span>
                            </div>
                        )
                    }}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    {...rest}
                />
            </div>
        )
    },
)

// Añadir displayName para evitar el error de ESLint
CalendarView.displayName = 'CalendarView'

export default CalendarView
