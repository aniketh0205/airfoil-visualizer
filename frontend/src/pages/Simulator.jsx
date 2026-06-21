import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AirfoilVisualizer from '../components/AirfoilVisualizer';
import { AoACLGraph, AoACDGraph, PolarGraph, VelocityLiftGraph, VelocityDragGraph, LDRatioGraph } from '../components/GraphPanel';
import { fetchAirfoils, calculate, processCustomAirfoil } from '../api/airfoilApi';
import { getCustomAirfoils, saveCustomAirfoil } from '../utils/airfoilStorage';
import { generateNACA, nacaName } from '../utils/nacaGenerator';

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
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: 'var(--bg-card)' }} />
        </div>
      )}
    </span>
  );
}

export default function Simulator() {
  const [searchParams] = useSearchParams();
  const [airfoils, setAirfoils] = useState([]);
  const [customAirfoils, setCustomAirfoils] = useState([]);
  const [selectedAirfoil, setSelectedAirfoil] = useState('NACA 2412');
  const [useCustom, setUseCustom] = useState(false);
  const [params, setParams] = useState({
    angleOfAttack: 5,
    velocity: 30,
    airDensity: 1.225,
    chordLength: 1
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('results');
  const [wingSpan, setWingSpan] = useState(10);
  const resultsRef = useRef(null);

  function scrollToResults() {
    setActiveTab('results');
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  useEffect(() => {
    fetchAirfoils().then(d => setAirfoils(d.airfoils)).catch(console.error);
    setCustomAirfoils(getCustomAirfoils());
  }, []);

  useEffect(() => {
    const naca = searchParams.get('naca');
    const coordsStr = searchParams.get('coords');
    if (naca && coordsStr) {
      try {
        const coords = JSON.parse(decodeURIComponent(coordsStr));
        const name = naca;
        const airfoilData = {
          name,
          coordinates: coords,
          geometry: {
            maxThickness: parseInt(naca.slice(-2)) / 100 || 0.12,
            maxCamber: parseInt(naca[0]) || 0,
            airfoilTypeEstimate: parseInt(naca[0]) === 0 ? 'Symmetric airfoil' : 'Cambered airfoil',
            stallAngleEstimate: parseInt(naca[0]) > 3 ? 13 : 15
          }
        };
        saveCustomAirfoil(airfoilData);
        setCustomAirfoils(getCustomAirfoils());
        setSelectedAirfoil(name);
        setUseCustom(true);
      } catch (e) { console.error('Failed to parse NACA coords', e); }
    }
  }, [searchParams]);

  const currentAirfoilData = useCallback(() => {
    if (useCustom) {
      return customAirfoils.find(a => a.name === selectedAirfoil) || null;
    }
    return airfoils.find(a => a.name === selectedAirfoil) || null;
  }, [useCustom, selectedAirfoil, airfoils, customAirfoils]);

  useEffect(() => {
    if (!selectedAirfoil) return;
    const timer = setTimeout(() => runCalculation(), 300);
    return () => clearTimeout(timer);
  }, [selectedAirfoil, useCustom, params]);

  async function runCalculation() {
    if (!selectedAirfoil) return;
    setLoading(true);
    setError(null);
    try {
      const customAirfoil = useCustom ? customAirfoils.find(a => a.name === selectedAirfoil) : null;
      const data = await calculate({
        airfoil: selectedAirfoil,
        ...params,
        customAirfoil: customAirfoil ? { geometry: customAirfoil.geometry } : null
      });
      setResult(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const airfoilData = currentAirfoilData();
  const coordinates = useCustom
    ? (customAirfoils.find(a => a.name === selectedAirfoil)?.coordinates || null)
    : (airfoils.find(a => a.name === selectedAirfoil)?.coordinates || null);

  const totalLift = result ? result.liftPerMeter * wingSpan : 0;
  const totalDrag = result ? result.dragPerMeter * wingSpan : 0;

  function exportCSV() {
    if (!result) return;
    const rows = [
      ['Parameter', 'Value', 'Unit'],
      ['Airfoil', selectedAirfoil, ''],
      ['Angle of Attack', params.angleOfAttack, 'deg'],
      ['Velocity', params.velocity, 'm/s'],
      ['Air Density', params.airDensity, 'kg/m^3'],
      ['Chord Length', params.chordLength, 'm'],
      ['Reynolds Number', result.reynoldsNumber, ''],
      ['Lift Coefficient (Cl)', result.liftCoefficient, ''],
      ['Drag Coefficient (Cd)', result.dragCoefficient, ''],
      ['Lift per meter', result.liftPerMeter, 'N/m'],
      ['Drag per meter', result.dragPerMeter, 'N/m'],
      ['L/D Ratio', result.liftToDragRatio, ''],
      ['Status', result.stallWarning ? 'STALL' : 'Normal', ''],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedAirfoil.replace(/\s+/g, '_') + '_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const paramDefs = [
    { key: 'angleOfAttack', label: 'Angle of Attack', min: -5, max: 20, step: 0.5, unit: '°',
      tooltip: 'The angle between the chord line of the airfoil and the oncoming airflow. Increasing AoA increases lift up to the stall point.' },
    { key: 'velocity', label: 'Velocity', min: 5, max: 100, step: 1, unit: 'm/s',
      tooltip: 'Speed of the airfoil relative to the air. Lift and drag increase with the square of velocity (V²).' },
    { key: 'airDensity', label: 'Air Density', min: 0.5, max: 2, step: 0.01, unit: 'kg/m³',
      tooltip: 'Density of the air. Standard sea-level value is 1.225 kg/m³. Decreases with altitude.' },
    { key: 'chordLength', label: 'Chord Length', min: 0.1, max: 2, step: 0.1, unit: 'm',
      tooltip: 'Distance from leading edge to trailing edge. Used with CL/CD to compute forces per meter of wing span.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
      <h1 className="text-3xl font-bold mb-2 heading-gradient">Aerodynamic Simulator</h1>
      <p className="text-gray-400 mb-8">Adjust parameters to see how lift and drag change in real time</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>Airfoil Selection</h2>
            <div className="mb-3">
              <label className="flex items-center gap-2 text-sm mb-2">
                <input type="checkbox" checked={useCustom} onChange={e => { setUseCustom(e.target.checked); setSelectedAirfoil(''); }} />
                Use custom airfoil
              </label>
            </div>
            <select value={selectedAirfoil} onChange={e => setSelectedAirfoil(e.target.value)} className="mb-4">
              <option value="">Select an airfoil...</option>
              {(useCustom ? customAirfoils : airfoils).map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
            {airfoilData && (
              <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                <p>Type: <strong>{airfoilData.type || airfoilData.geometry?.airfoilTypeEstimate || 'N/A'}</strong></p>
                <p>Max Thickness: <strong>{airfoilData.maxThickness ?? airfoilData.geometry?.maxThickness ?? 'N/A'}</strong></p>
                <p>Max Camber: <strong>{airfoilData.maxCamber ?? airfoilData.geometry?.maxCamber ?? 'N/A'}</strong></p>
                {airfoilData.stallAngle && <p>Stall Angle: <strong>{airfoilData.stallAngle}°</strong></p>}
                {airfoilData.geometry?.stallAngleEstimate && <p>Stall Angle (est.): <strong>{airfoilData.geometry.stallAngleEstimate}°</strong></p>}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>Parameters</h2>
            {paramDefs.map(p => (
              <div key={p.key} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <Tooltip text={p.tooltip}>
                    <label className="text-gray-300">{p.label}</label>
                  </Tooltip>
                  <span className="font-mono font-semibold" style={{ color: 'var(--accent-blue)' }}>{params[p.key]}{p.unit}</span>
                </div>
                <div className="relative">
                  <input type="range" min={p.min} max={p.max} step={p.step}
                    value={params[p.key]}
                    onChange={e => updateParam(p.key, e.target.value)}
                    className="slider-input"
                    style={{
                      background: p.key === 'angleOfAttack'
                        ? `linear-gradient(to right, #1a237e ${((params[p.key] - p.min) / (p.max - p.min)) * 100}%, #ef5350 ${((params[p.key] - p.min) / (p.max - p.min)) * 100}%)`
                        : undefined
                    }} />
                </div>
                <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <span>{p.min}</span>
                  <span>{p.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>Airfoil Visualization</h2>
            <div className="flex justify-center">
              <AirfoilVisualizer
                coordinates={coordinates}
                angleOfAttack={params.angleOfAttack}
                stallWarning={result?.stallWarning || false}
                liftCoefficient={result?.liftCoefficient}
                width={700} height={300}
              />
            </div>
          </div>

          {result && (
            <>
              <div className="card animate-slideUp" ref={resultsRef}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold" style={{ color: 'var(--accent-blue)' }}>Results <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(per meter of wing span)</span></h2>
                  <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.25)' }}
                    onMouseEnter={e => e.target.style.backgroundColor = 'rgba(59,130,246,0.25)'}
                    onMouseLeave={e => e.target.style.backgroundColor = 'rgba(59,130,246,0.15)'}>
                    Export CSV
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Lift coefficient (Cl)', value: result.liftCoefficient, color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.1)',
                      tooltip: 'Dimensionless number relating lift to air density, velocity, and chord. Higher CL = more lift at same speed.' },
                    { label: 'Drag coefficient (Cd)', value: result.dragCoefficient, color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)',
                      tooltip: 'Dimensionless number quantifying aerodynamic drag resistance.' },
                    { label: 'Lift per meter', value: `${result.liftPerMeter} N/m`, color: 'var(--accent-green)', bg: 'rgba(34,197,94,0.1)',
                      tooltip: 'Lift force generated per meter of wing span.' },
                    { label: 'Drag per meter', value: `${result.dragPerMeter} N/m`, color: 'var(--accent-orange)', bg: 'rgba(249,115,22,0.1)',
                      tooltip: 'Drag force generated per meter of wing span.' },
                    { label: 'L/D ratio', value: result.liftToDragRatio, color: 'var(--accent-purple)', bg: 'rgba(168,85,247,0.1)',
                      tooltip: 'Lift-to-Drag ratio. Higher = more efficient aerodynamics.' },
                    { label: 'Reynolds No.', value: result.reynoldsNumber.toLocaleString(), color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.1)',
                      tooltip: 'Ratio of inertial to viscous forces. Determines flow regime — higher Re = thinner boundary layer, lower drag.' },
                    { label: 'Status', value: result.stallWarning ? '⚠ STALL' : '✅ Normal',
                      color: result.stallWarning ? 'var(--accent-red)' : 'var(--accent-green)',
                      bg: result.stallWarning ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                      tooltip: result.stallWarning ? 'Stall condition: Angle of attack exceeds the stall angle. Lift decreases and drag increases rapidly as airflow separates from the upper surface.' : 'Normal flight condition: airflow is attached to the airfoil surface. Lift and drag behave as expected.' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg p-4 text-center relative group" style={{ backgroundColor: item.bg }}>
                      <div className="text-xs mb-1 flex items-center justify-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        {item.label}
                        <span className="cursor-help text-xs" style={{ color: 'var(--text-muted)' }}>ⓘ</span>
                      </div>
                      <div className="text-lg font-bold animate-countUp" style={{ color: item.color }}>{item.value}</div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        {item.tooltip}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 rounded-lg" style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--accent-blue)' }}>✈️ Estimate total forces for a full wing</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-sm text-gray-400">Wing span:</label>
                    <input type="number" value={wingSpan} onChange={e => setWingSpan(parseFloat(e.target.value) || 0)}
                      min={1} max={50} className="w-20 text-center" />
                    <span className="text-sm text-gray-500">m</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent-green)' }}>
                      Total Lift: {totalLift.toFixed(2)} N
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--accent-orange)' }}>
                      Total Drag: {totalDrag.toFixed(2)} N
                    </span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Assuming the same airfoil across the full span (no wingtip effects).</p>
                </div>

                {result.stallWarning && (
                  <div className="mt-4 rounded-lg p-3 text-sm animate-slideUp" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>
                    ⚠ <strong>Stall Warning:</strong> Angle of attack exceeds the stall angle. Lift decreases, drag increases rapidly.
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="font-bold mb-2" style={{ color: 'var(--accent-blue)' }}>What is happening?</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.explanation}</p>
                <p className="text-xs mt-2 italic" style={{ color: 'var(--text-muted)' }}>{result.note}</p>
              </div>

              <div className="mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex gap-4 overflow-x-auto">
                  {['results', 'clGraph', 'cdGraph', 'polarGraph', 'velGraphs', 'ldGraph'].map(t => (
                    <button key={t} onClick={t === 'results' ? scrollToResults : () => setActiveTab(t)}
                      className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === t ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
                      }`}
                      style={{ borderBottomColor: activeTab === t ? 'var(--accent-blue)' : 'transparent' }}>
                      {t === 'results' ? 'Results' : t === 'clGraph' ? 'Cl vs AoA' : t === 'cdGraph' ? 'Cd vs AoA' : t === 'polarGraph' ? 'Polar' : t === 'velGraphs' ? 'Velocity' : 'L/D vs AoA'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {activeTab === 'clGraph' && (
                  <AoACLGraph zeroLiftAngle={airfoilData?.zeroLiftAngle || -(airfoilData?.geometry?.maxCamber || 0) * 80 || 0}
                    stallAngle={airfoilData?.stallAngle || airfoilData?.geometry?.stallAngleEstimate || 15}
                    maxCamber={airfoilData?.maxCamber || airfoilData?.geometry?.maxCamber || 0}
                    velocity={params.velocity} chordLength={params.chordLength} airDensity={params.airDensity} />
                )}
                {activeTab === 'cdGraph' && (
                  <AoACDGraph maxThickness={airfoilData?.maxThickness || airfoilData?.geometry?.maxThickness || 0.12}
                    stallAngle={airfoilData?.stallAngle || airfoilData?.geometry?.stallAngleEstimate || 15}
                    velocity={params.velocity} chordLength={params.chordLength} airDensity={params.airDensity} />
                )}
                {activeTab === 'polarGraph' && (
                  <PolarGraph zeroLiftAngle={airfoilData?.zeroLiftAngle || -(airfoilData?.geometry?.maxCamber || 0) * 80 || 0}
                    stallAngle={airfoilData?.stallAngle || airfoilData?.geometry?.stallAngleEstimate || 15}
                    maxCamber={airfoilData?.maxCamber || airfoilData?.geometry?.maxCamber || 0}
                    maxThickness={airfoilData?.maxThickness || airfoilData?.geometry?.maxThickness || 0.12}
                    velocity={params.velocity} chordLength={params.chordLength} airDensity={params.airDensity} />
                )}
                {activeTab === 'velGraphs' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <VelocityLiftGraph velocity={params.velocity} lift={result.liftPerMeter} />
                    <VelocityDragGraph velocity={params.velocity} drag={result.dragPerMeter} />
                  </div>
                )}
                {activeTab === 'ldGraph' && (
                  <LDRatioGraph zeroLiftAngle={airfoilData?.zeroLiftAngle || 0}
                    stallAngle={airfoilData?.stallAngle || airfoilData?.geometry?.stallAngleEstimate || 15}
                    maxCamber={airfoilData?.maxCamber || airfoilData?.geometry?.maxCamber || 0}
                    maxThickness={airfoilData?.maxThickness || airfoilData?.geometry?.maxThickness || 0.12}
                    velocity={params.velocity} chordLength={params.chordLength} airDensity={params.airDensity} />
                )}
              </div>
            </>
          )}

          {!result && !loading && (
            <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
              {error ? <p style={{ color: 'var(--accent-red)' }}>{error}</p> : <p>Select an airfoil and adjust parameters</p>}
            </div>
          )}

          {loading && <div className="text-center py-4 animate-pulse" style={{ color: 'var(--accent-blue)' }}>Calculating...</div>}
        </div>
      </div>
    </div>
  );
}
