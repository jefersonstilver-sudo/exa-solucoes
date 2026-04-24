import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSindicoFormStore } from './formStore';
import { useExitGuard } from './useExitGuard';

interface ExitGuardFloatingProps {
  /** URL alvo padrão quando o usuário confirma a saída pelo botão flutuante. */
  defaultTarget?: string;
}

const ExitGuardFloating: React.FC<ExitGuardFloatingProps> = ({ defaultTarget = '/' }) => {
  const navigate = useNavigate();
  const { formStarted } = useExitGuard();
  const [open, setOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<string>(defaultTarget);

  // Aviso de fechamento de aba / refresh
  useEffect(() => {
    if (!formStarted) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formStarted]);

  // API global leve para outros componentes (logo, links) pedirem confirmação.
  useEffect(() => {
    (window as any).__exaSindicoRequestExit = (target: string = defaultTarget) => {
      setPendingTarget(target);
      setOpen(true);
    };
    return () => {
      try {
        delete (window as any).__exaSindicoRequestExit;
      } catch {
        /* noop */
      }
    };
  }, [defaultTarget]);

  const handleConfirm = useCallback(() => {
    useSindicoFormStore.getState().reset();
    setOpen(false);
    // Navegação interna; se for absoluta http(s), faz hard redirect.
    if (/^https?:\/\//i.test(pendingTarget)) {
      window.location.href = pendingTarget;
    } else {
      navigate(pendingTarget);
    }
  }, [navigate, pendingTarget]);

  if (!formStarted) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPendingTarget(defaultTarget);
          setOpen(true);
        }}
        aria-label="Sair do formulário"
        className="
          fixed z-[var(--z-floating)]
          bottom-4 right-4 sm:bottom-6 sm:right-6
          flex items-center gap-2 px-4 py-3 rounded-2xl
          backdrop-blur-xl bg-white/10 border border-white/20
          shadow-[0_8px_32px_rgba(0,0,0,0.45)]
          text-white text-sm font-medium
          hover:bg-white/15 hover:border-white/30
          active:scale-[0.97]
          transition-all duration-200
        "
      >
        <ShieldAlert className="w-4 h-4 text-amber-300" aria-hidden />
        <span className="hidden sm:inline">Progresso não salvo</span>
        <span className="sm:hidden">Sair</span>
        <LogOut className="w-4 h-4 opacity-70" aria-hidden />
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="exa-theme">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do cadastro?</AlertDialogTitle>
            <AlertDialogDescription>
              Você já começou a preencher o formulário. Se sair agora,{' '}
              <strong className="text-foreground">todas as informações serão perdidas</strong>{' '}
              e será necessário começar do zero.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar preenchendo</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ExitGuardFloating;
