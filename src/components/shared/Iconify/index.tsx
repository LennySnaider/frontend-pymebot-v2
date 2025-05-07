/**
 * frontend/src/components/shared/Iconify/index.tsx
 * Componente para renderizar iconos desde diferentes librerías
 * @version 1.0.0
 * @updated 2025-06-05
 */

'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface IconifyProps {
  icon: string;
  width?: number | string;
  height?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const Iconify: React.FC<IconifyProps> = ({
  icon,
  width,
  height,
  color,
  className = '',
  style,
  onClick,
  ...other
}) => {
  return (
    <Icon
      icon={icon}
      width={width || 20}
      height={height || 20}
      color={color}
      style={style}
      onClick={onClick}
      className={className}
      {...other}
    />
  );
};

export default Iconify;