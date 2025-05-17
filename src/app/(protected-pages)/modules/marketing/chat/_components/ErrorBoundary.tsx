'use client'

import React, { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Actualizar estado para que el siguiente renderizado muestre la UI alternativa
    return { 
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Puedes registrar el error en un servicio de reporting
    console.error('Error en componente:', error)
    console.error('Error stack:', errorInfo.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI alternativa
      return this.props.fallback || (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <h3 className="text-red-600 dark:text-red-400">Error al cargar el componente</h3>
          <div className="mt-2 text-red-700 dark:text-red-300 text-sm">
            {this.state.error?.message || "Se ha producido un error inesperado"}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-3 py-1 text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700"
          >
            Recargar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary