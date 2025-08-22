import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Route, 
  ArrowRight, 
  Clock, 
  Fuel, 
  TrendingUp,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useAirports, useRouteComparison } from '@/hooks/useApi';

interface ODComparePanelProps {
  period: 'baseline' | 'during';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ODComparePanel: React.FC<ODComparePanelProps> = ({
  period,
  isCollapsed,
  onToggleCollapse
}) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  const { data: airports, loading: airportsLoading } = useAirports();
  const { data: routeData, loading: routeLoading, compareRoute } = useRouteComparison();

  const handleCompare = async () => {
    if (origin && destination) {
      await compareRoute(origin, destination);
      setShowComparison(true);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={onToggleCollapse}
        className="fixed top-4 right-4 z-20 glass-panel hover:neon-glow"
        size="sm"
        variant="outline"
      >
        {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* OD Compare Panel */}
      <div className={`fixed top-4 right-16 z-10 transition-transform duration-300 ${
        isCollapsed ? 'translate-x-80' : 'translate-x-0'
      }`}>
        <Card className="glass-panel w-96">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-neon-cyan">
              <Route className="h-5 w-5" />
              Route Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Airport Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Origin
                  </label>
                  <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {airportsLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading airports...
                          </div>
                        </SelectItem>
                      ) : (
                        airports.map((airport) => (
                          <SelectItem key={airport.iata_code} value={airport.iata_code}>
                            {airport.iata_code} - {airport.city}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Destination
                  </label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {airportsLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading airports...
                          </div>
                        </SelectItem>
                      ) : (
                        airports.map((airport) => (
                          <SelectItem key={airport.iata_code} value={airport.iata_code}>
                            {airport.iata_code} - {airport.city}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCompare}
                className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90"
                disabled={!origin || !destination || routeLoading}
              >
                {routeLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Comparing...
                  </div>
                ) : (
                  'Compare Routes'
                )}
              </Button>
            </div>

            {/* Comparison Results */}
            {showComparison && origin && destination && routeData && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{origin}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{destination}</Badge>
                  </div>
                  <Badge variant={period === 'baseline' ? 'secondary' : 'destructive'}>
                    {period === 'baseline' ? 'Baseline' : 'During Conflict'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-background/30">
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs text-muted-foreground">Distance</div>
                      <div className="text-lg font-semibold text-neon-cyan">
                        {period === 'baseline' ? routeData.baselineDistance : routeData.duringDistance} km
                      </div>
                      {period === 'during' && routeData.detourKm > 0 && (
                        <div className="text-xs text-conflict-red flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +{routeData.detourKm} km detour
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-background/30">
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Flight Time
                      </div>
                      <div className="text-lg font-semibold text-neon-green">
                        {formatTime(period === 'baseline' ? routeData.baselineTime : routeData.duringTime)}
                      </div>
                      {period === 'during' && (routeData.duringTime - routeData.baselineTime) > 0 && (
                        <div className="text-xs text-conflict-red">
                          +{routeData.duringTime - routeData.baselineTime}min extra
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {period === 'during' && (routeData.extraFuel > 0 || routeData.co2Impact > 0) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Impact Analysis</h4>
                      <div className="space-y-2">
                        {routeData.extraFuel > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Fuel className="h-3 w-3" />
                              Extra Fuel
                            </span>
                            <span className="font-medium text-neon-orange">
                              +{routeData.extraFuel.toLocaleString()} L
                            </span>
                          </div>
                        )}
                        {routeData.co2Impact > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span>CO₂ Impact</span>
                            <span className="font-medium text-conflict-red">
                              +{routeData.co2Impact} tons
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ODComparePanel;