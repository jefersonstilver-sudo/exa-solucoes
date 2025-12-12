import { Wifi, WifiOff, Clock } from 'lucide-react';

interface ProviderStatsCardsProps {
  providerStats: Map<string, { falls: number; totalOfflineSeconds: number }>;
  periodLabel: string;
}

// Format seconds to human readable
const formatOfflineTime = (seconds: number): string => {
  if (seconds === 0) return '0min';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};

// Get provider color
const getProviderColor = (provider: string): string => {
  const upperProvider = provider?.toUpperCase() || '';
  if (upperProvider.includes('VIVO')) return 'from-purple-500 to-purple-600';
  if (upperProvider.includes('LIGGA')) return 'from-orange-500 to-orange-600';
  if (upperProvider.includes('TELECOM FOZ')) return 'from-blue-500 to-blue-600';
  return 'from-gray-500 to-gray-600';
};

const getProviderTextColor = (provider: string): string => {
  const upperProvider = provider?.toUpperCase() || '';
  if (upperProvider.includes('VIVO')) return 'text-purple-600';
  if (upperProvider.includes('LIGGA')) return 'text-orange-600';
  if (upperProvider.includes('TELECOM FOZ')) return 'text-blue-600';
  return 'text-gray-600';
};

export const ProviderStatsCards = ({ providerStats, periodLabel }: ProviderStatsCardsProps) => {
  // Convert Map to array and sort by falls (descending)
  const providers = Array.from(providerStats.entries())
    .filter(([name]) => name !== 'Sem Operadora')
    .sort((a, b) => b[1].falls - a[1].falls);

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Wifi className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Operadoras {periodLabel}
        </span>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {providers.map(([provider, stats]) => (
          <div 
            key={provider}
            className="bg-muted/50 rounded-lg p-2.5 hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${getProviderTextColor(provider)}`}>
                {provider}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Quedas */}
              <div className="flex items-center gap-1">
                <WifiOff className={`h-3 w-3 ${stats.falls > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-bold ${stats.falls > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {stats.falls}
                </span>
              </div>
              
              {/* Tempo Offline */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className={`text-xs ${stats.totalOfflineSeconds > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {formatOfflineTime(stats.totalOfflineSeconds)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
