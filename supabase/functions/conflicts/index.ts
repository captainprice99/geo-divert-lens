import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

// Mock conflict zones data
const mockConflictZones = {
  baseline: {
    type: 'FeatureCollection',
    features: []
  },
  during: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: '1',
          name: 'Eastern Europe Conflict Zone',
          severity: 3,
          startTime: '2022-02-24T00:00:00Z',
          endTime: '2024-12-31T23:59:59Z',
          description: 'Major conflict affecting air traffic routing'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [22, 52], [35, 52], [35, 45], [22, 45], [22, 52]
          ]]
        }
      },
      {
        type: 'Feature',
        properties: {
          id: '2',
          name: 'Middle East Tension Zone',
          severity: 2,
          startTime: '2023-10-01T00:00:00Z',
          endTime: '2024-12-31T23:59:59Z',
          description: 'Regional tensions affecting flight routes'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [30, 33], [40, 33], [40, 28], [30, 28], [30, 33]
          ]]
        }
      }
    ]
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`Fetching conflict zones for period: ${period}`);

    // Get active conflict zones based on period
    let query = supabase
      .from('conflict_zones')
      .select('*');

    if (period === 'baseline') {
      // Show conflicts active in 2021
      query = query
        .lte('start_time', '2021-12-31T23:59:59Z')
        .or('end_time.is.null,end_time.gte.2021-01-01T00:00:00Z');
    } else {
      // Show conflicts active in 2022 and ongoing
      query = query
        .lte('start_time', '2022-12-31T23:59:59Z')
        .or('end_time.is.null,end_time.gte.2022-01-01T00:00:00Z');
    }

    const { data: conflicts, error } = await query;

    if (error) {
      console.error('Error fetching conflict zones:', error);
      throw error;
    }

    console.log(`Found ${conflicts?.length || 0} conflict zones for period ${period}`);

    // Convert to GeoJSON format
    const geojson = {
      type: 'FeatureCollection',
      features: (conflicts || []).map(zone => {
        // Parse the geometry from PostGIS format
        let coordinates;
        try {
          // Handle both WKT and GeoJSON geometry formats
          if (typeof zone.geometry === 'string') {
            // Parse WKT format like "POLYGON((...))"  
            const coordsMatch = zone.geometry.match(/POLYGON\(\(([^)]+)\)\)/);
            if (coordsMatch) {
              const coordPairs = coordsMatch[1].split(',').map(pair => {
                const [lng, lat] = pair.trim().split(' ').map(Number);
                return [lng, lat];
              });
              coordinates = [coordPairs];
            }
          } else if (zone.geometry?.coordinates) {
            // Already in GeoJSON format
            coordinates = zone.geometry.coordinates;
          }
        } catch (parseError) {
          console.error('Error parsing geometry:', parseError);
          // Fallback coordinates for Ukraine conflict zone
          coordinates = [[
            [30.0, 52.0], [35.0, 52.0], [35.0, 45.0], [30.0, 45.0], [30.0, 52.0]
          ]];
        }

        return {
          type: 'Feature',
          properties: {
            id: zone.id,
            name: zone.name,
            severity: zone.severity,
            startTime: zone.start_time,
            endTime: zone.end_time,
            description: zone.description
          },
          geometry: {
            type: 'Polygon',
            coordinates: coordinates || [[
              [30.0, 52.0], [35.0, 52.0], [35.0, 45.0], [30.0, 45.0], [30.0, 52.0]
            ]]
          }
        };
      })
    };

    return new Response(JSON.stringify(geojson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in conflicts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});