import { mockArticleData } from '@/mock/data/helpCenterData'

const getArticle = async (id: string) => {
  try {
    // En producción, esto debería obtener datos reales desde una API o BD
    // Por ahora usamos datos mock
    const article = mockArticleData.find((item) => item.id === id)
    return article
  } catch (error) {
    return {}
  }
}

export default getArticle