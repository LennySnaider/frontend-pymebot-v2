// index.tsx - Punto de entrada principal para el componente Checkbox
// Este archivo exporta tanto el componente Checkbox como sus subcomponentes

import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import _Checkbox, { CheckboxProps } from './Checkbox'
import CheckboxGroup from './Group'

export type { CheckboxProps } from './Checkbox'
export type { CheckboxGroupProps } from './Group'
export type { CheckboxGroupValue, CheckboxValue } from './context'

type CompoundedComponent = ForwardRefExoticComponent<
    CheckboxProps & RefAttributes<HTMLInputElement>
> & {
    Group: typeof CheckboxGroup
}

const Checkbox = _Checkbox as CompoundedComponent

Checkbox.Group = CheckboxGroup

export { Checkbox }

export default Checkbox
