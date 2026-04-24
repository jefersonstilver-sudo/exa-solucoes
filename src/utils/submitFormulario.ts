import { supabase } from '@/integrations/supabase/client';
import { captureEvidencias } from './captureEvidencias';
import { normalizeBRPhoneToE164 } from './phoneE164';
import type { PredioState, SindicoState } from '@/components/interesse-sindico-form/formStore';

const ELEVADOR_LABELS: Record<string, string> = {
  atlas: 'Atlas',
  tke: 'TKE',
  otis: 'Otis',
  oriente: 'Oriente',
};

const INTERNET_LABELS: Record<string, string> = {
  vivo: 'Vivo',
  ligga: 'Ligga',
  telecom_foz: 'Telecom Foz',
};

export interface SubmitResult {
  success: boolean;
  protocolo?: string;
  pdf_path?: string;
  pdf_error?: string;
  error?: string;
}

export async function submitFormulario(
  predio: PredioState,
  sindico: SindicoState,
): Promise<SubmitResult> {
  try {
    // 1. Evidências
    const evid = await captureEvidencias();

    // 2. Normalização do WhatsApp para E.164
    const whatsappE164 = normalizeBRPhoneToE164(sindico.whatsappRaw || '') || sindico.whatsappRaw || '';
    const celularDigits = (sindico.whatsappRaw || '').replace(/\D/g, '');

    // 3. Endereço completo (legado)
    const enderecoCompleto = [
      predio.logradouro,
      predio.numero,
      predio.complemento ? `(${predio.complemento})` : '',
      predio.bairro,
      `${predio.cidade}/${predio.uf}`,
      predio.cep,
    ]
      .filter(Boolean)
      .join(', ');

    // 4. INSERT — todos os campos do formulário
    const insertPayload: any = {
      // Prédio
      nome_predio: predio.nomePredio,
      endereco_logradouro: predio.logradouro,
      endereco_numero: predio.numero,
      endereco_complemento: predio.complemento || null,
      endereco_bairro: predio.bairro,
      endereco_cidade: predio.cidade,
      endereco_uf: predio.uf,
      cep: predio.cep,
      endereco_latitude: predio.latitude ?? null,
      endereco_longitude: predio.longitude ?? null,
      endereco_google_place_id: predio.googlePlaceId ?? null,
      quantidade_andares: predio.andares,
      quantidade_blocos: predio.blocos ?? 1,
      quantidade_unidades_total: predio.unidades,
      quantidade_elevadores_sociais: predio.elevadoresSociais,
      internet_operadoras: (predio.internetOps ?? []).map((op) => INTERNET_LABELS[op] || op),
      empresa_elevador: predio.elevadorEmpresa
        ? ELEVADOR_LABELS[predio.elevadorEmpresa] || predio.elevadorEmpresa
        : null,
      elevador_casa_maquinas: predio.casaMaquinas,
      tipo_predio: predio.tipoPredio ?? null,
      permite_airbnb: predio.tipoPredio === 'residencial' ? (predio.permiteAirbnb ?? null) : null,
      // Síndico
      sindico_nome: sindico.nomeCompleto,
      sindico_cpf: (sindico.cpf || '').replace(/\D/g, ''),
      sindico_whatsapp: whatsappE164,
      sindico_email: (sindico.email || '').toLowerCase().trim(),
      sindico_mandato_ate: sindico.mandatoAte || null,
      // Aceite — evidências
      aceite_timestamp: evid.timestamp,
      aceite_ip: evid.ip,
      aceite_user_agent: evid.user_agent,
      // Legados (defesa em profundidade — triggers também sincronizam)
      nome_completo: sindico.nomeCompleto,
      endereco: enderecoCompleto,
      numero_andares: predio.andares,
      numero_unidades: predio.unidades,
      email: (sindico.email || '').toLowerCase().trim(),
      celular: celularDigits,
      status: 'novo',
    };

    // Usa RPC security definer para contornar a policy de SELECT (restrita a admins)
    // que bloqueava o retorno do .insert().select() para usuários anônimos.
    const { data: rpcData, error: insertErr } = await (supabase as any).rpc(
      'submit_sindico_interesse',
      { payload: insertPayload },
    );

    const inserted = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    if (insertErr || !inserted?.id) {
      console.error('[submitFormulario] insert failed:', insertErr);
      return { success: false, error: insertErr?.message || 'Falha ao registrar' };
    }

    const recordId: string = inserted.id;
    const protocolo: string = inserted.protocolo;

    // 5. Upload de fotos (se houver)
    if (sindico.fotos && sindico.fotos.length > 0) {
      const uploadedPaths: string[] = [];
      for (let i = 0; i < sindico.fotos.length; i++) {
        const file = sindico.fotos[i];
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${recordId}/foto-${i + 1}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('fotos-sindicos')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (!upErr) uploadedPaths.push(path);
        else console.warn('[submitFormulario] foto upload falhou:', upErr);
      }
      if (uploadedPaths.length > 0) {
        await (supabase as any).rpc('update_sindico_fotos', {
          p_id: recordId,
          p_fotos: uploadedPaths,
        });
      }
    }

    // 6. Invocar edge function para gerar PDF oficial — com timeout para NÃO bloquear navegação
    let pdfError: string | undefined;
    let pdfPath: string | undefined;
    const PDF_TIMEOUT_MS = 15000;
    try {
      const invokePromise = supabase.functions.invoke('gerar-pdf-aceite-sindico', {
        body: { sindico_interessado_id: recordId },
      });
      const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
        setTimeout(
          () => resolve({ data: null, error: { message: 'PDF timeout — gerando em background' } }),
          PDF_TIMEOUT_MS,
        ),
      );
      const { data: pdfResp, error: pdfErr } = (await Promise.race([
        invokePromise,
        timeoutPromise,
      ])) as any;
      if (pdfErr) {
        console.warn('[submitFormulario] PDF generation deferred:', pdfErr);
        pdfError = pdfErr.message || 'Falha ao gerar PDF';
      } else if ((pdfResp as any)?.error) {
        console.warn('[submitFormulario] PDF response error:', pdfResp);
        pdfError = (pdfResp as any).error;
      } else {
        pdfPath = (pdfResp as any)?.pdf_path;
        console.log('[submitFormulario] PDF gerado:', pdfPath);
      }
    } catch (pdfCatchErr: any) {
      console.warn('[submitFormulario] PDF invoke exception (não bloqueia):', pdfCatchErr);
      pdfError = pdfCatchErr?.message || 'Exceção ao gerar PDF';
    }

    // 7. Disparar e-mail de confirmação ao síndico (com PDF anexo) — fire-and-forget,
    //    NÃO bloqueia a tela de sucesso. A própria função é idempotente e marca
    //    auditoria em sindicos_interessados.email_confirmacao_*.
    try {
      void supabase.functions
        .invoke('send-sindico-confirmation', {
          body: { sindico_interessado_id: recordId },
        })
        .then((res) => {
          if ((res as any)?.error) {
            console.warn('[submitFormulario] envio e-mail síndico falhou (não bloqueia):', (res as any).error);
          } else {
            console.log('[submitFormulario] e-mail de confirmação despachado');
          }
        })
        .catch((e) => {
          console.warn('[submitFormulario] exceção ao despachar e-mail (não bloqueia):', e?.message);
        });
    } catch (mailErr: any) {
      console.warn('[submitFormulario] não foi possível agendar envio de e-mail:', mailErr?.message);
    }

    return {
      success: true,
      protocolo,
      pdf_path: pdfPath,
      pdf_error: pdfError,
    };
  } catch (err: any) {
    console.error('[submitFormulario] erro inesperado:', err);
    return { success: false, error: err?.message || 'Erro inesperado' };
  }
}
