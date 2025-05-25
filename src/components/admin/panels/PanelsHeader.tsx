
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Bug } from 'lucide-react';

interface PanelsHeaderProps {
  onRefresh: () => void;
  onNewPanel: () => void;
  loading: boolean;
}

const PanelsHeader: React.FC<PanelsHeaderProps> = ({
  onRefresh,
  onNewPanel,
  loading
}) => {
  const handleDebugRefresh = () => {
    console.log('🔄 [USER ACTION] Usuário clicou em refresh - forçando reload');
    onRefresh();
  };

  const handleDebugLog = () => {
    console.log('🐛 [DEBUG] Estado atual dos painéis:');
    console.log('- Loading:', loading);
    console.log('- Timestamp:', new Date().toISOString());
    
    // Force browser cache clear and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          console.log('🧹 [CACHE] Limpando cache:', name);
          caches.delete(name);
        });
      });
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Gerenciar Painéis</h1>
      <p className="text-gray-600 mt-2">Monitore e gerencie todos os painéis digitais</p>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Button variant="outline" onClick={handleDebugRefresh} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button variant="outline" onClick={handleDebugLog}>
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
        <Button 
          onClick={onNewPanel}
          className="bg-indexa-purple hover:bg-indexa-purple-dark text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Painel
        </Button>
      </div>
    </div>
  );
};

export default PanelsHeader;
