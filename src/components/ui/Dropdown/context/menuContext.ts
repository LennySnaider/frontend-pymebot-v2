'use client'

import { createContext } from 'react'

export type MenuContextProps = {
    getItemProps: (
        key?: string
    ) => {
        'data-key'?: string
        onClick?: (e: MouseEvent) => void
        className?: string
    }
    activeKeys?: []
    onSelect?: (eventKey: string, e: MouseEvent) => void
}

const MenuContext = createContext<MenuContextProps>({
    getItemProps: () => ({
        className: '',
    }),
})

export const MenuContextProvider = MenuContext.Provider

export default MenuContext