import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FlightState {
  icao24: string
  callsign: string | null
  origin_country: string
  longitude: number | null
  latitude: number | null
  baro_altitude: number | null
  velocity: number | null
  true_track: number | null
  on_ground: boolean
  last_contact: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { bbox, extended } = await req.json()
    
    // Build OpenSky API URL
    let url = 'https://opensky-network.org/api/states/all'
    const params = new URLSearchParams()
    
    if (bbox && bbox.length === 4) {
      const [lamin, lomin, lamax, lomax] = bbox
      params.append('lamin', lamin.toString())
      params.append('lomin', lomin.toString())
      params.append('lamax', lamax.toString())
      params.append('lomax', lomax.toString())
    }
    
    if (extended) {
      params.append('extended', '1')
    }
    
    if (params.toString()) {
      url += '?' + params.toString()
    }

    console.log('Fetching from OpenSky API:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('OpenSky API error:', response.status, response.statusText)
      throw new Error(`OpenSky API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.states) {
      return new Response(
        JSON.stringify({ 
          time: Math.floor(Date.now() / 1000),
          flights: [],
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform OpenSky data format to our format
    const flights: FlightState[] = data.states
      .filter((state: any[]) => {
        // Filter out ground vehicles and null positions
        const [icao24, callsign, country, timePos, lastContact, lon, lat, altitude, onGround] = state
        return lat !== null && lon !== null && !onGround
      })
      .map((state: any[]) => {
        const [icao24, callsign, country, timePos, lastContact, lon, lat, baro_altitude, onGround, velocity, true_track] = state
        
        return {
          icao24,
          callsign: callsign ? callsign.trim() : null,
          origin_country: country,
          longitude: lon,
          latitude: lat,
          baro_altitude,
          velocity,
          true_track,
          on_ground: onGround,
          last_contact: lastContact
        }
      })

    return new Response(
      JSON.stringify({
        time: data.time,
        flights,
        count: flights.length,
        source: 'opensky'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in live-flights function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        time: Math.floor(Date.now() / 1000),
        flights: [],
        count: 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 with empty data instead of error
      },
    )
  }
})