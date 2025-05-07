/**
 * frontend/src/components/verticals/seguros/features/InsuranceQuotes.tsx
 * Gestor de cotizaciones de seguros
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
import dayjs from 'dayjs';

// Definición de tipos
interface InsuranceProvider {
  id: string;
  name: string;
  logo?: string;
}

interface InsuranceType {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
}

interface InsurancePlan {
  id: string;
  name: string;
  description: string;
  providerId: string;
  provider?: InsuranceProvider;
  typeId: string;
  type?: InsuranceType;
  coverage: number;
  premiumBase: number;
  deductible: number;
  benefits: string[];
}

interface QuoteItem {
  planId: string;
  plan?: InsurancePlan;
  premium: number;
  discount?: number;
  finalPrice: number;
  notes?: string;
  selected?: boolean;
}

interface Quote {
  id: string;
  quoteNumber: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  typeId: string;
  type?: InsuranceType;
  date: Date;
  expiryDate: Date;
  clientId: string;
  client?: Client;
  items: QuoteItem[];
  notes?: string;
  agentId: string;
  agent?: {
    id: string;
    name: string;
    image?: string;
  };
}

interface InsuranceQuotesProps {
  quotes: Quote[];
  insuranceTypes?: InsuranceType[];
  insurancePlans?: InsurancePlan[];
  clients?: Client[];
  providers?: InsuranceProvider[];
  onAddQuote?: () => void;
  onEditQuote?: (quoteId: string) => void;
  onViewQuote?: (quoteId: string) => void;
  onSendQuote?: (quoteId: string) => void;
  onConvertToPolicy?: (quoteId: string) => void;
  className?: string;
}

const InsuranceQuotes: React.FC<InsuranceQuotesProps> = ({
  quotes = [],
  insuranceTypes = [],
  insurancePlans = [],
  clients = [],
  providers = [],
  onAddQuote,
  onEditQuote,
  onViewQuote,
  onSendQuote,
  onConvertToPolicy,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const pageSize = 10;
  
  // Filtrar cotizaciones
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || quote.status === selectedStatus;
    const matchesType = selectedType === 'all' || quote.typeId === selectedType;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Paginar los resultados
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Configuración de estados y etiquetas
  const statusTags = {
    'draft': { label: 'Borrador', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    'sent': { label: 'Enviada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    'viewed': { label: 'Vista', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
    'accepted': { label: 'Aceptada', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    'rejected': { label: 'Rechazada', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    'expired': { label: 'Expirada', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  };
  
  // Manejadores
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Resetear a primera página
  };
  
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1); // Resetear a primera página
  };
  
  const handleQuoteClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDetailsDialogOpen(true);
  };
  
  // Calcular el total de la cotización
  const calculateQuoteTotal = (quote: Quote): number => {
    return quote.items.reduce((total, item) => total + item.finalPrice, 0);
  };
  
  // Funciones de utilidad
  const getInsuranceTypeName = (typeId: string): string => {
    const type = insuranceTypes.find(t => t.id === typeId);
    return type?.name || 'Desconocido';
  };
  
  const getPlanName = (planId: string): string => {
    const plan = insurancePlans.find(p => p.id === planId);
    return plan?.name || 'Desconocido';
  };
  
  const getProviderName = (planId: string): string => {
    const plan = insurancePlans.find(p => p.id === planId);
    if (!plan) return 'Desconocido';
    
    const provider = providers.find(p => p.id === plan.providerId);
    return provider?.name || 'Desconocido';
  };
  
  const getProviderLogo = (planId: string): string | undefined => {
    const plan = insurancePlans.find(p => p.id === planId);
    if (!plan) return undefined;
    
    const provider = providers.find(p => p.id === plan.providerId);
    return provider?.logo;
  };
  
  // Determinar si una cotización está expirada
  const isQuoteExpired = (quote: Quote): boolean => {
    return dayjs(quote.expiryDate).isBefore(dayjs());
  };
  
  return (
    <>
      <Card className={`overflow-hidden ${className}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Gestión de Cotizaciones</h3>
            {onAddQuote && (
              <Button 
                variant="solid" 
                onClick={onAddQuote}
                size="sm"
              >
                Nueva Cotización
              </Button>
            )}
          </div>
          
          <div className="flex flex-col gap-3 mb-4">
            <Input
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Resetear a primera página
              }}
              className="w-full"
            />
            
            <div className="flex flex-wrap justify-between gap-4">
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
                <span className="text-sm font-medium mr-2">Tipo de Seguro:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Tag 
                    className={`cursor-pointer ${selectedType === 'all' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
                    onClick={() => handleTypeChange('all')}
                  >
                    Todos
                  </Tag>
                  {insuranceTypes.map((type) => (
                    <Tag
                      key={type.id}
                      className={`cursor-pointer ${selectedType === type.id ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}`}
                      onClick={() => handleTypeChange(type.id)}
                    >
                      {type.name}
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
                <Table.Th>Núm. Cotización</Table.Th>
                <Table.Th>Cliente</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Fecha</Table.Th>
                <Table.Th>Expiración</Table.Th>
                <Table.Th>Monto</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.THead>
            <Table.TBody>
              {paginatedQuotes.length > 0 ? (
                paginatedQuotes.map(quote => {
                  const total = calculateQuoteTotal(quote);
                  const expired = isQuoteExpired(quote) && quote.status !== 'accepted';
                  
                  return (
                    <Table.Tr 
                      key={quote.id}
                      className={expired ? 'bg-red-50 dark:bg-red-900/10' : ''}
                    >
                      <Table.Td className="font-medium">
                        {quote.quoteNumber}
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-2">
                          {quote.client?.image && (
                            <Avatar 
                              size={24} 
                              shape="circle" 
                              src={quote.client.image} 
                              alt={quote.client?.name || ''}
                            />
                          )}
                          <div className="truncate max-w-[120px]">
                            {quote.client?.name || 'N/A'}
                          </div>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {getInsuranceTypeName(quote.typeId)}
                      </Table.Td>
                      <Table.Td>
                        {dayjs(quote.date).format('DD/MM/YYYY')}
                      </Table.Td>
                      <Table.Td>
                        <span className={expired ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {dayjs(quote.expiryDate).format('DD/MM/YYYY')}
                        </span>
                      </Table.Td>
                      <Table.Td className="text-right font-medium">
                        ${total.toLocaleString()}
                      </Table.Td>
                      <Table.Td>
                        {quote.status && statusTags[quote.status as keyof typeof statusTags] && (
                          <Tag className={statusTags[quote.status as keyof typeof statusTags].className}>
                            {expired && quote.status !== 'expired' 
                              ? statusTags['expired'].label 
                              : statusTags[quote.status as keyof typeof statusTags].label}
                          </Tag>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <div className="flex gap-2">
                          <Button 
                            size="xs"
                            onClick={() => handleQuoteClick(quote)}
                          >
                            Ver
                          </Button>
                          
                          {onEditQuote && quote.status === 'draft' && (
                            <Button 
                              size="xs"
                              onClick={() => onEditQuote(quote.id)}
                            >
                              Editar
                            </Button>
                          )}
                          
                          {onSendQuote && quote.status === 'draft' && (
                            <Button 
                              size="xs"
                              variant="plain"
                              onClick={() => onSendQuote(quote.id)}
                            >
                              Enviar
                            </Button>
                          )}
                          
                          {onConvertToPolicy && quote.status === 'accepted' && (
                            <Button 
                              size="xs"
                              variant="solid"
                              onClick={() => onConvertToPolicy(quote.id)}
                            >
                              Convertir
                            </Button>
                          )}
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={8} className="text-center py-8">
                    {searchTerm || selectedStatus !== 'all' || selectedType !== 'all'
                      ? 'No se encontraron cotizaciones con los filtros seleccionados'
                      : 'No hay cotizaciones disponibles'}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.TBody>
          </Table>
        </div>
        
        {filteredQuotes.length > pageSize && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              pageSize={pageSize}
              total={filteredQuotes.length}
              currentPage={currentPage}
              onChange={handlePageChange}
            />
          </div>
        )}
      </Card>
      
      {/* Diálogo de detalles de cotización */}
      {selectedQuote && (
        <Dialog
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          onRequestClose={() => setIsDetailsDialogOpen(false)}
          width={700}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-bold">Cotización #{selectedQuote.quoteNumber}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Tag className={statusTags[selectedQuote.status as keyof typeof statusTags]?.className || ''}>
                  {isQuoteExpired(selectedQuote) && selectedQuote.status !== 'accepted'
                    ? statusTags['expired'].label 
                    : statusTags[selectedQuote.status as keyof typeof statusTags]?.label || selectedQuote.status}
                </Tag>
                {isQuoteExpired(selectedQuote) && selectedQuote.status !== 'accepted' && selectedQuote.status !== 'expired' && (
                  <span className="text-red-600 dark:text-red-400 text-sm">
                    Esta cotización está expirada
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Fecha: {dayjs(selectedQuote.date).format('DD/MM/YYYY')}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Expira: {dayjs(selectedQuote.expiryDate).format('DD/MM/YYYY')}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="font-medium mb-1">Cliente</div>
              <div className="flex items-center gap-2">
                {selectedQuote.client?.image && (
                  <Avatar 
                    size={32} 
                    shape="circle" 
                    src={selectedQuote.client.image} 
                    alt={selectedQuote.client?.name || ''}
                  />
                )}
                <div>
                  <div className="font-semibold">{selectedQuote.client?.name || 'N/A'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedQuote.client?.email || ''}
                    {selectedQuote.client?.phone && ` • ${selectedQuote.client.phone}`}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="font-medium mb-1">Tipo de Seguro</div>
              <div className="font-semibold">
                {getInsuranceTypeName(selectedQuote.typeId)}
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="font-medium mb-2">Detalles de la Cotización</div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              <Table>
                <Table.THead>
                  <Table.Tr>
                    <Table.Th>Plan</Table.Th>
                    <Table.Th>Proveedor</Table.Th>
                    <Table.Th className="text-right">Prima</Table.Th>
                    <Table.Th className="text-right">Descuento</Table.Th>
                    <Table.Th className="text-right">Precio Final</Table.Th>
                  </Table.Tr>
                </Table.THead>
                <Table.TBody>
                  {selectedQuote.items.map((item, index) => (
                    <Table.Tr key={`${item.planId}-${index}`} className={item.selected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                      <Table.Td>
                        <div className="font-medium">{getPlanName(item.planId)}</div>
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-2">
                          {getProviderLogo(item.planId) && (
                            <img 
                              src={getProviderLogo(item.planId)} 
                              alt={getProviderName(item.planId)}
                              className="h-5 w-5 object-contain"
                            />
                          )}
                          <span>{getProviderName(item.planId)}</span>
                        </div>
                      </Table.Td>
                      <Table.Td className="text-right">
                        ${item.premium.toLocaleString()}
                      </Table.Td>
                      <Table.Td className="text-right">
                        {item.discount ? `${item.discount}%` : '-'}
                      </Table.Td>
                      <Table.Td className="text-right font-semibold">
                        ${item.finalPrice.toLocaleString()}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  <Table.Tr className="bg-gray-50 dark:bg-gray-800">
                    <Table.Td colSpan={4} className="text-right font-bold">
                      Total
                    </Table.Td>
                    <Table.Td className="text-right font-bold">
                      ${calculateQuoteTotal(selectedQuote).toLocaleString()}
                    </Table.Td>
                  </Table.Tr>
                </Table.TBody>
              </Table>
            </div>
          </div>
          
          {selectedQuote.notes && (
            <div className="mb-4">
              <div className="font-medium mb-1">Notas</div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                {selectedQuote.notes}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            {onViewQuote && (
              <Button
                onClick={() => {
                  onViewQuote(selectedQuote.id);
                  setIsDetailsDialogOpen(false);
                }}
              >
                Ver Completo
              </Button>
            )}
            
            {onEditQuote && selectedQuote.status === 'draft' && (
              <Button
                onClick={() => {
                  onEditQuote(selectedQuote.id);
                  setIsDetailsDialogOpen(false);
                }}
              >
                Editar
              </Button>
            )}
            
            {onSendQuote && selectedQuote.status === 'draft' && (
              <Button
                variant="solid"
                onClick={() => {
                  onSendQuote(selectedQuote.id);
                  setIsDetailsDialogOpen(false);
                }}
              >
                Enviar al Cliente
              </Button>
            )}
            
            {onConvertToPolicy && selectedQuote.status === 'accepted' && (
              <Button
                variant="solid"
                onClick={() => {
                  onConvertToPolicy(selectedQuote.id);
                  setIsDetailsDialogOpen(false);
                }}
              >
                Convertir a Póliza
              </Button>
            )}
            
            <Button
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default InsuranceQuotes;