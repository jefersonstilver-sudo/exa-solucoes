import { useState, useEffect, useMemo, useCallback } from 'react';
import { Wifi, WifiOff, Zap, Lock, Eye, EyeOff, AlertTriangle, X, CheckCircle2, Clock, User, Pencil, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Device, fetchDevices } from '@/modules/monitoramento-ia/utils/devices';
import { DeviceIncident, useIncidentCategories } from '@/modules/monitoramento-ia/hooks/useDeviceIncidents';
import { useDeviceIncidentStatus } from '@/modules/monitoramento-ia/hooks/useDeviceIncidentStatus';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const MONITOR_PASSWORD = 'Exa3029@#';
const SESSION_KEY = 'exa_monitor_auth';
const POLLING_MS = 15000;

// ─── Realtime Counter Hook ───
const useRealtimeCounter = (lastOnline: string | null) => {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!lastOnline) { setElapsed('sem dados'); return; }
    const update = () => {
      const diff = Date.now() - new Date(lastOnline).getTime();
      if (diff < 0) { setElapsed('agora'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(h > 0 ? `${h}h ${m}min` : m > 0 ? `${m}min ${s}s` : `${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastOnline]);
  return elapsed;
};

// ─── Device Incident Detail Modal ───
const DeviceIncidentModal = ({ device, onClose }: { device: Device; onClose: () => void }) => {
  const { categories } = useIncidentCategories();
  const [incident, setIncident] = useState<DeviceIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [causa, setCausa] = useState('');
  const [resolucao, setResolucao] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isOnline = device.status === 'online';

  const fetchIncident = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('device_offline_incidents')
        .select('*, category:incident_categories(*)')
        .eq('device_id', device.id)
        .in('status', ['pendente', 'causa_registrada'])
        .is('resolved_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (data) {
        setIncident(data);
      } else if (!isOnline) {
        // Create incident on demand
        const { data: newIncident, error: insertError } = await (supabase as any)
          .from('device_offline_incidents')
          .insert([{ device_id: device.id, started_at: new Date().toISOString(), status: 'pendente' }])
          .select('*, category:incident_categories(*)')
          .single();
        if (!insertError && newIncident) setIncident(newIncident);
      }
    } catch (err) {
      console.error('Erro ao buscar incidente:', err);
    } finally {
      setLoading(false);
    }
  }, [device.id, isOnline]);

  useEffect(() => { fetchIncident(); }, [fetchIncident]);

  const handleSave = async () => {
    if (!incident || !selectedCategoryId || !causa.trim()) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('device_offline_incidents')
        .update({
          category_id: selectedCategoryId,
          causa: causa.trim(),
          resolucao: resolucao.trim() || null,
          registrado_por_nome: 'Monitor Público',
          registrado_em: new Date().toISOString(),
          status: 'causa_registrada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', incident.id);
      if (error) throw error;
      toast.success('Causa registrada!');
      await fetchIncident();
      setIsEditing(false);
      setCausa('');
      setResolucao('');
      setSelectedCategoryId('');
    } catch (err) {
      toast.error('Erro ao registrar causa');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = () => {
    if (!incident) return;
    setSelectedCategoryId(incident.category_id || '');
    setCausa(incident.causa || '');
    setResolucao(incident.resolucao || '');
    setIsEditing(true);
  };

  const displayName = (device.comments || device.name).split(' - ')[0].trim();
  const isPending = !incident || incident.status === 'pendente';
  const hasCause = incident?.status === 'causa_registrada';
  const showForm = isPending || isEditing;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'px-6 py-4 border-b flex items-center justify-between',
          isOnline ? 'border-green-500/30 bg-green-950/50' : 'border-red-500/30 bg-red-950/50'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-3 h-3 rounded-full',
              isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse'
            )} />
            <div>
              <h2 className="text-white font-bold text-lg">{displayName}</h2>
              <p className="text-white/50 text-xs">{device.provider || 'Sem provedor'} • ID: {device.anydesk_client_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isOnline ? (
            <div className="text-center py-8">
              <Wifi className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-green-400 font-bold text-lg">Painel Online</p>
              <p className="text-white/50 text-sm mt-1">
                {device.last_online_at
                  ? `Última atividade: ${formatDistanceToNow(new Date(device.last_online_at), { addSuffix: true, locale: ptBR })}`
                  : 'Funcionando normalmente'}
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/50 text-sm">Carregando incidente...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn('w-4 h-4', isPending ? 'text-red-400' : 'text-amber-400')} />
                  <span className={cn('text-sm font-bold', isPending ? 'text-red-400' : 'text-amber-400')}>
                    {isPending ? '⚠️ Causa Pendente' : '📋 Causa Registrada'}
                  </span>
                </div>
                {incident && (
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Offline há {formatDistanceToNow(new Date(incident.started_at), { locale: ptBR })}
                  </span>
                )}
              </div>

              {hasCause && !isEditing ? (
                /* View mode */
                <div className="space-y-3">
                  {incident?.category && (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                      style={{
                        backgroundColor: `${incident.category.color}20`,
                        color: incident.category.color,
                        borderColor: `${incident.category.color}40`,
                      }}
                    >
                      {incident.category.icon} {incident.category.label}
                    </span>
                  )}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs font-semibold text-amber-400 mb-1">Causa:</p>
                    <p className="text-sm text-white">{incident?.causa}</p>
                  </div>
                  {incident?.resolucao && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-xs font-semibold text-amber-400 mb-1">Resolução:</p>
                      <p className="text-sm text-white">{incident.resolucao}</p>
                    </div>
                  )}
                  {incident?.registrado_por_nome && (
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <User className="w-3 h-3" />
                      <span>
                        por <strong className="text-white/60">{incident.registrado_por_nome}</strong>
                        {incident.registrado_em && ` em ${format(new Date(incident.registrado_em), "dd/MM 'às' HH:mm", { locale: ptBR })}`}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar Causa
                  </button>
                </div>
              ) : (
                /* Form mode */
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-red-400 mb-2 block">Categoria</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                            selectedCategoryId === cat.id ? 'ring-2 ring-offset-1 ring-offset-gray-900 scale-105' : 'opacity-70 hover:opacity-100'
                          )}
                          style={{
                            backgroundColor: selectedCategoryId === cat.id ? `${cat.color}30` : `${cat.color}15`,
                            color: cat.color,
                            borderColor: selectedCategoryId === cat.id ? cat.color : `${cat.color}40`,
                          }}
                        >
                          {cat.icon} {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-red-400 mb-1 block">Causa da Queda *</label>
                    <textarea
                      placeholder="Descreva o motivo..."
                      value={causa}
                      onChange={(e) => setCausa(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[60px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/50 mb-1 block">Resolução (opcional)</label>
                    <textarea
                      placeholder="O que está sendo feito..."
                      value={resolucao}
                      onChange={(e) => setResolucao(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[60px] resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    {isEditing && (
                      <button
                        onClick={() => { setIsEditing(false); setCausa(''); setResolucao(''); setSelectedCategoryId(''); }}
                        className="flex-1 h-10 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saving || !incident || !selectedCategoryId || !causa.trim()}
                      className={cn(
                        'h-10 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40',
                        isEditing ? 'flex-1 bg-amber-600 hover:bg-amber-700' : 'w-full bg-[#9C1E1E] hover:bg-[#B40D1A]'
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Registrar Causa'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Monitor Card ───
const MonitorCard = ({ device, compact, onClick, hasCauseDefined }: { device: Device; compact: boolean; onClick: () => void; hasCauseDefined: boolean }) => {
  const displayName = (device.comments || device.name).split(' - ')[0].trim();
  const provider = device.provider || 'Sem provedor';
  const elapsed = useRealtimeCounter(device.last_online_at);
  const isOnline = device.status === 'online';

  const getProviderColor = (p: string) => {
    const u = p.toUpperCase();
    if (u.includes('VIVO')) return 'text-purple-400';
    if (u.includes('LIGGA')) return 'text-orange-400';
    if (u.includes('TELECOM FOZ')) return 'text-blue-400';
    return 'text-white/90';
  };

  const showYellowArc = !isOnline && hasCauseDefined;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl h-full transition-all duration-300 cursor-pointer',
        isOnline
          ? 'bg-green-950/90 border-2 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:border-green-400'
          : showYellowArc
            ? 'bg-red-950/90 border-2 border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:border-amber-300'
            : 'bg-red-950/90 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse hover:border-red-400'
      )}
      style={{ backgroundColor: isOnline ? 'rgba(5,46,22,0.9)' : 'rgba(69,10,10,0.9)' }}
    >
      <div className={cn(
        'absolute top-3 right-3 w-4 h-4 rounded-full shadow-lg',
        isOnline
          ? 'bg-green-500 shadow-[0_0_16px_rgba(34,197,94,1)] animate-pulse'
          : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] animate-ping'
      )} />

      <div className="p-5 h-full flex flex-col justify-between">
        <div className="space-y-2 flex-1">
          <h3 className={cn('font-bold text-white line-clamp-2 leading-tight', compact ? 'text-base' : 'text-2xl')}>
            {displayName}
          </h3>
          <p className={cn('font-semibold', compact ? 'text-xs' : 'text-sm', getProviderColor(provider))}>
            {provider}
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
              <span className={cn('text-sm font-bold', isOnline ? 'text-green-400' : 'text-red-400')}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className={cn('text-xs truncate', isOnline ? 'text-white/50' : 'text-red-400')}>
              {isOnline
                ? device.last_online_at
                  ? formatDistanceToNow(new Date(device.last_online_at), { addSuffix: true, locale: ptBR })
                  : 'agora'
                : elapsed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Login Screen ───
const LoginScreen = ({ onAuth }: { onAuth: () => void }) => {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MONITOR_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9C1E1E]/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-950 via-black to-gray-900" />
      </div>

      <div
        className={cn(
          'relative z-10 w-full max-w-md mx-4 p-8 rounded-3xl',
          'backdrop-blur-xl bg-white/5 border border-white/10',
          'shadow-[0_0_80px_rgba(156,30,30,0.15)]',
          'transition-transform',
          shake && 'animate-[shake_0.5s_ease-in-out]'
        )}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#9C1E1E] via-[#180A0A] to-[#0B0B0B] flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(156,30,30,0.4)]">
            <span className="text-white text-3xl font-black tracking-tighter">EXA</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Monitor de Painéis</h1>
          <p className="text-sm text-white/50 mt-1">Acesso restrito — Digite a senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs text-white/60 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Senha de Acesso
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="••••••••"
                className={cn(
                  'w-full h-12 px-4 pr-12 rounded-xl bg-white/5 border text-white placeholder:text-white/30',
                  'focus:outline-none focus:ring-2 focus:ring-[#9C1E1E]/50 transition-all',
                  error ? 'border-red-500/60' : 'border-white/10'
                )}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-400">Senha incorreta. Tente novamente.</p>}
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-[#9C1E1E] hover:bg-[#B40D1A] text-white font-bold text-sm transition-all shadow-[0_0_30px_rgba(156,30,30,0.3)] hover:shadow-[0_0_40px_rgba(156,30,30,0.5)]"
          >
            Acessar Monitor
          </button>
        </form>

        <p className="text-center text-[10px] text-white/20 mt-6">EXA Soluções — Monitoramento em Tempo Real</p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

// ─── Monitor Dashboard ───
const MonitorDashboard = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [groups, setGroups] = useState<{ id: string; nome: string; cor: string; ordem: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPortrait, setIsPortrait] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { incidentStatusMap } = useDeviceIncidentStatus(devices);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const { devices: data } = await fetchDevices(0, 500);
      setDevices(data);
    } catch (err) {
      console.error('[MonitorPublic] Erro:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('device_groups')
        .select('*')
        .order('ordem', { ascending: true });
      if (!error && data) setGroups(data);
    } catch (err) {
      console.error('[MonitorPublic] Erro ao buscar grupos:', err);
    }
  }, []);

  useEffect(() => {
    loadDevices();
    loadGroups();
    const id = setInterval(loadDevices, POLLING_MS);
    return () => clearInterval(id);
  }, [loadDevices, loadGroups]);

  useEffect(() => {
    const channel = supabase
      .channel('monitor_public_devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => loadDevices())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_groups' }, () => loadGroups())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadDevices, loadGroups]);

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      if (a.status === 'offline' && b.status !== 'offline') return -1;
      if (a.status !== 'offline' && b.status === 'offline') return 1;
      return 0;
    });
  }, [devices]);

  // Group devices
  const groupedDevices = useMemo(() => {
    const grouped = new Map<string | null, Device[]>();
    for (const device of sortedDevices) {
      const gid = (device as any).device_group_id || null;
      if (!grouped.has(gid)) grouped.set(gid, []);
      grouped.get(gid)!.push(device);
    }
    const result: { group: typeof groups[0] | null; devices: Device[] }[] = [];
    for (const g of groups) {
      if (grouped.has(g.id)) result.push({ group: g, devices: grouped.get(g.id)! });
    }
    if (grouped.has(null)) result.push({ group: null, devices: grouped.get(null)! });
    return result;
  }, [sortedDevices, groups]);

  const onlineCount = useMemo(() => devices.filter((d) => d.status === 'online').length, [devices]);
  const offlineCount = devices.length - onlineCount;

  const gridConfig = useMemo(() => {
    const count = devices.length;
    const isMobile = window.innerWidth < 1024;
    if (count === 0) return { cols: 1, compact: false };
    if (isMobile && isPortrait) return count <= 2 ? { cols: 1, compact: false } : { cols: 2, compact: true };
    if (isMobile) return count <= 3 ? { cols: 3, compact: false } : count <= 8 ? { cols: 4, compact: true } : { cols: 5, compact: true };
    if (count <= 4) return { cols: 2, compact: false };
    if (count <= 9) return { cols: 3, compact: false };
    if (count <= 16) return { cols: 4, compact: false };
    if (count <= 30) return { cols: 5, compact: true };
    if (count <= 50) return { cols: 6, compact: true };
    return { cols: 7, compact: true };
  }, [devices.length, isPortrait]);

  const isMobile = window.innerWidth < 1024;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#9C1E1E] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Carregando painéis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />

      <div className="relative z-10 flex flex-col h-full">
        <header className={cn(
          'shrink-0 flex items-center bg-gradient-to-r from-white/5 to-transparent backdrop-blur-xl border-b border-white/10',
          isMobile ? 'px-3 py-2' : 'px-8 py-5'
        )}>
          {isMobile ? (
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9C1E1E] to-[#0B0B0B] flex items-center justify-center">
                  <span className="text-white text-xs font-black">EXA</span>
                </div>
                <p className={cn('font-black tracking-tight tabular-nums bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent', isPortrait ? 'text-3xl' : 'text-4xl')}>
                  {format(currentTime, 'HH:mm:ss')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/50 uppercase tracking-wide">Online</p>
                <p className={cn('font-black tabular-nums', isPortrait ? 'text-2xl' : 'text-3xl')}>
                  <span className="text-green-400">{onlineCount}</span>
                  <span className="text-white/30 mx-1">/</span>
                  <span className="text-white">{devices.length}</span>
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9C1E1E] via-[#180A0A] to-[#0B0B0B] flex items-center justify-center shadow-[0_0_30px_rgba(156,30,30,0.3)]">
                  <span className="text-white text-lg font-black tracking-tighter">EXA</span>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Monitor</p>
                  <p className="text-white/40 text-xs">Tempo Real</p>
                </div>
              </div>

              <div className="flex-1 flex justify-center">
                <div className="flex flex-col items-center">
                  <p className="text-7xl font-black tracking-tight tabular-nums bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    {format(currentTime, 'HH:mm:ss')}
                  </p>
                  <p className="mt-2 text-sm text-white/60 font-light tracking-widest uppercase">
                    {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-8">
                {offlineCount > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                    <div>
                      <p className="text-xs text-red-400/70 uppercase tracking-wide">Offline</p>
                      <p className="text-2xl font-black text-red-400 tabular-nums">{offlineCount}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Conectados</p>
                  <p className="text-4xl font-black tabular-nums">
                    <span className="text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{onlineCount}</span>
                    <span className="text-white/30 mx-1">/</span>
                    <span className="text-white">{devices.length}</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </header>

        <main className={cn('flex-1 overflow-auto', isMobile ? 'p-2' : 'p-6')}>
          {devices.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-4xl font-bold text-white/60 mb-2">Nenhum dispositivo</p>
                <p className="text-xl text-white/40">Aguardando dados...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedDevices.map(({ group, devices: groupDevs }) => {
                const groupKey = group?.id || '__ungrouped__';
                const isCollapsed = collapsedGroups.has(groupKey);
                return (
                  <div key={groupKey}>
                    {/* Group Header */}
                    <button
                      onClick={() => setCollapsedGroups(prev => {
                        const next = new Set(prev);
                        if (next.has(groupKey)) next.delete(groupKey);
                        else next.add(groupKey);
                        return next;
                      })}
                      className="flex items-center gap-2 w-full px-4 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm mb-3 hover:bg-white/10 transition-colors"
                      style={{ borderLeftColor: group?.cor || '#6B7280', borderLeftWidth: '4px' }}
                    >
                      {isCollapsed ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronUp className="w-4 h-4 text-white/50" />}
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: group?.cor || '#6B7280' }} />
                      <span className="font-semibold text-sm text-white">{group?.nome || 'Sem grupo'}</span>
                      <span className="text-xs text-white/40 ml-1">({groupDevs.length})</span>
                    </button>
                    {!isCollapsed && (
                      <div
                        className={cn('grid auto-rows-fr', isMobile ? 'gap-2' : 'gap-4')}
                        style={{ gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))` }}
                      >
                        {groupDevs.map((device) => (
                          <MonitorCard
                            key={device.id}
                            device={device}
                            compact={gridConfig.compact}
                            onClick={() => setSelectedDevice(device)}
                            hasCauseDefined={incidentStatusMap.get(device.id) === 'causa_registrada'}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Device Detail Modal */}
      {selectedDevice && (
        <DeviceIncidentModal
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
};

// ─── Main Page ───
const MonitorPublicPage = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true');

  return (
    <>
      <Toaster position="top-right" />
      {!authed ? <LoginScreen onAuth={() => setAuthed(true)} /> : <MonitorDashboard />}
    </>
  );
};

export default MonitorPublicPage;
