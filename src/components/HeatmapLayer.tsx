import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useHeatmapData } from '@/hooks/useApi';

interface HeatmapLayerProps {
  map: mapboxgl.Map;
  period: 'baseline' | 'during';
  opacity: number;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ map, period, opacity }) => {
  const { data: heatmapData, loading, error } = useHeatmapData(period);

  useEffect(() => {
    if (!map || !map.isStyleLoaded() || loading || !heatmapData) return;

    const sourceId = `heatmap-${period}`;
    const layerId = `heatmap-layer-${period}`;

    // Remove existing layer and source
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Add source with API data
    map.addSource(sourceId, {
      type: 'geojson',
      data: heatmapData
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
  }, [map, period, opacity, heatmapData, loading]);

  return null;
};

export default HeatmapLayer;