import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import CRM360Panel from '@/components/admin/crm/CRM360Panel';

export default function CRM360Page() {
  const [params] = useSearchParams();
  const lookup = { contact: params.get('contact') || undefined, user: params.get('user') || undefined, phone: params.get('phone') || undefined, email: params.get('email') || undefined };
  return <main className="p-4 md:p-6 max-w-screen-2xl mx-auto space-y-6"><Helmet><title>Ficha 360 | EXA Admin</title></Helmet><h1 className="text-2xl font-semibold">Ficha 360</h1>{Object.values(lookup).some(Boolean) ? <CRM360Panel lookup={lookup} /> : <p className="text-muted-foreground">Selecione um contato ou usuário para consultar a ficha.</p>}</main>;
}