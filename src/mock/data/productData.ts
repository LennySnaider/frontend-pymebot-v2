/**
 * Mock data para productos
 */

export interface ProductData {
  id: string
  name: string
  description: string
  price: number
  category: string
  inStock: boolean
  createdAt: string
}

export const productData: ProductData[] = [
  {
    id: '1',
    name: 'Producto Demo',
    description: 'Producto de demostración',
    price: 100.00,
    category: 'General',
    inStock: true,
    createdAt: '2024-01-01T00:00:00Z'
  }
]

export const productsData = productData

export default productData