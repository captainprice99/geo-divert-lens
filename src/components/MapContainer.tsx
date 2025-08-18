import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MapContainerProps {
  onMapReady: (map: mapboxgl.Map) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ onMapReady }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !apiKey) return;

    // Initialize map with Mapbox token
    mapboxgl.accessToken = apiKey;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        projection: { name: 'globe' } as any,
        zoom: 3,
        center: [20, 45], // Eastern Europe focus
        pitch: 0,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add atmosphere effects
      map.current.on('style.load', () => {
        if (map.current) {
          map.current.setFog({
            color: 'rgb(15, 20, 30)',
            'high-color': 'rgb(25, 35, 55)',
            'horizon-blend': 0.1,
          });
        }
      });

      // Notify parent component
      map.current.on('load', () => {
        if (map.current) {
          onMapReady(map.current);
        }
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setShowApiKeyInput(true);
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [apiKey, onMapReady]);

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setShowApiKeyInput(false);
    }
  };

  if (!apiKey || showApiKeyInput) {
    return (
      <div className="relative w-full h-screen bg-background flex items-center justify-center">
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold mb-4 text-neon-cyan">Mapbox Configuration</h2>
          <p className="text-muted-foreground mb-4">
            Enter your Mapbox public token to display the interactive map. You can get one at{' '}
            <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">
              mapbox.com
            </a>
          </p>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbG..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-background/50 border-border"
            />
            <Button 
              onClick={handleApiKeySubmit}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90"
              disabled={!apiKey.trim()}
            >
              Initialize Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/5" />
    </div>
  );
};

export default MapContainer;