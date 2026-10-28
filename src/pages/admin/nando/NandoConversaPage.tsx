import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NandoChatPanel } from '@/pages/admin/crm/components/NandoChatPanel';

/** /admin/nando?tel=55...&nome=...&predio=... — conversa com síndico/portaria pelo Nando, aberta a partir do painel do prédio. */
const NandoConversaPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tel = params.get('tel') || '';
  const abrir = useMemo(() => tel ? {
    telefone: tel,
    nome: params.get('nome') || undefined,
    predio: params.get('predio') || undefined,
    papel: params.get('papel') || undefined,
  } : null, [tel, params]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} aria-label="Voltar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 border border-black/[0.06] hover:bg-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#17181A]">Nando · síndicos</h1>
          {abrir?.predio && <p className="text-sm text-[#6A6B70]">{abrir.predio}{abrir.nome ? ` · ${abrir.nome}` : ''}</p>}
        </div>
      </div>
      <NandoChatPanel abrir={abrir} />
    </div>
  );
};

export default NandoConversaPage;
