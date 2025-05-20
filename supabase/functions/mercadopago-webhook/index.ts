
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function is deprecated and no longer processes webhooks
// It returns a 410 Gone status to indicate it's no longer in use
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  // Log the deprecation
  console.log("Deprecated webhook endpoint accessed");
  
  // Return a 410 Gone status with a helpful message
  return new Response(
    JSON.stringify({
      message: "This webhook endpoint has been deprecated. Payment processing now happens through direct API integration.",
      status: "deprecated"
    }),
    {
      status: 410,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    }
  );
});
