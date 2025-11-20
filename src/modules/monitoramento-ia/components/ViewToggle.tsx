/**
 * Component: ViewToggle
 * Toggle entre Cards e Tabela
 */

import { LayoutGrid, Table } from 'lucide-react';
import { useModuleTheme, getThemeClasses } from '../hooks/useModuleTheme';

interface ViewToggleProps {
  view: 'cards' | 'table';
  onViewChange: (view: 'cards' | 'table') => void;
}

export const ViewToggle = ({ view, onViewChange }: ViewToggleProps) => {
  const { theme } = useModuleTheme();
  const tc = getThemeClasses(theme);
  
  return (
    <div className={`flex items-center gap-1 ${tc.bgInput} rounded-lg p-1 ${tc.border} border`}>
      <button
        onClick={() => onViewChange('cards')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          view === 'cards'
            ? `${tc.bgCard} ${tc.textPrimary} shadow-sm`
            : `${tc.textSecondary} ${tc.bgHover}`
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Cards</span>
      </button>
      <button
        onClick={() => onViewChange('table')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          view === 'table'
            ? `${tc.bgCard} ${tc.textPrimary} shadow-sm`
            : `${tc.textSecondary} ${tc.bgHover}`
        }`}
      >
        <Table className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Tabela</span>
      </button>
    </div>
  );
};
