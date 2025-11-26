// Geocode edge function with persistent cache in public.building_geocodes
// Providers: Google (if GOOGLE_GEOCODING_KEY), Mapbox (if MAPBOX_TOKEN), fallback Nominatim

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function geocodeWithGoogle(address: string) {
  const key = Deno.env.get('GOOGLE_MAPS_API_KEY_SERVER');
  if (!key) {
    console.log('[GEOCODE] Google API key not found');
    return null;
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=pt-BR&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log('[GEOCODE] Google API failed:', res.status);
    return null;
  }
  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.length) {
    console.log('[GEOCODE] Google returned:', data.status);
    return null;
  }
  const r = data.results[0];
  const lt = r.geometry?.location_type;
  const types: string[] = r.types || [];
  const isPrecise = lt === 'ROOFTOP' || types.includes('street_address') || types.includes('premise');
  return {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    precision: isPrecise ? 'rooftop' : (lt || 'approximate').toString().toLowerCase(),
    provider: 'google',
    raw: r,
  };
}

async function geocodeWithMapbox(address: string) {
  const token = Deno.env.get('MAPBOX_TOKEN');
  if (!token) {
    console.log('[GEOCODE] Mapbox token not found');
    return null;
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1&language=pt-BR&country=BR`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.features?.length) return null;
  const f = data.features[0];
  const types: string[] = f.place_type || [];
  const isPrecise = types.includes('address') || types.includes('poi');
  return {
    lat: f.center?.[1],
    lng: f.center?.[0],
    precision: isPrecise ? 'rooftop' : 'approximate',
    provider: 'mapbox',
    raw: f,
  };
}

async function geocodeWithNominatim(address: string) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'IndexaDigitalWebApp/1.0',
        'Accept-Language': 'pt-BR',
      },
    });
    if (!res.ok) {
      console.log('[GEOCODE] Nominatim failed:', res.status);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) {
      console.log('[GEOCODE] Nominatim no results');
      return null;
    }
    const r = data[0];
    const cls = r.class || '';
    const typ = r.type || '';
    const isPrecise = cls === 'building' || typ === 'house' || typ === 'residential';
    console.log('[GEOCODE] Nominatim success:', r.display_name);
    return {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      precision: isPrecise ? 'rooftop' : 'approximate',
      provider: 'nominatim',
      raw: r,
    };
  } catch (error) {
    console.error('[GEOCODE] Nominatim error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ANON = Deno.env.get('SUPABASE_ANON_KEY');
  const supabase = createClient(SUPABASE_URL!, (SERVICE_ROLE || ANON)!);

  try {
    const { address, building_id }: { address?: string; building_id?: string } = await req.json();

    if (!address && !building_id) {
      return new Response(JSON.stringify({ error: 'Missing address or building_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If only building_id provided, try to construct address from DB
    let fullAddress = address?.trim();
    if (!fullAddress && building_id) {
      const { data: b } = await supabase
        .from('buildings')
        .select('endereco, bairro')
        .eq('id', building_id)
        .maybeSingle();
      if (b) {
        const parts = [b.endereco, b.bairro, 'Foz do Iguaçu', 'PR'].filter(Boolean);
        fullAddress = parts.join(', ');
      }
    }

    if (!fullAddress) {
      return new Response(JSON.stringify({ error: 'Unable to resolve address' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const normalized = normalizeAddress(fullAddress);

    // Check cache by building_id or normalized address
    const { data: cached } = await supabase
      .from('building_geocodes')
      .select('id, lat, lng, precision, provider')
      .or(`${building_id ? `building_id.eq.${building_id},` : ''}normalized_address.eq.${normalized}`)
      .limit(1);

    if (cached && cached.length) {
      const c = cached[0];
      return new Response(
        JSON.stringify({ lat: Number(c.lat), lng: Number(c.lng), precision: c.precision, provider: c.provider, cached: true, address: fullAddress }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Provider order: Google → Mapbox → Nominatim
    console.log('[GEOCODE] Trying to geocode:', fullAddress);
    let result = await geocodeWithGoogle(fullAddress);
    if (!result) result = await geocodeWithMapbox(fullAddress);
    if (!result) result = await geocodeWithNominatim(fullAddress);

    if (!result) {
      console.error('[GEOCODE] All providers failed for:', fullAddress);
      return new Response(JSON.stringify({ error: 'Geocoding failed', address: fullAddress }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log('[GEOCODE] Success with provider:', result.provider);

    // Insert into cache table
    const { error: insertErr } = await supabase.from('building_geocodes').upsert({
      building_id: building_id || null,
      address: fullAddress,
      normalized_address: normalized,
      lat: result.lat,
      lng: result.lng,
      precision: result.precision,
      provider: result.provider,
      raw: result.raw,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'normalized_address' });

    if (insertErr) {
      console.error('Cache insert error', insertErr);
    }

    return new Response(
      JSON.stringify({ lat: result.lat, lng: result.lng, precision: result.precision, provider: result.provider, cached: false, address: fullAddress }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('geocode_v1 error', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});