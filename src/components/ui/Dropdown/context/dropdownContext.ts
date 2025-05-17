'use client'

import { createContext } from 'react'

export type DropdownContextProps = {
    activeKey?: string
    onSelect?: (eventKey: string, e: MouseEvent) => void
    toggleClassName?: string
    disabled?: boolean
    triggeredProp?: 'click' | 'hover' | 'contextmenu'
    direction?: 'up' | 'down' | 'left' | 'right'
    menuClass?: string
    menuStyle?: object
    placement?: 
        | 'top-start'
        | 'top-center'
        | 'top-end'
        | 'bottom-start'
        | 'bottom-center'
        | 'bottom-end'
        | 'middle-start-top'
        | 'middle-start-bottom'
        | 'middle-end-top'
        | 'middle-end-bottom'
    transitionType?: 'none' | 'fade' | 'collapse'
}

const DropdownContext = createContext<DropdownContextProps>({})

export const DropdownContextProvider = DropdownContext.Provider

export default DropdownContext