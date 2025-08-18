import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

// Mock heatmap data points
const generateMockHeatmapData = (period: 'baseline' | 'during') => {
  const points: Array<{ lat: number; lng: number; intensity: number }> = [];
  
  // Base flight corridors in Europe/Middle East
  const corridors = [
    // Western Europe corridor
    { lat: 50.0, lng: 8.5, baseIntensity: 0.8 },
    { lat: 48.8, lng: 2.3, baseIntensity: 0.7 },
    { lat: 51.5, lng: -0.1, baseIntensity: 0.9 },
    
    // Eastern Europe corridor
    { lat: 52.2, lng: 21.0, baseIntensity: 0.6 },
    { lat: 47.5, lng: 19.0, baseIntensity: 0.5 },
    { lat: 50.1, lng: 14.4, baseIntensity: 0.6 },
    
    // Turkey/Middle East corridor
    { lat: 41.0, lng: 29.0, baseIntensity: 0.8 },
    { lat: 39.9, lng: 32.9, baseIntensity: 0.4 },
    
    // Alternative routes (more active during conflict)
    { lat: 45.8, lng: 15.9, baseIntensity: period === 'during' ? 0.9 : 0.3 }, // Zagreb
    { lat: 44.8, lng: 20.4, baseIntensity: period === 'during' ? 0.7 : 0.2 }, // Belgrade
    { lat: 42.7, lng: 23.3, baseIntensity: period === 'during' ? 0.6 : 0.2 }, // Sofia
  ];
  
  corridors.forEach(corridor => {
    // Generate points around each corridor
    for (let i = 0; i < 50; i++) {
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
      
      points.push({
        lat,
        lng,
        intensity: Math.max(0.1, intensity + (Math.random() - 0.5) * 0.3)
      });
    }
  });
  
  return points;
};

interface HeatmapLayerProps {
  map: mapboxgl.Map;
  period: 'baseline' | 'during';
  opacity: number;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ map, period, opacity }) => {
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = `heatmap-${period}`;
    const layerId = `heatmap-layer-${period}`;

    // Remove existing layer and source
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Generate heatmap data
    const heatmapData = generateMockHeatmapData(period);

    // Create GeoJSON
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: heatmapData.map((point, index) => ({
        type: 'Feature',
        properties: {
          intensity: point.intensity,
          flightCount: Math.floor(point.intensity * 100),
          avgDetour: period === 'during' ? Math.floor(point.intensity * 200) : 0
        },
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        }
      }))
    };

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson
    });

    // Add heatmap layer
    map.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      maxzoom: 9,
      paint: {
        // Increase the heatmap weight based on intensity
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0, 0,
          1, 1
        ],
        // Increase the heatmap color weight by intensity
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          9, 3
        ],
        // Color ramp for heatmap
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33, 102, 172, 0)',
          0.2, 'rgb(103, 169, 207)',
          0.4, 'rgb(209, 229, 240)',
          0.6, 'rgb(253, 219, 199)',
          0.8, 'rgb(239, 138, 98)',
          1, 'rgb(178, 24, 43)'
        ],
        // Adjust the heatmap radius by zoom level & intensity
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          9, 20
        ],
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, opacity / 100,
          9, 0
        ]
      }
    });

    // Add circle layer for high zoom levels
    map.addLayer({
      id: `${layerId}-points`,
      type: 'circle',
      source: sourceId,
      minzoom: 7,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, ['interpolate', ['linear'], ['get', 'intensity'], 0.1, 1, 1, 4],
          16, ['interpolate', ['linear'], ['get', 'intensity'], 0.1, 5, 1, 20]
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0.1, '#22d3ee',
          0.4, '#06b6d4',
          0.6, '#0891b2',
          0.8, '#0e7490',
          1.0, '#155e75'
        ],
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1,
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 0,
          8, opacity / 100
        ]
      }
    });

    // Add hover effects for circle points
    map.on('mouseenter', `${layerId}-points`, (e) => {
      map.getCanvas().style.cursor = 'pointer';
      
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const properties = feature.properties;
        
        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'heatmap-popup'
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2 glass-panel rounded-lg text-xs">
              <div class="font-semibold">Traffic Density</div>
              <div class="text-gray-300">
                Flights: ${properties?.flightCount || 0}<br>
                ${period === 'during' && properties?.avgDetour > 0 ? 
                  `Avg Detour: ${properties.avgDetour}km` : 
                  'No detours'
                }
              </div>
            </div>
          `)
          .addTo(map);
      }
    });

    map.on('mouseleave', `${layerId}-points`, () => {
      map.getCanvas().style.cursor = '';
      
      // Remove popup
      const popups = document.getElementsByClassName('heatmap-popup');
      if (popups.length > 0) {
        popups[0].remove();
      }
    });

    // Cleanup function
    return () => {
      if (map.getLayer(`${layerId}-points`)) {
        map.removeLayer(`${layerId}-points`);
      }
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, period, opacity]);

  return null;
};

export default HeatmapLayer;