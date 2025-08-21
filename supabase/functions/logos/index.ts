import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Logo {
  id: string;
  name: string;
  file_url: string;
  color_variant: string;
  link_url?: string;
  sort_order: number;
  is_active: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const path = url.pathname.replace('/logos', '');
    
    // GET /logos - Lista todas as logos ativas (endpoint público)
    if (req.method === 'GET' && path === '') {
      console.log('📋 Fetching active logos for ticker');
      
      const { data: logos, error } = await supabaseClient
        .from('logos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching logos:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch logos' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Helper to extract bucket and path (decoded and raw) from a stored URL or path
      const extractBucketAndPath = (
        urlOrPath: string
      ): { bucket: string; pathDecoded: string; pathRaw: string } | null => {
        if (!urlOrPath) return null;
        try {
          // Matches .../storage/v1/object/public/<bucket>/<path> or .../storage/v1/object/<bucket>/<path>
          const match = urlOrPath.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
          if (match) {
            const raw = match[2];
            return { bucket: match[1], pathDecoded: decodeURIComponent(raw), pathRaw: raw };
          }
        } catch (_) {}
        // If looks like bucket/path (no protocol)
        if (!urlOrPath.startsWith('http') && urlOrPath.includes('/')) {
          const [bucket, ...rest] = urlOrPath.split('/');
          const raw = rest.join('/');
          return { bucket, pathDecoded: decodeURIComponent(raw), pathRaw: raw };
        }
        return null; // External URL or unrecognized format
      };

      // Create signed URLs when possible; try decoded + raw; fallback to public URL
      const signedLogos: Logo[] = await Promise.all((logos || []).map(async (logo: any) => {
        const info = extractBucketAndPath(logo.file_url);
        if (!info) {
          return logo; // Keep original (likely external/public URL)
        }
        try {
          // Attempt 1: decoded path
          let { data: s1, error: e1 } = await supabaseClient
            .storage.from(info.bucket)
            .createSignedUrl(info.pathDecoded, 60 * 60 * 24 * 7);
          if (s1?.signedUrl) {
            return { ...logo, file_url: s1.signedUrl } as Logo;
          }
          if (e1) {
            console.warn('⚠️ Sign (decoded) failed', { logoId: logo.id, bucket: info.bucket, path: info.pathDecoded, err: (e1 as any)?.message || e1 });
          }

          // Attempt 2: raw path (without decode)
          let { data: s2, error: e2 } = await supabaseClient
            .storage.from(info.bucket)
            .createSignedUrl(info.pathRaw, 60 * 60 * 24 * 7);
          if (s2?.signedUrl) {
            return { ...logo, file_url: s2.signedUrl } as Logo;
          }
          if (e2) {
            console.warn('⚠️ Sign (raw) failed', { logoId: logo.id, bucket: info.bucket, path: info.pathRaw, err: (e2 as any)?.message || e2 });
          }

          // Attempt 3: get public URL (for public buckets)
          const { data: pub1 } = supabaseClient.storage.from(info.bucket).getPublicUrl(info.pathDecoded);
          if (pub1?.publicUrl) {
            return { ...logo, file_url: pub1.publicUrl } as Logo;
          }
          const { data: pub2 } = supabaseClient.storage.from(info.bucket).getPublicUrl(info.pathRaw);
          if (pub2?.publicUrl) {
            return { ...logo, file_url: pub2.publicUrl } as Logo;
          }

          console.warn('⚠️ All attempts failed for logo', { logoId: logo.id, bucket: info.bucket, decoded: info.pathDecoded, raw: info.pathRaw });
          return logo;
        } catch (e) {
          console.warn('⚠️ Signing process threw for logo', logo.id, e);
          return logo;
        }
      }));

      console.log(`✅ Found ${signedLogos?.length || 0} active logos (signed or public URLs ready)`);
      return new Response(
        JSON.stringify(signedLogos || []), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // POST /logos/bulk - Upload múltiplo de logos (admin apenas)
    if (req.method === 'POST' && path === '/bulk') {
      console.log('📤 Processing bulk logo upload');
      
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }), 
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verificar se é admin
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }), 
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: userData } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }), 
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const { logos } = await req.json();
      
      if (!Array.isArray(logos) || logos.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid logos array' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Obter próximo sort_order
      const { data: lastLogo } = await supabaseClient
        .from('logos')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      let nextSortOrder = (lastLogo?.sort_order || 0) + 1;

      // Inserir logos em batch
      const logosToInsert = logos.map((logo: Partial<Logo>) => ({
        name: logo.name,
        file_url: logo.file_url,
        color_variant: logo.color_variant || 'white',
        link_url: logo.link_url,
        sort_order: nextSortOrder++,
        is_active: true
      }));

      const { data: insertedLogos, error: insertError } = await supabaseClient
        .from('logos')
        .insert(logosToInsert)
        .select();

      if (insertError) {
        console.error('❌ Error inserting logos:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to insert logos' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`✅ Successfully inserted ${insertedLogos?.length || 0} logos`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          count: insertedLogos?.length || 0,
          logos: insertedLogos
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // PATCH /logos/:id - Editar logo específica (admin apenas)
    if (req.method === 'PATCH' && path.startsWith('/')) {
      const logoId = path.substring(1);
      
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }), 
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const updates = await req.json();

      const { data: updatedLogo, error: updateError } = await supabaseClient
        .from('logos')
        .update(updates)
        .eq('id', logoId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating logo:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update logo' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(updatedLogo), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // DELETE /logos/:id - Inativar logo (admin apenas)
    if (req.method === 'DELETE' && path.startsWith('/')) {
      const logoId = path.substring(1);
      
      const { data: updatedLogo, error: deleteError } = await supabaseClient
        .from('logos')
        .update({ is_active: false })
        .eq('id', logoId)
        .select()
        .single();

      if (deleteError) {
        console.error('❌ Error deactivating logo:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to deactivate logo' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, logo: updatedLogo }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('🚨 Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});