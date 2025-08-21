
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Logo {
  id: string;
  name: string;
  file_url: string;
  color_variant: 'white' | 'dark' | 'colored';
  link_url?: string;
  sort_order: number;
  is_active: boolean;
  storage_bucket?: string;
  storage_key?: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (req.method === 'GET') {
      console.log('📋 Fetching active logos for ticker');
      
      const { data: logos, error } = await supabaseClient
        .from('logos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching logos:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch logos' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Criar URLs assinadas usando storage_bucket/storage_key quando disponível
      const signedLogos: Logo[] = await Promise.all((logos || []).map(async (logo: any) => {
        // Priorizar storage_bucket/storage_key quando disponível
        if (logo.storage_bucket && logo.storage_key) {
          try {
            const { data: signedData, error: signError } = await supabaseClient
              .storage
              .from(logo.storage_bucket)
              .createSignedUrl(logo.storage_key, 60 * 60 * 24 * 7); // 1 semana

            if (signedData?.signedUrl && !signError) {
              console.log(`✅ Signed URL created for logo ${logo.name}`);
              return { ...logo, file_url: signedData.signedUrl } as Logo;
            } else {
              console.warn(`⚠️ Could not sign URL for logo ${logo.id}:`, signError);
              
              // Fallback para URL pública
              const { data: publicData } = supabaseClient
                .storage
                .from(logo.storage_bucket)
                .getPublicUrl(logo.storage_key);
              
              if (publicData?.publicUrl) {
                console.log(`🔄 Using public URL for logo ${logo.name}`);
                return { ...logo, file_url: publicData.publicUrl } as Logo;
              }
            }
          } catch (err) {
            console.warn(`⚠️ Storage error for logo ${logo.id}:`, err);
          }
        }
        
        // Usar file_url original como fallback
        console.log(`📎 Using original file_url for logo ${logo.name}`);
        return logo as Logo;
      }));

      const activeLogos = signedLogos.filter(logo => logo.file_url);
      console.log(`✅ Found ${activeLogos.length} active logos (signed URLs ready)`);

      return new Response(JSON.stringify(activeLogos), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PATCH') {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: 'Logo ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseClient
        .from('logos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating logo:', error);
        return new Response(JSON.stringify({ error: 'Failed to update logo' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { logos: logosData } = body;

      if (!logosData || !Array.isArray(logosData)) {
        return new Response(JSON.stringify({ error: 'Logos array is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseClient
        .from('logos')
        .insert(logosData)
        .select();

      if (error) {
        console.error('❌ Error inserting logos:', error);
        return new Response(JSON.stringify({ error: 'Failed to insert logos' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
