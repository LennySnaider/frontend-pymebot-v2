/**
 * frontend/agentprop/src/app/(protected-pages)/modules/marketing/chat/_components/SelectWithAvatar.tsx
 * Componente Select con Avatar para selección de plantillas (solo cliente)
 * @version 1.0.0
 * @updated 2025-04-26
 */

'use client'

import { useMemo } from 'react'
import { Select, Avatar } from '@/components/ui'
import { HiCheck } from 'react-icons/hi'

interface SelectOption {
  value: string
  label: string
  avatarUrl?: string
}

interface SelectWithAvatarProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const SelectWithAvatar = ({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: SelectWithAvatarProps) => {
  
  // Transformar las opciones para el formato que espera Select
  const selectOptions = useMemo(() => 
    options.map(option => ({
      value: option.value,
      label: option.label,
      data: {
        avatarUrl: option.avatarUrl
      }
    })), 
  [options])
  
  // Encontrar la opción seleccionada actualmente
  const selectedOption = useMemo(() => 
    selectOptions.find(option => option.value === value) || null,
  [selectOptions, value])
  
  // Manejar el cambio de selección
  const handleChange = (selected: any) => {
    if (selected && selected.value) {
      onChange(selected.value)
    }
  }
  

  return (
    <Select 
      className="w-full"
      size="sm"
      placeholder={placeholder || "Seleccionar"}
      options={selectOptions}
      value={selectedOption}
      onChange={handleChange}
      components={{
        Option: ({ innerProps, label, isSelected, isDisabled, data }) => (
          <div
            className={`select-option ${
              isSelected ? 'text-primary bg-primary-subtle' : ''
            } ${
              !isDisabled && !isSelected ? 'hover:text-gray-800 dark:hover:text-gray-100' : ''
            } ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            {...innerProps}
          >
            <div className="flex items-center gap-2">
              <Avatar 
                size={24} 
                shape="circle" 
                src={data.data?.avatarUrl || '/img/avatars/thumb-2.jpg'} 
              />
              <span>{label}</span>
            </div>
            {isSelected && <HiCheck className="text-xl" />}
          </div>
        )
      }}
    />
  )
}

export default SelectWithAvatar
