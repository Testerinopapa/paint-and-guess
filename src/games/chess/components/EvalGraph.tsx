import { useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PerMove {
  ply: number;
  cpl: number;
  tag: string;
  phase: "opening" | "middlegame" | "endgame";
}

interface EvalGraphProps {
  perMove: PerMove[];
  selectedPly?: number;
  onPlyClick?: (ply: number) => void;
}

const TAG_COLORS: Record<string, string> = {
  Best: "#10b981", // green
  Excellent: "#3b82f6", // blue
  Good: "#06b6d4", // cyan
  Inaccuracy: "#eab308", // yellow
  Mistake: "#f97316", // orange
  Blunder: "#ef4444", // red
};

export function EvalGraph({ perMove, selectedPly, onPlyClick }: EvalGraphProps) {
  // Calculate evaluations from CPL (simplified - in real implementation, we'd have actual evals)
  // For now, we'll simulate by assuming starting from 0 and applying CPL changes
  const evals = useMemo(() => {
    const result: number[] = [0]; // Start at 0 (equal position)
    let currentEval = 0;
    
    for (let i = 0; i < perMove.length; i++) {
      const move = perMove[i];
      const isWhite = move.ply % 2 === 1;
      
      // Apply CPL: if white moves, subtract CPL (white loses advantage)
      // If black moves, add CPL (black loses advantage, so white gains)
      if (isWhite) {
        currentEval -= move.cpl;
      } else {
        currentEval += move.cpl;
      }
      
      result.push(currentEval);
    }
    
    return result;
  }, [perMove]);

  const cpToY = useCallback((cp: number, height: number) => {
    const maxAbs = 1000;
    const clamped = Math.max(-maxAbs, Math.min(maxAbs, cp));
    return height / 2 - (clamped / maxAbs) * (height / 2 - 20);
  }, []);

  const width = 800;
  const height = 200;
  const padding = 20;

  const points = useMemo(() => {
    if (evals.length === 0) return "";
    const step = evals.length > 1 ? (width - padding * 2) / (evals.length - 1) : 0;
    return evals
      .map((cp, i) => {
        const x = padding + i * step;
        const y = cpToY(cp, height);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [evals, width, height, padding, cpToY]);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!onPlyClick) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const step = evals.length > 1 ? (width - padding * 2) / (evals.length - 1) : 0;
      const ply = Math.round((x - padding) / step);
      
      if (ply >= 0 && ply < evals.length) {
        onPlyClick(ply);
      }
    },
    [onPlyClick, evals.length, width, padding]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Graph</CardTitle>
        <CardDescription>
          Position evaluation throughout the game (from White's perspective)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full border rounded bg-white cursor-pointer"
            onClick={handleClick}
          >
            {/* Center line (equal position) */}
            <line
              x1={padding}
              y1={height / 2}
              x2={width - padding}
              y2={height / 2}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            
            {/* Evaluation line */}
            <path
              d={points}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points with colors based on move tags */}
            {evals.map((cp, i) => {
              if (i === 0) return null; // Skip initial position
              const step = evals.length > 1 ? (width - padding * 2) / (evals.length - 1) : 0;
              const x = padding + i * step;
              const y = cpToY(cp, height);
              const move = perMove[i - 1];
              const color = TAG_COLORS[move?.tag] || "#6b7280";
              const isSelected = selectedPly === i;
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={isSelected ? 5 : 3}
                  fill={isSelected ? "#111" : color}
                  stroke={isSelected ? "#fff" : "none"}
                  strokeWidth={isSelected ? 2 : 0}
                  className="hover:r-4 transition-all"
                />
              );
            })}
            
            {/* Labels */}
            <text x={padding} y={15} fontSize="10" fill="#6b7280">
              +1000
            </text>
            <text x={padding} y={height - 5} fontSize="10" fill="#6b7280">
              -1000
            </text>
            <text x={width - padding - 30} y={height / 2 + 4} fontSize="10" fill="#6b7280">
              0
            </text>
          </svg>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Best</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Excellent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span>Good</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Inaccuracy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Mistake</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Blunder</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

