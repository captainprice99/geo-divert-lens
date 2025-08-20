import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Airport {
  iata_code: string;
  name: string;
  city: string;
  country?: string;
}

interface StatsData {
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

interface RouteComparison {
  baselineDistance: number;
  duringDistance: number;
  detourKm: number;
  baselineTime: number;
  duringTime: number;
  extraFuel: number;
  co2Impact: number;
}

export const useHeatmapData = (period: 'baseline' | 'during') => {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: fnError } = await supabase.functions.invoke('heatmap', {
          body: { period }
        });

        if (fnError) throw fnError;
        
        setData(result);
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch heatmap data');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [period]);

  return { data, loading, error };
};

export const useConflictZones = (period: 'baseline' | 'during') => {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConflictZones = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: fnError } = await supabase.functions.invoke('conflicts', {
          body: { period }
        });

        if (fnError) throw fnError;
        
        setData(result);
      } catch (err) {
        console.error('Error fetching conflict zones:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch conflict zones');
      } finally {
        setLoading(false);
      }
    };

    fetchConflictZones();
  }, [period]);

  return { data, loading, error };
};

export const useStatsData = (period: 'baseline' | 'during') => {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: fnError } = await supabase.functions.invoke('stats', {
          body: { period }
        });

        if (fnError) throw fnError;
        
        setData(result);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  return { data, loading, error };
};

export const useAirports = () => {
  const [data, setData] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: result, error: fnError } = await supabase.functions.invoke('airports');

        if (fnError) throw fnError;
        
        setData(result || []);
      } catch (err) {
        console.error('Error fetching airports:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch airports');
      } finally {
        setLoading(false);
      }
    };

    fetchAirports();
  }, []);

  return { data, loading, error };
};

export const useRouteComparison = (origin: string, destination: string) => {
  const [data, setData] = useState<RouteComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compareRoute = async () => {
    if (!origin || !destination) return;

    try {
      setLoading(true);
      setError(null);

      const { data: result, error: fnError } = await supabase.functions.invoke('od-routes', {
        body: { origin, destination }
      });

      if (fnError) throw fnError;
      
      setData(result);
    } catch (err) {
      console.error('Error comparing route:', err);
      setError(err instanceof Error ? err.message : 'Failed to compare route');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, compareRoute };
};