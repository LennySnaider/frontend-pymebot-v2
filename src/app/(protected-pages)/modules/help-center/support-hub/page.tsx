import TopSection from './_components/TopSection'
import BodySection from './_components/BodySection'
import getSupportHubCategories from '@/server/actions/getSupportHubCategories'

export default async function Page() {
    const data = await getSupportHubCategories()

    return (
        <>
            <TopSection />
            <BodySection data={data as any} />
        </>
    )
}
