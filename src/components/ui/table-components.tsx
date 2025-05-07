'use client';

/**
 * Archivo de compatibilidad para Table
 * Este archivo proporciona exportaciones consistentes del componente Table
 * y sus subcomponentes, resolviendo problemas de sensibilidad a mayúsculas/minúsculas.
 */

import OriginalTable from './Table/Table';
import type { TableProps } from './Table/Table';

// Definir las propiedades y tipos necesarios
type THeadProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TFootProps = React.HTMLAttributes<HTMLTableSectionElement>;
type TrProps = React.HTMLAttributes<HTMLTableRowElement>;
type ThProps = React.HTMLAttributes<HTMLTableCellElement>;
type TdProps = React.HTMLAttributes<HTMLTableCellElement>;

// Crear subcomponentes
const THead = (props: THeadProps) => <thead {...props} />;
const TBody = (props: TBodyProps) => <tbody {...props} />;
const TFoot = (props: TFootProps) => <tfoot {...props} />;
const Tr = (props: TrProps) => <tr {...props} />;
const Th = (props: ThProps) => <th {...props} />;
const Td = (props: TdProps) => <td {...props} />;

// Agregar los subcomponentes al componente Table
const Table = OriginalTable as typeof OriginalTable & {
  THead: typeof THead;
  TBody: typeof TBody;
  TFoot: typeof TFoot;
  Tr: typeof Tr;
  Th: typeof Th;
  Td: typeof Td;
};

// Asignar subcomponentes
Table.THead = THead;
Table.TBody = TBody;
Table.TFoot = TFoot;
Table.Tr = Tr;
Table.Th = Th;
Table.Td = Td;

// Reexportar con nombres que coincidan con los esperados para shadcn/ui API
export const TableHeader = THead;
export const TableBody = TBody;
export const TableFooter = TFoot;
export const TableRow = Tr;
export const TableHead = Th;
export const TableCell = Td;
export { Table };
export type { TableProps };

// Exportaciones adicionales para mantener compatibilidad con diferentes patrones de importación
export type { THeadProps, TBodyProps, TFootProps, TrProps, ThProps, TdProps };

// Exportación por defecto para compatibilidad
export default Table;