import { mockHelpCenterCategoriesData, mockPopularArticles } from '@/mock/data/helpCenterData'

const getSupportHubCategories = async () => {
  try {
    // En producción, esto debería obtener datos reales desde una API o BD
    // Por ahora usamos datos mock
    return {
      categories: mockHelpCenterCategoriesData,
      popularArticles: mockPopularArticles
    }
  } catch (error) {
    return {
      categories: [],
      popularArticles: []
    }
  }
}

export default getSupportHubCategories