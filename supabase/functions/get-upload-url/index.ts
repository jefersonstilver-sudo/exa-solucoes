
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get request data
    const { fileName, contentType, userId } = await req.json();
    
    if (!fileName || !contentType || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if video bucket exists, if not create it
    const { data: buckets } = await supabase
      .storage
      .listBuckets();
    
    const videoBucket = buckets?.find(bucket => bucket.name === 'videos');
    
    if (!videoBucket) {
      // Create videos bucket
      const { error: bucketError } = await supabase
        .storage
        .createBucket('videos', {
          public: false,
          fileSizeLimit: 100 * 1024 * 1024, // 100MB
        });
      
      if (bucketError) {
        console.error('Error creating bucket:', bucketError);
        return new Response(
          JSON.stringify({ error: 'Failed to create storage bucket' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Set bucket policy
      const { error: policyError } = await supabase
        .storage
        .from('videos')
        .createSignedUrl('dummy', 10); // Just to trigger policy creation
      
      if (policyError && !policyError.message.includes('not found')) {
        console.error('Error with bucket policy:', policyError);
      }
    }
    
    // Generate a unique path for the file
    const timestamp = new Date().getTime();
    const fileNameParts = fileName.split('.');
    const extension = fileNameParts.pop();
    const baseName = fileNameParts.join('.');
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const path = `${userId}/${sanitizedBaseName}_${timestamp}.${extension}`;
    
    // Get signed URL for upload
    const { data, error } = await supabase
      .storage
      .from('videos')
      .createSignedUploadUrl(path);
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate upload URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate a public URL for later access
    const { data: publicUrlData } = supabase
      .storage
      .from('videos')
      .getPublicUrl(path);
    
    // Return the signed URL and file info
    return new Response(
      JSON.stringify({
        signedUrl: data.signedUrl,
        path: path,
        fileUrl: publicUrlData.publicUrl,
        fileName: fileName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
