import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Coupon } from '@/types/coupon';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Tag, 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Building2, 
  Percent,
  Clock,
  Target,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CouponDetailsHoverCardProps {
  coupon: Coupon;
  children: React.ReactNode;
}

const CouponDetailsHoverCard: React.FC<CouponDetailsHoverCardProps> = ({ coupon, children }) => {
  const now = new Date();
  const isExpired = coupon.expira_em && new Date(coupon.expira_em) <= now;
  const isMaxedOut = coupon.usos_atuais >= coupon.max_usos;
  const usagePercent = (coupon.usos_atuais / coupon.max_usos) * 100;
  
  const getStatusInfo = () => {
    if (!coupon.ativo) {
      return { 
        icon: XCircle, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-50 border-gray-200',
        text: 'Cupom Inativo' 
      };
    }
    if (isExpired) {
      return { 
        icon: Clock, 
        color: 'text-red-500', 
        bgColor: 'bg-red-50 border-red-200',
        text: 'Cupom Expirado' 
      };
    }
    if (isMaxedOut) {
      return { 
        icon: AlertCircle, 
        color: 'text-orange-500', 
        bgColor: 'bg-orange-50 border-orange-200',
        text: 'Limite Atingido' 
      };
    }
    return { 
      icon: CheckCircle2, 
      color: 'text-green-500', 
      bgColor: 'bg-green-50 border-green-200',
      text: 'Cupom Ativo' 
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="cursor-help hover:underline decoration-dashed underline-offset-4 transition-all">
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-96 p-0 overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-white to-gray-50"
        sideOffset={8}
        align="start"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header com gradiente */}
          <div className={`${statusInfo.bgColor} border-b-2 p-4`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className={`h-5 w-5 ${statusInfo.color}`} />
                  <span className="font-mono text-lg font-bold">
                    {coupon.codigo}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
              <div className={`flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-[#3C1361] to-[#5a1a8f] shadow-lg`}>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {coupon.desconto_percentual}%
                  </div>
                  <div className="text-[10px] text-white/80">
                    OFF
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Corpo com informações */}
          <div className="p-4 space-y-3">
            {/* Descrição */}
            {coupon.descricao && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {coupon.descricao}
                </p>
              </div>
            )}

            {/* Grid de informações */}
            <div className="grid grid-cols-2 gap-3">
              {/* Categoria */}
              <div className="flex items-start gap-2 p-2 bg-white rounded-lg border">
                <Target className="h-4 w-4 text-[#3C1361] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">
                    Categoria
                  </div>
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {coupon.categoria.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Uso */}
              <div className="flex items-start gap-2 p-2 bg-white rounded-lg border">
                <Users className="h-4 w-4 text-[#3C1361] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">
                    Utilização
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {coupon.usos_atuais} / {coupon.max_usos}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className={`h-1 rounded-full transition-all ${
                        usagePercent >= 80 ? 'bg-red-500' : 
                        usagePercent >= 50 ? 'bg-orange-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Requisitos */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Requisitos
              </div>
              
              <div className="space-y-2">
                {/* Mínimo de meses */}
                {coupon.min_meses > 1 && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      Plano mínimo: <span className="font-semibold text-purple-700">{coupon.min_meses} meses</span>
                    </span>
                  </div>
                )}

                {/* Valor mínimo */}
                {coupon.valor_minimo_pedido && coupon.valor_minimo_pedido > 0 && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-green-50 border border-green-200 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      Valor mínimo: <span className="font-semibold text-green-700">R$ {coupon.valor_minimo_pedido.toFixed(2)}</span>
                    </span>
                  </div>
                )}

                {/* Quantidade de prédios */}
                {(coupon.min_predios || coupon.max_predios) && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      {coupon.min_predios && coupon.max_predios 
                        ? `${coupon.min_predios} a ${coupon.max_predios} prédios`
                        : coupon.min_predios 
                        ? `Mínimo: ${coupon.min_predios} prédios`
                        : `Máximo: ${coupon.max_predios} prédios`
                      }
                    </span>
                  </div>
                )}

                {/* Limite por usuário */}
                {coupon.uso_por_usuario && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Users className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      Limite: <span className="font-semibold text-amber-700">{coupon.uso_por_usuario}x por usuário</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Validade */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Validade
                </span>
                <span className={`font-medium ${
                  isExpired ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {coupon.expira_em 
                    ? format(new Date(coupon.expira_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : 'Sem expiração'
                  }
                </span>
              </div>
              {coupon.data_inicio && (
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-500">
                    Início
                  </span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(coupon.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CouponDetailsHoverCard;
