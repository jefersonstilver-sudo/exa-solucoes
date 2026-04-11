import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para obter geolocalização do IP
async function getGeoLocation(ip: string): Promise<any> {
  if (!ip || ip === 'unknown' || ip === '::1' || ip === '127.0.0.1') {
    return null;
  }
  
  try {
    // Tentar ipapi.co primeiro (mais preciso)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        return {
          city: data.city || null,
          region: data.region || null,
          country: data.country_name || null,
          country_code: data.country_code || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          timezone: data.timezone || null,
          isp: data.org || data.asn || null
        };
      }
    }
    
    // Fallback: ip-api.com
    const fallbackResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country,countryCode,lat,lon,timezone,isp,org`);
    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      if (data.status === 'success') {
        return {
          city: data.city || null,
          region: data.regionName || null,
          country: data.country || null,
          country_code: data.countryCode || null,
          latitude: data.lat || null,
          longitude: data.lon || null,
          timezone: data.timezone || null,
          isp: data.isp || data.org || null
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao obter geolocalização:', error);
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Capturar IP real do usuário
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || req.headers.get('cf-connecting-ip')
      || 'unknown';

    const body = await req.json();
    const { proposalId, timeSpentSeconds, deviceType, userAgent, action, sessionId, referrer, fingerprint } = body;

    console.log(`📊 [TRACK-VIEW] Action: ${action}, Proposal: ${proposalId}, Time: ${timeSpentSeconds}s`);
    console.log(`🌐 IP: ${ipAddress}, Session: ${sessionId}, Referrer: ${referrer}`);
    console.log(`📨 [TRACK-VIEW] Full body:`, JSON.stringify(body));

    if (!proposalId) {
      return new Response(JSON.stringify({ error: 'proposalId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'enter') {
      console.log('🚀 [ENTER] Iniciando registro de visualização...');
      
      // Obter geolocalização do IP com tratamento de erro isolado
      let geoData = null;
      try {
        geoData = await getGeoLocation(ipAddress);
        console.log('📍 [GEO] Geolocalização obtida:', JSON.stringify(geoData));
      } catch (geoError) {
        console.warn('⚠️ [GEO] Falha na geolocalização, continuando sem:', geoError);
      }

      // Preparar dados para inserção
      const insertData = {
        proposal_id: proposalId,
        device_type: deviceType || 'unknown',
        user_agent: userAgent || null,
        time_spent_seconds: 0,
        // Campos de rastreamento
        ip_address: ipAddress,
        city: geoData?.city || null,
        region: geoData?.region || null,
        country: geoData?.country || null,
        country_code: geoData?.country_code || null,
        latitude: geoData?.latitude || null,
        longitude: geoData?.longitude || null,
        timezone: geoData?.timezone || null,
        isp: geoData?.isp || null,
        fingerprint: fingerprint || null,
        session_id: sessionId || null,
        referrer_url: referrer || null,
      };
      
      console.log('💾 [INSERT] Dados a inserir:', JSON.stringify(insertData));

      // Register new view with full tracking data
      const { data: insertedData, error: insertError } = await supabase
        .from('proposal_views')
        .insert(insertData)
        .select();

      if (insertError) {
        console.error('❌ [INSERT] ERRO:', JSON.stringify(insertError));
      } else {
        console.log('✅ [INSERT] Sucesso! ID:', insertedData?.[0]?.id);
      }

      // Update proposal counters AND status
      const { data: proposal } = await supabase
        .from('proposals')
        .select('view_count, first_viewed_at, status')
        .eq('id', proposalId)
        .single();

      const newViewCount = (proposal?.view_count || 0) + 1;
      
      const updates: any = {
        view_count: newViewCount,
        last_viewed_at: new Date().toISOString(),
        is_viewing: true,
        last_heartbeat_at: new Date().toISOString(),
      };

      // Se primeira visualização, atualizar first_viewed_at
      if (!proposal?.first_viewed_at) {
        updates.first_viewed_at = new Date().toISOString();
      }

      // ✅ Atualizar status para 'visualizando' enquanto cliente está na página
      if (proposal?.status === 'enviada' || proposal?.status === 'visualizada') {
        updates.status = 'visualizando';
        console.log('📊 Status atualizado para: visualizando');
        
        // Registrar log de visualização com dados de geolocalização
        await supabase.from('proposal_logs').insert({
          proposal_id: proposalId,
          action: 'visualizando',
          details: {
            device_type: deviceType,
            timestamp: new Date().toISOString(),
            ip_address: ipAddress,
            city: geoData?.city,
            country: geoData?.country,
            session_id: sessionId
          }
        });
      }

      await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposalId);

      console.log('✅ View registered, is_viewing: true, view_count:', updates.view_count);

      // 🔔 Enviar notificação via EXA Alerts
      const eventType = newViewCount > 1 ? 'proposal_viewed_again' : 'proposal_viewing';
      try {
        await supabase.functions.invoke('notify-proposal-event', {
          body: {
            proposalId,
            eventType,
            metadata: {
              viewCount: newViewCount,
              deviceType,
              ipAddress,
              city: geoData?.city,
              country: geoData?.country
            }
          }
        });
        console.log(`🔔 Notification sent: ${eventType}`);
      } catch (notifyError) {
        console.error('⚠️ Error sending notification:', notifyError);
        // Não falhar a requisição principal por erro de notificação
      }

    } else if (action === 'heartbeat' && timeSpentSeconds > 0) {
      // Heartbeat: update time incrementally and keep viewing status active
      const { data: proposal } = await supabase
        .from('proposals')
        .select('total_time_spent_seconds, status')
        .eq('id', proposalId)
        .single();

      const newTotalTime = (proposal?.total_time_spent_seconds || 0) + timeSpentSeconds;

      const heartbeatUpdates: any = {
        total_time_spent_seconds: newTotalTime,
        last_viewed_at: new Date().toISOString(),
        is_viewing: true,
        last_heartbeat_at: new Date().toISOString(),
      };

      // Manter status como visualizando durante heartbeat
      if (proposal?.status === 'visualizada' || proposal?.status === 'enviada') {
        heartbeatUpdates.status = 'visualizando';
      }

      await supabase
        .from('proposals')
        .update(heartbeatUpdates)
        .eq('id', proposalId);

      // Also update the most recent view record
      const { data: recentView } = await supabase
        .from('proposal_views')
        .select('id, time_spent_seconds')
        .eq('proposal_id', proposalId)
        .order('viewed_at', { ascending: false })
        .limit(1)
        .single();

      if (recentView) {
        await supabase
          .from('proposal_views')
          .update({ 
            time_spent_seconds: (recentView.time_spent_seconds || 0) + timeSpentSeconds 
          })
          .eq('id', recentView.id);
      }

      console.log(`✅ Heartbeat: +${timeSpentSeconds}s (total: ${newTotalTime}s), is_viewing: true`);
      
    } else if (action === 'leave') {
      // Cliente saiu da página - marcar como não visualizando
      const { data: proposal } = await supabase
        .from('proposals')
        .select('total_time_spent_seconds, status')
        .eq('id', proposalId)
        .single();

      const leaveUpdates: any = {
        is_viewing: false,
        last_viewed_at: new Date().toISOString(),
      };

      // Se estava visualizando, mudar para visualizada
      if (proposal?.status === 'visualizando') {
        leaveUpdates.status = 'visualizada';
        console.log('📊 Status atualizado: visualizando → visualizada');
      }

      // Adicionar tempo final se houver
      if (timeSpentSeconds > 0) {
        leaveUpdates.total_time_spent_seconds = (proposal?.total_time_spent_seconds || 0) + timeSpentSeconds;
      }

      await supabase
        .from('proposals')
        .update(leaveUpdates)
        .eq('id', proposalId);

      console.log(`✅ Leave: is_viewing: false, time: ${timeSpentSeconds}s`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
