/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
    useState,
    useImperativeHandle,
    useRef,
    useCallback,
    cloneElement,
    createRef,
} from 'react'
import classNames from 'classnames'
import chainedFunction from '../utils/chainedFunction'
import { motion } from 'framer-motion'
import { getPlacementTransition } from './transition'
import { createRoot } from 'react-dom/client'
import { NotificationPlacement } from '../@types/placement'
import type { DetailedReactHTMLElement, ReactNode, Ref } from 'react'

// Default placement value - hardcoded to avoid import issues
const DEFAULT_PLACEMENT = 'top-end' as NotificationPlacement

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NodeProps = DetailedReactHTMLElement<any, HTMLDivElement>

type Message = {
    key: string
    visible: boolean
    node: NodeProps
}

const useMessages = (msgKey: string) => {
    const [messages, setMessages] = useState<Message[]>([])

    const getKey = useCallback(
        (key: string) => {
            if (typeof key === 'undefined' && messages.length) {
                key = messages[messages.length - 1].key
            }
            return key
        },
        [messages],
    )

    const push = useCallback(
        (message: NodeProps) => {
            const key = msgKey || '_' + Math.random().toString(36).substr(2, 12)
            setMessages([...messages, { key, visible: true, node: message }])
            return key
        },
        [messages, msgKey],
    )

    const removeAll = useCallback(() => {
        setMessages(messages.map((msg) => ({ ...msg, visible: false })))
        setTimeout(() => {
            setMessages([])
        }, 50)
    }, [messages])

    const remove = useCallback(
        (key: string) => {
            setMessages(
                messages.map((elm) => {
                    if (elm.key === getKey(key)) {
                        elm.visible = false
                    }
                    return elm
                }),
            )

            setTimeout(() => {
                setMessages(messages.filter((msg) => msg.visible))
            }, 50)
        },
        [messages, getKey],
    )

    return { messages, push, removeAll, remove }
}

export interface ToastProps {
    transitionType?: 'scale' | 'fade'
    placement?: NotificationPlacement | 'top-full' | 'bottom-full'
    offsetX?: string | number
    offsetY?: string | number
    block?: boolean
}

export interface ToastWrapperInstance {
    root: HTMLElement | null
    push: (message: NodeProps) => string
    remove: (key: string) => void
    removeAll: () => void
}

export interface ToastWrapperProps extends ToastProps {
    messageKey: string
    callback: (ref: HTMLDivElement | null) => void
    ref: Ref<ToastWrapperInstance>
    wrapper?: HTMLElement | (() => HTMLElement)
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const ToastWrapper = (props: ToastWrapperProps) => {
    const rootRef = useRef<HTMLDivElement | null>(null)

    const {
        transitionType = 'scale',
        placement = DEFAULT_PLACEMENT as NotificationPlacement,
        offsetX = 30,
        offsetY = 30,
        messageKey,
        block = false,
        ref,
        callback,
        ...rest
    } = props

    const { push, removeAll, remove, messages } = useMessages(messageKey)

    useImperativeHandle(ref, () => {
        return { root: rootRef.current, push, removeAll, remove }
    })

    const placementTransition = getPlacementTransition({
        offsetX,
        offsetY,
        placement: placement as NotificationPlacement,
        transitionType,
    }) || {
        default: {},
        variants: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 }
        }
    }

    const messageElements = messages.map((item) => {
        return (
            <motion.div
                key={item.key}
                className={'toast-wrapper'}
                initial={placementTransition?.variants?.initial || { opacity: 0 }}
                variants={placementTransition?.variants || {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 }
                }}
                animate={item.visible ? 'animate' : 'exit'}
                transition={{ duration: 0.15, type: 'tween' }}
            >
                {cloneElement(
                    item.node as DetailedReactHTMLElement<any, HTMLElement>,
                    {
                        // Solo pasar props que sean relevantes para el componente hijo
                        ref,
                        onClose: chainedFunction(
                            item.node?.props?.onClose,
                            () => remove(item.key),
                        ),
                        className: classNames(item.node?.props?.className),
                    },
                )}
            </motion.div>
        )
    })

    return (
        <div
            style={placementTransition?.default || {}}
            ref={(thisRef) => {
                rootRef.current = thisRef
                callback?.(thisRef)
            }}
            className={classNames('toast', block && 'w-full')}
        >
            {messageElements}
        </div>
    )
}

ToastWrapper.getInstance = (props: ToastWrapperProps) => {
    const { wrapper, ...rest } = props

    const wrapperRef = createRef<ToastWrapperInstance>()

    const wrapperElement =
        (typeof wrapper === 'function' ? wrapper() : wrapper) || document.body

    return new Promise((resolve) => {
        const renderCallback = () => {
            resolve([wrapperRef, unmount])
        }

        function renderElement(element: ReactNode) {
            const mountElement = document.createElement('div')

            wrapperElement.appendChild(mountElement)

            const root = createRoot(mountElement)

            root.render(element)

            return root
        }

        const { unmount } = renderElement(
            <ToastWrapper
                {...rest}
                ref={wrapperRef}
                callback={renderCallback}
            />,
        )
    })
}

export default ToastWrapper
