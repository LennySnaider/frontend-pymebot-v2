'use client';

import React from 'react';

export interface InputNumberProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number | null) => void;
}

const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  ({ className, min, max, step = 1, precision, value, defaultValue, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      if (inputValue === '') {
        onChange?.(null);
        return;
      }
      
      const numValue = parseFloat(inputValue);
      
      if (!isNaN(numValue)) {
        let finalValue = numValue;
        
        // Apply precision
        if (precision !== undefined) {
          finalValue = parseFloat(numValue.toFixed(precision));
        }
        
        // Apply min/max constraints
        if (min !== undefined && finalValue < min) {
          finalValue = min;
        }
        if (max !== undefined && finalValue > max) {
          finalValue = max;
        }
        
        onChange?.(finalValue);
      }
    };

    return (
      <input
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={`
          rounded-md border border-gray-300 px-3 py-2 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className || ''}
        `}
        {...props}
      />
    );
  }
);

InputNumber.displayName = 'InputNumber';

export default InputNumber;