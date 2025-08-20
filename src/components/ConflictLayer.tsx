import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useConflictZones } from '@/hooks/useApi';

interface ConflictLayerProps {
  map: mapboxgl.Map;
  period: 'baseline' | 'during';
}

const ConflictLayer: React.FC<ConflictLayerProps> = ({ map, period }) => {
  const { data: conflictData, loading, error } = useConflictZones(period);

  useEffect(() => {
    if (!map || !map.isStyleLoaded() || loading || !conflictData) return;

    const sourceId = 'conflict-zones';
    const layerId = 'conflict-zones-fill';
    const borderLayerId = 'conflict-zones-border';

    // Remove existing layers and source
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getLayer(borderLayerId)) {
      map.removeLayer(borderLayerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Filter conflicts based on period - data already filtered by API
    const activeConflicts = conflictData.features || [];

    if (activeConflicts.length === 0) return;

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: conflictData
    });

    // Add fill layer
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'severity'], 1], '#facc15',
          ['==', ['get', 'severity'], 2], '#f97316',
          '#ef4444'
        ],
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false], 0.5,
          0.25
        ]
      }
    });

    // Add border layer
    map.addLayer({
      id: borderLayerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'severity'], 1], '#facc15',
          ['==', ['get', 'severity'], 2], '#f97316',
          '#ef4444'
        ],
        'line-width': 2,
        'line-opacity': 0.8
      }
    });

    // Add hover effects
    let hoveredFeatureId: string | null = null;

    map.on('mouseenter', layerId, (e) => {
      map.getCanvas().style.cursor = 'pointer';
      
      if (e.features && e.features.length > 0) {
        if (hoveredFeatureId) {
          map.setFeatureState(
            { source: sourceId, id: hoveredFeatureId },
            { hover: false }
          );
        }
        
        hoveredFeatureId = e.features[0].id as string;
        
        map.setFeatureState(
          { source: sourceId, id: hoveredFeatureId },
          { hover: true }
        );

        // Show tooltip
        const feature = e.features[0];
        const properties = feature.properties;
        
        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'conflict-popup'
        })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3 glass-panel rounded-lg">
              <div class="font-semibold text-sm mb-1">${properties?.name}</div>
              <div class="text-xs text-gray-300">
                Severity: ${properties?.severity}/3<br>
                Period: ${new Date(properties?.startTime).toLocaleDateString()} - ${new Date(properties?.endTime).toLocaleDateString()}
              </div>
            </div>
          `)
          .addTo(map);
      }
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
      
      if (hoveredFeatureId) {
        map.setFeatureState(
          { source: sourceId, id: hoveredFeatureId },
          { hover: false }
        );
      }
      
      hoveredFeatureId = null;
      
      // Remove popup
      const popups = document.getElementsByClassName('conflict-popup');
      if (popups.length > 0) {
        popups[0].remove();
      }
    });

    // Cleanup function
    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getLayer(borderLayerId)) {
        map.removeLayer(borderLayerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, period, conflictData, loading]);

  return null;
};

export default ConflictLayer;