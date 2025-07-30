/**
 * Mock data para servicios de IA
 */

export interface ChatHistoryData {
  id: string
  message: string
  response: string
  timestamp: string
  userId: string
}

export interface ImageData {
  id: string
  url: string
  description: string
  createdAt: string
}

export interface GeneratedImageData {
  id: string
  prompt: string
  imageUrl: string
  generatedAt: string
}

export const chatHistoryData: ChatHistoryData[] = [
  {
    id: '1',
    message: 'Hola, ¿cómo estás?',
    response: 'Hola! Estoy bien, gracias por preguntar. ¿En qué puedo ayudarte hoy?',
    timestamp: '2024-01-01T10:00:00Z',
    userId: 'user1'
  }
]

export const imageData: ImageData[] = [
  {
    id: '1',
    url: '/images/demo-image.jpg',
    description: 'Imagen de demostración',
    createdAt: '2024-01-01T10:00:00Z'
  }
]

export const generatedImageData: GeneratedImageData[] = [
  {
    id: '1',
    prompt: 'Un paisaje hermoso al atardecer',
    imageUrl: '/images/generated-demo.jpg',
    generatedAt: '2024-01-01T10:00:00Z'
  }
]

export const mockAiData = {
  chatHistoryData,
  imageData,
  generatedImageData
}

export default mockAiData