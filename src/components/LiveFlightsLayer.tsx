import React, { useEffect, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { useLiveFlights } from '@/hooks/useLiveFlights';

interface LiveFlightsLayerProps {
  map: mapboxgl.Map;
}

const LiveFlightsLayer: React.FC<LiveFlightsLayerProps> = ({ map }) => {
  const { data: liveFlights, loading, error } = useLiveFlights();

  // Create GeoJSON from live flights data
  const flightsGeoJSON = useMemo(() => {
    if (!liveFlights?.flights) return null;

    return {
      type: 'FeatureCollection' as const,
      features: liveFlights.flights
        .filter(flight => flight.latitude && flight.longitude && !flight.on_ground)
        .map(flight => ({
          type: 'Feature' as const,
          properties: {
            id: flight.icao24,
            callsign: flight.callsign || 'Unknown',
            country: flight.origin_country,
            altitude: flight.baro_altitude || 0,
            velocity: flight.velocity || 0,
            heading: flight.true_track || 0
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [flight.longitude!, flight.latitude!]
          }
        }))
    };
  }, [liveFlights]);

  useEffect(() => {
    if (!map || !flightsGeoJSON) return;

    const sourceId = 'live-flights';
    const layerId = 'live-flights-layer';

    // Remove existing layer and source
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: flightsGeoJSON
    });

    // Add layer for aircraft icons
    map.addLayer({
      id: layerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'icon-image': 'custom-plane',
        'icon-size': 0.6,
        'icon-rotation-alignment': 'map',
        'icon-rotate': ['get', 'heading'],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      },
      paint: {
        'icon-color': '#00ff88',
        'icon-opacity': 0.8
      }
    });

    // Load custom aircraft icon if not already loaded
    if (!map.hasImage('custom-plane')) {
      // Create a simple aircraft icon using Canvas
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      
      // Draw simple aircraft shape
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.moveTo(size/2, 4);
      ctx.lineTo(size/2 + 8, size - 4);
      ctx.lineTo(size/2 + 4, size - 2);
      ctx.lineTo(size/2, size - 8);
      ctx.lineTo(size/2 - 4, size - 2);
      ctx.lineTo(size/2 - 8, size - 4);
      ctx.closePath();
      ctx.fill();
      
      map.addImage('custom-plane', canvas as any);
    }

    // Add click handler for flight details
    map.on('click', layerId, (e) => {
      if (e.features && e.features[0]) {
        const flight = e.features[0].properties;
        
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-bold text-sm">${flight?.callsign || 'Unknown Flight'}</h3>
              <p class="text-xs text-gray-600">ICAO: ${flight?.id}</p>
              <p class="text-xs">Country: ${flight?.country}</p>
              <p class="text-xs">Altitude: ${Math.round(flight?.altitude || 0)}m</p>
              <p class="text-xs">Speed: ${Math.round((flight?.velocity || 0) * 3.6)}km/h</p>
            </div>
          `)
          .addTo(map);
      }
    });

    // Change cursor on hover
    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });

    // Cleanup function
    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, flightsGeoJSON]);

  return null;
};

export default LiveFlightsLayer;