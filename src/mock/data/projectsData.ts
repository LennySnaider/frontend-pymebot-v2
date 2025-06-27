/**
 * Mock data para proyectos
 */

export interface ProjectData {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'completed'
  createdAt: string
  updatedAt: string
}

export const projectsData: ProjectData[] = [
  {
    id: '1',
    name: 'Proyecto Demo',
    description: 'Proyecto de demostración',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

export default projectsData