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
    <div className="flex items-center gap-1 bg-module-input rounded-lg p-1 border border-module">
      <button
        onClick={() => onViewChange('cards')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          view === 'cards'
            ? 'bg-module-card text-module-primary shadow-sm'
            : 'text-module-secondary hover-module-bg'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Cards</span>
      </button>
      <button
        onClick={() => onViewChange('table')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          view === 'table'
            ? 'bg-module-card text-module-primary shadow-sm'
            : 'text-module-secondary hover-module-bg'
        }`}
      >
        <Table className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Tabela</span>
      </button>
    </div>
  );
};
