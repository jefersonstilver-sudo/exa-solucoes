/**
 * Component: ViewToggle
 * Toggle entre Cards e Tabela
 */

import { LayoutGrid, Table } from 'lucide-react';

interface ViewToggleProps {
  view: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
}

export const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <button
        onClick={() => onViewChange('cards')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          view === 'cards'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Cards</span>
      </button>
      <button
        onClick={() => onViewChange('table')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          view === 'table'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Table className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Tabela</span>
      </button>
    </div>
  );
};
