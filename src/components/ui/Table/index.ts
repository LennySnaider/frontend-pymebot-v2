'use client';

// Importar directamente desde los archivos de componentes para evitar referencias circulares
import Table from './Table';
import THead from './THead';
import TBody from './TBody';
import TFoot from './TFoot';
import Th from './Th';
import Tr from './Tr';
import Td from './Td';
// Importar también Sorter para mantener compatibilidad con DataTable
import Sorter from './Sorter';

// Componentes adicionales necesarios (nombres alternativos más descriptivos)
const TableHeader = THead;
const TableBody = TBody;
const TableFooter = TFoot;
const TableRow = Tr;
const TableHead = Th;
const TableCell = Td;

// Exportar todo para mantener la API pública
export {
  Table,
  THead,
  TBody,
  TFoot,
  Th,
  Tr,
  Td,
  Sorter,
  // Nombres alternativos
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell
};

// Re-exportar por defecto para compatibilidad
export default Table;