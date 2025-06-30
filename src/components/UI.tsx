import React from 'react';
import { Activity, Target, Zap, Monitor } from 'lucide-react';

interface UIProps {
  metrics: {
    ballVelocity: number;
    activePrimitives: number;
    collisionCount: number;
    fps: number;
    primitiveDistribution: Record<string, number>;
  };
}

export const UI: React.FC<UIProps> = ({ metrics }) => {
  return (
    <div className="absolute top-4 left-4 z-10 space-y-4">
      {/* Main Metrics Panel */}
      <div className="bg-black bg-opacity-70 backdrop-blur-sm border border-cyan-500 rounded-lg p-4 text-white min-w-64">
        <h2 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Simulation Metrics
        </h2>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Ball Velocity:
            </span>
            <span className="text-cyan-400 font-mono">{metrics.ballVelocity} m/s</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300 flex items-center gap-1">
              <Target className="w-4 h-4" />
              Primitives:
            </span>
            <span className="text-green-400 font-mono">{metrics.activePrimitives}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Collisions:</span>
            <span className="text-orange-400 font-mono">{metrics.collisionCount}</span>
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
        <h3 className="text-md font-bold text-purple-400 mb-2">Primitive Distribution</h3>
        <div className="space-y-1 text-sm">
          {Object.entries(metrics.primitiveDistribution).map(([type, count]) => (
            <div key={type} className="flex justify-between items-center">
              <span className="text-gray-300 capitalize">{type}:</span>
              <span className="text-purple-300 font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-black bg-opacity-70 backdrop-blur-sm border border-gray-600 rounded-lg p-3 text-white max-w-64">
        <p className="text-xs text-gray-400">
          Watch the ball navigate through an infinite procedurally generated Rube Goldberg machine. 
          Each primitive reacts uniquely to collisions.
        </p>
      </div>
    </div>
  );
};