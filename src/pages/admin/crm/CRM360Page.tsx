import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import CRM360Panel from '@/components/admin/crm/CRM360Panel';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { crm360Error, type CRM360Lookup } from '@/services/crm360';

export default function CRM360Page() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const { data: order, isLoading, error } = useQuery({ queryKey: ['crm360-order-lookup', orderId], enabled: Boolean(orderId), retry: false, queryFn: async () => {
    const { data, error } = await supabase.from('pedidos').select('client_id,email,whatsapp').eq('id', orderId || '').single();
    if (error) throw new Error(crm360Error(error));
    return data;
  }});
  const lookup: CRM360Lookup = { contact: params.get('contact') || undefined, user: params.get('user') || order?.client_id || undefined, phone: params.get('phone') || order?.whatsapp || undefined, email: params.get('email') || order?.email || undefined };
  return <main className="p-4 md:p-6 max-w-screen-2xl mx-auto space-y-6"><Helmet><title>Ficha 360 | EXA Admin</title></Helmet><h1 className="text-2xl font-semibold">Ficha 360</h1>{orderId && isLoading ? <p>Carregando cliente do pedido...</p> : error ? <p role="alert">{error.message}</p> : Object.values(lookup).some(Boolean) ? <CRM360Panel lookup={lookup} /> : <p className="text-muted-foreground">Selecione um contato ou usuário para consultar a ficha.</p>}</main>;
}