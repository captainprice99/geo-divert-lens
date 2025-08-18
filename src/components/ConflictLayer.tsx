import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface ConflictZone {
  id: string;
  name: string;
  severity: number;
  startTime: string;
  endTime: string;
  coordinates: [number, number][][];
}

// Mock conflict zones data
const mockConflictZones: ConflictZone[] = [
  {
    id: 'ukraine-2022',
    name: 'Ukraine Conflict Zone',
    severity: 3,
    startTime: '2022-02-24T00:00:00Z',
    endTime: '2024-12-31T23:59:59Z',
    coordinates: [[
      [30.0, 52.0], [35.0, 52.0], [35.0, 45.0], [30.0, 45.0], [30.0, 52.0]
    ]]
  },
  {
    id: 'middle-east-2021',
    name: 'Middle East Tensions',
    severity: 2,
    startTime: '2021-05-01T00:00:00Z',
    endTime: '2021-06-30T23:59:59Z',
    coordinates: [[
      [34.0, 33.0], [36.0, 33.0], [36.0, 31.0], [34.0, 31.0], [34.0, 33.0]
    ]]
  }
];

interface ConflictLayerProps {
  map: mapboxgl.Map;
  period: 'baseline' | 'during';
}

const ConflictLayer: React.FC<ConflictLayerProps> = ({ map, period }) => {
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

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

    // Filter conflicts based on period
    const activeConflicts = mockConflictZones.filter(zone => {
      const start = new Date(zone.startTime);
      const end = new Date(zone.endTime);
      
      if (period === 'baseline') {
        // Show conflicts active in 2021
        return start <= new Date('2021-12-31') && end >= new Date('2021-01-01');
      } else {
        // Show conflicts active in 2022
        return start <= new Date('2022-12-31') && end >= new Date('2022-01-01');
      }
    });

    if (activeConflicts.length === 0) return;

    // Create GeoJSON for active conflicts
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: activeConflicts.map(zone => ({
        type: 'Feature',
        properties: {
          id: zone.id,
          name: zone.name,
          severity: zone.severity,
          startTime: zone.startTime,
          endTime: zone.endTime
        },
        geometry: {
          type: 'Polygon',
          coordinates: zone.coordinates
        }
      }))
    };

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson
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
  }, [map, period]);

  return null;
};

export default ConflictLayer;