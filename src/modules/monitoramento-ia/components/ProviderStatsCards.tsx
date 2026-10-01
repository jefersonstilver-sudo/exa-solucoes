import { Wifi, WifiOff, CircleHelp } from 'lucide-react';
import { useProviderConnectionStats } from '../hooks/useProviderConnectionStats';

export const ProviderStatsCards = () => {
  const { data: providers = [], isLoading, isError } = useProviderConnectionStats();

  return (
    <section className="bg-card border border-border rounded-lg p-3 shadow-sm" aria-label="Conexões por operadora">
      <div className="flex items-center gap-2 mb-3">
        <Wifi className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Operadoras agora
        </span>
      </div>
      {isError && <p className="text-sm text-destructive">Não foi possível atualizar as conexões.</p>}
      {isLoading && providers.length === 0 && <p className="text-sm text-muted-foreground">Carregando operadoras...</p>}
      {!isLoading && !isError && providers.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conexão cadastrada.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {providers.map(({ provider, online, offline, unknown }) => (
          <div key={provider} className="bg-muted/50 rounded-md p-3 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-foreground break-words min-w-0">{provider}</span>
              <span className="text-xs text-muted-foreground shrink-0">{online + offline + unknown} total</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5 text-sm text-foreground" aria-label={`${online} online`}>
                <Wifi className="h-4 w-4 text-primary" />
                <strong>{online}</strong><span>online</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-foreground" aria-label={`${offline} offline`}>
                <WifiOff className="h-4 w-4 text-destructive" />
                <strong>{offline}</strong><span>offline</span>
              </div>
              {unknown > 0 && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><CircleHelp className="h-4 w-4" /><strong>{unknown}</strong><span>indefinidos</span></div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
