import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { ZodError } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingEvent {
  user_id?: string;
  session_id: string;
  event_type: 'page_view' | 'building_view' | 'video_watch' | 'cart_add' | 'checkout_start' | 'cart_abandon';
  data: {
    page?: string;
    time_spent?: number;
    building_id?: string;
    video_id?: string;
    watch_duration?: number;
    completed?: boolean;
    device_type?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Auth client to verify the user
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    // Service role client to bypass RLS for writing analytics
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Importar e validar entrada
    const { validateTrackingEvent } = await import('./validation.ts');
    const event: TrackingEvent = validateTrackingEvent(body);
    
    console.log('📊 Tracking event received:', event.event_type);

    // Validate that user_id matches authenticated user
    if (event.user_id && event.user_id !== user.id) {
      console.error('❌ Forbidden: user_id mismatch', { provided: event.user_id, authenticated: user.id });
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Cannot track other users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use authenticated user's ID
    const trackingUserId = user.id;

    // Buscar ou criar registro de analytics
    const { data: existingAnalytics, error: fetchError } = await supabase
      .from('client_behavior_analytics')
      .select('*')
      .eq('user_id', trackingUserId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching analytics:', fetchError);
      throw fetchError;
    }

    let updatedData: any = {
      user_id: trackingUserId,
      session_id: event.session_id,
      last_visit: new Date().toISOString(),
      device_type: event.data.device_type || 'desktop',
    };

    if (existingAnalytics) {
      // Atualizar registro existente
      const pagesVisited = existingAnalytics.pages_visited || {};
      const buildingsViewed = existingAnalytics.buildings_viewed || [];
      const videosWatched = existingAnalytics.videos_watched || [];
      const buildingsInCart = existingAnalytics.buildings_in_cart || [];

      switch (event.event_type) {
        case 'page_view':
          if (event.data.page && event.data.time_spent) {
            pagesVisited[event.data.page] = (pagesVisited[event.data.page] || 0) + event.data.time_spent;
            updatedData.pages_visited = pagesVisited;
            updatedData.total_time_spent = (existingAnalytics.total_time_spent || 0) + event.data.time_spent;
          }
          break;

        case 'building_view':
          if (event.data.building_id && event.data.time_spent) {
            const existingBuilding = buildingsViewed.find((b: any) => b.building_id === event.data.building_id);
            if (existingBuilding) {
              existingBuilding.time_spent += event.data.time_spent;
              existingBuilding.views_count += 1;
            } else {
              buildingsViewed.push({
                building_id: event.data.building_id,
                time_spent: event.data.time_spent,
                views_count: 1,
              });
            }
            updatedData.buildings_viewed = buildingsViewed;
            
            // Calcular prédio mais visto
            const mostViewed = buildingsViewed.reduce((prev: any, current: any) => 
              (prev.time_spent > current.time_spent) ? prev : current
            );
            updatedData.most_viewed_building_id = mostViewed.building_id;
            
            // Calcular tempo médio por prédio
            const totalBuildingTime = buildingsViewed.reduce((sum: number, b: any) => sum + b.time_spent, 0);
            updatedData.avg_time_per_building = Math.floor(totalBuildingTime / buildingsViewed.length);
          }
          break;

        case 'video_watch':
          if (event.data.video_id && event.data.watch_duration !== undefined) {
            videosWatched.push({
              video_id: event.data.video_id,
              watch_duration: event.data.watch_duration,
              completed: event.data.completed || false,
              timestamp: new Date().toISOString(),
            });
            updatedData.videos_watched = videosWatched;
            updatedData.total_video_time = (existingAnalytics.total_video_time || 0) + event.data.watch_duration;
            
            // Calcular taxa de conclusão
            const completedCount = videosWatched.filter((v: any) => v.completed).length;
            updatedData.video_completion_rate = (completedCount / videosWatched.length) * 100;
          }
          break;

        case 'cart_add':
          if (event.data.building_id) {
            if (!buildingsInCart.some((b: any) => b.building_id === event.data.building_id)) {
              buildingsInCart.push({
                building_id: event.data.building_id,
                added_at: new Date().toISOString(),
              });
              updatedData.buildings_in_cart = buildingsInCart;
            }
          }
          break;

        case 'checkout_start':
          updatedData.checkout_starts = (existingAnalytics.checkout_starts || 0) + 1;
          break;

        case 'cart_abandon':
          updatedData.cart_abandonments = (existingAnalytics.cart_abandonments || 0) + 1;
          break;
      }

      // Calcular score de intenção de compra (simples)
      const score = Math.min(100, 
        (updatedData.checkout_starts || existingAnalytics.checkout_starts || 0) * 20 +
        (updatedData.buildings_in_cart?.length || buildingsInCart.length || 0) * 10 +
        (updatedData.video_completion_rate || existingAnalytics.video_completion_rate || 0) * 0.3
      );
      updatedData.purchase_intent_score = Math.round(score);

      // Atualizar
      const { error: updateError } = await supabase
        .from('client_behavior_analytics')
        .update(updatedData)
        .eq('user_id', trackingUserId);

      if (updateError) {
        console.error('❌ Error updating analytics:', updateError);
        throw updateError;
      }

      console.log('✅ Analytics updated successfully');
    } else {
      // Criar novo registro
      updatedData.total_sessions = 1;
      updatedData.total_time_spent = event.data.time_spent || 0;
      
      if (event.event_type === 'page_view' && event.data.page && event.data.time_spent) {
        updatedData.pages_visited = { [event.data.page]: event.data.time_spent };
      }

      const { error: insertError } = await supabase
        .from('client_behavior_analytics')
        .insert(updatedData);

      if (insertError) {
        console.error('❌ Error inserting analytics:', insertError);
        throw insertError;
      }

      console.log('✅ Analytics created successfully');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Tracking recorded' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in track-client-behavior:', error);
    
    // Handle Zod validation errors separately
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Validation error', details: error.errors }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
