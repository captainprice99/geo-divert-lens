import React, { useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapContainer from '@/components/MapContainer';
import ControlPanel from '@/components/ControlPanel';
import ODComparePanel from '@/components/ODComparePanel';
import StatsPanel from '@/components/StatsPanel';
import ConflictLayer from '@/components/ConflictLayer';
import HeatmapLayer from '@/components/HeatmapLayer';
import LiveFlightsLayer from '@/components/LiveFlightsLayer';

const Index = () => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [period, setPeriod] = useState<'baseline' | 'during'>('baseline');
  const [heatmapOpacity, setHeatmapOpacity] = useState(70);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const handleMapReady = useCallback((mapInstance: mapboxgl.Map) => {
    setMap(mapInstance);
  }, []);

  const handlePeriodChange = useCallback((newPeriod: 'baseline' | 'during') => {
    setPeriod(newPeriod);
  }, []);

  const handleHeatmapOpacityChange = useCallback((value: number) => {
    setHeatmapOpacity(value);
  }, []);

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Map Container */}
      <MapContainer onMapReady={handleMapReady} />
      
      {/* Map Layers */}
      {map && (
        <>
          <ConflictLayer map={map} period={period} />
          <HeatmapLayer map={map} period={period} opacity={heatmapOpacity} />
          <LiveFlightsLayer map={map} />
        </>
      )}

      {/* Control Panels */}
      <ControlPanel
        period={period}
        onPeriodChange={handlePeriodChange}
        heatmapOpacity={heatmapOpacity}
        onHeatmapOpacityChange={handleHeatmapOpacityChange}
        isCollapsed={leftPanelCollapsed}
        onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
      />

      <ODComparePanel
        period={period}
        isCollapsed={rightPanelCollapsed}
        onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
      />

      <StatsPanel period={period} />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default Index;
