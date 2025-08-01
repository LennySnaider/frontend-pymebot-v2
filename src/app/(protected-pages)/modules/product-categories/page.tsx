/**
 * frontend/src/app/(protected-pages)/modules/product-categories/page.tsx
 * Página principal para la gestión de categorías de productos.
 *
 * @version 1.0.0
 * @created 2025-05-29
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Dialog, Input, Badge, FormItem } from '@/components/ui';
import { Trash2, Edit, Plus, Package } from 'lucide-react';
import { notifications } from '@/utils/notifications';

interface ProductCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  display_order: number;
  is_active: boolean;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

const ProductCategoriesPage = () => {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent_id: '',
        is_active: true
    });

    // Separar categorías padre e hijas para mostrar jerarquía
    const parentCategories = categories.filter(cat => !cat.parent_id);
    const getSubcategories = (parentId: string) => 
        categories.filter(cat => cat.parent_id === parentId);

    // Cargar categorías al montar el componente
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/product-categories', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setCategories(data || []);
        } catch (error) {
            console.error('Error cargando categorías:', error);
            notifications.error('Error al cargar las categorías');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            notifications.error('El nombre es requerido');
            return;
        }

        try {
            const url = editingCategory 
                ? `/api/product-categories/${editingCategory.id}`
                : '/api/product-categories';
            
            const method = editingCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            notifications.success(
                editingCategory 
                    ? 'Categoría actualizada exitosamente'
                    : 'Categoría creada exitosamente'
            );

            // Recargar categorías
            await loadCategories();
            handleCloseDialog();

        } catch (error) {
            console.error('Error guardando categoría:', error);
            notifications.error('Error al guardar la categoría');
        }
    };

    const handleEdit = (category: ProductCategory) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            parent_id: category.parent_id || '',
            is_active: category.is_active
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (categoryId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
            return;
        }

        try {
            const response = await fetch(`/api/product-categories/${categoryId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            notifications.success('Categoría eliminada exitosamente');
            await loadCategories();

        } catch (error) {
            console.error('Error eliminando categoría:', error);
            notifications.error('Error al eliminar la categoría');
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            parent_id: '',
            is_active: true
        });
    };

    const handleNewCategory = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            description: '',
            parent_id: '',
            is_active: true
        });
        setIsDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando categorías...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Categorías de Productos
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Gestiona las categorías para organizar tus productos y servicios.
                    </p>
                </div>
                <Button
                    onClick={handleNewCategory}
                    className="flex items-center gap-2"
                >
                    <Plus size={16} />
                    Nueva Categoría
                </Button>
            </div>

            {categories.length === 0 ? (
                <Card className="p-6">
                    <div className="text-center py-12">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            No hay categorías
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Comienza creando tu primera categoría para organizar tus productos.
                        </p>
                        <Button onClick={handleNewCategory} className="flex items-center gap-2 mx-auto">
                            <Plus size={16} />
                            Crear Primera Categoría
                        </Button>
                    </div>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Descripción
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Orden
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {parentCategories.map((parentCategory) => (
                                    <React.Fragment key={parentCategory.id}>
                                        {/* Categoría padre */}
                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-gray-50 dark:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center">
                                                    📁 {parentCategory.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                                    {parentCategory.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    className={parentCategory.is_active ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}
                                                >
                                                    {parentCategory.is_active ? 'Activa' : 'Inactiva'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {parentCategory.display_order}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="plain"
                                                        onClick={() => handleEdit(parentCategory)}
                                                    >
                                                        <Edit size={14} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="plain"
                                                        color="red"
                                                        onClick={() => handleDelete(parentCategory.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Subcategorías */}
                                        {getSubcategories(parentCategory.id).map((subCategory) => (
                                            <tr key={subCategory.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center ml-6">
                                                        ↳ {subCategory.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                                        {subCategory.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge
                                                        className={subCategory.is_active ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}
                                                    >
                                                        {subCategory.is_active ? 'Activa' : 'Inactiva'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {subCategory.display_order}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="plain"
                                                            onClick={() => handleEdit(subCategory)}
                                                        >
                                                            <Edit size={14} />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="plain"
                                                            color="red"
                                                            onClick={() => handleDelete(subCategory.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Modal de Crear/Editar Categoría */}
            <Dialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                className="max-w-md"
            >
                <h3 className="text-lg font-semibold mb-4">
                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormItem
                        label="Nombre"
                        asterisk
                    >
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nombre de la categoría"
                            required
                        />
                    </FormItem>

                    <FormItem
                        label="Descripción"
                    >
                        <Input
                            textArea={true}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Descripción opcional de la categoría"
                            rows={3}
                        />
                    </FormItem>

                    <FormItem
                        label="Categoría Padre"
                    >
                        <select
                            value={formData.parent_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        >
                            <option value="">Sin categoría padre (categoría principal)</option>
                            {parentCategories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </FormItem>

                    <FormItem>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="mr-2"
                            />
                            Categoría activa
                        </label>
                    </FormItem>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={handleCloseDialog}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingCategory ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
};

export default ProductCategoriesPage;