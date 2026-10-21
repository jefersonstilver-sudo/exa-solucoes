import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useCRMUserSummaries } from '@/hooks/useCRMUserSummaries';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { crm360Path, crmPhone } from '@/services/crm360';

export default function CRMUserSummary({ userId, showLink = false }: { userId: string; showLink?: boolean }) {
  const { data, error, isLoading } = useCRMUserSummaries();
  const { basePath } = useAdminBasePath();
  const row = data?.get(userId);
  return <div className="space-y-2 text-xs" onClick={e => e.stopPropagation()}>
    {isLoading ? <p className="text-muted-foreground">Carregando WhatsApp e pedidos...</p> : row ? <>
      <p className="break-words">WhatsApp: {crmPhone(row.phone)}</p>
      <div className="flex flex-wrap gap-1.5"><Badge variant="outline" className={row.verified ? 'text-crm-success border-crm-success/30' : 'text-crm-warning-foreground border-crm-warning/30'}>{row.verified ? 'E-mail verificado' : 'E-mail NÃO verificado'}</Badge><Badge variant="secondary">{row.count} pedidos</Badge>
        {row.duplicates && <Tooltip><TooltipTrigger asChild><Badge variant="outline" className="text-crm-warning-foreground border-crm-warning/30 cursor-help" tabIndex={0}>Telefone repetido</Badge></TooltipTrigger><TooltipContent className="max-w-xs break-words">{row.duplicates}</TooltipContent></Tooltip>}
      </div>
    </> : <p className="text-muted-foreground">{error ? 'Dados complementares indisponíveis.' : 'Dados não encontrados.'}</p>}
    {showLink && <Button variant="outline" size="sm" asChild><Link to={crm360Path(basePath, { user: userId, phone: row?.phone })}>Ver ficha 360</Link></Button>}
  </div>;
}