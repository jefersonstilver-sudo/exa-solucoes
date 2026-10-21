import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { crm360Path, crmPhone } from '@/services/crm360';

export default function OrderCRM360Fields({ userId, email, whatsapp }: { userId?: string | null; email?: string | null; whatsapp?: string | null }) {
  const { basePath } = useAdminBasePath();
  return <div className="space-y-1 text-xs min-w-0" onClick={e => e.stopPropagation()}>
    <p className="break-all">E-mail do pedido: {email || 'Não informado'}</p>
    <p>WhatsApp do pedido: {crmPhone(whatsapp)}</p>
    <div className="flex flex-wrap gap-2">
      {(userId || email || whatsapp) && <Button size="sm" variant="link" className="p-0 h-auto text-primary" asChild><Link to={crm360Path(basePath, { user: userId || undefined, phone: whatsapp || undefined, email: email || undefined })}>Ver ficha 360 do cliente</Link></Button>}
      {whatsapp && <Button size="sm" variant="link" className="p-0 h-auto text-primary" asChild><Link to={crm360Path(basePath, { phone: whatsapp })}>Consultar contato Sofia</Link></Button>}
    </div>
  </div>;
}