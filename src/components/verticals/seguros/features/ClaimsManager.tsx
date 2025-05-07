/**
 * frontend/src/components/verticals/seguros/features/ClaimsManager.tsx
 * Gestor de reclamaciones para la vertical de seguros
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
import { Form, FormItem } from '@/components/ui/Form';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import dayjs from 'dayjs';

// Definición de tipos
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
}

interface Policy {
  id: string;
  policyNumber: string;
  type: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  clientId: string;
  client?: Client;
}

interface ClaimDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: Date;
  size: number;
}

interface ClaimTimeline {
  id: string;
  date: Date;
  title: string;
  description: string;
  status: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Claim {
  id: string;
  claimNumber: string;
  title: string;
  description: string;
  status: 'open' | 'in_review' | 'pending_info' | 'approved' | 'rejected' | 'settled';
  type: string;
  date: Date;
  amount?: number;
  policyId: string;
  policy?: Policy;
  clientId: string;
  client?: Client;
  assignedTo?: {
    id: string;
    name: string;
    image?: string;
  };
  documents?: ClaimDocument[];
  timeline?: ClaimTimeline[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedSettlementDate?: Date;
}

interface ClaimsManagerProps {
  claims: Claim[];
  policies?: Policy[];
  clients?: Client[];
  agents?: {
    id: string;
    name: string;
    role: string;
    image?: string;
  }[];
  onAddClaim?: () => void;
  onEditClaim?: (claimId: string) => void;
  onViewClaim?: (claimId: string) => void;
  onUpdateStatus?: (claimId: string, newStatus: string) => void;
  onAssignClaim?: (claimId: string, agentId: string) => void;
  className?: string;
}

const ClaimsManager: React.FC<ClaimsManagerProps> = ({
  claims = [],
  policies = [],
  clients = [],
  agents = [],
  onAddClaim,
  onEditClaim,
  onViewClaim,
  onUpdateStatus,
  onAssignClaim,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const pageSize = 10;
  
  // Filtrar reclamaciones
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.policy?.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || claim.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || claim.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
  
  // Paginar los resultados
  const paginatedClaims = filteredClaims.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Configuración de estados y etiquetas
  const statusTags = {
    'open': { label: 'Abierta', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    'in_review': { label: 'En revisión', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    'pending_info': { label: 'Pendiente info', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    'approved': { label: 'Aprobada', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    'rejected': { label: 'Rechazada', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    'settled': { label: 'Liquidada', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
  };
  
  const priorityTags = {
    'low': { label: 'Baja', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    'medium': { label: 'Media', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    'high': { label: 'Alta', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    'urgent': { label: 'Urgente', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  };
  
  // Manejadores
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Resetear a primera página
  };
  
  const handlePriorityChange = (priority: string) => {
    setSelectedPriority(priority);
    setCurrentPage(1); // Resetear a primera página
  };
  
  const handleUpdateStatusClick = (claim: Claim) => {
    setSelectedClaim(claim);
    setNewStatus(claim.status);
    setIsStatusDialogOpen(true);
  };
  
  const handleAssignClick = (claim: Claim) => {
    setSelectedClaim(claim);
    setAssignedAgentId(claim.assignedTo?.id || '');
    setIsAssignDialogOpen(true);
  };
  
  const handleStatusUpdate = () => {
    if (selectedClaim && onUpdateStatus) {
      onUpdateStatus(selectedClaim.id, newStatus);
      setIsStatusDialogOpen(false);
      setSelectedClaim(null);
    }
  };
  
  const handleAssign = () => {
    if (selectedClaim && onAssignClaim) {
      onAssignClaim(selectedClaim.id, assignedAgentId);
      setIsAssignDialogOpen(false);
      setSelectedClaim(null);
    }
  };
  
  return (
    <>
      <Card className={`overflow-hidden ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Gestión de Reclamaciones</h3>
            {onAddClaim && (
              <Button 
                variant="solid" 
                onClick={onAddClaim}
                size="sm"
              >
                Nueva Reclamación
              </Button>
            )}
          </div>
          
          <div className="flex flex-col gap-3 mb-4">
            <Input
              placeholder="Buscar por número, título, cliente o póliza..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Resetear a primera página
              }}
              className="w-full"
            />
            
            <div className="flex flex-wrap justify-between">
              <div>
                <span className="text-sm font-medium mr-2">Estado:</span>
                <div className="flex flex-wrap gap-2 mt-1">
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
              
              <div>
                <span className="text-sm font-medium mr-2">Prioridad:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Tag 
                    className={`cursor-pointer ${selectedPriority === 'all' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
                    onClick={() => handlePriorityChange('all')}
                  >
                    Todas
                  </Tag>
                  {Object.entries(priorityTags).map(([priority, { label, className }]) => (
                    <Tag
                      key={priority}
                      className={`cursor-pointer ${selectedPriority === priority ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : className}`}
                      onClick={() => handlePriorityChange(priority)}
                    >
                      {label}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <Table.THead>
              <Table.Tr>
                <Table.Th>Núm. Reclamación</Table.Th>
                <Table.Th>Detalles</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Prioridad</Table.Th>
                <Table.Th>Asignado a</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.THead>
            <Table.TBody>
              {paginatedClaims.length > 0 ? (
                paginatedClaims.map(claim => (
                  <Table.Tr key={claim.id}>
                    <Table.Td className="font-medium">
                      {claim.claimNumber}
                    </Table.Td>
                    <Table.Td>
                      <div className="max-w-xs">
                        <div className="font-semibold truncate">{claim.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {claim.type}
                          {claim.amount && ` • $${claim.amount.toLocaleString()}`}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          Póliza: {claim.policy?.policyNumber || 'N/A'}
                        </div>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <div className="flex items-center gap-2">
                        {claim.client?.image && (
                          <Avatar 
                            size={24} 
                            shape="circle" 
                            src={claim.client.image} 
                            alt={claim.client?.name || ''}
                          />
                        )}
                        <div className="truncate max-w-[120px]">
                          {claim.client?.name || 'N/A'}
                        </div>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      {dayjs(claim.date).format('DD/MM/YYYY')}
                    </Table.Td>
                    <Table.Td>
                      {claim.status && statusTags[claim.status as keyof typeof statusTags] && (
                        <Tag className={statusTags[claim.status as keyof typeof statusTags].className}>
                          {statusTags[claim.status as keyof typeof statusTags].label}
                        </Tag>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {claim.priority && priorityTags[claim.priority as keyof typeof priorityTags] && (
                        <Tag className={priorityTags[claim.priority as keyof typeof priorityTags].className}>
                          {priorityTags[claim.priority as keyof typeof priorityTags].label}
                        </Tag>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {claim.assignedTo ? (
                        <div className="flex items-center gap-2">
                          {claim.assignedTo.image && (
                            <Avatar 
                              size={24} 
                              shape="circle" 
                              src={claim.assignedTo.image} 
                              alt={claim.assignedTo.name || ''}
                            />
                          )}
                          <span className="truncate max-w-[100px]">{claim.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin asignar</span>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <div className="flex gap-2">
                        {onViewClaim && (
                          <Button 
                            size="xs"
                            onClick={() => onViewClaim(claim.id)}
                          >
                            Ver
                          </Button>
                        )}
                        {onUpdateStatus && (
                          <Button 
                            size="xs"
                            onClick={() => handleUpdateStatusClick(claim)}
                          >
                            Estado
                          </Button>
                        )}
                        {onAssignClaim && (
                          <Button 
                            size="xs"
                            variant="plain"
                            onClick={() => handleAssignClick(claim)}
                          >
                            Asignar
                          </Button>
                        )}
                        {onEditClaim && (
                          <Button 
                            size="xs"
                            variant="plain"
                            onClick={() => onEditClaim(claim.id)}
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={8} className="text-center py-8">
                    {searchTerm || selectedStatus !== 'all' || selectedPriority !== 'all'
                      ? 'No se encontraron reclamaciones con los filtros seleccionados'
                      : 'No hay reclamaciones disponibles'}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.TBody>
          </Table>
        </div>
        
        {filteredClaims.length > pageSize && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              pageSize={pageSize}
              total={filteredClaims.length}
              currentPage={currentPage}
              onChange={handlePageChange}
            />
          </div>
        )}
      </Card>
      
      {/* Diálogo para actualizar estado */}
      {selectedClaim && (
        <Dialog
          isOpen={isStatusDialogOpen}
          onClose={() => setIsStatusDialogOpen(false)}
          onRequestClose={() => setIsStatusDialogOpen(false)}
          width={500}
        >
          <h4 className="text-lg font-bold mb-4">Actualizar Estado de Reclamación</h4>
          
          <div className="mb-4">
            <div className="font-medium mb-1">Reclamación</div>
            <div>
              <div className="font-semibold">{selectedClaim.claimNumber} - {selectedClaim.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Cliente: {selectedClaim.client?.name || 'N/A'}
              </div>
            </div>
          </div>
          
          <Form>
            <FormItem
              label="Estado Actual"
            >
              <Tag className={statusTags[selectedClaim.status as keyof typeof statusTags]?.className || ''}>
                {statusTags[selectedClaim.status as keyof typeof statusTags]?.label || selectedClaim.status}
              </Tag>
            </FormItem>
            
            <FormItem
              label="Nuevo Estado"
            >
              <Select
                options={Object.entries(statusTags).map(([value, { label }]) => ({
                  value,
                  label
                }))}
                onChange={(option) => setNewStatus(option?.value || '')}
                value={{
                  value: newStatus,
                  label: statusTags[newStatus as keyof typeof statusTags]?.label || newStatus
                }}
              />
            </FormItem>
            
            {(newStatus === 'approved' || newStatus === 'settled') && (
              <FormItem
                label="Fecha Estimada de Liquidación"
              >
                <DatePicker
                  selected={selectedClaim.expectedSettlementDate || new Date()}
                  onChange={(date) => {/* Implementar lógica de actualización */}}
                  dateFormat="dd/MM/yyyy"
                  className="w-full"
                />
              </FormItem>
            )}
            
            {newStatus === 'pending_info' && (
              <FormItem
                label="Información Requerida"
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="Detallar la información requerida..."
                />
              </FormItem>
            )}
            
            {newStatus === 'rejected' && (
              <FormItem
                label="Motivo de Rechazo"
              >
                <Input.TextArea 
                  rows={3}
                  placeholder="Detallar el motivo de rechazo..."
                />
              </FormItem>
            )}
          </Form>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="solid"
              onClick={handleStatusUpdate}
              disabled={newStatus === selectedClaim.status}
            >
              Actualizar Estado
            </Button>
          </div>
        </Dialog>
      )}
      
      {/* Diálogo para asignar reclamación */}
      {selectedClaim && (
        <Dialog
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          onRequestClose={() => setIsAssignDialogOpen(false)}
          width={500}
        >
          <h4 className="text-lg font-bold mb-4">Asignar Reclamación</h4>
          
          <div className="mb-4">
            <div className="font-medium mb-1">Reclamación</div>
            <div>
              <div className="font-semibold">{selectedClaim.claimNumber} - {selectedClaim.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Cliente: {selectedClaim.client?.name || 'N/A'}
              </div>
            </div>
          </div>
          
          <Form>
            <FormItem
              label="Actualmente Asignado a"
            >
              {selectedClaim.assignedTo ? (
                <div className="flex items-center gap-2">
                  {selectedClaim.assignedTo.image && (
                    <Avatar 
                      size={24} 
                      shape="circle" 
                      src={selectedClaim.assignedTo.image} 
                      alt={selectedClaim.assignedTo.name || ''}
                    />
                  )}
                  <span>{selectedClaim.assignedTo.name}</span>
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">Sin asignar</span>
              )}
            </FormItem>
            
            <FormItem
              label="Asignar a"
            >
              <Select
                options={[
                  { value: '', label: 'Sin asignar' },
                  ...agents.map(agent => ({
                    value: agent.id,
                    label: agent.name
                  }))
                ]}
                onChange={(option) => setAssignedAgentId(option?.value || '')}
                value={
                  assignedAgentId === '' 
                    ? { value: '', label: 'Sin asignar' }
                    : agents
                        .filter(agent => agent.id === assignedAgentId)
                        .map(agent => ({
                          value: agent.id,
                          label: agent.name
                        }))[0] || { value: '', label: 'Sin asignar' }
                }
              />
            </FormItem>
          </Form>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="solid"
              onClick={handleAssign}
              disabled={assignedAgentId === (selectedClaim.assignedTo?.id || '')}
            >
              Asignar
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default ClaimsManager;