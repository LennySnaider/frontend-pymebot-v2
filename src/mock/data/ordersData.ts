/**
 * Mock data para órdenes
 */

export interface OrderData {
  id: string
  orderNumber: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  total: number
  createdAt: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
}

export interface OrderDetailsData extends OrderData {
  customer: {
    id: string
    name: string
    email: string
  }
  shipping: {
    address: string
    city: string
    country: string
  }
}

export const ordersData: OrderData[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'completed',
    total: 100.00,
    createdAt: '2024-01-01T00:00:00Z',
    items: [
      {
        id: '1',
        name: 'Producto Demo',
        quantity: 1,
        price: 100.00
      }
    ]
  }
]

export const orderDetailsData: OrderDetailsData[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'completed',
    total: 100.00,
    createdAt: '2024-01-01T00:00:00Z',
    items: [
      {
        id: '1',
        name: 'Producto Demo',
        quantity: 1,
        price: 100.00
      }
    ],
    customer: {
      id: '1',
      name: 'Cliente Demo',
      email: 'cliente@demo.com'
    },
    shipping: {
      address: 'Dirección Demo 123',
      city: 'Ciudad Demo',
      country: 'País Demo'
    }
  }
]

export default ordersData