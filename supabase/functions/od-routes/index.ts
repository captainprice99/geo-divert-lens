import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteComparisonResponse {
  baselineDistance: number;
  duringDistance: number;
  detourKm: number;
  baselineTime: number;
  duringTime: number;
  extraFuel: number;
  co2Impact: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const origin = url.searchParams.get('origin');
    const destination = url.searchParams.get('destination');

    if (!origin || !destination) {
      return new Response(JSON.stringify({ error: 'Origin and destination are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Comparing route ${origin} → ${destination}`);

    // Get route statistics for both periods
    const { data: routeStats, error: statsError } = await supabase
      .from('route_statistics')
      .select('*')
      .eq('origin_iata', origin)
      .eq('destination_iata', destination);

    if (statsError) {
      console.error('Error fetching route statistics:', statsError);
    }

    let baselineStats = routeStats?.find(r => r.period === 'baseline');
    let duringStats = routeStats?.find(r => r.period === 'during');

    // If no data exists, calculate from airports and generate sample data
    if (!baselineStats || !duringStats) {
      console.log('No route statistics found, calculating from airports...');
      
      const { data: airports, error: airportError } = await supabase
        .from('airports')
        .select('*')
        .in('iata_code', [origin, destination]);

      if (airportError) {
        throw airportError;
      }

      const originAirport = airports?.find(a => a.iata_code === origin);
      const destAirport = airports?.find(a => a.iata_code === destination);

      if (!originAirport || !destAirport) {
        return new Response(JSON.stringify({ error: 'Airport not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Calculate base distance using Haversine formula
      const baseDistance = haversineDistance(
        originAirport.location.coordinates[1], // lat
        originAirport.location.coordinates[0], // lng
        destAirport.location.coordinates[1],   // lat
        destAirport.location.coordinates[0]    // lng
      );

      const baseTime = Math.floor(baseDistance / 800 * 60); // Assume 800 km/h cruise speed

      // Check if route passes through conflict zones (simplified check)
      const avgLat = (originAirport.location.coordinates[1] + destAirport.location.coordinates[1]) / 2;
      const avgLng = (originAirport.location.coordinates[0] + destAirport.location.coordinates[0]) / 2;
      
      let detourKm = 0;
      let extraTime = 0;

      // Ukraine conflict zone check
      if (avgLat > 45 && avgLat < 52 && avgLng > 25 && avgLng < 35) {
        detourKm = Math.floor(Math.random() * 200) + 150; // 150-350km detour
      }
      // Middle East tension zone check
      else if (avgLat > 31 && avgLat < 33 && avgLng > 34 && avgLng < 36) {
        detourKm = Math.floor(Math.random() * 100) + 50; // 50-150km detour
      }
      // Other potential detour routes
      else if (Math.random() > 0.7) { // 30% chance of minor detour
        detourKm = Math.floor(Math.random() * 50) + 20; // 20-70km minor detour
      }

      extraTime = Math.floor(detourKm / 800 * 60); // Additional time for detour

      baselineStats = {
        avg_distance_km: baseDistance,
        avg_flight_time_minutes: baseTime,
        avg_detour_km: 0,
        total_extra_fuel_liters: 0,
        total_co2_impact_tons: 0
      };

      duringStats = {
        avg_distance_km: baseDistance + detourKm,
        avg_flight_time_minutes: baseTime + extraTime,
        avg_detour_km: detourKm,
        total_extra_fuel_liters: detourKm * 7, // ~7L per km
        total_co2_impact_tons: (detourKm * 7) * 0.00315 // ~3.15kg CO2 per liter
      };

      // Store the calculated statistics
      const newRouteStats = [
        {
          origin_iata: origin,
          destination_iata: destination,
          period: 'baseline',
          total_flights: 1,
          ...baselineStats
        },
        {
          origin_iata: origin,
          destination_iata: destination,
          period: 'during',
          total_flights: 1,
          ...duringStats
        }
      ];

      const { error: insertError } = await supabase
        .from('route_statistics')
        .upsert(newRouteStats, { onConflict: 'origin_iata,destination_iata,period' });

      if (insertError) {
        console.error('Error storing route statistics:', insertError);
      }
    }

    const response: RouteComparisonResponse = {
      baselineDistance: Math.round(baselineStats?.avg_distance_km || 0),
      duringDistance: Math.round(duringStats?.avg_distance_km || 0),
      detourKm: Math.round(duringStats?.avg_detour_km || 0),
      baselineTime: Math.round(baselineStats?.avg_flight_time_minutes || 0),
      duringTime: Math.round(duringStats?.avg_flight_time_minutes || 0),
      extraFuel: Math.round(duringStats?.total_extra_fuel_liters || 0),
      co2Impact: Math.round((duringStats?.total_co2_impact_tons || 0) * 100) / 100 // Round to 2 decimal places
    };

    console.log(`Route comparison result:`, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in od-routes function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
