/**
 * frontend/src/components/ui/dropdown-menu/dropdown-menu.tsx
 * Componentes de menú desplegable compatible con la API de pacientes
 * @version 1.0.0
 * @updated 2025-06-05
 */

'use client'

import React from 'react'
import DropdownRoot from '@/components/ui/Dropdown/Dropdown'
import DropdownToggle from '@/components/ui/Dropdown/DropdownToggle'
import DropdownMenuOriginal from '@/components/ui/Dropdown/DropdownMenu'
import DropdownItem from '@/components/ui/Dropdown/DropdownItem'
import DropdownSub from '@/components/ui/Dropdown/DropdownSub'
import DropdownSubItem from '@/components/ui/Dropdown/DropdownSubItem'
import classNames from 'classnames'

export interface DropdownMenuProps {
  children: React.ReactNode
  className?: string
}

// Exportamos DropdownRoot como DropdownMenu para mantener la compatibilidad
export const DropdownMenu = DropdownRoot

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <DropdownToggle
    ref={ref}
    className={classNames('outline-none', className)}
    {...props}
  >
    {children}
  </DropdownToggle>
))
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuOriginal
    ref={ref}
    className={classNames(
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-1 min-w-[10rem]',
      className
    )}
    {...props}
  >
    {children}
  </DropdownMenuOriginal>
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? React.cloneElement(children as React.ReactElement, { ref, ...props }) : (
    <DropdownItem
      ref={ref}
      className={classNames(
        'cursor-pointer flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </DropdownItem>
  )
  
  return Comp
})
DropdownMenuItem.displayName = 'DropdownMenuItem'

// Componentes adicionales para compatibilidad API
export const DropdownMenuCheckboxItem = DropdownMenuItem
export const DropdownMenuRadioItem = DropdownMenuItem
export const DropdownMenuLabel = DropdownMenuItem
export const DropdownMenuSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={classNames('h-px my-1 bg-gray-200 dark:bg-gray-700', className)}
    {...props}
  />
)
export const DropdownMenuGroup = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={classNames('', className)} {...props}>
    {children}
  </div>
)
export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuSub = DropdownSub
export const DropdownMenuSubContent = DropdownMenuContent
export const DropdownMenuSubTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <DropdownSubItem
    ref={ref}
    className={classNames(
      'flex cursor-default select-none items-center px-3 py-2 text-sm outline-none',
      className
    )}
    {...props}
  >
    {children}
    <span className="ml-auto">→</span>
  </DropdownSubItem>
))
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

export const DropdownMenuRadioGroup = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={classNames('', className)} {...props}>
    {children}
  </div>
)