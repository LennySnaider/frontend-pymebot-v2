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

export interface TaskData {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  assignedTo: string
  projectId: string
  createdAt: string
}

export interface IssueData {
  id: string
  title: string
  description: string
  type: 'bug' | 'feature' | 'improvement'
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  projectId: string
  createdAt: string
}

export interface ScrumboardData {
  id: string
  name: string
  columns: Array<{
    id: string
    title: string
    tasks: TaskData[]
  }>
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

export const projectListData = projectsData

export const projectDetailsData = projectsData

export const tasksData: TaskData[] = [
  {
    id: '1',
    title: 'Tarea de ejemplo',
    description: 'Descripción de la tarea',
    status: 'pending',
    priority: 'medium',
    assignedTo: 'Usuario Demo',
    projectId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

export const issueData: IssueData[] = [
  {
    id: '1',
    title: 'Issue de ejemplo',
    description: 'Descripción del issue',
    type: 'bug',
    status: 'open',
    priority: 'high',
    projectId: '1',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

export const scrumboardData: ScrumboardData[] = [
  {
    id: '1',
    name: 'Tablero Scrum Demo',
    columns: [
      {
        id: '1',
        title: 'Por hacer',
        tasks: []
      }
    ]
  }
]

export default projectsData