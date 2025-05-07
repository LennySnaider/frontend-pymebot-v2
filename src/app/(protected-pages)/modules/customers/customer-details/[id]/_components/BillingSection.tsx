/**
 * frontend/src/app/(protected-pages)/modules/customers/customer-details/[id]/_components/BillingSection.tsx
 * Sección de facturación del cliente con soporte para internacionalización.
 * @version 1.0.0
 * @updated 2025-04-01
 */

'use client'

import { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Tag from '@/components/ui/Tag'
import toast from '@/components/ui/toast'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import CreditCardDialog from '@/components/view/CreditCardDialog'
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    createColumnHelper,
} from '@tanstack/react-table'
import { NumericFormat } from 'react-number-format'
import { countryList } from '@/constants/countries.constant'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'

type OrderHistory = {
    id: string
    item: string
    status: string
    amount: number
    date: number
}

type PaymentMethod = {
    cardHolderName: string
    cardType: string
    expMonth: string
    expYear: string
    last4Number: string
    primary: boolean
}

type BillingSectionProps = {
    data: Partial<{
        orderHistory: OrderHistory[]
        personalInfo: {
            address: string
            postcode: string
            city: string
            country: string
        }
        paymentMethod: PaymentMethod[]
    }>
}

const { Tr, Td, TBody } = Table

const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
]

const statusColor: Record<string, string> = {
    paid: 'bg-emerald-500',
    pending: 'bg-amber-400',
}

const BillingSection = ({ data }: BillingSectionProps) => {
    const t = useTranslations()

    const [selectedCard, setSelectedCard] = useState<{
        cardHolderName: string
        ccNumber: string
        cardExpiry: string
        code: string
    }>({
        cardHolderName: '',
        ccNumber: '',
        cardExpiry: '',
        code: '',
    })

    const [dialogOpen, setDialogOpen] = useState(false)

    const columnHelper = createColumnHelper<OrderHistory>()

    const columns = useMemo(
        () => [
            columnHelper.accessor('item', {
                header: t('customers.details.billing.product'),
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{row.item}</span>
                        </div>
                    )
                },
            }),
            columnHelper.accessor('status', {
                header: t('customers.details.billing.status'),
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-2">
                            <Badge className={statusColor[row.status]} />
                            <span className="heading-text font-bold capitalize">
                                {row.status}
                            </span>
                        </div>
                    )
                },
            }),
            columnHelper.accessor('date', {
                header: t('customers.details.billing.date'),
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center">
                            {dayjs.unix(row.date).format('MM/DD/YYYY')}
                        </div>
                    )
                },
            }),
            columnHelper.accessor('amount', {
                header: t('customers.details.billing.amount'),
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center">
                            <NumericFormat
                                displayType="text"
                                value={(
                                    Math.round(row.amount * 100) / 100
                                ).toFixed(2)}
                                prefix={'$'}
                                thousandSeparator={true}
                            />
                        </div>
                    )
                },
            }),
        ],
        [t, columnHelper],
    )

    const table = useReactTable({
        data: data.orderHistory || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    const countryName = useMemo(() => {
        return countryList.find(
            (country) => country.value === data.personalInfo?.country,
        )?.label
    }, [data.personalInfo?.country])

    const handleEdit = (cardHolderName: string, cardExpiry: string) => {
        setSelectedCard({
            cardHolderName,
            ccNumber: '',
            cardExpiry,
            code: '',
        })
        setDialogOpen(true)
    }

    const handleEditClose = () => {
        setSelectedCard({
            cardHolderName: '',
            ccNumber: '',
            cardExpiry: '',
            code: '',
        })
        setDialogOpen(false)
    }

    const handleSubmit = () => {
        handleEditClose()
        toast.push(
            <Notification
                title={t('customers.details.billing.updateSuccess')}
                type="success"
            />,
            {
                placement: 'top-center',
            },
        )
    }

    return (
        <>
            <h6 className="mb-4">
                {t('customers.details.billing.purchaseHistory')}
            </h6>
            <Table>
                <TBody>
                    {table
                        .getRowModel()
                        .rows.slice(0, 10)
                        .map((row) => {
                            return (
                                <Tr key={row.id}>
                                    {row.getVisibleCells().map((cell) => {
                                        return (
                                            <Td key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </Td>
                                        )
                                    })}
                                </Tr>
                            )
                        })}
                </TBody>
            </Table>
            <h6 className="mt-8">{t('customers.details.billing.addresses')}</h6>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Card>
                    <div className="font-bold heading-text">
                        {t('customers.details.billing.billingAddress')}
                    </div>
                    <div className="mt-4 flex flex-col gap-1 font-semibold">
                        <span>{data.personalInfo?.address}</span>
                        <span>{data.personalInfo?.city}</span>
                        <span>{data.personalInfo?.postcode}</span>
                        <span>{countryName}</span>
                    </div>
                </Card>
                <Card>
                    <div className="font-bold heading-text">
                        {t('customers.details.billing.deliveryAddress')}
                    </div>
                    <div className="mt-4 flex flex-col gap-1 font-semibold">
                        <span>{data.personalInfo?.address}</span>
                        <span>{data.personalInfo?.city}</span>
                        <span>{data.personalInfo?.postcode}</span>
                        <span>{countryName}</span>
                    </div>
                </Card>
            </div>
            <h6 className="mt-8">
                {t('customers.details.billing.paymentMethods')}
            </h6>
            <Card className="mt-4" bodyClass="py-0">
                {data.paymentMethod?.map((card, index) => (
                    <div
                        key={card.last4Number}
                        className={classNames(
                            'flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4',
                            !isLastChild(data.paymentMethod || [], index) &&
                                'border-b border-gray-200 dark:border-gray-600',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {card.cardType === 'VISA' && (
                                <img src="/img/others/img-8.png" alt="visa" />
                            )}
                            {card.cardType === 'MASTER' && (
                                <img src="/img/others/img-9.png" alt="master" />
                            )}
                            <div>
                                <div className="flex items-center">
                                    <div className="text-gray-900 dark:text-gray-100 font-semibold">
                                        {card.cardHolderName} ••••{' '}
                                        {card.last4Number}
                                    </div>
                                    {card.primary && (
                                        <Tag className="bg-sky-100 text-primary dark:bg-primary/20 dark:text-primary rounded-md border-0 mx-2">
                                            <span className="capitalize">
                                                {' '}
                                                {t(
                                                    'customers.details.billing.primary',
                                                )}{' '}
                                            </span>
                                        </Tag>
                                    )}
                                </div>
                                <span>
                                    {t('customers.details.billing.expired')}{' '}
                                    {months[parseInt(card.expMonth) - 1]} 20
                                    {card.expYear}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                onClick={() =>
                                    handleEdit(
                                        card.cardHolderName,
                                        `${card.expMonth}${card.expYear}`,
                                    )
                                }
                            >
                                {t('common.edit')}
                            </Button>
                        </div>
                    </div>
                ))}
                <CreditCardDialog
                    title={t('customers.details.billing.editCreditCard')}
                    defaultValues={selectedCard}
                    dialogOpen={dialogOpen}
                    onDialogClose={handleEditClose}
                    onSubmit={handleSubmit}
                />
            </Card>
        </>
    )
}

export default BillingSection
