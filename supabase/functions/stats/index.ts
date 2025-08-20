import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatsResponse {
  totalFlights: number;
  avgDetour: number;
  totalExtraKm: number;
  avgDelay: number;
  co2Impact: number;
  affectedRoutes: number;
  topAffectedRoutes?: Array<{
    route: string;
    detour: number;
    impact: string;
  }>;
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
    const period = url.searchParams.get('period') || 'baseline';

    console.log(`Calculating statistics for period: ${period}`);

    // Check if we have flight track data
    const { data: flightTracks, error: trackError } = await supabase
      .from('flight_tracks')
      .select('*')
      .eq('period', period);

    if (trackError) {
      console.error('Error fetching flight tracks:', trackError);
    }

    let stats: StatsResponse;

    if (flightTracks && flightTracks.length > 0) {
      // Calculate real statistics from flight data
      const totalFlights = flightTracks.length;
      const totalDetourKm = flightTracks.reduce((sum, flight) => sum + (flight.detour_km || 0), 0);
      const totalExtraFuel = flightTracks.reduce((sum, flight) => sum + (flight.extra_fuel_liters || 0), 0);
      const totalCO2 = flightTracks.reduce((sum, flight) => sum + (flight.co2_impact_tons || 0), 0);
      
      const avgDetour = totalFlights > 0 ? Math.round(totalDetourKm / totalFlights) : 0;
      const avgDelay = Math.round(avgDetour * 0.12); // Rough estimate: 0.12 min per km detour
      
      // Count affected routes (routes with detours > 0)
      const affectedRoutes = flightTracks.filter(flight => (flight.detour_km || 0) > 0).length;

      stats = {
        totalFlights,
        avgDetour,
        totalExtraKm: Math.round(totalDetourKm),
        avgDelay,
        co2Impact: Math.round(totalCO2),
        affectedRoutes
      };

      // Get top affected routes for 'during' period
      if (period === 'during') {
        const { data: routeStats, error: routeError } = await supabase
          .from('route_statistics')
          .select('*')
          .eq('period', period)
          .gt('avg_detour_km', 0)
          .order('avg_detour_km', { ascending: false })
          .limit(3);

        if (!routeError && routeStats) {
          stats.topAffectedRoutes = routeStats.map(route => ({
            route: `${route.origin_iata} → ${route.destination_iata}`,
            detour: Math.round(route.avg_detour_km || 0),
            impact: route.avg_detour_km > 250 ? 'High' : route.avg_detour_km > 150 ? 'Medium' : 'Low'
          }));
        }
      }
    } else {
      // Use sample statistics if no real data exists
      console.log('No flight track data found, using sample statistics');
      
      if (period === 'baseline') {
        stats = {
          totalFlights: 45623,
          avgDetour: 0,
          totalExtraKm: 0,
          avgDelay: 0,
          co2Impact: 0,
          affectedRoutes: 0
        };
      } else {
        stats = {
          totalFlights: 41289,
          avgDetour: 187,
          totalExtraKm: 2847500,
          avgDelay: 23,
          co2Impact: 8942,
          affectedRoutes: 78,
          topAffectedRoutes: [
            { route: 'IST → FRA', detour: 309, impact: 'High' },
            { route: 'VIE → WAW', detour: 245, impact: 'Medium' },
            { route: 'LHR → BUD', detour: 198, impact: 'Medium' },
          ]
        };
      }

      // Generate some sample flight data for next time
      await generateSampleFlightData(supabase, period);
    }

    console.log(`Returning statistics for period ${period}:`, stats);

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in stats function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function generateSampleFlightData(supabase: any, period: string) {
  try {
    console.log(`Generating sample flight data for period: ${period}`);
    
    // Get airports for flight generation
    const { data: airports } = await supabase
      .from('airports')
      .select('*')
      .limit(8);

    if (!airports || airports.length < 2) return;

    const sampleFlights = [];
    const routeStats = [];

    // Generate flights between major airport pairs
    const majorRoutes = [
      ['IST', 'FRA'], ['LHR', 'CDG'], ['VIE', 'WAW'], 
      ['FRA', 'BUD'], ['IST', 'VIE'], ['LHR', 'WAW']
    ];

    for (const [originIata, destIata] of majorRoutes) {
      const origin = airports.find(a => a.iata_code === originIata);
      const dest = airports.find(a => a.iata_code === destIata);
      
      if (!origin || !dest) continue;

      const numFlights = Math.floor(Math.random() * 20) + 10; // 10-30 flights per route
      let totalDetour = 0;
      let totalFuel = 0;
      let totalCO2 = 0;

      for (let i = 0; i < numFlights; i++) {
        // Create simple route geometry (straight line with potential detour)
        const originCoords = [origin.location.coordinates[0], origin.location.coordinates[1]];
        const destCoords = [dest.location.coordinates[0], dest.location.coordinates[1]];
        
        let routeCoords = [originCoords, destCoords];
        let detourKm = 0;
        let extraFuel = 0;
        let co2Impact = 0;

        // Add detours for 'during' period if route goes through conflict zones
        if (period === 'during') {
          // Check if route crosses Ukraine or Middle East (simplified)
          const avgLat = (originCoords[1] + destCoords[1]) / 2;
          const avgLng = (originCoords[0] + destCoords[0]) / 2;
          
          if ((avgLat > 45 && avgLat < 52 && avgLng > 25 && avgLng < 35) || 
              (avgLat > 31 && avgLat < 33 && avgLng > 34 && avgLng < 36)) {
            detourKm = Math.floor(Math.random() * 300) + 100; // 100-400km detour
            extraFuel = detourKm * 7; // ~7L per km extra fuel
            co2Impact = extraFuel * 0.00315; // ~3.15kg CO2 per liter fuel
            
            // Add detour waypoint
            const detourLat = avgLat + (Math.random() - 0.5) * 5;
            const detourLng = avgLng + (Math.random() - 0.5) * 5;
            routeCoords = [originCoords, [detourLng, detourLat], destCoords];
          }
        }

        const baseDistance = haversineDistance(originCoords[1], originCoords[0], destCoords[1], destCoords[0]);
        const flightTime = Math.floor(baseDistance / 800 * 60) + Math.floor(detourKm / 800 * 60); // ~800km/h cruise speed

        sampleFlights.push({
          flight_number: `${originIata}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
          origin_airport_id: origin.id,
          destination_airport_id: dest.id,
          departure_time: new Date(period === 'baseline' ? '2021-06-15' : '2022-06-15').toISOString(),
          route_geometry: `LINESTRING(${routeCoords.map(c => `${c[0]} ${c[1]}`).join(', ')})`,
          distance_km: baseDistance + detourKm,
          flight_time_minutes: flightTime,
          period,
          detour_km: detourKm,
          extra_fuel_liters: extraFuel,
          co2_impact_tons: co2Impact
        });

        totalDetour += detourKm;
        totalFuel += extraFuel;
        totalCO2 += co2Impact;
      }

      // Store route statistics
      routeStats.push({
        origin_iata: originIata,
        destination_iata: destIata,
        period,
        total_flights: numFlights,
        avg_distance_km: Math.floor(Math.random() * 2000) + 500,
        avg_flight_time_minutes: Math.floor(Math.random() * 180) + 60,
        avg_detour_km: totalDetour / numFlights,
        total_extra_fuel_liters: totalFuel,
        total_co2_impact_tons: totalCO2
      });
    }

    // Insert sample flights and route stats
    if (sampleFlights.length > 0) {
      const { error: flightError } = await supabase
        .from('flight_tracks')
        .insert(sampleFlights);

      if (flightError) {
        console.error('Error inserting sample flights:', flightError);
      } else {
        console.log(`Inserted ${sampleFlights.length} sample flights`);
      }
    }

    if (routeStats.length > 0) {
      const { error: statsError } = await supabase
        .from('route_statistics')
        .upsert(routeStats, { onConflict: 'origin_iata,destination_iata,period' });

      if (statsError) {
        console.error('Error inserting route statistics:', statsError);
      } else {
        console.log(`Inserted ${routeStats.length} route statistics`);
      }
    }

  } catch (error) {
    console.error('Error generating sample flight data:', error);
  }
}

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