/**
 * frontend/src/components/verticals/bienes_raices/features/ClientsManager.tsx
 * Gestor de clientes para bienes raíces
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
import Dialog from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import dayjs from 'dayjs';

// Definición de tipos
interface Property {
  id: string;
  title: string;
  type: string;
  address: string;
  price: number;
  status: 'available' | 'sold' | 'reserved';
}

interface ClientInteraction {
  id: string;
  date: Date;
  type: 'call' | 'email' | 'visit' | 'meeting' | 'offer';
  notes?: string;
  propertyId?: string;
  property?: Property;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  budget?: number;
  status: 'active' | 'inactive' | 'prospect' | 'current-client';
  leadSource?: string;
  registrationDate: Date;
  lastContactDate?: Date;
  notes?: string;
  tags?: string[];
  profileImage?: string;
  interestedIn?: string[]; // tipos de propiedades
  favoriteProperties?: string[]; // IDs de propiedades
  interactions?: ClientInteraction[];
}

interface ClientsManagerProps {
  clients: Client[];
  properties?: Property[];
  onAddClient?: () => void;
  onEditClient?: (clientId: string) => void;
  onViewClient?: (clientId: string) => void;
  onAddInteraction?: (clientId: string) => void;
  onDeleteClient?: (clientId: string) => void;
  className?: string;
}

const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients = [],
  properties = [],
  onAddClient,
  onEditClient,
  onViewClient,
  onAddInteraction,
  onDeleteClient,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const pageSize = 10;
  
  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm);
    
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Paginar los resultados
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Manejadores
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Resetear a primera página
  };
  
  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };
  
  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedClient(null);
  };
  
  // Mapeo de estados a etiquetas con colores
  const statusTags = {
    'active': { label: 'Activo', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    'inactive': { label: 'Inactivo', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    'prospect': { label: 'Prospecto', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    'current-client': { label: 'Cliente Actual', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  };
  
  // Obtener propiedad por ID
  const getPropertyById = (propertyId?: string): Property | undefined => {
    if (!propertyId) return undefined;
    return properties.find(property => property.id === propertyId);
  };
  
  return (
    <>
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
                Agregar Cliente
              </Button>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Buscar cliente por nombre, email o teléfono..."
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
                <Table.Th>Estado</Table.Th>
                <Table.Th>Fuente</Table.Th>
                <Table.Th>Registro</Table.Th>
                <Table.Th>Último Contacto</Table.Th>
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
                          src={client.profileImage} 
                          alt={client.name}
                        />
                        <div>
                          <div className="font-semibold">{client.name}</div>
                          {client.budget && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Presupuesto: ${client.budget.toLocaleString()}
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
                      {client.status && statusTags[client.status as keyof typeof statusTags] && (
                        <Tag className={statusTags[client.status as keyof typeof statusTags].className}>
                          {statusTags[client.status as keyof typeof statusTags].label}
                        </Tag>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {client.leadSource || '-'}
                    </Table.Td>
                    <Table.Td>
                      {dayjs(client.registrationDate).format('DD/MM/YYYY')}
                    </Table.Td>
                    <Table.Td>
                      {client.lastContactDate 
                        ? dayjs(client.lastContactDate).format('DD/MM/YYYY')
                        : '-'}
                    </Table.Td>
                    <Table.Td>
                      <div className="flex gap-2">
                        <Button 
                          size="xs"
                          onClick={() => handleViewClient(client)}
                        >
                          Ver
                        </Button>
                        {onEditClient && (
                          <Button 
                            size="xs"
                            onClick={() => onEditClient(client.id)}
                          >
                            Editar
                          </Button>
                        )}
                        {onAddInteraction && (
                          <Button 
                            size="xs"
                            variant="plain"
                            onClick={() => onAddInteraction(client.id)}
                          >
                            + Interacción
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
      
      {/* Diálogo de detalles del cliente */}
      {selectedClient && (
        <Dialog
          isOpen={isViewDialogOpen}
          onClose={closeViewDialog}
          onRequestClose={closeViewDialog}
          width={800}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
              <Avatar 
                size={60} 
                shape="circle" 
                src={selectedClient.profileImage} 
                alt={selectedClient.name} 
              />
              <div>
                <h4 className="text-xl font-bold">{selectedClient.name}</h4>
                <div className="flex gap-2 mt-1">
                  {selectedClient.status && statusTags[selectedClient.status as keyof typeof statusTags] && (
                    <Tag className={statusTags[selectedClient.status as keyof typeof statusTags].className}>
                      {statusTags[selectedClient.status as keyof typeof statusTags].label}
                    </Tag>
                  )}
                  {selectedClient.tags?.map((tag, index) => (
                    <Tag key={index} className="bg-gray-100 dark:bg-gray-700">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
            
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.TabList>
                <Tabs.TabNav value="info">Información</Tabs.TabNav>
                <Tabs.TabNav value="interactions">Interacciones</Tabs.TabNav>
                <Tabs.TabNav value="properties">Propiedades</Tabs.TabNav>
              </Tabs.TabList>
              <Tabs.TabContent value="info" className="p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold mb-2">Información de Contacto</h5>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                        <div>{selectedClient.email}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Teléfono</div>
                        <div>{selectedClient.phone}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold mb-2">Información Adicional</h5>
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Fuente</div>
                        <div>{selectedClient.leadSource || 'No especificada'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Presupuesto</div>
                        <div>{selectedClient.budget ? `$${selectedClient.budget.toLocaleString()}` : 'No especificado'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Registro</div>
                        <div>{dayjs(selectedClient.registrationDate).format('DD/MM/YYYY')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Último Contacto</div>
                        <div>
                          {selectedClient.lastContactDate 
                            ? dayjs(selectedClient.lastContactDate).format('DD/MM/YYYY')
                            : 'Sin contacto registrado'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedClient.interestedIn && selectedClient.interestedIn.length > 0 && (
                    <div className="col-span-full">
                      <h5 className="font-semibold mb-2">Intereses</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.interestedIn.map((interest, index) => (
                          <Tag key={index} className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            {interest}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedClient.notes && (
                    <div className="col-span-full">
                      <h5 className="font-semibold mb-2">Notas</h5>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                        {selectedClient.notes}
                      </div>
                    </div>
                  )}
                </div>
              </Tabs.TabContent>
              
              <Tabs.TabContent value="interactions" className="p-2">
                {selectedClient.interactions && selectedClient.interactions.length > 0 ? (
                  <div className="space-y-4">
                    {selectedClient.interactions.map((interaction, index) => {
                      const property = getPropertyById(interaction.propertyId);
                      
                      return (
                        <div 
                          key={interaction.id} 
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Tag className={
                                interaction.type === 'call' ? 'bg-blue-100 text-blue-800' :
                                interaction.type === 'email' ? 'bg-purple-100 text-purple-800' :
                                interaction.type === 'visit' ? 'bg-green-100 text-green-800' :
                                interaction.type === 'meeting' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }>
                                {interaction.type === 'call' ? 'Llamada' :
                                 interaction.type === 'email' ? 'Email' :
                                 interaction.type === 'visit' ? 'Visita' :
                                 interaction.type === 'meeting' ? 'Reunión' :
                                 'Oferta'}
                              </Tag>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {dayjs(interaction.date).format('DD/MM/YYYY HH:mm')}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {interaction.id.slice(0, 8)}
                            </span>
                          </div>
                          
                          {property && (
                            <div className="mb-2 bg-gray-50 dark:bg-gray-800 p-2 rounded flex justify-between">
                              <div>
                                <div className="font-medium">{property.title}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {property.address}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">${property.price.toLocaleString()}</div>
                                <Tag className={
                                  property.status === 'available' ? 'bg-green-100 text-green-800' :
                                  property.status === 'sold' ? 'bg-red-100 text-red-800' :
                                  'bg-amber-100 text-amber-800'
                                }>
                                  {property.status === 'available' ? 'Disponible' :
                                   property.status === 'sold' ? 'Vendida' : 'Reservada'}
                                </Tag>
                              </div>
                            </div>
                          )}
                          
                          {interaction.notes && (
                            <div className="text-sm">{interaction.notes}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500 dark:text-gray-400">No hay interacciones registradas</p>
                  </div>
                )}
              </Tabs.TabContent>
              
              <Tabs.TabContent value="properties" className="p-2">
                {selectedClient.favoriteProperties && selectedClient.favoriteProperties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedClient.favoriteProperties.map(propertyId => {
                      const property = getPropertyById(propertyId);
                      
                      if (!property) return null;
                      
                      return (
                        <Card key={propertyId} className="overflow-hidden">
                          <div className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h6 className="font-semibold">{property.title}</h6>
                              <Tag className={
                                property.status === 'available' ? 'bg-green-100 text-green-800' :
                                property.status === 'sold' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800'
                              }>
                                {property.status === 'available' ? 'Disponible' :
                                 property.status === 'sold' ? 'Vendida' : 'Reservada'}
                              </Tag>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {property.address}
                            </div>
                            <div className="mb-2">
                              <span className="font-bold">${property.price.toLocaleString()}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                {property.type}
                              </span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500 dark:text-gray-400">No hay propiedades favoritas</p>
                  </div>
                )}
              </Tabs.TabContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 mt-4">
              {onAddInteraction && (
                <Button 
                  onClick={() => {
                    onAddInteraction(selectedClient.id);
                    closeViewDialog();
                  }}
                >
                  Agregar Interacción
                </Button>
              )}
              {onEditClient && (
                <Button 
                  variant="solid"
                  onClick={() => {
                    onEditClient(selectedClient.id);
                    closeViewDialog();
                  }}
                >
                  Editar Cliente
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default ClientsManager;