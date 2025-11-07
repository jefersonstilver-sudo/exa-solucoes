import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log('🔔 [BENEFIT-NOTIFICATION] Requisição recebida:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { benefit_id, event_type, old_record, new_record } = await req.json();
    
    console.log('📦 [BENEFIT-NOTIFICATION] Processando evento:', {
      benefit_id: benefit_id?.substring(0, 8),
      event_type
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do benefício
    const { data: benefit, error: benefitError } = await supabase
      .from('provider_benefits')
      .select('*, created_by')
      .eq('id', benefit_id)
      .single();

    if (benefitError || !benefit) {
      console.error('❌ [BENEFIT-NOTIFICATION] Benefício não encontrado:', benefitError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Benefício não encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    let notificationType: string;
    let notificationTitle: string;
    let notificationMessage: string;
    let targetUserIds: string[] = [];

    // Determinar tipo de notificação e usuários alvo
    if (event_type === 'INSERT') {
      // Novo benefício criado
      notificationType = 'benefit_created';
      notificationTitle = '🎁 Novo Benefício Criado';
      notificationMessage = `Benefício para ${benefit.provider_name} foi criado com sucesso.`;
      
      // Notificar admins
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'super_admin');
      
      targetUserIds = admins?.map(u => u.id) || [];
      
    } else if (event_type === 'UPDATE') {
      // Detectar mudanças específicas
      const choiceChanged = !old_record?.benefit_choice && new_record?.benefit_choice;
      const codeInserted = !old_record?.gift_code && new_record?.gift_code;
      const cancelled = old_record?.status !== 'cancelled' && new_record?.status === 'cancelled';

      if (choiceChanged) {
        // Prestador escolheu o presente - AÇÃO URGENTE
        notificationType = 'benefit_choice_made';
        notificationTitle = '⚠️ AÇÃO NECESSÁRIA';
        notificationMessage = `${benefit.provider_name} escolheu o presente: ${new_record.benefit_choice}. Insira o código!`;
        
        // Notificar admins
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'super_admin');
        
        targetUserIds = admins?.map(u => u.id) || [];
        
      } else if (codeInserted) {
        // Código foi inserido - sucesso
        notificationType = 'benefit_code_sent';
        notificationTitle = '✅ Código Enviado';
        notificationMessage = `Código do presente para ${benefit.provider_name} foi enviado com sucesso.`;
        
        // Notificar admins
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'super_admin');
        
        targetUserIds = admins?.map(u => u.id) || [];
        
      } else if (cancelled) {
        // Benefício cancelado
        notificationType = 'benefit_cancelled';
        notificationTitle = '❌ Benefício Cancelado';
        notificationMessage = `Benefício para ${benefit.provider_name} foi cancelado.`;
        
        // Notificar admins
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'super_admin');
        
        targetUserIds = admins?.map(u => u.id) || [];
        
      } else {
        // Atualização não relevante
        console.log('ℹ️ [BENEFIT-NOTIFICATION] Atualização não relevante, pulando notificação');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Nenhuma notificação necessária' 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    } else {
      console.log('ℹ️ [BENEFIT-NOTIFICATION] Tipo de evento não suportado:', event_type);
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Evento não suportado' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Criar notificações para todos os usuários alvo
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      metadata: {
        benefit_id: benefit.id,
        provider_name: benefit.provider_name,
        benefit_choice: new_record?.benefit_choice || null,
        activation_point: benefit.activation_point || null
      }
    }));

    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('❌ [BENEFIT-NOTIFICATION] Erro ao criar notificações:', notifError);
        throw notifError;
      }

      console.log(`✅ [BENEFIT-NOTIFICATION] ${notifications.length} notificações criadas`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Notificações criadas com sucesso',
      notifications_count: notifications.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('💥 [BENEFIT-NOTIFICATION] Erro:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro ao processar notificação',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
