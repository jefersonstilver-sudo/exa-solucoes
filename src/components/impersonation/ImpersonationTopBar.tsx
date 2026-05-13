import React, { useEffect, useState } from 'react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut, Clock } from 'lucide-react';

const fmt = (ms: number) => {
  if (ms < 0) ms = 0;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const ImpersonationTopBar: React.FC = () => {
  const { impersonation, isImpersonating, endSession } = useImpersonation();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isImpersonating) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isImpersonating]);

  if (!isImpersonating || !impersonation) return null;

  const remaining = new Date(impersonation.expires_at).getTime() - now;
  const target = impersonation.target_user;
  const targetLabel = target?.nome || target?.email || impersonation.target_user_id.slice(0, 8);

  return (
    <>
      <div className="h-12" aria-hidden />
      <div
        className="fixed top-0 inset-x-0 z-[1000] flex items-center justify-between gap-3 px-4 py-2 text-white shadow-lg"
        style={{ background: 'linear-gradient(90deg, #7D1818 0%, #C7141A 100%)' }}
        role="alert"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm font-semibold truncate">
            Modo Admin — visualizando como cliente <span className="font-bold">{targetLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-xs font-mono bg-black/20 rounded px-2 py-1">
            <Clock className="h-3.5 w-3.5" /> {fmt(remaining)}
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-[#7D1818] hover:bg-white/90 font-semibold"
            onClick={() => endSession('manual')}
          >
            <LogOut className="h-4 w-4 mr-1" /> Sair do modo cliente
          </Button>
        </div>
      </div>
    </>
  );
};

export default ImpersonationTopBar;
