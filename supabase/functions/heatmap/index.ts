import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

// Mock data for demonstration
const mockHeatmapData = {
  baseline: {
    type: 'FeatureCollection',
    features: Array.from({ length: 50 }, (_, i) => ({
      type: 'Feature',
      properties: {
        intensity: Math.random() * 0.8 + 0.2,
        flightCount: Math.floor(Math.random() * 100) + 20,
        avgDetour: 0
      },
      geometry: {
        type: 'Point',
        coordinates: [
          Math.random() * 40 - 10, // longitude between -10 and 30
          Math.random() * 20 + 40   // latitude between 40 and 60
        ]
      }
    }))
  },
  during: {
    type: 'FeatureCollection',
    features: Array.from({ length: 45 }, (_, i) => ({
      type: 'Feature',
      properties: {
        intensity: Math.random() * 0.6 + 0.1,
        flightCount: Math.floor(Math.random() * 80) + 15,
        avgDetour: Math.floor(Math.random() * 150) + 20
      },
      geometry: {
        type: 'Point',
        coordinates: [
          Math.random() * 40 - 10,
          Math.random() * 20 + 40
        ]
      }
    }))
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  flightCount: number;
  avgDetour: number;
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

    console.log(`Fetching heatmap data for period: ${period}`);

    // Get existing heatmap data or generate if not exists
    const { data: existingData, error: fetchError } = await supabase
      .from('heatmap_data')
      .select('*')
      .eq('period', period);

    if (fetchError) {
      console.error('Error fetching heatmap data:', fetchError);
      throw fetchError;
    }

    let heatmapPoints: HeatmapPoint[] = [];

    if (existingData && existingData.length > 0) {
      // Use existing data
      heatmapPoints = existingData.map(point => ({
        lat: point.location?.coordinates[1] || 0,
        lng: point.location?.coordinates[0] || 0,
        intensity: point.intensity || 0,
        flightCount: point.flight_count || 0,
        avgDetour: point.avg_detour_km || 0
      }));
    } else {
      // Generate sample heatmap data
      console.log('Generating sample heatmap data...');
      
      const corridors = [
        { lat: 50.0, lng: 8.5, baseIntensity: 0.8 }, // Frankfurt area
        { lat: 48.8, lng: 2.3, baseIntensity: 0.7 }, // Paris area
        { lat: 51.5, lng: -0.1, baseIntensity: 0.9 }, // London area
        { lat: 52.2, lng: 21.0, baseIntensity: 0.6 }, // Warsaw area
        { lat: 47.5, lng: 19.0, baseIntensity: 0.5 }, // Budapest area
        { lat: 41.0, lng: 29.0, baseIntensity: 0.8 }, // Istanbul area
        { lat: 45.8, lng: 15.9, baseIntensity: period === 'during' ? 0.9 : 0.3 }, // Zagreb
        { lat: 44.8, lng: 20.4, baseIntensity: period === 'during' ? 0.7 : 0.2 }, // Belgrade
        { lat: 42.7, lng: 23.3, baseIntensity: period === 'during' ? 0.6 : 0.2 }, // Sofia
      ];

      const insertData = [];

      corridors.forEach(corridor => {
        for (let i = 0; i < 30; i++) {
          const lat = corridor.lat + (Math.random() - 0.5) * 2;
          const lng = corridor.lng + (Math.random() - 0.5) * 4;
          
          let intensity = corridor.baseIntensity;
          
          // Reduce intensity in conflict zones during conflict period
          if (period === 'during') {
            // Ukraine area - reduce traffic
            if (lat > 45 && lat < 52 && lng > 30 && lng < 35) {
              intensity *= 0.1;
            }
            // Middle East area - reduce traffic
            if (lat > 31 && lat < 33 && lng > 34 && lng < 36) {
              intensity *= 0.3;
            }
          }

          const finalIntensity = Math.max(0.1, intensity + (Math.random() - 0.5) * 0.3);
          const flightCount = Math.floor(finalIntensity * 100);
          const avgDetour = period === 'during' ? Math.floor(finalIntensity * 200) : 0;

          heatmapPoints.push({
            lat,
            lng,
            intensity: finalIntensity,
            flightCount,
            avgDetour
          });

          insertData.push({
            location: `POINT(${lng} ${lat})`,
            period,
            flight_count: flightCount,
            intensity: finalIntensity,
            avg_detour_km: avgDetour,
            grid_cell: `${Math.floor(lat * 10)}_${Math.floor(lng * 10)}`
          });
        }
      });

      // Insert generated data
      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from('heatmap_data')
          .insert(insertData);

        if (insertError) {
          console.error('Error inserting heatmap data:', insertError);
        } else {
          console.log(`Inserted ${insertData.length} heatmap points for period ${period}`);
        }
      }
    }

    // Convert to GeoJSON format expected by frontend
    const geojson = {
      type: 'FeatureCollection',
      features: heatmapPoints.map((point, index) => ({
        type: 'Feature',
        properties: {
          intensity: point.intensity,
          flightCount: point.flightCount,
          avgDetour: point.avgDetour
        },
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        }
      }))
    };

    console.log(`Returning ${heatmapPoints.length} heatmap points for period ${period}`);

    return new Response(JSON.stringify(geojson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in heatmap function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});