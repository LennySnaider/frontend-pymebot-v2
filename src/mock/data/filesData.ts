/**
 * Mock data para archivos
 * Datos temporales para el sistema de archivos
 */

export interface FileData {
  id: string
  name: string
  type: 'file' | 'folder'
  size?: number
  createdAt: string
  modifiedAt: string
  path: string
}

export const filesData: FileData[] = [
  {
    id: '1',
    name: 'Documentos',
    type: 'folder',
    createdAt: '2024-01-01T00:00:00Z',
    modifiedAt: '2024-01-01T00:00:00Z',
    path: '/documentos'
  },
  {
    id: '2',
    name: 'Templates',
    type: 'folder',
    createdAt: '2024-01-01T00:00:00Z',
    modifiedAt: '2024-01-01T00:00:00Z',
    path: '/templates'
  }
]

export default filesData