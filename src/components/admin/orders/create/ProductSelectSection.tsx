import React from 'react';
import { Label } from '@/components/ui/label';
import { AdminOrderFormData } from '@/hooks/useAdminCreateOrder';
import { useProdutosExa } from '@/hooks/useProdutosExa';
import { Monitor, Smartphone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductSelectSectionProps {
  formData: AdminOrderFormData;
  updateField: <K extends keyof AdminOrderFormData>(key: K, value: AdminOrderFormData[K]) => void;
}

const ProductSelectSection: React.FC<ProductSelectSectionProps> = ({ formData, updateField }) => {
  const { produtos, isLoading } = useProdutosExa();
  const activeProducts = produtos?.filter(p => p.ativo) || [];

  if (isLoading) {
    return <div className="flex items-center gap-2 py-4 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando produtos...</div>;
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Tipo de Produto *</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeProducts.map(produto => {
          const isSelected = formData.tipoProduto === produto.codigo;
          const isHorizontal = produto.formato === 'horizontal';
          
          return (
            <button
              key={produto.id}
              type="button"
              onClick={() => updateField('tipoProduto', produto.codigo)}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                isSelected
                  ? 'border-[#9C1E1E] bg-[#9C1E1E]/5 shadow-sm'
                  : 'border-border hover:border-[#9C1E1E]/40 hover:bg-accent/50'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#9C1E1E] flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isSelected ? 'bg-[#9C1E1E]/10' : 'bg-muted'
                )}>
                  {isHorizontal ? <Monitor className="h-5 w-5 text-[#9C1E1E]" /> : <Smartphone className="h-5 w-5 text-[#9C1E1E]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{produto.nome}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{produto.descricao}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium">
                      {produto.resolucao}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium">
                      {produto.duracao_video_segundos}s
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium">
                      {produto.max_videos_por_pedido || 1} slot(s)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium">
                      {produto.proporcao}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductSelectSection;
