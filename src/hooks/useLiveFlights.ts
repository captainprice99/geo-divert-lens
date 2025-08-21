import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveFlight {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  velocity: number | null;
  true_track: number | null;
  on_ground: boolean;
  last_contact: number;
}

interface LiveFlightData {
  time: number;
  flights: LiveFlight[];
  count: number;
  source: string;
}

export const useLiveFlights = (bbox?: number[], autoRefresh = true) => {
  const [data, setData] = useState<LiveFlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveFlights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('live-flights', {
        body: { bbox, extended: 1 }
      });

      if (error) throw error;
      
      setData(result);
    } catch (err) {
      console.error('Error fetching live flights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFlights();
    
    if (autoRefresh) {
      // Refresh every 30 seconds (respecting OpenSky rate limits)
      const interval = setInterval(fetchLiveFlights, 30000);
      return () => clearInterval(interval);
    }
  }, [bbox?.join(','), autoRefresh]);

  return { data, loading, error, refetch: fetchLiveFlights };
};