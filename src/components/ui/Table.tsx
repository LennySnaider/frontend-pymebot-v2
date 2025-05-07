'use client';

/**
 * Archivo de compatibilidad para Table
 * Este archivo proporciona exportaciones consistentes del componente Table
 * y sus subcomponentes, resolviendo problemas de sensibilidad a mayúsculas/minúsculas.
 */

// Importamos todo desde index.tsx que es el archivo correcto
import Table, {
  THead,
  TBody,
  TFoot,
  Tr,
  Th,
  Td,
  Sorter
} from './Table/index.tsx';

import type {
  TableProps,
  THeadProps,
  TBodyProps,
  TFootProps,
  TrProps,
  ThProps,
  TdProps,
  SorterProps
} from './Table/index.tsx';

// Re-exportar los componentes con nombres alternativos para compatibilidad con shadcn/ui
export const TableHeader = THead;
export const TableBody = TBody;
export const TableFooter = TFoot;
export const TableRow = Tr;
export const TableHead = Th;
export const TableCell = Td;

// Re-exportamos todos los componentes y tipos
export {
  Table,
  THead,
  TBody,
  TFoot,
  Tr,
  Th,
  Td,
  Sorter
};

export type {
  TableProps,
  THeadProps,
  TBodyProps,
  TFootProps,
  TrProps,
  ThProps,
  TdProps,
  SorterProps
};

// Exportación por defecto para compatibilidad
export default Table;