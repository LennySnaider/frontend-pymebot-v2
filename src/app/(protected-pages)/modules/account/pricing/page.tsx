import Card from '@/components/ui/Card'
import Plans from './_components/Plans'
import PaymentCycleToggle from './_components/PaymentCycleToggle'
import Faq from './_components/Faq'
import PaymentDialog from './_components/PaymentDialog'
import getPricingPlans from '@/server/actions/getPricingPlans'
import type { PageProps } from '@/@types/common'
import type { GetPricingPanResponse } from './types'

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams
    const pricingPlans = await getPricingPlans()

    // Convert PricingPlan[] to GetPricingPanResponse format
    const data: GetPricingPanResponse = {
        featuresModel: [],
        plans: pricingPlans.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: {
                monthly: plan.price.monthly,
                annually: plan.price.yearly,
            },
            features: plan.features.map(f => f.id),
            recommended: plan.popular || false,
        }))
    }

    return (
        <>
            <Card className="mb-4">
                <div className="flex items-center justify-between mb-8">
                    <h3>Pricing</h3>
                    <PaymentCycleToggle />
                </div>
                <Plans
                    data={data}
                    subcription={params.subcription as string}
                    cycle={params.cycle as string}
                />
            </Card>
            <Faq />
            <PaymentDialog />
        </>
    )
}
