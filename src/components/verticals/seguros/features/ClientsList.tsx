/**
 * frontend/src/components/verticals/seguros/features/ClientsList.tsx
 * Lista de clientes para la vertical de seguros
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
import Avatar from '@/components/ui/Avatar';
import dayjs from 'dayjs';

// Definición de tipos
interface Policy {
  id: string;
  policyNumber: string;
  type: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  startDate: Date;
  endDate: Date;
  premium: number;
  coverage: number;
}

interface InsuranceClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  documentId?: string;
  documentType?: string;
  status: 'active' | 'inactive' | 'prospect';
  birthDate?: Date;
  occupation?: string;
  gender?: 'male' | 'female' | 'other';
  registrationDate: Date;
  lastContactDate?: Date;
  image?: string;
  policies?: Policy[];
  tags?: string[];
  notes?: string;
}

interface ClientsListProps {
  clients: InsuranceClient[];
  onAddClient?: () => void;
  onEditClient?: (clientId: string) => void;
  onViewClient?: (clientId: string) => void;
  onDeleteClient?: (clientId: string) => void;
  className?: string;
}

const ClientsList: React.FC<ClientsListProps> = ({
  clients = [],
  onAddClient,
  onEditClient,
  onViewClient,
  onDeleteClient,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const pageSize = 10;
  
  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) || 
      client.documentId?.includes(searchTerm);
    
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Paginar los resultados
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Mapeo de estados a etiquetas
  const statusTags = {
    'active': { label: 'Activo', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    'inactive': { label: 'Inactivo', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    'prospect': { label: 'Prospecto', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  };
  
  // Manejadores
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Resetear a primera página
  };
  
  // Calcular número de pólizas activas
  const getActivePoliciesCount = (client: InsuranceClient): number => {
    if (!client.policies) return 0;
    return client.policies.filter(policy => policy.status === 'active').length;
  };
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Gestión de Clientes</h3>
          {onAddClient && (
            <Button 
              variant="solid" 
              onClick={onAddClient}
              size="sm"
            >
              Nuevo Cliente
            </Button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Buscar cliente por nombre, documento, email o teléfono..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Resetear a primera página
            }}
            className="flex-grow"
          />
          
          <div className="flex flex-wrap gap-2">
            <Tag 
              className={`cursor-pointer ${selectedStatus === 'all' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
              onClick={() => handleStatusChange('all')}
            >
              Todos
            </Tag>
            {Object.entries(statusTags).map(([status, { label, className }]) => (
              <Tag
                key={status}
                className={`cursor-pointer ${selectedStatus === status ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : className}`}
                onClick={() => handleStatusChange(status)}
              >
                {label}
              </Tag>
            ))}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <Table.THead>
            <Table.Tr>
              <Table.Th>Cliente</Table.Th>
              <Table.Th>Contacto</Table.Th>
              <Table.Th>Documento</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Pólizas Activas</Table.Th>
              <Table.Th>Registro</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.THead>
          <Table.TBody>
            {paginatedClients.length > 0 ? (
              paginatedClients.map(client => (
                <Table.Tr key={client.id}>
                  <Table.Td>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        size={40} 
                        shape="circle" 
                        src={client.image} 
                        alt={client.name}
                      />
                      <div>
                        <div className="font-semibold">{client.name}</div>
                        {client.occupation && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.occupation}
                          </div>
                        )}
                      </div>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div>
                      <div className="text-sm">{client.email}</div>
                      <div className="text-sm">{client.phone}</div>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {client.documentId ? (
                      <div>
                        <div className="text-sm font-medium">
                          {client.documentId}
                        </div>
                        {client.documentType && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {client.documentType}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">No registrado</span>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {client.status && statusTags[client.status as keyof typeof statusTags] && (
                      <Tag className={statusTags[client.status as keyof typeof statusTags].className}>
                        {statusTags[client.status as keyof typeof statusTags].label}
                      </Tag>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <div className="text-center">
                      {getActivePoliciesCount(client)}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    {dayjs(client.registrationDate).format('DD/MM/YYYY')}
                  </Table.Td>
                  <Table.Td>
                    <div className="flex gap-2">
                      {onViewClient && (
                        <Button 
                          size="xs"
                          onClick={() => onViewClient(client.id)}
                        >
                          Ver
                        </Button>
                      )}
                      {onEditClient && (
                        <Button 
                          size="xs"
                          onClick={() => onEditClient(client.id)}
                        >
                          Editar
                        </Button>
                      )}
                      {onDeleteClient && (
                        <Button 
                          size="xs" 
                          variant="plain"
                          className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => onDeleteClient(client.id)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={7} className="text-center py-8">
                  {searchTerm || selectedStatus !== 'all'
                    ? 'No se encontraron clientes con los filtros seleccionados'
                    : 'No hay clientes disponibles'}
                </Table.Td>
              </Table.Tr>
            )}
          </Table.TBody>
        </Table>
      </div>
      
      {filteredClients.length > pageSize && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Pagination
            pageSize={pageSize}
            total={filteredClients.length}
            currentPage={currentPage}
            onChange={handlePageChange}
          />
        </div>
      )}
    </Card>
  );
};

export default ClientsList;