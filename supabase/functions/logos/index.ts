import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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
    
    // GET /logos - Lista todas as logos ativas
    if (req.method === 'GET' && path === '') {
      console.log('📋 Fetching active logos for ticker');
      
      // ✅ FIX: Select apenas colunas necessárias + LIMIT
      const { data: logos, error } = await supabaseClient
        .from('logos')
        .select('id, name, file_url, link_url, is_active, sort_order, storage_bucket, storage_key, color_variant, scale_factor')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(20);

      if (error) {
        console.error('❌ Error fetching logos:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch logos', details: error.message }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const extractBucketAndPath = (urlOrPath: string): { bucket: string; pathDecoded: string; pathRaw: string } | null => {
        if (!urlOrPath) return null;
        try {
          const match = urlOrPath.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
          if (match) {
            const raw = match[2];
            return { bucket: match[1], pathDecoded: decodeURIComponent(raw), pathRaw: raw };
          }
        } catch (_) {}
        if (!urlOrPath.startsWith('http') && urlOrPath.includes('/')) {
          const [bucket, ...rest] = urlOrPath.split('/');
          const raw = rest.join('/');
          return { bucket, pathDecoded: decodeURIComponent(raw), pathRaw: raw };
        }
        return null;
      };

      // ✅ FIX: Processar em batches de 3
      const BATCH_SIZE = 3;
      const signedLogos: any[] = [];
      
      for (let i = 0; i < (logos || []).length; i += BATCH_SIZE) {
        const batch = (logos || []).slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(async (logo: any) => {
          const info = extractBucketAndPath(logo.file_url);
          if (!info) {
            const cacheBustedUrl = logo.file_url + (logo.file_url.includes('?') ? '&' : '?') + `v=${Date.now()}`;
            return { 
              id: logo.id,
              name: logo.name,
              file_url: cacheBustedUrl,
              link_url: logo.link_url,
              is_active: logo.is_active,
              sort_order: logo.sort_order,
              storage_bucket: logo.storage_bucket,
              storage_key: logo.storage_key,
              color_variant: logo.color_variant,
              scale_factor: logo.scale_factor
            };
          }
          try {
            let { data: s1 } = await supabaseClient.storage.from(info.bucket).createSignedUrl(info.pathDecoded, 60 * 60 * 24 * 7);
            if (s1?.signedUrl) return { 
              id: logo.id,
              name: logo.name,
              file_url: s1.signedUrl,
              link_url: logo.link_url,
              is_active: logo.is_active,
              sort_order: logo.sort_order,
              storage_bucket: logo.storage_bucket,
              storage_key: logo.storage_key,
              color_variant: logo.color_variant,
              scale_factor: logo.scale_factor
            };
            
            let { data: s2 } = await supabaseClient.storage.from(info.bucket).createSignedUrl(info.pathRaw, 60 * 60 * 24 * 7);
            if (s2?.signedUrl) return { 
              id: logo.id,
              name: logo.name,
              file_url: s2.signedUrl,
              link_url: logo.link_url,
              is_active: logo.is_active,
              sort_order: logo.sort_order,
              storage_bucket: logo.storage_bucket,
              storage_key: logo.storage_key,
              color_variant: logo.color_variant,
              scale_factor: logo.scale_factor
            };
            
            const { data: pub1 } = supabaseClient.storage.from(info.bucket).getPublicUrl(info.pathDecoded);
            if (pub1?.publicUrl) return { 
              id: logo.id,
              name: logo.name,
              file_url: pub1.publicUrl,
              link_url: logo.link_url,
              is_active: logo.is_active,
              sort_order: logo.sort_order,
              storage_bucket: logo.storage_bucket,
              storage_key: logo.storage_key,
              color_variant: logo.color_variant,
              scale_factor: logo.scale_factor
            };
            
            const { data: pub2 } = supabaseClient.storage.from(info.bucket).getPublicUrl(info.pathRaw);
            if (pub2?.publicUrl) return { 
              id: logo.id,
              name: logo.name,
              file_url: pub2.publicUrl,
              link_url: logo.link_url,
              is_active: logo.is_active,
              sort_order: logo.sort_order,
              storage_bucket: logo.storage_bucket,
              storage_key: logo.storage_key,
              color_variant: logo.color_variant,
              scale_factor: logo.scale_factor
            };
            
            return null;
          } catch (e) {
            return null;
          }
        }));
        
        signedLogos.push(...batchResults);
        
        if (i + BATCH_SIZE < (logos || []).length) {
          await new Promise(r => setTimeout(r, 50));
        }
      }

      const validLogos = signedLogos.filter(logo => logo !== null);
      console.log(`✅ Found ${validLogos?.length || 0} active logos in batches`);
      return new Response(
        JSON.stringify(validLogos || []), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /logos - Regular logo upload (admin apenas)
    if (req.method === 'POST' && path === '') {
      console.log('📤 Processing logo upload or update');
      
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

      const payload = await req.json();

      // Check if it's a bulk upload or single update
      if (payload.logos) {
        // Handle bulk upload
        const { logos } = payload;
        
        if (!Array.isArray(logos) || logos.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Invalid logos array' }), 
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

      // Obter próxima ordem
        const { data: lastLogo } = await supabaseClient
          .from('logos')
          .select('sort_order')
          .order('sort_order', { ascending: false })
          .limit(1)
          .single();

        let nextSortOrder = (lastLogo?.sort_order || 0) + 1;

        // Inserir logos em batch
        const logosToInsert = logos.map((logo: any) => ({
          name: logo.name,
          file_url: logo.file_url,
          link_url: logo.link_url,
          sort_order: logo.sort_order || nextSortOrder++,
          is_active: logo.is_active !== false,
          storage_bucket: logo.storage_bucket,
          storage_key: logo.storage_key,
          color_variant: logo.color_variant || 'dark'
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
      } else if (payload.id) {
        // Handle single logo update via POST (for compatibility)
        const { id, ...updates } = payload;
        
        const mappedUpdates: any = {};
        if (updates.file_url) mappedUpdates.file_url = updates.file_url;
        if (updates.link_url) mappedUpdates.link_url = updates.link_url;
        if (updates.is_active !== undefined) mappedUpdates.is_active = updates.is_active;
        if (updates.sort_order !== undefined) mappedUpdates.sort_order = updates.sort_order;
        if (updates.name) mappedUpdates.name = updates.name;
        if (updates.storage_bucket) mappedUpdates.storage_bucket = updates.storage_bucket;
        if (updates.storage_key) mappedUpdates.storage_key = updates.storage_key;
        if (updates.color_variant) mappedUpdates.color_variant = updates.color_variant;
        mappedUpdates.updated_at = new Date().toISOString();
        
        const { data: updatedLogo, error: updateError } = await supabaseClient
          .from('logos')
          .update(mappedUpdates)
          .eq('id', id)
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

        console.log('✅ Logo updated successfully:', id);
        return new Response(JSON.stringify(updatedLogo), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(
        JSON.stringify({ error: 'Invalid request format' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // POST /logos/bulk - Upload múltiplo de logos (admin apenas) - backward compatibility
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

      // Obter próxima ordem
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
        link_url: logo.link_url,
        sort_order: nextSortOrder++,
        is_active: true,
        color_variant: logo.color_variant || 'dark'
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

    // PATCH - Handle logo updates (admin apenas)
    if (req.method === 'PATCH') {
      console.log('📝 Processing logo update');
      
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

      const payload = await req.json();
      const { id, ...updates } = payload;
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Logo ID required' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('📝 Updating logo:', id, updates);

      const mappedUpdates: any = {};
      if (updates.file_url) mappedUpdates.file_url = updates.file_url;
      if (updates.link_url) mappedUpdates.link_url = updates.link_url;
      if (updates.is_active !== undefined) mappedUpdates.is_active = updates.is_active;
      if (updates.sort_order !== undefined) mappedUpdates.sort_order = updates.sort_order;
      if (updates.name) mappedUpdates.name = updates.name;
      if (updates.storage_bucket) mappedUpdates.storage_bucket = updates.storage_bucket;
      if (updates.storage_key) mappedUpdates.storage_key = updates.storage_key;
      if (updates.color_variant) mappedUpdates.color_variant = updates.color_variant;
      mappedUpdates.updated_at = new Date().toISOString();

      const { data: updatedLogo, error: updateError } = await supabaseClient
        .from('logos')
        .update(mappedUpdates)
        .eq('id', id)
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

      console.log('✅ Logo updated successfully:', id);
      return new Response(JSON.stringify(updatedLogo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
