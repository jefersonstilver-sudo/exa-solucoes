import React, { ReactNode } from 'react';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface ResponsiveColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveColumn<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado',
  className,
}: ResponsiveTableProps<T>) {
  const { isMobile } = useAdvancedResponsive();

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Mobile: Card stack layout
  if (isMobile) {
    return (
      <div className={cn('table-card-stack', className)}>
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            className={cn(
              'table-card-item',
              onRowClick && 'cursor-pointer'
            )}
            onClick={() => onRowClick?.(item)}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div key={col.key} className="table-card-row">
                  <span className="table-card-label">
                    {col.mobileLabel || col.label}:
                  </span>
                  <span className="table-card-value">{col.render(item)}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  }

  // Desktop/Tablet: Traditional table
  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={keyExtractor(item)}
              className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50')}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render(item)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
