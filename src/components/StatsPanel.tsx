import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Plane, 
  TrendingUp, 
  AlertTriangle, 
  Fuel,
  Clock,
  Loader2
} from 'lucide-react';
import { useStatsData } from '@/hooks/useApi';

interface StatsPanelProps {
  period: 'baseline' | 'during';
}

const StatsPanel: React.FC<StatsPanelProps> = ({ period }) => {
  const { data: stats, loading, error } = useStatsData(period);

  if (loading) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <Card className="glass-panel w-fit">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading statistics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
      <Card className="glass-panel w-fit">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-neon-cyan text-lg">
            <BarChart3 className="h-5 w-5" />
            Statistics Overview
            <Badge variant={period === 'baseline' ? 'secondary' : 'destructive'}>
              {period === 'baseline' ? 'Baseline Period' : 'During Conflict'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-6">
            
            {/* Total Flights */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Plane className="h-4 w-4 text-neon-cyan" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.totalFlights.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Flights</div>
              {period === 'during' && (
                <div className="text-xs text-conflict-red mt-1">
                  -4,334 flights
                </div>
              )}
            </div>

            {/* Average Detour */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-neon-orange" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.avgDetour}
                <span className="text-sm text-muted-foreground ml-1">km</span>
              </div>
              <div className="text-xs text-muted-foreground">Avg Detour</div>
            </div>

            {/* Flight Delays */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-neon-purple" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.avgDelay}
                <span className="text-sm text-muted-foreground ml-1">min</span>
              </div>
              <div className="text-xs text-muted-foreground">Avg Delay</div>
            </div>

            {/* CO₂ Impact */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Fuel className="h-4 w-4 text-conflict-red" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.co2Impact.toLocaleString()}
                <span className="text-sm text-muted-foreground ml-1">t</span>
              </div>
              <div className="text-xs text-muted-foreground">Extra CO₂</div>
            </div>

            {/* Affected Routes */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <AlertTriangle className="h-4 w-4 text-neon-green" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {stats.affectedRoutes}
              </div>
              <div className="text-xs text-muted-foreground">Affected Routes</div>
            </div>

            {/* Top Routes */}
            {period === 'during' && stats.topAffectedRoutes && (
              <div className="col-span-1">
                <div className="text-xs text-muted-foreground mb-2 text-center">Most Affected</div>
                <div className="space-y-1">
                  {stats.topAffectedRoutes.slice(0, 3).map((route, index) => (
                    <div key={index} className="text-xs">
                      <div className="font-medium text-foreground">{route.route}</div>
                      <div className="text-neon-orange">+{route.detour}km</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPanel;