/**
 * Mesma configuração em dois lugares: dentro de uma janela (lista de telas) ou embutida na página da tela.
 * Os componentes de configuração usam Moldura/MCab/MTit/MDesc no lugar de Dialog/DialogHeader/DialogTitle/DialogDescription.
 */
import React, { createContext, useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Embutido = createContext(false);

export function Moldura({ embutido = false, onFechar, className = '', children }: { embutido?: boolean; onFechar: () => void; className?: string; children: React.ReactNode }) {
  if (embutido) {
    return (
      <Embutido.Provider value>
        <section className="min-w-0 rounded-3xl border border-black/[0.06] bg-white/80 p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)] backdrop-blur">{children}</section>
      </Embutido.Provider>
    );
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onFechar(); }}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={className}>{children}</DialogContent>
    </Dialog>
  );
}

export function MCab({ children }: { children: React.ReactNode }) {
  return useContext(Embutido) ? <div className="mb-3 space-y-1">{children}</div> : <DialogHeader>{children}</DialogHeader>;
}
export function MTit({ children }: { children: React.ReactNode }) {
  return useContext(Embutido) ? <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">{children}</h2> : <DialogTitle>{children}</DialogTitle>;
}
export function MDesc({ children }: { children: React.ReactNode }) {
  return useContext(Embutido) ? <p className="text-[13px] text-[#5E5F63]">{children}</p> : <DialogDescription>{children}</DialogDescription>;
}
export const useEmbutido = () => useContext(Embutido);
