import EditArticleHeader from './_components/EditArticleHeader'
import EditArticleBody from './_components/EditArticleBody'
import EditArticleFooter from './_components/EditArticleFooter'
import NotFound from '@/components/shared/NotFound'
import getArticle from '@/server/actions/getArticle'
import isEmpty from 'lodash/isEmpty'

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params

    const data = await getArticle(params.id)

    if (isEmpty(data)) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <NotFound message="No article found!" />
            </div>
        )
    }

    return (
        <>
            <div className="max-w-[1200px] mx-auto w-full">
                <div className="flex flex-col gap-2">
                    <EditArticleHeader
                        {...(data as any)}
                        tags={(data as any).tags.map((tag: any) => ({
                            ...tag,
                            id: tag.id.toString(),
                        }))}
                    />
                    <EditArticleBody content={(data as any).content} />
                </div>
            </div>
            <EditArticleFooter />
        </>
    )
}
