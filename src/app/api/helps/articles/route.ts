import { NextRequest, NextResponse } from 'next/server';
import { mockArticleData } from '@/mock/data/helpCenterData';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return new NextResponse(
        JSON.stringify({
          message: 'No estás autorizado para acceder a este recurso'
        }),
        { status: 401 }
      );
    }

    // Get search parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const topic = searchParams.get('topic') || '';

    let filteredArticles = [...mockArticleData];

    // Filter by topic if provided
    if (topic) {
      filteredArticles = filteredArticles.filter(
        (article) => article.category.toLowerCase() === topic.toLowerCase()
      );
    }

    // Filter by search query if provided
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      filteredArticles = filteredArticles.filter((article) =>
        searchTerms.some(
          (term) =>
            article.title.toLowerCase().includes(term) ||
            article.content.toLowerCase().includes(term)
        )
      );
    }

    return NextResponse.json(filteredArticles);
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    return new NextResponse(
      JSON.stringify({
        message: 'Error al procesar la solicitud'
      }),
      { status: 500 }
    );
  }
}