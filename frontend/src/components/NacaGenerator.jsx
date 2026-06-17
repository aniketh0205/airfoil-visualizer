import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateNACA, nacaName, describeNACA } from '../utils/nacaGenerator';

export default function NacaGenerator() {
  const navigate = useNavigate();
  const [camber, setCamber] = useState(2);
  const [position, setPosition] = useState(40);
  const [thickness, setThickness] = useState(12);

  const coordinates = useMemo(() => generateNACA(camber, position, thickness, 60), [camber, position, thickness]);
  const name = useMemo(() => nacaName(camber, position, thickness), [camber, position, thickness]);
  const desc = useMemo(() => describeNACA(camber, position, thickness), [camber, position, thickness]);

  const handleUseInSimulator = () => {
    const coordsStr = encodeURIComponent(JSON.stringify(coordinates));
    navigate(`/simulator?naca=${name}&coords=${coordsStr}`);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-bold text-xl mb-4" style={{ color: 'var(--accent-blue)' }}>NACA 4-Digit Generator</h2>

        <div className="text-center mb-6">
          <div className="text-4xl font-mono font-bold tracking-widest animate-fadeIn" style={{ color: 'var(--accent-blue)' }}>
            {name}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{desc}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label style={{ color: 'var(--text-secondary)' }}>Camber (%)</label>
                <span className="font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{camber}%</span>
              </div>
              <input type="range" min={0} max={9} step={0.5} value={camber}
                onChange={e => setCamber(parseFloat(e.target.value))}
                className="slider-input" />
              <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <span>0% (Symmetric)</span>
                <span>9% (Highly cambered)</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                <strong>NACA digit:</strong> {Math.round(camber)} — Controls lift at low AoA
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label style={{ color: 'var(--text-secondary)' }}>Position of max camber (%)</label>
                <span className="font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{position}%</span>
              </div>
              <input type="range" min={10} max={60} step={5} value={position}
                onChange={e => setPosition(parseFloat(e.target.value))}
                className="slider-input" />
              <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <span>10% (Forward)</span>
                <span>60% (Aft)</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                <strong>NACA digit:</strong> {Math.round(position / 10)} — Shifts the camber peak location
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <label style={{ color: 'var(--text-secondary)' }}>Max thickness (%)</label>
                <span className="font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{thickness}%</span>
              </div>
              <input type="range" min={6} max={30} step={1} value={thickness}
                onChange={e => setThickness(parseFloat(e.target.value))}
                className="slider-input" />
              <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <span>6% (Thin)</span>
                <span>30% (Very thick)</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                <strong>NACA digits:</strong> {String(thickness).padStart(2, '0')} — Affects drag and structural strength
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <svg width="100%" height="200" viewBox="0 0 400 200" className="rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <defs>
                <filter id="naca-shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
                </filter>
              </defs>

              <line x1="20" y1="100" x2="380" y2="100" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

              {camber > 0 && (
                (() => {
                  const m = camber / 100;
                  const p = position / 100;
                  const pts = [];
                  for (let i = 0; i <= 60; i++) {
                    const x = i / 60;
                    let yc = 0;
                    if (x < p) yc = (m / (p * p)) * (2 * p * x - x * x);
                    else yc = (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * x - x * x);
                    pts.push(`${i === 0 ? 'M' : 'L'} ${20 + x * 360} ${100 - yc * 260}`);
                  }
                  return <path d={pts.join(' ')} fill="none" stroke="#2e7d32" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />;
                })()
              )}

              <path d={coordinates.map((c, i) => `${i === 0 ? 'M' : 'L'} ${20 + c.x * 360} ${100 - c.y * 260}`).join(' ') + ' Z'}
                fill="rgba(66,165,245,0.15)" stroke="#1a237e" strokeWidth={2} filter="url(#naca-shadow)" />

              <text x="10" y="15" fill="#94a3b8" fontSize="10">{name}</text>
              <text x="10" y="28" fill="#94a3b8" fontSize="9">Chord: {chordPreview(camber, position, thickness)}</text>
            </svg>
            <button onClick={handleUseInSimulator} className="btn-primary mt-4 text-sm">
              Use in Simulator →
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <h3 className="font-bold mb-2" style={{ color: 'var(--accent-blue)' }}>How NACA 4-digit naming works</h3>
        <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p><strong>NACA MPXX</strong></p>
          <p><strong>M</strong> (1st digit) = <strong>Camber</strong> (% of chord) — {Math.round(camber)}% in current airfoil</p>
          <p><strong>P</strong> (2nd digit) = <strong>Position</strong> of max camber (tenths of chord) — {Math.round(position / 10)} in current = {position}% of chord</p>
          <p><strong>XX</strong> (3rd & 4th digits) = <strong>Max thickness</strong> (% of chord) — {String(thickness).padStart(2, '0')} in current = {thickness}%</p>
        </div>
        <div className="mt-3 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
          <strong>Examples:</strong><br />
          NACA 0012 → 0% camber (symmetric), 12% thickness<br />
          NACA 2412 → 2% camber at 40% chord, 12% thickness<br />
          NACA 4412 → 4% camber at 40% chord, 12% thickness
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold mb-3" style={{ color: 'var(--accent-blue)' }}>Other Airfoil Naming Systems</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Clark Y</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Named after designer Virginius Clark. Flat-bottom design, no numerical code. "Y" denotes the specific variant.</p>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Selig S1223</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>S = Selig series, 1 = low Reynolds number class, 223 = design number. High-lift, high-drag airfoil.</p>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Eppler E205</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>E = Eppler series (Richard Eppler), 205 = design number. Laminar flow airfoil for sailplanes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function chordPreview(camber, position, thickness) {
  if (camber === 0) return `Symmetric, ${thickness}% thick`;
  return `${camber}% camber @ ${position}% chord, ${thickness}% thick`;
}
