import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { SindicoRow } from '@/hooks/useSindicosList';

interface Props {
  sindico: SindicoRow;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/50 last:border-0">
    <div className="text-sm text-muted-foreground">{label}</div>
    <div className="col-span-2 text-sm">{children}</div>
  </div>
);

const casaLabel = (v: string | null) => {
  if (v === 'sim') return <Badge className="bg-green-600 text-white">Sim</Badge>;
  if (v === 'nao') return <Badge className="bg-yellow-500 text-white">Não</Badge>;
  if (v === 'nao_sei') return <Badge className="bg-gray-400 text-white">Não sei</Badge>;
  return <span className="text-muted-foreground">—</span>;
};

export const TabPredio: React.FC<Props> = ({ sindico }) => {
  const enderecoCompleto = [
    sindico.endereco_logradouro,
    sindico.endereco_numero,
    sindico.endereco_bairro,
    sindico.endereco_cidade,
    sindico.endereco_uf,
  ]
    .filter(Boolean)
    .join(', ');

  const lat = sindico.endereco_latitude;
  const lng = sindico.endereco_longitude;
  const hasCoords = lat != null && lng != null;
  const mapsUrl = hasCoords ? `https://maps.google.com/?q=${lat},${lng}` : '';
  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`
    : '';

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <Row label="Nome do prédio">{sindico.nome_predio}</Row>
        <Row label="Endereço">{enderecoCompleto || sindico.endereco || '—'}</Row>
        <Row label="CEP">{sindico.cep ?? '—'}</Row>
        <Row label="Complemento">{sindico.endereco_complemento ?? '—'}</Row>
        <Row label="Coordenadas">
          {hasCoords ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs">
                {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
              </span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
              >
                Ver no Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Row>
        <Row label="Andares">{sindico.quantidade_andares ?? '—'}</Row>
        <Row label="Blocos">{sindico.quantidade_blocos ?? '—'}</Row>
        <Row label="Unidades (total)">
          {sindico.quantidade_unidades_total ?? sindico.numero_unidades ?? '—'}
        </Row>
        <Row label="Elevadores sociais">{sindico.quantidade_elevadores_sociais ?? '—'}</Row>
        <Row label="Empresa do elevador">
          {sindico.empresa_elevador ? (
            <Badge variant="secondary">{sindico.empresa_elevador}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Row>
        <Row label="Casa de máquinas">{casaLabel(sindico.elevador_casa_maquinas)}</Row>
        <Row label="Operadoras de internet">
          {sindico.internet_operadoras && sindico.internet_operadoras.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {sindico.internet_operadoras.map((op) => (
                <Badge key={op} variant="secondary">
                  {op}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Row>
        <Row label="Google Place ID">
          {sindico.endereco_google_place_id ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs break-all">
                {sindico.endereco_google_place_id}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(sindico.endereco_google_place_id!);
                  toast.success('Place ID copiado');
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Row>
      </Card>

      {hasCoords && (
        <Card className="p-2 overflow-hidden">
          <iframe
            title="Mapa do prédio"
            src={embedUrl}
            className="w-full h-[200px] rounded-md border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Card>
      )}
    </div>
  );
};
