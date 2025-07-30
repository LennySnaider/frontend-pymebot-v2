'use client'

import { useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { NumericFormat } from 'react-number-format'
import type { ColumnDef } from '@tanstack/react-table'
import type { Order } from '../types'

type RecentOrderProps = {
    data: Order[]
}
const { Tr, Td, TBody, THead, Th } = Table

const orderStatusColor: Record<
    number,
    {
        label: string
        dotClass: string
        textClass: string
    }
> = {
    0: {
        label: 'paid',
        dotClass: 'bg-emerald-500',
        textClass: 'text-emerald-500',
    },
    1: {
        label: 'pending',
        dotClass: 'bg-amber-500',
        textClass: 'text-amber-500',
    },
    2: { label: 'failed', dotClass: 'bg-red-500', textClass: 'text-red-500' },
}

const OrderColumn = ({ row }: { row: Order }) => {
    const router = useRouter()

    const handleView = useCallback(() => {
        router.push(`/modules/orders/order-details/${row.id}`)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [row])

    return (
        <span
            className={`cursor-pointer select-none font-semibold hover:text-primary`}
            onClick={handleView}
        >
            #{row.id}
        </span>
    )
}

const RecentOrder = ({ data = [] }: RecentOrderProps) => {
    const t = useTranslations('dashboard')
    const router = useRouter()

    const columns: ColumnDef<Order>[] = useMemo(
        () => [
            {
                accessorKey: 'id',
                header: t('orderBy'),
                cell: (props) => <OrderColumn row={props.row.original} />,
            },
            {
                accessorKey: 'status',
                header: t('status'),
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <div className="flex items-center">
                            <Badge
                                className={orderStatusColor[status].dotClass}
                            />
                            <span
                                className={`ml-2 rtl:mr-2 capitalize font-semibold ${orderStatusColor[status].textClass}`}
                            >
                                {t(orderStatusColor[status].label)}
                            </span>
                        </div>
                    )
                },
            },
            {
                accessorKey: 'date',
                header: t('date'),
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <span>{row.date}</span>
                    )
                },
            },
            { header: 'Customer', accessorKey: 'customer' },
            {
                accessorKey: 'totalAmount',
                header: t('totalSpent'),
                cell: (props) => {
                    const { totalAmount } = props.row.original
                    return (
                        <NumericFormat
                            className="heading-text font-bold"
                            displayType="text"
                            value={(
                                Math.round(totalAmount * 100) / 100
                            ).toFixed(2)}
                            prefix={'$'}
                            thousandSeparator={true}
                        />
                    )
                },
            },
        ],
        [t],
    )

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h4>{t('recentOrders')}</h4>
                <Button
                    size="sm"
                    onClick={() => router.push('/modules/orders/order-list')}
                >
                    {t('viewDetails')}
                </Button>
            </div>
            <Table>
                <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <Th
                                        key={header.id}
                                        colSpan={header.colSpan}
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                    </Th>
                                )
                            })}
                        </Tr>
                    ))}
                </THead>
                <TBody>
                    {table.getRowModel().rows.map((row) => {
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
        </Card>
    )
}

export default RecentOrder
