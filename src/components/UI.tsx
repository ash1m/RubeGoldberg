import React from 'react';
import { Target, Monitor, TrendingUp, Clock } from 'lucide-react';

interface UIProps {
  metrics: {
    ballVelocity: number;
    activePrimitives: number;
    collisionCount: number;
    fps: number;
    primitiveDistribution: Record<string, number>;
    kineticEnergy: number;
    potentialEnergy: number;
    totalEnergy: number;
  };
  timeScale: number;
  onTimeScaleChange: (scale: number) => void;
}

export const UI: React.FC<UIProps> = ({ metrics, timeScale, onTimeScaleChange }) => {
  // Convert time scale to percentage for display (1.0 = 100%, 0.1 = 10%)
  const timeScalePercentage = Math.round(timeScale * 100);
  
  // Sort primitive distribution alphabetically to prevent twitching
  const sortedPrimitiveDistribution = Object.entries(metrics.primitiveDistribution)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, number>);
  
  return (
    <div className="absolute top-4 left-4 z-10 space-y-4 font-monda">
      {/* Time Control Panel */}
      <div className="bg-black bg-opacity-70 backdrop-blur-sm border border-orange-500 rounded-lg p-4 text-white min-w-64">
        <h3 className="text-md font-bold text-orange-400 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time Control
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Speed:</span>
            <span className="text-orange-300 font-mono">{timeScalePercentage}%</span>
          </div>
          
          {/* Slow Motion Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Slow</span>
              <span>Normal</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={timeScale}
              onChange={(e) => onTimeScaleChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${timeScalePercentage}%, #374151 ${timeScalePercentage}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>10%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Quick preset buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onTimeScaleChange(0.1)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeScale === 0.1 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              10%
            </button>
            <button
              onClick={() => onTimeScaleChange(0.25)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeScale === 0.25 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              25%
            </button>
            <button
              onClick={() => onTimeScaleChange(0.5)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeScale === 0.5 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              50%
            </button>
            <button
              onClick={() => onTimeScaleChange(1.0)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeScale === 1.0 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Status Panel */}
      <div className="bg-black bg-opacity-70 backdrop-blur-sm border border-cyan-500 rounded-lg p-4 text-white min-w-64">
        <h2 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Simulation Status
        </h2>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Ball Velocity:</span>
            <span className="text-cyan-400 font-mono">{metrics.ballVelocity.toFixed(2)} m/s</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Active Primitives:</span>
            <span className="text-green-400 font-mono">{metrics.activePrimitives}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center gap-1">
              <Monitor className="w-4 h-4" />
              FPS:
            </span>
            <span className={`font-mono ${metrics.fps > 50 ? 'text-green-400' : metrics.fps > 30 ? 'text-yellow-400' : 'text-red-400'}`}>
              {metrics.fps}
            </span>
          </div>
        </div>
      </div>

      {/* Primitive Distribution Panel */}
      <div className="bg-black bg-opacity-70 backdrop-blur-sm border border-purple-500 rounded-lg p-4 text-white min-w-64">
        <h3 className="text-md font-bold text-purple-400 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Primitive Distribution
        </h3>
        <div className="space-y-1 text-sm">
          {Object.entries(sortedPrimitiveDistribution).map(([type, count]) => (
            <div key={type} className="flex justify-between items-center">
              <span className="text-gray-300 capitalize">{type}:</span>
              <span className="text-purple-300 font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Physics Info */}
      <div className="bg-black bg-opacity-70 backdrop-blur-sm border border-gray-600 rounded-lg p-3 text-white max-w-64">
        <p className="text-xs text-gray-400 leading-relaxed">
          <strong className="text-cyan-400">Physics-Based Motion:</strong> The ball experiences continuous gravitational force, 
          realistic collision responses with momentum conservation, and energy-based interactions. 
          Motion persists indefinitely through force accumulation and anti-stagnation systems.
        </p>
      </div>
    </div>
  );
};