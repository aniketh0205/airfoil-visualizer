import { useEffect, useRef, useState } from 'react';

function rotatePoint(x, y, angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

export default function AirfoilVisualizer({ coordinates, angleOfAttack = 0, stallWarning = false, liftCoefficient, width = 700, height = 300 }) {
  const svgRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [frame, setFrame] = useState(0);

  const pad = 60;
  const vw = width;
  const vh = height;
  const cx = vw / 2;
  const cy = vh / 2;
  const sx = (vw - 2 * pad) * 0.85;
  const sy = Math.min((vh - 2 * pad) * 3, sx * 0.45);

  const aoa = Math.max(-30, Math.min(30, angleOfAttack));
  const radAoa = aoa * Math.PI / 180;
  const stalled = stallWarning;

  useEffect(() => {
    if (!coordinates || coordinates.length < 2) return;
    const interval = setInterval(() => setFrame(f => f + 1), 50);
    return () => clearInterval(interval);
  }, [coordinates]);

  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 14; i++) {
      const offset = ((frame * 4 + i * 26) % 360);
      newParticles.push({
        x: -0.55 + ((offset / 360) * 2),
        y: (Math.sin(i * 1.7 + frame * 0.3)) * 0.35,
        key: i
      });
    }
    setParticles(newParticles);
  }, [frame]);

  if (!coordinates || coordinates.length < 2) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed" style={{ width, height, backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select or upload an airfoil to visualize</p>
      </div>
    );
  }

  const drawPath = (pts, closed = true) => {
    if (pts.length < 2) return '';
    const rotated = pts.map(p => rotatePoint(p.x * sx, p.y * sy, aoa));
    let d = `M ${cx + rotated[0].x} ${cy - rotated[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${cx + rotated[i].x} ${cy - rotated[i].y}`;
    }
    if (closed) d += ' Z';
    return d;
  };

  const quarterX = rotatePoint(0.25 * sx, 0, aoa).x;
  const quarterY = rotatePoint(0.25 * sx, 0, aoa).y;
  const qx = cx + quarterX;
  const qy = cy - quarterY;

  const teX = cx + rotatePoint(0.5 * sx, 0, aoa).x;
  const teY = cy - rotatePoint(0.5 * sx, 0, aoa).y;

  const arrowLen = Math.min(sy * 0.55, vh * 0.35);
  const liftSign = liftCoefficient !== undefined && liftCoefficient < 0 ? 1 : -1;
  const dragSign = 1;
  const negLift = liftCoefficient !== undefined && liftCoefficient < 0;

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ width, height, backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
      <svg ref={svgRef} width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`}>
        <defs>
          <linearGradient id="gradUpper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="gradLower" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.35" />
          </linearGradient>
          <filter id="foilShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.4" />
          </filter>
          <marker id="arrGreen" markerWidth="12" markerHeight="9" refX="12" refY="4.5" orient="auto">
            <polygon points="0 0, 12 4.5, 0 9" fill="#22c55e" />
          </marker>
          <marker id="arrOrange" markerWidth="12" markerHeight="9" refX="12" refY="4.5" orient="auto">
            <polygon points="0 0, 12 4.5, 0 9" fill="#f97316" />
          </marker>
          <marker id="arrBlue" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
          </marker>
        </defs>

        {/* Chord line (rotates with airfoil) */}
        <line x1={cx - 0.52 * sx} y1={cy} x2={cx + 0.52 * sx} y2={cy}
          stroke="#475569" strokeWidth="1" strokeDasharray="5 4"
          transform={`rotate(${aoa}, ${cx}, ${cy})`} />

        {/* AoA arc indicator */}
        {aoa !== 0 && (
          <g>
            <path d={`M ${pad + 5} ${cy} A ${cx - pad - 5} ${cx - pad - 5} 0 0 ${aoa > 0 ? 0 : 1} ${aoa > 0 ? 0 : 1} ${cx - pad - 5 - (cx - pad - 5) * Math.cos(radAoa)} ${cy - (cx - pad - 5) * Math.sin(Math.abs(radAoa))}`}
              fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" />
            <text x={pad + 18} y={cy - 10 - Math.min(Math.abs(aoa) * 2.5, 40)}
              fill="#60a5fa" fontSize="11" fontWeight="600">α = {aoa}°</text>
          </g>
        )}

        {/* Relative wind arrow (always horizontal from left) */}
        <line x1={pad - 10} y1={cy} x2={pad + 25} y2={cy}
          stroke="#60a5fa" strokeWidth="2" markerEnd="url(#arrBlue)" />
        <text x={pad - 5} y={cy - 8} fill="#60a5fa" fontSize="10" textAnchor="end" fontWeight="500">Wind</text>

        {/* Flow particles */}
        {particles.map(p => (
          <line key={p.key}
            x1={cx + p.x * sx - 7} y1={cy + p.y * sy}
            x2={cx + p.x * sx + 7} y2={cy + p.y * sy}
            stroke={stalled ? '#ef4444' : '#60a5fa'}
            strokeWidth="1.5" opacity={0.5} />
        ))}

        {/* Airfoil shape */}
        <path d={drawPath(coordinates)}
          fill={negLift ? 'url(#gradLower)' : 'url(#gradUpper)'}
          stroke="#93c5fd"
          strokeWidth="2"
          filter="url(#foilShadow)" />

        {/* Pressure labels — swap when lift is negative */}
        <text x={cx + 20} y={cy - sy * 0.3 - 12}
          fill={negLift ? '#ef4444' : '#60a5fa'} fontSize="11" fontWeight="600">
          {negLift ? 'High Pressure' : 'Low Pressure'}
        </text>
        <text x={cx + 20} y={cy + sy * 0.3 + 22}
          fill={negLift ? '#60a5fa' : '#ef4444'} fontSize="11" fontWeight="600">
          {negLift ? 'Low Pressure' : 'High Pressure'}
        </text>

        {/* Lift & Drag arrows */}
        {!stalled && (
          <>
            {/* Lift arrow — perpendicular to relative wind, direction follows AoA sign */}
            <line x1={qx} y1={qy}
              x2={qx} y2={qy + liftSign * arrowLen}
              stroke="#22c55e" strokeWidth="3" markerEnd="url(#arrGreen)" />
            <text x={qx + 10} y={qy + liftSign * (arrowLen + 16)}
              fill="#22c55e" fontSize="13" fontWeight="bold"
              textAnchor="start" dominantBaseline="middle">
              {liftSign === -1 ? 'Lift ↑' : 'Lift ↓'}
            </text>

            {/* Drag arrow — parallel to relative wind, always rearward */}
            <line x1={qx} y1={qy}
              x2={qx + dragSign * arrowLen * 0.8} y2={qy}
              stroke="#f97316" strokeWidth="3" markerEnd="url(#arrOrange)" />
            <text x={qx + dragSign * (arrowLen * 0.8 + 16)} y={qy - 10}
              fill="#f97316" fontSize="13" fontWeight="bold"
              textAnchor="start">
              Drag →
            </text>
          </>
        )}

        {/* Stall overlay */}
        {stalled && (
          <>
            <rect x={cx - 85} y={12} width={170} height={32}
              rx="6" fill="#ef4444" opacity="0.9" />
            <text x={cx} y={33} textAnchor="middle"
              fill="white" fontSize="14" fontWeight="bold">
              ⚠ STALL — Flow Separated
            </text>
            {[1, 2, 3, 4].map(i => (
              <path key={i}
                d={`M ${teX + i * 18} ${teY - 15}
                    Q ${teX + i * 18 + 10} ${teY + 8},
                      ${teX + i * 18 + 20} ${teY - 5}`}
                fill="none" stroke="#ef4444" strokeWidth="1.5"
                strokeDasharray="3 3" opacity={0.8} />
            ))}
          </>
        )}

        {/* AoA label bottom-right */}
        <text x={vw - 12} y={vh - 12} textAnchor="end"
          fill="#64748b" fontSize="11" fontFamily="monospace">
          AoA: {aoa}°
        </text>
      </svg>
    </div>
  );
}
