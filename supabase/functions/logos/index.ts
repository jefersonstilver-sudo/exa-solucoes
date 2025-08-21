
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
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const diagnoseMode = urlParams.get('diagnose') === 'true';

  if (diagnoseMode) {
    console.log('🔍 Running diagnostic mode for logos');
    
    try {
      // List all files in the logos directory
      const { data: files, error: listError } = await supabase.storage
        .from('arquivos')
        .list('PAGINA PRINCIPAL LOGOS', { limit: 100 });

      if (listError) {
        console.error('❌ Error listing storage files:', listError);
      } else {
        console.log(`📁 Found ${files?.length || 0} files in storage:`, files?.map(f => f.name));
      }

      // Get all logos from database
      const { data: dbLogos, error: dbError } = await supabase
        .from('logos')
        .select('id, name, storage_key, storage_bucket, file_url, is_active')
        .order('sort_order', { ascending: true });

      if (dbError) {
        console.error('❌ Error fetching database logos:', dbError);
      } else {
        console.log(`💾 Found ${dbLogos?.length || 0} logos in database`);
        dbLogos?.forEach(logo => {
          const fileExists = files?.some(f => f.name === logo.storage_key?.replace('PAGINA PRINCIPAL LOGOS/', ''));
          console.log(`${fileExists ? '✅' : '❌'} Logo "${logo.name}": storage_key=${logo.storage_key}, file_exists=${fileExists}`);
        });
      }

      return new Response(JSON.stringify({ 
        success: true,
        storage_files: files,
        database_logos: dbLogos,
        diagnostic: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('❌ Diagnostic error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    if (req.method === 'GET') {
      console.log('📋 Fetching active logos for ticker');
      
      const { data: logos, error } = await supabase
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

      // Enhanced URL validation and generation
      const validLogos: Logo[] = [];
      
      for (const logo of logos || []) {
        try {
          let finalUrl = '';
          let isValidUrl = false;
          
          // Priority 1: Generate signed URL from storage_bucket/storage_key
          if (logo.storage_bucket && logo.storage_key) {
            console.log(`🔄 Attempting to sign URL for logo "${logo.name}" (ID: ${logo.id})`);
            console.log(`   Storage: ${logo.storage_bucket}/${logo.storage_key}`);
            
            const { data: signedData, error: signError } = await supabase.storage
              .from(logo.storage_bucket)
              .createSignedUrl(logo.storage_key, 3600);
            
            if (signedData?.signedUrl && !signError) {
              finalUrl = signedData.signedUrl;
              isValidUrl = true;
              console.log(`✅ Successfully signed URL for logo "${logo.name}"`);
            } else {
              console.warn(`⚠️ Failed to sign URL for logo "${logo.name}":`, signError?.message);
              
              // Try public URL as fallback
              const { data: publicData } = supabase.storage
                .from(logo.storage_bucket)
                .getPublicUrl(logo.storage_key);
              
              if (publicData?.publicUrl) {
                finalUrl = publicData.publicUrl;
                console.log(`🔄 Using public URL for logo ${logo.name}`);
                
                // Test if public URL is accessible
                try {
                  const response = await fetch(finalUrl, { method: 'HEAD' });
                  isValidUrl = response.ok;
                  if (isValidUrl) {
                    console.log(`✅ Public URL verified for logo "${logo.name}"`);
                  }
                } catch {
                  console.warn(`❌ Public URL not accessible for logo "${logo.name}"`);
                }
              }
            }
          }
          
          // Priority 2: Use existing file_url if storage method failed
          if (!isValidUrl && logo.file_url) {
            console.log(`ℹ️ Testing existing file_url for logo "${logo.name}": ${logo.file_url}`);
            
            // Test if existing URL is still valid
            try {
              const response = await fetch(logo.file_url, { method: 'HEAD' });
              if (response.ok) {
                finalUrl = logo.file_url;
                isValidUrl = true;
                console.log(`✅ Existing file_url is valid for logo "${logo.name}"`);
              } else {
                console.warn(`❌ Existing file_url is invalid for logo "${logo.name}" (${response.status})`);
              }
            } catch (error) {
              console.warn(`❌ Error testing file_url for logo "${logo.name}":`, error);
            }
          }
          
          // Only include logos with valid, accessible URLs
          if (isValidUrl && finalUrl) {
            validLogos.push({ ...logo, file_url: finalUrl } as Logo);
          } else {
            console.error(`❌ Logo "${logo.name}" (${logo.id}) excluded - no valid URL found`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing logo "${logo.name}" (${logo.id}):`, error);
        }
      }

      console.log(`✅ Found ${validLogos.length} valid logos with accessible URLs (out of ${logos?.length || 0} active)`);

      return new Response(JSON.stringify(validLogos), {
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

      const { data, error } = await supabase
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

      const { data, error } = await supabase
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
