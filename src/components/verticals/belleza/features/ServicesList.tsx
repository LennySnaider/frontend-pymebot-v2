/**
 * frontend/src/components/verticals/belleza/features/ServicesList.tsx
 * Listado de servicios de belleza ofrecidos
 * @version 1.0.0
 * @updated 2025-06-05
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Table, Pagination } from '@/components/ui/index';

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface BeautyService {
  id: string;
  name: string;
  description?: string;
  duration: number; // en minutos
  price: number;
  categoryId: string;
  isActive: boolean;
}

interface ServicesListProps {
  services: BeautyService[];
  categories: ServiceCategory[];
  onAddService?: () => void;
  onEditService?: (serviceId: string) => void;
  onToggleActive?: (serviceId: string, isActive: boolean) => void;
  onDeleteService?: (serviceId: string) => void;
  className?: string;
}

const ServicesList: React.FC<ServicesListProps> = ({
  services = [],
  categories = [],
  onAddService,
  onEditService,
  onToggleActive,
  onDeleteService,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const pageSize = 10;
  
  // Filtrar servicios por búsqueda y categoría
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || service.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Paginar los resultados
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Obtener categoría por ID
  const getCategoryById = (categoryId: string): ServiceCategory | undefined => {
    return categories.find(category => category.id === categoryId);
  };
  
  // Manejadores
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Resetear a primera página
  };
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Servicios</h3>
          {onAddService && (
            <Button 
              variant="solid" 
              onClick={onAddService}
              size="sm"
            >
              Agregar servicio
            </Button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Buscar servicio..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Resetear a primera página
            }}
            className="flex-grow"
          />
          
          <div className="flex flex-wrap gap-2">
            <Tag 
              className={`cursor-pointer ${selectedCategory === 'all' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
              onClick={() => handleCategoryChange('all')}
            >
              Todos
            </Tag>
            {categories.map(category => (
              <Tag
                key={category.id}
                className={`cursor-pointer ${selectedCategory === category.id ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
                style={{ backgroundColor: selectedCategory === category.id ? undefined : category.color }}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.name}
              </Tag>
            ))}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <Table.THead>
            <Table.Tr>
              <Table.Th>Servicio</Table.Th>
              <Table.Th>Categoría</Table.Th>
              <Table.Th>Duración</Table.Th>
              <Table.Th>Precio</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.THead>
          <Table.TBody>
            {paginatedServices.length > 0 ? (
              paginatedServices.map(service => {
                const category = getCategoryById(service.categoryId);
                
                return (
                  <Table.Tr key={service.id}>
                    <Table.Td>
                      <div>
                        <div className="font-semibold">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      {category && (
                        <Tag style={{ backgroundColor: category.color }}>
                          {category.name}
                        </Tag>
                      )}
                    </Table.Td>
                    <Table.Td>{service.duration} min</Table.Td>
                    <Table.Td>${service.price.toFixed(2)}</Table.Td>
                    <Table.Td>
                      <Tag className={
                        service.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }>
                        {service.isActive ? 'Activo' : 'Inactivo'}
                      </Tag>
                    </Table.Td>
                    <Table.Td>
                      <div className="flex gap-2">
                        {onEditService && (
                          <Button 
                            size="xs"
                            onClick={() => onEditService(service.id)}
                          >
                            Editar
                          </Button>
                        )}
                        {onToggleActive && (
                          <Button 
                            size="xs" 
                            variant={service.isActive ? 'plain' : 'default'}
                            onClick={() => onToggleActive(service.id, !service.isActive)}
                          >
                            {service.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                        )}
                        {onDeleteService && (
                          <Button 
                            size="xs" 
                            variant="plain"
                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => onDeleteService(service.id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            ) : (
              <Table.Tr>
                <Table.Td colSpan={6} className="text-center py-8">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'No se encontraron servicios con los filtros seleccionados'
                    : 'No hay servicios disponibles'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.TBody>
        </Table>
      </div>
      
      {filteredServices.length > pageSize && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            pageSize={pageSize}
            total={filteredServices.length}
            currentPage={currentPage}
            onChange={handlePageChange}
          />
        </div>
      )}
    </Card>
  );
};

export default ServicesList;