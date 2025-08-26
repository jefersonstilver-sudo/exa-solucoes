import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ToggleRequest {
  titulo: string;
  ativo: boolean;
  buildingIds: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'PATCH') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { titulo, ativo, buildingIds }: ToggleRequest = await req.json();

    if (!titulo || typeof ativo !== 'boolean' || !Array.isArray(buildingIds)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: titulo, ativo, buildingIds' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔄 [TOGGLE_VIDEO] Toggling video "${titulo}" to ${ativo ? 'ACTIVE' : 'INACTIVE'} for buildings:`, buildingIds);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Send PATCH request to each building
    for (const buildingId of buildingIds) {
      const apiUrl = `http://15.228.8.3:8000/ativo/${buildingId}`;
      
      try {
        console.log(`📡 [TOGGLE_VIDEO] Sending PATCH to ${apiUrl}:`, { titulo, ativo });
        
        const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ titulo, ativo })
        });

        const responseText = await response.text();
        
        if (response.ok) {
          console.log(`✅ [TOGGLE_VIDEO] Success for building ${buildingId}:`, responseText);
          results.push({ buildingId, success: true, data: responseText });
          successCount++;
        } else {
          console.error(`❌ [TOGGLE_VIDEO] Error for building ${buildingId}:`, response.status, responseText);
          results.push({ buildingId, success: false, error: responseText, status: response.status });
          errorCount++;
        }
      } catch (error) {
        console.error(`💥 [TOGGLE_VIDEO] Network error for building ${buildingId}:`, error);
        results.push({ buildingId, success: false, error: error.message });
        errorCount++;
      }
    }

    const overallSuccess = successCount > 0;
    
    console.log(`📊 [TOGGLE_VIDEO] Summary: ${successCount} successes, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: overallSuccess,
        results,
        summary: {
          total: buildingIds.length,
          successes: successCount,
          errors: errorCount
        }
      }),
      { 
        status: overallSuccess ? 200 : 207, // 207 Multi-Status if mixed results
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 [TOGGLE_VIDEO] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})