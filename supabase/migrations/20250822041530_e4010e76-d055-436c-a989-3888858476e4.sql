-- Fix RLS for spatial_ref_sys table (PostGIS system table)
-- This table is read-only and used by PostGIS, so we enable RLS but don't create policies
-- as it's managed by PostGIS and should be publicly readable

ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access to spatial_ref_sys
-- This is safe because it's a PostGIS system table with standardized coordinate system definitions
CREATE POLICY "Allow public read access to spatial reference systems" 
ON public.spatial_ref_sys 
FOR SELECT 
USING (true);