/**
 * frontend/src/app/(protected-pages)/vertical-medicina/pacientes/page.tsx
 * Página de listado de pacientes para la vertical de medicina.
 * Muestra una tabla con los pacientes registrados y permite búsqueda y filtrado.
 * @version 1.0.0
 * @updated 2025-04-29
 */

'use client';

import { useState, useEffect } from 'react';
import { PatientCard } from '@/components/verticals/medicina';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table-components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select-components';

// Tipos para los datos
type PatientStatus = 'active' | 'inactive' | 'pending';

interface Patient {
  id: string;
  recordNumber: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  birthDate: Date;
  phone: string;
  email?: string;
  address?: string;
  status: PatientStatus;
  lastVisit?: Date;
  photoUrl?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');

  useEffect(() => {
    // Simular la carga de datos de pacientes
    const timer = setTimeout(() => {
      const mockPatients: Patient[] = [
        {
          id: '1',
          recordNumber: 'PAC-001',
          name: 'Carlos Rodríguez',
          age: 42,
          gender: 'male',
          birthDate: new Date(1983, 5, 15),
          phone: '555-123-4567',
          email: 'carlos.rodriguez@example.com',
          address: 'Calle Principal 123, Ciudad',
          status: 'active',
          lastVisit: new Date(2025, 3, 15),
          photoUrl: '/api/placeholder/150/150'
        },
        {
          id: '2',
          recordNumber: 'PAC-002',
          name: 'María González',
          age: 35,
          gender: 'female',
          birthDate: new Date(1990, 2, 10),
          phone: '555-234-5678',
          email: 'maria.gonzalez@example.com',
          address: 'Avenida Central 456, Ciudad',
          status: 'active',
          lastVisit: new Date(2025, 3, 10),
          photoUrl: '/api/placeholder/150/150'
        },
        {
          id: '3',
          recordNumber: 'PAC-003',
          name: 'Juan Pérez',
          age: 28,
          gender: 'male',
          birthDate: new Date(1997, 8, 22),
          phone: '555-345-6789',
          email: 'juan.perez@example.com',
          address: 'Plaza Mayor 789, Ciudad',
          status: 'inactive',
          lastVisit: new Date(2025, 2, 5),
          photoUrl: '/api/placeholder/150/150'
        },
        {
          id: '4',
          recordNumber: 'PAC-004',
          name: 'Ana Martínez',
          age: 58,
          gender: 'female',
          birthDate: new Date(1967, 11, 3),
          phone: '555-456-7890',
          status: 'active',
          lastVisit: new Date(2025, 3, 20),
          photoUrl: '/api/placeholder/150/150'
        },
        {
          id: '5',
          recordNumber: 'PAC-005',
          name: 'Roberto Sánchez',
          age: 47,
          gender: 'male',
          birthDate: new Date(1978, 4, 18),
          phone: '555-567-8901',
          email: 'roberto.sanchez@example.com',
          status: 'pending',
          photoUrl: '/api/placeholder/150/150'
        }
      ];
      
      setPatients(mockPatients);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Filtrar pacientes según búsqueda y filtro de estado
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.recordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Mostrar estado de paciente con colores
  const renderStatus = (status: PatientStatus) => {
    const statusMap = {
      active: { label: 'Activo', variant: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      inactive: { label: 'Inactivo', variant: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
      pending: { label: 'Pendiente', variant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    };
    
    return (
      <Badge className={`${statusMap[status].variant}`}>
        {statusMap[status].label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
        <Button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Paciente
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/2">
          <Input
            type="text"
            placeholder="Buscar por nombre, expediente, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as PatientStatus | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expediente</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última Visita</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.recordNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {patient.photoUrl && (
                        <img 
                          src={patient.photoUrl} 
                          alt={patient.name} 
                          className="h-8 w-8 rounded-full mr-2 object-cover"
                        />
                      )}
                      {patient.name}
                    </div>
                  </TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{patient.phone}</div>
                      {patient.email && <div className="text-gray-500">{patient.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{renderStatus(patient.status)}</TableCell>
                  <TableCell>
                    {patient.lastVisit ? 
                      patient.lastVisit.toLocaleDateString() : 
                      <span className="text-gray-500">Sin visitas</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/vertical-medicina/pacientes/${patient.id}`}>Ver Expediente</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Programar Cita</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron pacientes con los criterios de búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}