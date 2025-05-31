
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface SindicosPageHeaderProps {
  onExportCSV: () => void;
}

const SindicosPageHeader: React.FC<SindicosPageHeaderProps> = ({ onExportCSV }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Síndicos Interessados</h1>
        <p className="text-gray-600">Gerencie os síndicos que demonstraram interesse no projeto</p>
      </div>
      
      <Button onClick={onExportCSV} variant="outline" className="flex items-center gap-2">
        <Download className="w-4 h-4" />
        Exportar CSV
      </Button>
    </div>
  );
};

export default SindicosPageHeader;
