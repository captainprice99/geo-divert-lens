import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  Calendar, 
  Shield, 
  Plane, 
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ControlPanelProps {
  period: 'baseline' | 'during';
  onPeriodChange: (period: 'baseline' | 'during') => void;
  heatmapOpacity: number;
  onHeatmapOpacityChange: (value: number) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  period,
  onPeriodChange,
  heatmapOpacity,
  onHeatmapOpacityChange,
  isCollapsed,
  onToggleCollapse
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Start animation between periods
      const interval = setInterval(() => {
        onPeriodChange(period === 'baseline' ? 'during' : 'baseline');
      }, 2000);
      
      // Stop after a few cycles
      setTimeout(() => {
        clearInterval(interval);
        setIsPlaying(false);
      }, 8000);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={onToggleCollapse}
        className="fixed top-4 left-4 z-20 glass-panel hover:neon-glow"
        size="sm"
        variant="outline"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Control Panel */}
      <div className={`fixed top-4 left-16 z-10 transition-transform duration-300 ${
        isCollapsed ? '-translate-x-80' : 'translate-x-0'
      }`}>
        <Card className="glass-panel w-80">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-neon-cyan">
              <Activity className="h-5 w-5" />
              Flight Route Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Period Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time Period
              </Label>
              <RadioGroup 
                value={period} 
                onValueChange={(value) => onPeriodChange(value as 'baseline' | 'during')}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="baseline" id="baseline" />
                  <Label htmlFor="baseline" className="text-sm">Baseline</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="during" id="during" />
                  <Label htmlFor="during" className="text-sm">During Conflict</Label>
                </div>
              </RadioGroup>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <Badge variant={period === 'baseline' ? 'default' : 'secondary'} className="text-xs">
                  Jan 2021
                </Badge>
                <Badge variant={period === 'during' ? 'default' : 'secondary'} className="text-xs">
                  Mar 2022
                </Badge>
              </div>
            </div>

            {/* Animation Control */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Animation</Label>
              <Button
                onClick={handlePlayPause}
                variant="outline"
                className="w-full"
                disabled={isPlaying}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Compare Periods
                  </>
                )}
              </Button>
            </div>

            {/* Heatmap Opacity */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Heatmap Intensity
              </Label>
              <Slider
                value={[heatmapOpacity]}
                onValueChange={(value) => onHeatmapOpacityChange(value[0])}
                max={100}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                Opacity: {heatmapOpacity}%
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Heat Legend
              </Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Low Traffic</span>
                  <div className="w-4 h-4 rounded-full bg-neon-green/30"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Moderate Traffic</span>
                  <div className="w-4 h-4 rounded-full bg-neon-orange/50"></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>High Traffic</span>
                  <div className="w-4 h-4 rounded-full bg-conflict-red/70"></div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ControlPanel;