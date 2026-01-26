import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, Clock, MapPin, Globe, Monitor, Smartphone, AlertTriangle, 
  Users, Wifi, ExternalLink, Calendar
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface ProposalView {
  id: string;
  proposal_id: string;
  device_type: string | null;
  user_agent: string | null;
  time_spent_seconds: number | null;
  viewed_at: string;
  ip_address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  country_code?: string | null;
  isp?: string | null;
  session_id?: string | null;
  referrer_url?: string | null;
  timezone?: string | null;
}

interface ViewsAnalyticsCardProps {
  views: ProposalView[];
  totalTimeSpent?: number;
  viewCount?: number;
  firstViewedAt?: string | null;
  lastViewedAt?: string | null;
}

// Mapa de códigos de país para emojis de bandeira
const countryFlags: Record<string, string> = {
  'BR': '🇧🇷',
  'PT': '🇵🇹',
  'US': '🇺🇸',
  'ES': '🇪🇸',
  'AR': '🇦🇷',
  'MX': '🇲🇽',
  'CO': '🇨🇴',
  'CL': '🇨🇱',
  'PE': '🇵🇪',
  'UY': '🇺🇾',
  'PY': '🇵🇾',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'GB': '🇬🇧',
  'IT': '🇮🇹',
  'JP': '🇯🇵',
  'CN': '🇨🇳',
  'CA': '🇨🇦',
  'AU': '🇦🇺',
};

// IPs internos da empresa (exemplo - configurável)
const INTERNAL_IPS = [
  '177.52.', // Range exemplo
  '192.168.',
  '10.0.',
];

export const ViewsAnalyticsCard: React.FC<ViewsAnalyticsCardProps> = ({
  views,
  totalTimeSpent = 0,
  viewCount = 0,
  firstViewedAt,
  lastViewedAt
}) => {
  
  const formatTimeSpent = (seconds: number | null) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}min ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  // Análise dos dados de visualização
  const analytics = useMemo(() => {
    const uniqueIPs = new Set(views.map(v => v.ip_address).filter(Boolean));
    const uniqueSessions = new Set(views.map(v => v.session_id).filter(Boolean));
    
    // Contagem por país
    const countryCount: Record<string, number> = {};
    views.forEach(v => {
      if (v.country_code) {
        countryCount[v.country_code] = (countryCount[v.country_code] || 0) + 1;
      }
    });
    
    // Contagem por cidade
    const cityCount: Record<string, number> = {};
    views.forEach(v => {
      if (v.city) {
        const key = `${v.city}, ${v.region || ''}`.trim();
        cityCount[key] = (cityCount[key] || 0) + 1;
      }
    });
    
    // Contagem por dispositivo
    const deviceCount = {
      mobile: views.filter(v => v.device_type === 'mobile').length,
      desktop: views.filter(v => v.device_type === 'desktop').length
    };
    
    // Detectar IPs internos
    const internalViews = views.filter(v => 
      v.ip_address && INTERNAL_IPS.some(prefix => v.ip_address?.startsWith(prefix))
    );
    
    // Detectar sessões muito longas (> 1 hora)
    const longSessions = views.filter(v => (v.time_spent_seconds || 0) > 3600);
    
    // Múltiplos acessos do mesmo IP em curto período
    const ipAccessCount: Record<string, number> = {};
    views.forEach(v => {
      if (v.ip_address) {
        ipAccessCount[v.ip_address] = (ipAccessCount[v.ip_address] || 0) + 1;
      }
    });
    const suspiciousIPs = Object.entries(ipAccessCount).filter(([_, count]) => count > 3);
    
    // Referrers
    const referrerCount: Record<string, number> = {};
    views.forEach(v => {
      if (v.referrer_url) {
        try {
          const url = new URL(v.referrer_url);
          referrerCount[url.hostname] = (referrerCount[url.hostname] || 0) + 1;
        } catch {
          referrerCount[v.referrer_url] = (referrerCount[v.referrer_url] || 0) + 1;
        }
      } else {
        referrerCount['Acesso direto'] = (referrerCount['Acesso direto'] || 0) + 1;
      }
    });
    
    return {
      uniqueIPs: uniqueIPs.size,
      uniqueSessions: uniqueSessions.size,
      countries: Object.entries(countryCount).sort((a, b) => b[1] - a[1]),
      cities: Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
      deviceCount,
      internalViews: internalViews.length,
      longSessions: longSessions.length,
      suspiciousIPs,
      referrers: Object.entries(referrerCount).sort((a, b) => b[1] - a[1]).slice(0, 5),
      hasAlerts: internalViews.length > 0 || longSessions.length > 0 || suspiciousIPs.length > 0
    };
  }, [views]);

  if (views.length === 0) {
    return (
      <Card className="p-4 bg-white shadow-sm border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-4 w-4 text-[#9C1E1E]" />
          <h3 className="font-semibold text-sm text-gray-900">Análise de Visualizações</h3>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhuma visualização registrada ainda.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white shadow-sm border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#9C1E1E]" />
          <h3 className="font-semibold text-sm text-gray-900">Análise de Visualizações</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {viewCount} acessos
        </Badge>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-purple-50 rounded-xl">
          <Eye className="h-4 w-4 mx-auto text-purple-600 mb-1" />
          <p className="text-lg font-bold text-gray-900">{viewCount}</p>
          <p className="text-[10px] text-gray-500">Visualizações</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-xl">
          <Clock className="h-4 w-4 mx-auto text-blue-600 mb-1" />
          <p className="text-lg font-bold text-gray-900">{formatTimeSpent(totalTimeSpent)}</p>
          <p className="text-[10px] text-gray-500">Tempo Total</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <Wifi className="h-4 w-4 mx-auto text-green-600 mb-1" />
          <p className="text-lg font-bold text-gray-900">{analytics.uniqueIPs}</p>
          <p className="text-[10px] text-gray-500">IPs Únicos</p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-xl">
          <Users className="h-4 w-4 mx-auto text-orange-600 mb-1" />
          <p className="text-lg font-bold text-gray-900">{analytics.uniqueSessions}</p>
          <p className="text-[10px] text-gray-500">Sessões</p>
        </div>
      </div>

      {/* Alertas de fraude */}
      {analytics.hasAlerts && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">Alertas de Análise</span>
          </div>
          <ul className="space-y-1 text-xs text-amber-700">
            {analytics.internalViews > 0 && (
              <li>• {analytics.internalViews} acesso(s) de IP interno (empresa?)</li>
            )}
            {analytics.longSessions > 0 && (
              <li>• {analytics.longSessions} sessão(ões) com mais de 1 hora ativa</li>
            )}
            {analytics.suspiciousIPs.length > 0 && (
              <li>• {analytics.suspiciousIPs.length} IP(s) com múltiplos acessos rápidos</li>
            )}
          </ul>
        </motion.div>
      )}

      {/* Países */}
      {analytics.countries.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Países de Origem</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analytics.countries.map(([code, count]) => (
              <Badge key={code} variant="outline" className="text-xs gap-1">
                {countryFlags[code] || '🌍'} {code} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Cidades */}
      {analytics.cities.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Cidades</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analytics.cities.map(([city, count]) => (
              <Badge key={city} variant="secondary" className="text-xs">
                {city} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dispositivos */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">Dispositivos</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-gray-600" />
            <span className="text-xs">{analytics.deviceCount.desktop} desktop</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-gray-600" />
            <span className="text-xs">{analytics.deviceCount.mobile} mobile</span>
          </div>
        </div>
      </div>

      {/* Origem do tráfego */}
      {analytics.referrers.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Origem do Acesso</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analytics.referrers.map(([source, count]) => (
              <Badge key={source} variant="outline" className="text-xs">
                {source.includes('wa.me') || source.includes('whatsapp') ? '💬 WhatsApp' : 
                 source.includes('mail') || source.includes('gmail') ? '📧 E-mail' : 
                 source === 'Acesso direto' ? '🔗 Direto' : source} ({count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Datas */}
      {(firstViewedAt || lastViewedAt) && (
        <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
          {firstViewedAt && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Primeira visita
              </span>
              <span className="font-medium">
                {format(new Date(firstViewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
          {lastViewedAt && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Última visita
              </span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(lastViewedAt), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Lista detalhada de visualizações */}
      <details className="mt-4">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Ver detalhes de cada visualização ({views.length})
        </summary>
        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
          {views.map((view, index) => (
            <div key={view.id} className="p-2 bg-gray-50 rounded-lg text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1 font-medium">
                    {view.device_type === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                    {view.city ? `${view.city}, ${view.region || ''}` : 'Localização desconhecida'}
                    {view.country_code && (
                      <span className="ml-1">{countryFlags[view.country_code] || ''}</span>
                    )}
                  </div>
                  {view.ip_address && (
                    <span className="text-gray-400">IP: {view.ip_address}</span>
                  )}
                  {view.isp && (
                    <span className="text-gray-400 block">ISP: {view.isp}</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatTimeSpent(view.time_spent_seconds)}</div>
                  <div className="text-gray-400">
                    {format(new Date(view.viewed_at), "dd/MM HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
};
