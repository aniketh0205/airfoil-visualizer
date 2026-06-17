import { useEffect, useState } from 'react';

const parts = [
  { key: 'le', label: 'Leading Edge', color: '#ef4444', x: 0.05, y: 0.5 },
  { key: 'te', label: 'Trailing Edge', color: '#ef4444', x: 0.95, y: 0.5 },
  { key: 'chord', label: 'Chord Line', color: '#60a5fa', x: 0.5, y: 0.48 },
  { key: 'camber', label: 'Camber Line', color: '#4ade80', x: 0.5, y: 0.38 },
  { key: 'upper', label: 'Upper Surface', color: '#60a5fa', x: 0.5, y: 0.12 },
  { key: 'lower', label: 'Lower Surface', color: '#f87171', x: 0.5, y: 0.75 },
  { key: 'thick', label: 'Max Thickness', color: '#fbbf24', x: 0.35, y: 0.62 },
];

function naca4415Coords() {
  const pts = [];
  const m = 0.04, p = 0.4, t = 0.15;
  for (let i = 0; i <= 80; i++) {
    const x = i / 80;
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
    let yc, dyc;
    if (x < p) {
      yc = (m / (p * p)) * (2 * p * x - x * x);
      dyc = (2 * m / (p * p)) * (p - x);
    } else {
      yc = (m / ((1 - p) * (1 - p))) * (1 - 2 * p + 2 * p * x - x * x);
      dyc = (2 * m / ((1 - p) * (1 - p))) * (p - x);
    }
    const theta = Math.atan(dyc);
    pts.push({ x, yu: yc + yt * Math.cos(theta), yl: yc - yt * Math.cos(theta) });
  }
  return pts;
}

export default function AirfoilAnatomy({ width = 800, height = 340 }) {
  const [activePart, setActivePart] = useState(null);
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCycleIndex(i => (i + 1) % parts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const padding = 60;
  const sx = (width - 2 * padding) * 0.92;
  const sy = (height - 2 * padding) * 0.42;
  const cx = width / 2;
  const cy = height / 2;
  const coords = naca4415Coords();

  const upperPath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx + (p.x - 0.5) * sx} ${cy - p.yu * sy}`).join(' ');
  const lowerPath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx + (p.x - 0.5) * sx} ${cy - p.yl * sy}`).join(' ');

  const isActive = (key) => activePart === key || parts[cycleIndex].key === key;

  const leX = cx - 0.5 * sx;
  const teX = cx + 0.5 * sx;

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <marker id="arrOrange" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Chord line */}
        <line x1={leX} y1={cy} x2={teX} y2={cy}
          stroke={isActive('chord') ? '#60a5fa' : '#475569'}
          strokeWidth={isActive('chord') ? 3 : 2}
          strokeDasharray={isActive('chord') ? 'none' : '6 3'}
          style={isActive('chord') ? { filter: 'url(#glow)' } : {}} />

        {isActive('chord') && (
          <>
            <text x={cx} y={cy - 12} textAnchor="middle" fill="#60a5fa" fontSize="12" fontWeight="bold">
              Chord Line
            </text>
            <text x={cx} y={cy + 24} textAnchor="middle" fill="#94a3b8" fontSize="10">
              Distance from LE to TE
            </text>
          </>
        )}

        {/* Camber line */}
        {isActive('camber') && coords.length > 0 && (
          <path d={coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx + (p.x - 0.5) * sx} ${cy - ((p.yu + p.yl) / 2) * sy}`).join(' ')}
            fill="none" stroke="#4ade80" strokeWidth={2.5} strokeDasharray="5 3" opacity={0.9}
            style={{ filter: 'url(#glow)' }} />
        )}

        {/* Upper surface */}
        {isActive('upper') && (
          <path d={upperPath} fill="rgba(96,165,250,0.2)" stroke="#60a5fa" strokeWidth={3} />
        )}
        {!isActive('upper') && (
          <path d={upperPath} fill="rgba(96,165,250,0.06)" stroke="#3b82f6" strokeWidth={1.5} opacity={0.5} />
        )}

        {/* Lower surface */}
        {isActive('lower') && (
          <path d={lowerPath} fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth={3} />
        )}
        {!isActive('lower') && (
          <path d={lowerPath} fill="rgba(248,113,113,0.05)" stroke="#ef4444" strokeWidth={1.5} opacity={0.5} />
        )}

        {/* Full airfoil outline (always visible beneath) */}
        {!isActive('upper') && !isActive('lower') && !isActive('le') && !isActive('te') && (
          <path d={upperPath + ' Z ' + lowerPath + ' Z'}
            fill="rgba(96,165,250,0.05)" stroke="#64748b" strokeWidth={1} />
        )}

        {/* Leading Edge */}
        {isActive('le') && (
          <g>
            <circle cx={leX} cy={cy} r={12} fill="none" stroke="#ef4444" strokeWidth={2.5}
              style={{ filter: 'url(#glow)' }}>
              <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <line x1={leX} y1={cy + 16} x2={leX} y2={cy + 50} stroke="#ef4444" strokeWidth={2}
              strokeDasharray="4 3" />
            <text x={leX} y={cy + 64} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              Leading Edge
            </text>
            <text x={leX} y={cy + 78} textAnchor="middle" fill="#94a3b8" fontSize="10">
              Frontmost point of the airfoil
            </text>
          </g>
        )}

        {/* Trailing Edge */}
        {isActive('te') && (
          <g>
            <circle cx={teX} cy={cy} r={12} fill="none" stroke="#ef4444" strokeWidth={2.5}
              style={{ filter: 'url(#glow)' }}>
              <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <line x1={teX} y1={cy + 16} x2={teX} y2={cy + 50} stroke="#ef4444" strokeWidth={2}
              strokeDasharray="4 3" />
            <text x={teX} y={cy + 64} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">
              Trailing Edge
            </text>
            <text x={teX} y={cy + 78} textAnchor="middle" fill="#94a3b8" fontSize="10">
              Rearmost point of the airfoil
            </text>
          </g>
        )}

        {/* Max Thickness */}
        {isActive('thick') && (
          <g>
            <line x1={cx - 0.15 * sx} y1={cy - 0.12 * sy} x2={cx - 0.15 * sx} y2={cy + 0.12 * sy}
              stroke="#fbbf24" strokeWidth={3} markerStart="url(#arrOrange)" markerEnd="url(#arrOrange)"
              style={{ filter: 'url(#glow)' }} />
            <text x={cx - 0.15 * sx - 50} y={cy} textAnchor="end" fill="#fbbf24" fontSize="12" fontWeight="bold">
              Max Thickness
            </text>
            <text x={cx - 0.15 * sx - 50} y={cy + 16} textAnchor="end" fill="#94a3b8" fontSize="11">
              15% of chord (NACA 4415)
            </text>
          </g>
        )}
      </svg>

      <div className="flex flex-wrap justify-center gap-2 px-4 pb-4">
        {parts.map((p, i) => (
          <button
            key={p.key}
            onMouseEnter={() => setActivePart(p.key)}
            onMouseLeave={() => setActivePart(null)}
            onClick={() => setCycleIndex(i)}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
              parts[cycleIndex].key === p.key
                ? 'text-white shadow-md scale-105'
                : 'hover:border-blue-400'
            }`}
            style={parts[cycleIndex].key === p.key
              ? { backgroundColor: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }
              : { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

    </div>
  );
}
