import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, MapPin, Building2 } from 'lucide-react';
import BuildingMap from '@/components/building-store/BuildingMap';
import type { BuildingStore } from '@/services/buildingStoreService';
import { cn } from '@/lib/utils';

interface ProposalMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildings: Array<Partial<BuildingStore> & { id: string; nome: string }>;
  title?: string;
}

/**
 * Overlay glass fullscreen exibindo o mapa real da loja com todos os
 * prédios da proposta. Reusa o BuildingMap (Google Maps + geocoding cache).
 */
const ProposalMapDialog: React.FC<ProposalMapDialogProps> = ({
  open,
  onOpenChange,
  buildings,
  title = 'Locais da Proposta',
}) => {
  const count = buildings.length;
  const compactTitle = count > 0 ? `Mapa · ${count}` : 'Mapa';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop glass */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'duration-200'
          )}
        />

        {/* Container fullscreen */}
        <DialogPrimitive.Content
          aria-label={title}
          className={cn(
            'fixed inset-0 z-[121] m-0 p-0 outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-[0.98] data-[state=closed]:zoom-out-[0.98]',
            'duration-200'
          )}
          style={{ height: '100dvh', width: '100vw' }}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Mapa com todos os prédios selecionados na proposta.
          </DialogPrimitive.Description>

          {/* Mapa em background ocupando toda a viewport */}
          <div className="absolute inset-0">
            {count === 0 ? (
              <div className="flex h-full w-full items-center justify-center p-6">
                <div className="max-w-sm rounded-3xl border border-white/40 bg-white/85 px-6 py-8 text-center shadow-2xl backdrop-blur-xl">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Building2 className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    Nenhum prédio selecionado
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Selecione prédios na proposta para visualizá-los no mapa.
                  </p>
                </div>
              </div>
            ) : (
              <BuildingMap
                buildings={buildings as BuildingStore[]}
                selectedLocation={null}
                autoFitAllBuildings
                enableClustering
                gestureHandling="greedy"
                defaultZoom={13}
                hideDefaultControls={false}
                requirePreciseGeocode={false}
              />
            )}
          </div>

          {/* Header flutuante glass */}
          <div
            className={cn(
              'absolute left-3 right-3 sm:left-5 sm:right-5',
              'flex items-center justify-between gap-3',
              'rounded-2xl border border-white/40 bg-white/80 px-3 py-2 sm:px-4 sm:py-2.5',
              'shadow-2xl backdrop-blur-xl'
            )}
            style={{
              top: 'max(0.75rem, env(safe-area-inset-top))',
            }}
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 sm:h-10 sm:w-10">
                <MapPin className="h-4 w-4 text-slate-700 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="hidden truncate text-sm font-semibold text-slate-900 sm:block">
                  {title}
                </p>
                <p className="truncate text-sm font-semibold text-slate-900 sm:hidden">
                  {compactTitle}
                </p>
                <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
                  Visualização geográfica em tempo real
                </p>
              </div>
              {count > 0 && (
                <span className="ml-1 hidden flex-shrink-0 rounded-full bg-[#C7141A]/10 px-2.5 py-1 text-xs font-semibold text-[#C7141A] sm:inline-block">
                  {count} {count === 1 ? 'prédio' : 'prédios'}
                </span>
              )}
            </div>

            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Fechar mapa"
                title="Fechar (ESC)"
                className={cn(
                  'inline-flex flex-shrink-0 items-center justify-center',
                  'h-11 w-11 sm:h-10 sm:w-10 rounded-full',
                  'bg-white/90 text-slate-700',
                  'border border-slate-200/80',
                  'shadow-xl hover:shadow-2xl',
                  'hover:bg-white hover:scale-105 active:scale-95',
                  'transition-all duration-200 ease-out',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C7141A]/40 focus-visible:ring-offset-2'
                )}
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default ProposalMapDialog;
