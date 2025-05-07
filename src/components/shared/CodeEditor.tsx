'use client';

/**
 * frontend/src/components/shared/CodeEditor.tsx
 * Editor de código con resaltado de sintaxis utilizando el componente SyntaxHighlighter existente
 * con capacidad de edición a través de un textarea.
 * @version 1.0.0
 * @updated 2025-05-01
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/utils/cn';
import SyntaxHighlighter from '@/components/shared/SyntaxHighlighter';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  lineNumbers?: 'on' | 'off';
  minimap?: boolean;
}

/**
 * Editor de código con resaltado de sintaxis
 */
export default function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  height = '300px',
  className,
  placeholder = '// Write your code here...',
  readOnly = false,
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Para evitar errores de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detectar si estamos en modo oscuro comprobando una clase en el elemento html
  const isDarkMode = () => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Para mantener el editor en un tamaño apropiado
  const [editorDimensions, setEditorDimensions] = useState({ width: '100%', height });
  
  // Capturar las dimensiones cuando el usuario hace click para editar
  const activateEditing = useCallback(() => {
    if (readOnly || isEditing) return;
    
    // Ajustar el alto del textarea para que ocupe el espacio disponible
    // No consultamos el DOM en cada click para evitar reflows
    const availableHeight = Math.max(typeof height === 'string' ? parseInt(height) : 300, 600);
    
    setEditorDimensions({
      width: '100%',
      height: `${availableHeight}px`
    });
    
    // Aplazamos ligeramente el cambio de estado para evitar colisiones
    setTimeout(() => {
      setIsEditing(true);
    }, 0);
  }, [readOnly, height, isEditing]);
  
  // Inicializar dimensiones una vez al montar
  useEffect(() => {
    const availableHeight = Math.max(typeof height === 'string' ? parseInt(height) : 300, 400);
    setEditorDimensions({
      width: '100%',
      height: `${availableHeight}px`
    });
  }, [height]);

  // Si no está montado, mostrar un placeholder simple para evitar errores de hidratación
  if (!mounted) {
    return (
      <div
        className={cn(
          'border rounded-md flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900 dark:border-gray-700',
          className
        )}
        style={{ height }}
      >
        {placeholder || 'Loading editor...'}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'border rounded-md overflow-hidden relative',
        !readOnly && 'hover:border-primary-500 focus-within:border-primary-500',
        className
      )}
      style={{ minHeight: height }}
      onClick={() => !readOnly && activateEditing()}
    >
      {isEditing && !readOnly ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'w-full h-full p-4 focus:outline-none resize-none font-mono text-sm',
            isDarkMode() 
              ? 'bg-gray-900 text-gray-100'
              : 'bg-white text-gray-800'
          )}
          style={{ height: editorDimensions.height, minHeight: editorDimensions.height }}
          onBlur={() => setIsEditing(false)}
          autoFocus
          spellCheck="false"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      ) : (
        <div className="w-full h-full">
          <SyntaxHighlighter 
            language={language} 
            customStyle={{ 
              margin: 0,
              padding: '1rem',
              height: 'auto',
              minHeight: editorDimensions.height,
              borderRadius: 0,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              background: isDarkMode() ? '#1e1e1e' : '#f5f5f5'
            }}
          >
            {value || placeholder}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}
