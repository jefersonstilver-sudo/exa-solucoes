import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Props {
  status: string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  novo:               { label: 'Novo',            cls: 'bg-blue-500 text-white hover:bg-blue-500' },
  em_contato:         { label: 'Em contato',      cls: 'bg-yellow-500 text-white hover:bg-yellow-500' },
  contatado:          { label: 'Contatado',       cls: 'bg-yellow-500 text-white hover:bg-yellow-500' },
  interessado:        { label: 'Interessado',     cls: 'bg-yellow-600 text-white hover:bg-yellow-600' },
  visita_agendada:    { label: 'Visita agendada', cls: 'bg-orange-500 text-white hover:bg-orange-500' },
  aprovado:           { label: 'Aprovado',        cls: 'bg-green-600 text-white hover:bg-green-600' },
  instalado:          { label: 'Instalado',       cls: 'bg-emerald-600 text-white hover:bg-emerald-600' },
  recusado:           { label: 'Recusado',        cls: 'bg-red-600 text-white hover:bg-red-600' },
  nao_interessado:    { label: 'Não interessado', cls: 'bg-red-500 text-white hover:bg-red-500' },
  arquivado:          { label: 'Arquivado',       cls: 'bg-gray-500 text-white hover:bg-gray-500' },
};

export const SindicoStatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: 'bg-gray-400 text-white' };
  return <Badge className={`${cfg.cls} ${className}`}>{cfg.label}</Badge>;
};

export const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo' },
  { value: 'em_contato', label: 'Em contato' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'interessado', label: 'Interessado' },
  { value: 'visita_agendada', label: 'Visita agendada' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'instalado', label: 'Instalado' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'nao_interessado', label: 'Não interessado' },
  { value: 'arquivado', label: 'Arquivado' },
];
