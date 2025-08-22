// Comprehensive mock data for all functionalities

export const mockFlights = {
  baseline: [
    { id: 'LH441', icao24: 'abc123', callsign: 'LH441', origin_country: 'Germany', latitude: 50.1109, longitude: 8.6821, altitude: 11000, velocity: 850, heading: 45, route: 'FRA-LHR' },
    { id: 'BA917', icao24: 'def456', callsign: 'BA917', origin_country: 'United Kingdom', latitude: 51.4706, longitude: -0.4619, altitude: 10500, velocity: 820, heading: 90, route: 'LHR-CDG' },
    { id: 'AF1234', icao24: 'ghi789', callsign: 'AF1234', origin_country: 'France', latitude: 49.0097, longitude: 2.5479, altitude: 12000, velocity: 890, heading: 120, route: 'CDG-BEG' },
    { id: 'LO332', icao24: 'jkl012', callsign: 'LO332', origin_country: 'Poland', latitude: 52.1657, longitude: 20.9671, altitude: 9800, velocity: 780, heading: 180, route: 'WAW-VIE' },
    { id: 'OS441', icao24: 'mno345', callsign: 'OS441', origin_country: 'Austria', latitude: 48.1103, longitude: 16.5697, altitude: 11500, velocity: 860, heading: 270, route: 'VIE-ZAG' },
  ],
  during: [
    { id: 'LH441', icao24: 'abc123', callsign: 'LH441', origin_country: 'Germany', latitude: 50.1109, longitude: 8.6821, altitude: 11000, velocity: 850, heading: 45, route: 'FRA-LHR', detour: 45 },
    { id: 'BA917', icao24: 'def456', callsign: 'BA917', origin_country: 'United Kingdom', latitude: 51.4706, longitude: -0.4619, altitude: 10500, velocity: 820, heading: 90, route: 'LHR-CDG', detour: 0 },
    { id: 'AF1234', icao24: 'ghi789', callsign: 'AF1234', origin_country: 'France', latitude: 49.0097, longitude: 2.5479, altitude: 12000, velocity: 890, heading: 120, route: 'CDG-BEG', detour: 120 },
    { id: 'TK1876', icao24: 'pqr678', callsign: 'TK1876', origin_country: 'Turkey', latitude: 41.2753, longitude: 28.7519, altitude: 10200, velocity: 840, heading: 315, route: 'IST-SOF', detour: 80 },
    { id: 'OS441', icao24: 'mno345', callsign: 'OS441', origin_country: 'Austria', latitude: 48.1103, longitude: 16.5697, altitude: 11500, velocity: 860, heading: 270, route: 'VIE-ZAG', detour: 0 },
  ]
};

export const mockHeatmapData = {
  baseline: {
    type: 'FeatureCollection',
    features: [
      // Western Europe cluster
      {
        type: 'Feature',
        properties: { intensity: 0.9, flightCount: 120, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [2.3522, 48.8566] } // Paris
      },
      {
        type: 'Feature',
        properties: { intensity: 0.8, flightCount: 95, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [8.5417, 50.0755] } // Frankfurt
      },
      {
        type: 'Feature',
        properties: { intensity: 0.85, flightCount: 110, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] } // London
      },
      
      // Central Europe cluster
      {
        type: 'Feature',
        properties: { intensity: 0.7, flightCount: 75, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [16.3738, 48.2082] } // Vienna
      },
      {
        type: 'Feature',
        properties: { intensity: 0.6, flightCount: 65, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [14.4378, 50.0755] } // Prague
      },
      {
        type: 'Feature',
        properties: { intensity: 0.65, flightCount: 70, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [19.0402, 47.4979] } // Budapest
      },
      
      // Eastern Europe cluster
      {
        type: 'Feature',
        properties: { intensity: 0.55, flightCount: 58, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [21.0122, 52.2297] } // Warsaw
      },
      {
        type: 'Feature',
        properties: { intensity: 0.5, flightCount: 45, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [20.4489, 44.7866] } // Belgrade
      },
      {
        type: 'Feature',
        properties: { intensity: 0.45, flightCount: 40, avgDetour: 0 },
        geometry: { type: 'Point', coordinates: [23.7275, 37.9838] } // Athens
      }
    ]
  },
  during: {
    type: 'FeatureCollection',
    features: [
      // Western Europe cluster (reduced traffic)
      {
        type: 'Feature',
        properties: { intensity: 0.75, flightCount: 85, avgDetour: 15 },
        geometry: { type: 'Point', coordinates: [2.3522, 48.8566] } // Paris
      },
      {
        type: 'Feature',
        properties: { intensity: 0.7, flightCount: 78, avgDetour: 25 },
        geometry: { type: 'Point', coordinates: [8.5417, 50.0755] } // Frankfurt
      },
      {
        type: 'Feature',
        properties: { intensity: 0.72, flightCount: 82, avgDetour: 20 },
        geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] } // London
      },
      
      // Central Europe cluster (significant impact)
      {
        type: 'Feature',
        properties: { intensity: 0.55, flightCount: 55, avgDetour: 45 },
        geometry: { type: 'Point', coordinates: [16.3738, 48.2082] } // Vienna
      },
      {
        type: 'Feature',
        properties: { intensity: 0.45, flightCount: 48, avgDetour: 60 },
        geometry: { type: 'Point', coordinates: [14.4378, 50.0755] } // Prague
      },
      {
        type: 'Feature',
        properties: { intensity: 0.5, flightCount: 52, avgDetour: 55 },
        geometry: { type: 'Point', coordinates: [19.0402, 47.4979] } // Budapest
      },
      
      // Eastern Europe cluster (heavily affected)
      {
        type: 'Feature',
        properties: { intensity: 0.35, flightCount: 32, avgDetour: 120 },
        geometry: { type: 'Point', coordinates: [21.0122, 52.2297] } // Warsaw
      },
      {
        type: 'Feature',
        properties: { intensity: 0.3, flightCount: 28, avgDetour: 150 },
        geometry: { type: 'Point', coordinates: [20.4489, 44.7866] } // Belgrade
      },
      {
        type: 'Feature',
        properties: { intensity: 0.25, flightCount: 22, avgDetour: 180 },
        geometry: { type: 'Point', coordinates: [23.7275, 37.9838] } // Athens
      },
      
      // Southern routes (new alternative paths)
      {
        type: 'Feature',
        properties: { intensity: 0.4, flightCount: 35, avgDetour: 80 },
        geometry: { type: 'Point', coordinates: [28.9784, 41.0082] } // Istanbul
      }
    ]
  }
};

export const mockConflictZones = {
  baseline: {
    type: 'FeatureCollection',
    features: []
  },
  during: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: '1',
          name: 'Eastern Europe Conflict Zone',
          severity: 3,
          startTime: '2022-02-24T00:00:00Z',
          endTime: '2024-12-31T23:59:59Z',
          description: 'Major conflict affecting air traffic routing'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [22, 52], [35, 52], [35, 45], [22, 45], [22, 52]
          ]]
        }
      },
      {
        type: 'Feature',
        properties: {
          id: '2',
          name: 'Middle East Tension Zone',
          severity: 2,
          startTime: '2023-10-01T00:00:00Z',
          endTime: '2024-12-31T23:59:59Z',
          description: 'Regional tensions affecting flight routes'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [30, 33], [40, 33], [40, 28], [30, 28], [30, 33]
          ]]
        }
      }
    ]
  }
};

export const mockRouteComparisons = {
  'FRA-LHR': {
    baselineDistance: 658,
    duringDistance: 658,
    detourKm: 0,
    baselineTime: 95,
    duringTime: 95,
    extraFuel: 0,
    co2Impact: 0
  },
  'CDG-WAW': {
    baselineDistance: 1365,
    duringDistance: 1520,
    detourKm: 155,
    baselineTime: 130,
    duringTime: 148,
    extraFuel: 1085,
    co2Impact: 3.4
  },
  'VIE-IST': {
    baselineDistance: 1048,
    duringDistance: 1280,
    detourKm: 232,
    baselineTime: 105,
    duringTime: 128,
    extraFuel: 1624,
    co2Impact: 5.1
  },
  'PRG-ATH': {
    baselineDistance: 1245,
    duringDistance: 1580,
    detourKm: 335,
    baselineTime: 125,
    duringTime: 158,
    extraFuel: 2345,
    co2Impact: 7.4
  }
};

export const mockStatistics = {
  baseline: {
    totalFlights: 45623,
    avgDetour: 0,
    totalExtraKm: 0,
    avgDelay: 0,
    co2Impact: 0,
    affectedRoutes: 0
  },
  during: {
    totalFlights: 38945,
    avgDetour: 87,
    totalExtraKm: 3389750,
    avgDelay: 23,
    co2Impact: 10673,
    affectedRoutes: 245
  }
};