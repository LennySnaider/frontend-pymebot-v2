import ToastWrapper from './ToastWrapper'
import type { ToastProps, ToastWrapperProps } from './ToastWrapper'
import { NotificationPlacement } from '../@types/placement'
import type { ReactNode } from 'react'

// Default placement value - hardcoded to avoid import issues
const DEFAULT_PLACEMENT = 'top-end' as NotificationPlacement

export const toastDefaultProps = {
    placement: DEFAULT_PLACEMENT as NotificationPlacement,
    offsetX: 30,
    offsetY: 30,
    transitionType: 'scale' as const,
    block: false,
}

export interface Toast {
    push(
        message: ReactNode,
        options?: ToastProps,
    ): string | undefined | Promise<string | undefined>
    remove(key: string): void
    removeAll(): void
    success(message: ReactNode, options?: ToastProps): string | undefined | Promise<string | undefined>
    info(message: ReactNode, options?: ToastProps): string | undefined | Promise<string | undefined>
    warning(message: ReactNode, options?: ToastProps): string | undefined | Promise<string | undefined>
    error(message: ReactNode, options?: ToastProps): string | undefined | Promise<string | undefined>
}

const defaultWrapperId = 'default'
const wrappers = new Map()

function castPlacment(placement: NotificationPlacement) {
    if (/\top\b/.test(placement)) {
        return 'top-full'
    }

    if (/\bottom\b/.test(placement)) {
        return 'bottom-full'
    }
}

async function createWrapper(wrapperId: string, props: ToastProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [wrapper] = (await ToastWrapper.getInstance(
        props as ToastWrapperProps,
    )) as any

    wrappers.set(wrapperId || defaultWrapperId, wrapper)

    return wrapper
}

function getWrapper(wrapperId?: string) {
    if (wrappers.size === 0) {
        return null
    }
    return wrappers.get(wrapperId || defaultWrapperId)
}

// Crear la función toast base
const toast = ((message: ReactNode, options = {}) => {
    return toast.push(message, options);
}) as Toast;

// Implementar métodos requeridos
toast.push = (message, options = toastDefaultProps as ToastProps) => {
    let id = options.placement
    if (options.block) {
        id = castPlacment(options.placement as NotificationPlacement)
    }

    const wrapper = getWrapper(id)

    if (wrapper?.current) {
        return wrapper.current.push(message)
    }

    return createWrapper(id ?? '', options).then((ref) => {
        return ref.current?.push(message)
    })
}

toast.remove = (key) => {
    wrappers.forEach((elm) => {
        elm.current.remove(key)
    })
}

toast.removeAll = () => {
    wrappers.forEach((elm) => elm.current.removeAll())
}

// Implementar métodos de tipos específicos de toast
toast.success = (message, options = {}) => {
    return toast.push(message, { 
        ...toastDefaultProps,
        ...options,
        type: 'success'
    })
}

toast.info = (message, options = {}) => {
    return toast.push(message, { 
        ...toastDefaultProps,
        ...options,
        type: 'info'
    })
}

toast.warning = (message, options = {}) => {
    return toast.push(message, { 
        ...toastDefaultProps,
        ...options,
        type: 'warning'
    })
}

toast.error = (message, options = {}) => {
    return toast.push(message, { 
        ...toastDefaultProps,
        ...options,
        type: 'danger'
    })
}

export default toast;