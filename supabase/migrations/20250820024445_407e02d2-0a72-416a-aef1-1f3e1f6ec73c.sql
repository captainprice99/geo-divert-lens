-- Fix security issues from previous migration

-- 1. Fix function search path security issue
CREATE OR REPLACE FUNCTION calculate_flight_detour(
  flight_route GEOGRAPHY,
  flight_period TEXT,
  baseline_distance NUMERIC
) RETURNS NUMERIC 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  intersects_conflict BOOLEAN := FALSE;
  detour_factor NUMERIC := 1.0;
BEGIN
  -- Check if flight intersects any active conflict zones
  SELECT EXISTS(
    SELECT 1 FROM public.conflict_zones cz
    WHERE ST_Intersects(flight_route, cz.geometry)
    AND (flight_period = 'baseline' AND cz.start_time <= '2021-12-31' AND (cz.end_time IS NULL OR cz.end_time >= '2021-01-01'))
    OR (flight_period = 'during' AND cz.start_time <= '2022-12-31' AND (cz.end_time IS NULL OR cz.end_time >= '2022-01-01'))
  ) INTO intersects_conflict;
  
  IF intersects_conflict AND flight_period = 'during' THEN
    -- Calculate detour based on severity
    SELECT COALESCE(AVG(
      CASE 
        WHEN severity = 3 THEN 1.4  -- 40% detour for high severity
        WHEN severity = 2 THEN 1.2  -- 20% detour for medium severity
        ELSE 1.1                    -- 10% detour for low severity
      END
    ), 1.0) INTO detour_factor
    FROM public.conflict_zones cz
    WHERE ST_Intersects(flight_route, cz.geometry)
    AND cz.start_time <= '2022-12-31' 
    AND (cz.end_time IS NULL OR cz.end_time >= '2022-01-01');
    
    RETURN (baseline_distance * detour_factor) - baseline_distance;
  END IF;
  
  RETURN 0;
END;
$$;

-- 2. Verify RLS is properly enabled (re-enable to be sure)
ALTER TABLE public.airports FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_zones FORCE ROW LEVEL SECURITY;
ALTER TABLE public.flight_tracks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.route_statistics FORCE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_data FORCE ROW LEVEL SECURITY;