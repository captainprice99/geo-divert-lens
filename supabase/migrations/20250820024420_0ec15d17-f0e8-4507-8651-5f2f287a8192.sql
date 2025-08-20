-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create airports table
CREATE TABLE public.airports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  iata_code VARCHAR(3) NOT NULL UNIQUE,
  icao_code VARCHAR(4),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conflict zones table
CREATE TABLE public.conflict_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 3),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  geometry GEOGRAPHY(POLYGON, 4326) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create flight tracks table for storing actual flight paths
CREATE TABLE public.flight_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_number TEXT,
  origin_airport_id UUID REFERENCES public.airports(id),
  destination_airport_id UUID REFERENCES public.airports(id),
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE,
  route_geometry GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  distance_km NUMERIC,
  flight_time_minutes INTEGER,
  period TEXT NOT NULL CHECK (period IN ('baseline', 'during')),
  detour_km NUMERIC DEFAULT 0,
  extra_fuel_liters NUMERIC DEFAULT 0,
  co2_impact_tons NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create route statistics aggregation table
CREATE TABLE public.route_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_iata VARCHAR(3) NOT NULL,
  destination_iata VARCHAR(3) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('baseline', 'during')),
  total_flights INTEGER DEFAULT 0,
  avg_distance_km NUMERIC DEFAULT 0,
  avg_flight_time_minutes INTEGER DEFAULT 0,
  avg_detour_km NUMERIC DEFAULT 0,
  total_extra_fuel_liters NUMERIC DEFAULT 0,
  total_co2_impact_tons NUMERIC DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(origin_iata, destination_iata, period)
);

-- Create heatmap data table for aggregated flight density
CREATE TABLE public.heatmap_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('baseline', 'during')),
  flight_count INTEGER DEFAULT 0,
  intensity NUMERIC DEFAULT 0,
  avg_detour_km NUMERIC DEFAULT 0,
  grid_cell VARCHAR(20), -- For aggregation purposes
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_airports_location ON public.airports USING GIST (location);
CREATE INDEX idx_airports_iata ON public.airports (iata_code);
CREATE INDEX idx_conflict_zones_geometry ON public.conflict_zones USING GIST (geometry);
CREATE INDEX idx_conflict_zones_time ON public.conflict_zones (start_time, end_time);
CREATE INDEX idx_flight_tracks_route ON public.flight_tracks USING GIST (route_geometry);
CREATE INDEX idx_flight_tracks_period ON public.flight_tracks (period);
CREATE INDEX idx_flight_tracks_airports ON public.flight_tracks (origin_airport_id, destination_airport_id);
CREATE INDEX idx_route_statistics_route ON public.route_statistics (origin_iata, destination_iata, period);
CREATE INDEX idx_heatmap_location ON public.heatmap_data USING GIST (location);
CREATE INDEX idx_heatmap_period ON public.heatmap_data (period);

-- Insert sample airports
INSERT INTO public.airports (iata_code, icao_code, name, city, country, location) VALUES
('IST', 'LTFM', 'Istanbul Airport', 'Istanbul', 'Turkey', ST_Point(28.8142, 41.2619, 4326)),
('FRA', 'EDDF', 'Frankfurt Airport', 'Frankfurt', 'Germany', ST_Point(8.5622, 50.0379, 4326)),
('LHR', 'EGLL', 'Heathrow Airport', 'London', 'United Kingdom', ST_Point(-0.4543, 51.4700, 4326)),
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'Paris', 'France', ST_Point(2.5479, 49.0097, 4326)),
('VIE', 'LOWW', 'Vienna International Airport', 'Vienna', 'Austria', ST_Point(16.5697, 48.1103, 4326)),
('WAW', 'EPWA', 'Warsaw Chopin Airport', 'Warsaw', 'Poland', ST_Point(20.9679, 52.1657, 4326)),
('PRG', 'LKPR', 'Václav Havel Airport Prague', 'Prague', 'Czech Republic', ST_Point(14.2600, 50.1008, 4326)),
('BUD', 'LHBP', 'Budapest Ferenc Liszt International Airport', 'Budapest', 'Hungary', ST_Point(19.2556, 47.4369, 4326)),
('ZAG', 'LDZA', 'Zagreb Airport', 'Zagreb', 'Croatia', ST_Point(16.0688, 45.7429, 4326)),
('BEG', 'LYBE', 'Belgrade Nikola Tesla Airport', 'Belgrade', 'Serbia', ST_Point(20.3094, 44.8184, 4326)),
('SOF', 'LBSF', 'Sofia Airport', 'Sofia', 'Bulgaria', ST_Point(23.4114, 42.6951, 4326)),
('ATH', 'LGAV', 'Athens International Airport', 'Athens', 'Greece', ST_Point(23.9445, 37.9364, 4326));

-- Insert sample conflict zones
INSERT INTO public.conflict_zones (name, severity, start_time, end_time, geometry, description) VALUES
('Ukraine Conflict Zone', 3, '2022-02-24T00:00:00Z', NULL, 
 ST_GeomFromText('POLYGON((30.0 52.0, 35.0 52.0, 35.0 45.0, 30.0 45.0, 30.0 52.0))', 4326),
 'Major conflict zone affecting European air traffic'),
('Middle East Tension Zone', 2, '2021-05-01T00:00:00Z', '2021-06-30T23:59:59Z',
 ST_GeomFromText('POLYGON((34.0 33.0, 36.0 33.0, 36.0 31.0, 34.0 31.0, 34.0 33.0))', 4326),
 'Regional tensions affecting flight routes');

-- Function to calculate detour for flight intersecting conflict zones
CREATE OR REPLACE FUNCTION calculate_flight_detour(
  flight_route GEOGRAPHY,
  flight_period TEXT,
  baseline_distance NUMERIC
) RETURNS NUMERIC AS $$
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
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heatmap_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is a demo app)
CREATE POLICY "Public can read airports" ON public.airports FOR SELECT USING (true);
CREATE POLICY "Public can read conflict zones" ON public.conflict_zones FOR SELECT USING (true);
CREATE POLICY "Public can read flight tracks" ON public.flight_tracks FOR SELECT USING (true);
CREATE POLICY "Public can read route statistics" ON public.route_statistics FOR SELECT USING (true);
CREATE POLICY "Public can read heatmap data" ON public.heatmap_data FOR SELECT USING (true);