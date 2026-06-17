import { useState, useEffect } from 'react';
import AirfoilVisualizer from '../components/AirfoilVisualizer';
import { BarChartComparison } from '../components/GraphPanel';
import { fetchAirfoils, compareAirfoils } from '../api/airfoilApi';
import { getCustomAirfoils } from '../utils/airfoilStorage';

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      {children}
      <span className="ml-1 cursor-help text-gray-500 hover:text-blue-400 text-sm"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}>ⓘ</span>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-white text-xs rounded-lg shadow-lg z-50"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: 'var(--bg-card)' }} />
        </div>
      )}
    </span>
  );
}

export default function Compare() {
  const [airfoils, setAirfoils] = useState([]);
  const [customAirfoils, setCustomAirfoils] = useState([]);
  const [airfoilA, setAirfoilA] = useState('NACA 2412');
  const [airfoilB, setAirfoilB] = useState('NACA 0012');
  const [useCustomA, setUseCustomA] = useState(false);
  const [useCustomB, setUseCustomB] = useState(false);
  const [params, setParams] = useState({ angleOfAttack: 5, velocity: 30, airDensity: 1.225, chordLength: 1 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAirfoils().then(d => setAirfoils(d.airfoils)).catch(console.error);
    setCustomAirfoils(getCustomAirfoils());
  }, []);

  useEffect(() => {
    if (airfoilA && airfoilB) {
      const timer = setTimeout(runCompare, 500);
      return () => clearTimeout(timer);
    }
  }, [airfoilA, airfoilB, params, useCustomA, useCustomB]);

  async function runCompare() {
    setLoading(true);
    try {
      const data = await compareAirfoils({
        airfoilA, airfoilB, ...params,
        customAirfoils: useCustomA || useCustomB ? customAirfoils.map(a => ({ name: a.name, geometry: a.geometry })) : []
      });
      setResult(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  const getSource = (useCustom) => useCustom ? customAirfoils : airfoils;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-3xl font-bold mb-2 heading-gradient">Compare Airfoils</h1>
      <p className="text-gray-400 mb-8">Compare aerodynamic performance between two airfoils side by side</p>

      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--accent-blue)' }}>Airfoil A</h3>
          <label className="flex items-center gap-2 text-xs mb-2">
            <input type="checkbox" checked={useCustomA} onChange={e => setUseCustomA(e.target.checked)} />
            Use custom
          </label>
          <select value={airfoilA} onChange={e => setAirfoilA(e.target.value)} className="text-sm">
            <option value="">Select...</option>
            {(useCustomA ? customAirfoils : airfoils).map(a => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="card">
          <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--accent-blue)' }}>Airfoil B</h3>
          <label className="flex items-center gap-2 text-xs mb-2">
            <input type="checkbox" checked={useCustomB} onChange={e => setUseCustomB(e.target.checked)} />
            Use custom
          </label>
          <select value={airfoilB} onChange={e => setAirfoilB(e.target.value)} className="text-sm">
            <option value="">Select...</option>
            {(useCustomB ? customAirfoils : airfoils).map(a => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--accent-blue)' }}>Parameters</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>AoA (°)</label>
              <input type="number" value={params.angleOfAttack}
                onChange={e => setParams(p => ({ ...p, angleOfAttack: e.target.value }))}
                min={-5} max={20} step={0.5} />
            </div>
            <div>
              <Tooltip text="Speed of the airfoil relative to the air. Lift and drag increase with V².">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Velocity (m/s)</label>
              </Tooltip>
              <input type="number" value={params.velocity}
                onChange={e => setParams(p => ({ ...p, velocity: e.target.value }))}
                min={5} max={100} />
            </div>
            <div>
              <Tooltip text="Distance from leading edge to trailing edge. Together with CL/CD, determines the aerodynamic force per meter of span.">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Chord (m)</label>
              </Tooltip>
              <input type="number" value={params.chordLength}
                onChange={e => setParams(p => ({ ...p, chordLength: e.target.value }))}
                min={0.1} max={2} step={0.1} />
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-4 animate-pulse" style={{ color: 'var(--accent-blue)' }}>Comparing...</div>}

      {result && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold mb-3" style={{ color: 'var(--accent-blue)' }}>{result.airfoilA.name}</h3>
              <AirfoilVisualizer
                coordinates={getSource(useCustomA).find(a => a.name === airfoilA)?.coordinates || []}
                angleOfAttack={parseFloat(params.angleOfAttack)}
                stallWarning={result.airfoilA.stallWarning}
                liftCoefficient={result.airfoilA.liftCoefficient}
                width={500} height={220}
              />
            </div>
            <div className="card">
              <h3 className="font-bold mb-3" style={{ color: 'var(--accent-blue)' }}>{result.airfoilB.name}</h3>
              <AirfoilVisualizer
                coordinates={getSource(useCustomB).find(a => a.name === airfoilB)?.coordinates || []}
                angleOfAttack={parseFloat(params.angleOfAttack)}
                stallWarning={result.airfoilB.stallWarning}
                liftCoefficient={result.airfoilB.liftCoefficient}
                width={500} height={220}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>Geometry Comparison</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>{result.airfoilA.name}</h4>
                  <div className="space-y-2 text-sm">
                    <p>Max Thickness: <strong>{result.airfoilA.geometry?.maxThickness ?? 'N/A'}</strong></p>
                    <p>Max Camber: <strong>{result.airfoilA.geometry?.maxCamber ?? 'N/A'}</strong></p>
                    <p>Type: <strong>{result.airfoilA.geometry?.type || result.airfoilA.geometry?.airfoilTypeEstimate || 'N/A'}</strong></p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>{result.airfoilB.name}</h4>
                  <div className="space-y-2 text-sm">
                    <p>Max Thickness: <strong>{result.airfoilB.geometry?.maxThickness ?? 'N/A'}</strong></p>
                    <p>Max Camber: <strong>{result.airfoilB.geometry?.maxCamber ?? 'N/A'}</strong></p>
                    <p>Type: <strong>{result.airfoilB.geometry?.type || result.airfoilB.geometry?.airfoilTypeEstimate || 'N/A'}</strong></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>
                <Tooltip text="Bar chart comparing key aerodynamic performance metrics between the two airfoils.">
                  <span>Performance Comparison</span>
                </Tooltip>
              </h3>
              <BarChartComparison
                dataA={result.airfoilA}
                dataB={result.airfoilB}
                labelA={result.airfoilA.name}
                labelB={result.airfoilB.name}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold mb-3" style={{ color: 'var(--accent-blue)' }}>Detailed Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <th className="text-left p-2">Metric</th>
                    <th className="text-center p-2">{result.airfoilA.name}</th>
                    <th className="text-center p-2">{result.airfoilB.name}</th>
                    <th className="text-center p-2">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Cl', key: 'liftCoefficient' },
                    { label: 'Cd', key: 'dragCoefficient' },
                    { label: 'Lift/m (N/m)', key: 'liftPerMeter' },
                    { label: 'Drag/m (N/m)', key: 'dragPerMeter' },
                    { label: 'L/D ratio', key: 'liftToDragRatio' },
                  ].map((item, i) => {
                    const vA = result.airfoilA[item.key];
                    const vB = result.airfoilB[item.key];
                    const diff = vA !== 0 ? (((vB - vA) / Math.abs(vA)) * 100).toFixed(1) : 'N/A';
                    return (
                      <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td className="p-2 font-medium">{item.label}</td>
                        <td className="text-center p-2">{vA?.toFixed(4)}</td>
                        <td className="text-center p-2">{vB?.toFixed(4)}</td>
                        <td className={`text-center p-2 ${diff !== 'N/A' && parseFloat(diff) > 0 ? 'text-green-600' : diff !== 'N/A' && parseFloat(diff) < 0 ? 'text-red-600' : ''}`}>
                          {diff !== 'N/A' ? `${diff > 0 ? '+' : ''}${diff}%` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p>Select two airfoils and parameters to compare</p>
        </div>
      )}
    </div>
  );
}
