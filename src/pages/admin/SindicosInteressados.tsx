import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2,
  Users,
  CheckCircle2,
  TrendingUp,
  Eye,
  Download,
  RefreshCcw,
  X,
  Calendar as CalendarIcon,
  MessageCircle,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

import { useSindicosList, SindicoRow } from '@/hooks/useSindicosList';
import { useSindicosStats } from '@/hooks/useSindicosStats';
import { SindicoStatusBadge, STATUS_OPTIONS } from '@/components/admin/sindicos-interessados/SindicoStatusBadge';
import { SindicoDialog } from '@/components/admin/sindicos-interessados/SindicoDialog';
import { getSignedUrl } from '@/utils/storageSignedUrl';

const onlyDigits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}> = ({ label, value, icon: Icon, color }) => (
  <Card>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const SindicosInteressados: React.FC = () => {
  const {
    rows,
    loading,
    filters,
    setFilters,
    clearFilters,
    page,
    setPage,
    totalPages,
    totalCount,
    pageSize,
    refetch,
  } = useSindicosList();

  const { stats } = useSindicosStats();

  const [selected, setSelected] = useState<SindicoRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const openDetails = (s: SindicoRow) => {
    setSelected(s);
    setDialogOpen(true);
  };

  const downloadPdf = async (s: SindicoRow) => {
    if (!s.aceite_pdf_url) {
      toast.error('PDF não disponível');
      return;
    }
    setDownloadingId(s.id);
    const url = await getSignedUrl('termos-sindicos', s.aceite_pdf_url, 3600);
    setDownloadingId(null);
    if (!url) {
      toast.error('Não foi possível gerar o link');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `termo-${s.protocolo ?? s.id}.pdf`;
    a.click();
  };

  const dateRangeLabel = (() => {
    if (filters.startDate && filters.endDate) {
      return `${format(filters.startDate, 'dd/MM')} – ${format(filters.endDate, 'dd/MM')}`;
    }
    if (filters.startDate) return `Desde ${format(filters.startDate, 'dd/MM')}`;
    if (filters.endDate) return `Até ${format(filters.endDate, 'dd/MM')}`;
    return 'Período';
  })();

  const hasFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    !!filters.startDate ||
    !!filters.endDate;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Síndicos Interessados</h1>
          <p className="text-sm text-muted-foreground">
            Cadastros recebidos via /interessesindico
          </p>
        </div>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={Users} color="bg-slate-600" />
        <StatCard label="Novos" value={stats.novos} icon={TrendingUp} color="bg-blue-600" />
        <StatCard label="Em contato" value={stats.emContato} icon={MessageCircle} color="bg-yellow-600" />
        <StatCard label="Aprovados" value={stats.aprovados} icon={CheckCircle2} color="bg-emerald-600" />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <Input
              placeholder="Buscar por prédio, síndico ou protocolo…"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="md:max-w-sm"
            />

            <Select
              value={filters.status}
              onValueChange={(v) => setFilters({ status: v })}
            >
              <SelectTrigger className="md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="md:w-56 justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateRangeLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.startDate,
                    to: filters.endDate,
                  }}
                  onSelect={(range: any) =>
                    setFilters({ startDate: range?.from, endDate: range?.to })
                  }
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="md:ml-auto">
                <X className="w-4 h-4 mr-1" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {totalCount === 0
                  ? 'Nenhum cadastro recebido ainda.'
                  : 'Nenhum resultado para os filtros aplicados.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Prédio</TableHead>
                  <TableHead>Síndico</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-center">Unid.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const wpp = onlyDigits(r.sindico_whatsapp ?? r.celular);
                  const enderecoCurto =
                    [r.endereco_logradouro, r.endereco_numero].filter(Boolean).join(', ') ||
                    r.endereco ||
                    '';
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => openDetails(r)}
                    >
                      <TableCell>
                        <span className="font-mono text-xs text-primary">
                          {r.protocolo ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(r.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{r.nome_predio}</div>
                        {enderecoCurto && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {enderecoCurto}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.sindico_nome ?? r.nome_completo ?? '—'}
                      </TableCell>
                      <TableCell>
                        {wpp ? (
                          <a
                            href={`https://wa.me/${wpp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-primary hover:underline"
                          >
                            {r.sindico_whatsapp ?? r.celular}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{r.endereco_cidade ?? '—'}</TableCell>
                      <TableCell className="text-center text-sm">
                        {r.quantidade_unidades_total ?? r.numero_unidades ?? '—'}
                      </TableCell>
                      <TableCell>
                        <SindicoStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(r);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            disabled={downloadingId === r.id || !r.aceite_pdf_url}
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPdf(r);
                            }}
                          >
                            {downloadingId === r.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} de {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <span className="px-3 py-1.5">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <SindicoDialog
        sindico={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdated={refetch}
      />
    </div>
  );
};

export default SindicosInteressados;
