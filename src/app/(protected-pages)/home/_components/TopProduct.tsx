'use client'

import Avatar from '@/components/ui/Avatar'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import GrowShrinkValue from '@/components/shared/GrowShrinkValue'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import { useRouter } from 'next/navigation'
import type { Product } from '../types'

type TopProductProps = {
    data: Product[]
}

const TopProduct = ({ data }: TopProductProps) => {
    const t = useTranslations('dashboard')
    const router = useRouter()

    const handleViewAll = () => {
        router.push('/modules/products/product-list')
    }

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>{t('topProducts')}</h4>
                <Button size="sm" onClick={handleViewAll}>
                    {t('viewDetails')}
                </Button>
            </div>
            <div className="mt-5">
                {data.map((product, index) => (
                    <div
                        key={product.id}
                        className={classNames(
                            'flex items-center justify-between py-2 dark:border-gray-600',
                            !isLastChild(data, index) && 'mb-2',
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Avatar
                                className="bg-white"
                                size={50}
                                src={product.img}
                                shape="round"
                            />
                            <div>
                                <div className="heading-text font-bold">
                                    {product.name}
                                </div>
                                <div>Sold: {product.sales}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <GrowShrinkValue
                                className="rounded-lg py-0.5 px-2 font-bold"
                                value={product.growShrink}
                                positiveClass="bg-success-subtle"
                                negativeClass="bg-error-subtle"
                                suffix="%"
                                positiveIcon="+"
                                negativeIcon=""
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}

export default TopProduct
