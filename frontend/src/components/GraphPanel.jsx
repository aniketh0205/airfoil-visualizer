import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Shared formulas mirroring backend aerodynamics.js
function reynoldsNumber(velocity, chordLength, airDensity) {
  return (airDensity * velocity * chordLength) / 1.81e-5;
}

function graphAero(aoa, stallAngle, zeroLiftAngle, maxCamber, maxThickness, velocity, chordLength, airDensity) {
  const Re = reynoldsNumber(velocity, chordLength, airDensity);

  const stallReduction = 4.0 * Math.exp(-Re / 180000);
  const effectiveStall = Math.max(stallAngle - stallReduction, 6);
  const reLiftFactor = 1 - 0.30 * Math.exp(-Re / 70000) - 0.12 * Math.exp(-Re / 250000);
  const reDragFactor = 1 + 0.45 * Math.exp(-Re / 55000) + 0.18 * Math.exp(-Re / 200000);

  const clAlpha = 0.1;
  let CL = clAlpha * (aoa - zeroLiftAngle) * reLiftFactor;

  if (aoa > effectiveStall) {
    const excessAoa = aoa - effectiveStall;
    CL = clAlpha * (effectiveStall - zeroLiftAngle) * reLiftFactor * Math.exp(-0.1 * excessAoa);
  }

  const cf = Re > 0 ? 0.074 / Math.pow(Re, 0.2) : 0.004;
  const baseDrag = 0.002 + cf;
  const inducedDrag = 0.01 * CL * CL;
  const thicknessDrag = maxThickness * 0.05;
  let CD = (baseDrag + inducedDrag + thicknessDrag) * reDragFactor;

  if (aoa > 12) CD *= (1 + (aoa - 12) * 0.05);
  if (aoa > effectiveStall) CD *= (1 + (aoa - effectiveStall) * 0.15);

  return { CL: Math.round(CL * 10000) / 10000, CD: Math.round(CD * 10000) / 10000, Re };
}

export function AoACLGraph({ zeroLiftAngle = 0, stallAngle = 15, maxCamber = 0, velocity = 30, chordLength = 1, airDensity = 1.225 }) {
  const data = [];
  for (let aoa = -5; aoa <= 20; aoa++) {
    const { CL } = graphAero(aoa, stallAngle, zeroLiftAngle, maxCamber, 0.12, velocity, chordLength, airDensity);
    data.push({ aoa, CL });
  }
  const maxCl = Math.max(...data.map(d => d.CL));

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--accent-blue)' }}>Angle of Attack vs Lift Coefficient</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="aoa" label={{ value: 'AoA (°)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <YAxis domain={[Math.min(-0.5, ...data.map(d => d.CL)), Math.max(0.5, maxCl + 0.1)]} label={{ value: 'Cl', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <Tooltip formatter={(v) => v.toFixed(3)} />
          <ReferenceLine x={zeroLiftAngle} stroke="#64748b" strokeDasharray="4 4" label={{ value: 'α₀=' + zeroLiftAngle + '°', fontSize: 10, fill: '#94a3b8' }} />
          <ReferenceLine x={stallAngle} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Stall', fontSize: 10, fill: '#ef4444' }} />
          <Line type="monotone" dataKey="CL" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AoACDGraph({ maxThickness = 0.12, stallAngle = 15, velocity = 30, chordLength = 1, airDensity = 1.225 }) {
  const data = [];
  for (let aoa = -5; aoa <= 20; aoa++) {
    const { CD } = graphAero(aoa, stallAngle, 0, 0, maxThickness, velocity, chordLength, airDensity);
    data.push({ aoa, CD });
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--accent-blue)' }}>Angle of Attack vs Drag Coefficient</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="aoa" label={{ value: 'AoA (°)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <YAxis label={{ value: 'Cd', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <Tooltip formatter={(v) => v.toFixed(4)} />
          <Line type="monotone" dataKey="CD" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PolarGraph({ zeroLiftAngle = 0, stallAngle = 15, maxCamber = 0, maxThickness = 0.12, velocity = 30, chordLength = 1, airDensity = 1.225 }) {
  const data = [];
  for (let aoa = -5; aoa <= 20; aoa++) {
    const { CL, CD } = graphAero(aoa, stallAngle, zeroLiftAngle, maxCamber, maxThickness, velocity, chordLength, airDensity);
    data.push({ CD, CL, aoa });
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--accent-blue)' }}>Drag Polar (Cl vs Cd)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="CD" label={{ value: 'Cd', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} type="number" domain={['auto', 'auto']} />
          <YAxis dataKey="CL" label={{ value: 'Cl', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} domain={['auto', 'auto']} />
          <Tooltip formatter={(v, name) => [v.toFixed(4), name === 'CL' ? 'Cl' : 'Cd']} labelFormatter={(v) => ''} />
          <Line type="monotone" dataKey="CL" stroke="#a855f7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Each point represents a different AoA. The curve shows how drag increases as lift increases, with a sharp rise after stall.</p>
    </div>
  );
}

export function VelocityLiftGraph({ velocity, lift }) {
  const data = [];
  for (let v = 5; v <= 100; v += 5) {
    const factor = (v / velocity) ** 2;
    data.push({ velocity: v, Lift: Math.round(lift * factor * 100) / 100 });
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--accent-blue)' }}>Velocity vs Lift</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="velocity" label={{ value: 'Velocity (m/s)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <YAxis label={{ value: 'Lift (N/m)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <Tooltip formatter={(v) => v.toFixed(2)} />
          <Line type="monotone" dataKey="Lift" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VelocityDragGraph({ velocity, drag }) {
  const data = [];
  for (let v = 5; v <= 100; v += 5) {
    const factor = (v / velocity) ** 2;
    data.push({ velocity: v, Drag: Math.round(drag * factor * 100) / 100 });
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--accent-blue)' }}>Velocity vs Drag</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="velocity" label={{ value: 'Velocity (m/s)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <YAxis label={{ value: 'Drag (N/m)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <Tooltip formatter={(v) => v.toFixed(2)} />
          <Line type="monotone" dataKey="Drag" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LDRatioGraph({ zeroLiftAngle = 0, stallAngle = 15, maxCamber = 0, maxThickness = 0.12, velocity = 30, chordLength = 1, airDensity = 1.225 }) {
  const data = [];
  for (let aoa = -5; aoa <= 20; aoa++) {
    const { CL, CD } = graphAero(aoa, stallAngle, zeroLiftAngle, maxCamber, maxThickness, velocity, chordLength, airDensity);
    const ld = CD > 0 ? CL / CD : 0;
    data.push({ aoa, 'L/D': Math.round(ld * 100) / 100 });
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--accent-blue)' }}>Lift-to-Drag Ratio vs Angle of Attack</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="aoa" label={{ value: 'AoA (°)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <YAxis label={{ value: 'L/D', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} fontSize={11} stroke="#64748b" tick={{ fill: '#94a3b8' }} />
          <Tooltip formatter={(v) => v.toFixed(2)} />
          <Line type="monotone" dataKey="L/D" stroke="#a855f7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartComparison({ dataA, dataB, labelA, labelB }) {
  if (!dataA || !dataB) return null;

  const items = [
    { key: 'liftCoefficient', label: 'Cl', colorA: '#3b82f6', colorB: '#60a5fa' },
    { key: 'dragCoefficient', label: 'Cd', colorA: '#ef4444', colorB: '#f87171' },
    { key: 'liftPerMeter', label: 'Lift (N/m)', colorA: '#22c55e', colorB: '#4ade80' },
    { key: 'dragPerMeter', label: 'Drag (N/m)', colorA: '#f97316', colorB: '#fb923c' },
    { key: 'liftToDragRatio', label: 'L/D', colorA: '#a855f7', colorB: '#c084fc' },
  ];

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.key}>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            <span>{item.label}</span>
            <span>{labelA}: {dataA[item.key]?.toFixed(4)} | {labelB}: {dataB[item.key]?.toFixed(4)}</span>
          </div>
          <div className="flex gap-1 h-6">
            <div className="flex-1 rounded-l-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <div className="h-full transition-all duration-300" style={{ width: `${Math.min(Math.abs(dataA[item.key]) / Math.max(Math.abs(dataA[item.key] || 1), Math.abs(dataB[item.key] || 1)) * 100, 100)}%`, backgroundColor: item.colorA, opacity: 0.8 }} />
            </div>
            <div className="flex-1 rounded-r-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
              <div className="h-full transition-all duration-300" style={{ width: `${Math.min(Math.abs(dataB[item.key]) / Math.max(Math.abs(dataA[item.key] || 1), Math.abs(dataB[item.key] || 1)) * 100, 100)}%`, backgroundColor: item.colorB, opacity: 0.8 }} />
            </div>
          </div>
        </div>
      ))}
      {dataA.stallWarning && <span className="text-xs font-semibold" style={{ color: 'var(--accent-red)' }}>⚠ {labelA}: Stall</span>}
      {dataB.stallWarning && <span className="text-xs font-semibold ml-2" style={{ color: 'var(--accent-red)' }}>⚠ {labelB}: Stall</span>}
    </div>
  );
}
