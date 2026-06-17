import { useState, useRef } from 'react';
import AirfoilVisualizer from '../components/AirfoilVisualizer';
import { processCustomAirfoil, uploadAirfoilFile } from '../api/airfoilApi';
import { saveCustomAirfoil, getCustomAirfoils, deleteCustomAirfoil } from '../utils/airfoilStorage';

export default function CustomAirfoil() {
  const [tab, setTab] = useState('paste');
  const [name, setName] = useState('');
  const [coordinatesText, setCoordinatesText] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedAirfoils, setSavedAirfoils] = useState(getCustomAirfoils());
  const fileInputRef = useRef(null);

  const handlePaste = async () => {
    if (!coordinatesText.trim()) { setError('Please paste coordinate data'); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await processCustomAirfoil(name || 'Custom Airfoil', coordinatesText);
      setResult(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleFileUpload = async () => {
    if (!file) { setError('Please select a file'); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await uploadAirfoilFile(file, name || file.name.replace(/\.[^/.]+$/, ''));
      setResult(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleSave = () => {
    if (!result) return;
    const airfoils = saveCustomAirfoil(result);
    setSavedAirfoils(airfoils);
    alert('Airfoil saved to library!');
  };

  const handleDelete = (id) => {
    const airfoils = deleteCustomAirfoil(id);
    setSavedAirfoils(airfoils);
  };

  const handleLoad = (airfoil) => {
    setResult(airfoil);
    setName(airfoil.name);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 heading-gradient">Custom Airfoil Upload</h1>
      <p className="text-gray-400 mb-8">Upload your own airfoil coordinates or paste them to analyze</p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            <div className="card">
            <h2 className="font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>Input Method</h2>
            <div className="flex gap-2 mb-4">
              {['paste', 'file', 'library'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tab === t ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={tab === t ? { backgroundColor: 'var(--accent-blue)' } : { backgroundColor: 'var(--bg-elevated)' }}
                >
                  {t === 'paste' ? 'Paste Coordinates' : t === 'file' ? 'Upload File' : 'My Library'}
                </button>
              ))}
            </div>

            {tab === 'paste' && (
              <div>
                <div className="mb-3">
                  <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Airfoil Name (optional)</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="My Custom Airfoil" />
                </div>
                <div className="mb-3">
                  <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Coordinate Data
                    <span className="relative inline-group ml-1">
                      <span className="cursor-help text-gray-500 hover:text-blue-400 text-xs"
                        onMouseEnter={e => e.target.nextSibling.style.display = 'block'}
                        onMouseLeave={e => e.target.nextSibling.style.display = 'none'}>ⓘ</span>
                      <div className="hidden absolute bottom-full left-0 mb-2 w-72 p-2 text-white text-xs rounded-lg shadow-lg z-50 pointer-events-none"
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        Each line: x and y coordinate, space or comma separated. First line can be a name — it will be ignored automatically. Example: <code className="block mt-1">1.0000, 0.0013</code>
                      </div>
                    </span>
                  </label>
                  <textarea
                    value={coordinatesText}
                    onChange={e => setCoordinatesText(e.target.value)}
                    placeholder={`NACA 2412\n1.0000 0.0013\n0.9500 0.0074\n0.9000 0.0126\n...`}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <button onClick={handlePaste} disabled={loading} className="btn-primary w-full">
                  {loading ? 'Processing...' : 'Process Airfoil'}
                </button>
              </div>
            )}

            {tab === 'file' && (
              <div>
                <div className="mb-3">
                  <label className="text-sm mb-1 block" style={{ color: 'var(--text-secondary)' }}>Airfoil Name (optional)</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Airfoil name" />
                </div>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? (
                    <div>
                      <p className="font-medium" style={{ color: 'var(--accent-blue)' }}>{file.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl mb-2">📁</p>
                      <p style={{ color: 'var(--text-secondary)' }}>Click to select a file</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>.dat, .txt, or .csv — space or comma separated</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dat,.txt,.csv"
                    className="hidden"
                    onChange={e => setFile(e.target.files[0])}
                  />
                </div>
                {file && (
                  <button onClick={handleFileUpload} disabled={loading} className="btn-primary w-full mt-3">
                    {loading ? 'Uploading...' : 'Upload & Process'}
                  </button>
                )}
              </div>
            )}

            {tab === 'library' && (
              <div>
                {savedAirfoils.length === 0 ? (
                  <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    <p className="text-4xl mb-2">📂</p>
                    <p>No saved airfoils yet</p>
                    <p className="text-xs mt-1">Upload or paste an airfoil and save it to your library</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {savedAirfoils.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <div>
                          <p className="font-medium text-sm">{a.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.geometry?.airfoilTypeEstimate}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleLoad(a)} className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-blue)' }}>Load</button>
                          <button onClick={() => handleDelete(a.id)} className="text-xs font-medium hover:underline" style={{ color: 'var(--accent-red)' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && (
            <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>
              {error}
            </div>
            )}
          </div>

          {result && (
            <div className="card">
              <h2 className="font-bold mb-3" style={{ color: 'var(--accent-blue)' }}>Geometry Analysis</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Max Thickness', value: result.geometry?.maxThickness },
                  { label: 'Thickness Location', value: `${((result.geometry?.maxThicknessLocation || 0) * 100).toFixed(0)}% chord` },
                  { label: 'Max Camber', value: result.geometry?.maxCamber },
                  { label: 'Camber Location', value: `${((result.geometry?.maxCamberLocation || 0) * 100).toFixed(0)}% chord` },
                  { label: 'Type Estimate', value: result.geometry?.airfoilTypeEstimate },
                  { label: 'Stall Estimate', value: `${result.geometry?.stallAngleEstimate}°` },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                    <div className="font-semibold" style={{ color: 'var(--accent-blue)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleSave} className="btn-primary w-full mt-4">
                Save to Library
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {result && result.coordinates ? (
            <>
              <div className="card">
                <h2 className="font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>Airfoil Shape</h2>
                <div className="flex justify-center">
                  <AirfoilVisualizer
                    coordinates={result.coordinates}
                    angleOfAttack={0}
                    width={600}
                    height={280}
                  />
                </div>
              </div>
              <div className="card">
                <h2 className="font-bold mb-3" style={{ color: 'var(--accent-blue)' }}>Coordinate Preview</h2>
                <div className="max-h-60 overflow-y-auto rounded-lg p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <pre className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {result.coordinates.map((c, i) => `${c.x.toFixed(4)} ${c.y.toFixed(4)}`).join('\n')}
                  </pre>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  {result.coordinates.length} coordinate points loaded
                </p>
              </div>
            </>
          ) : (
            <div className="card flex items-center justify-center h-64">
              <div className="text-center" style={{ color: 'var(--text-muted)' }}>
                <p className="text-5xl mb-4">📐</p>
                <p>Upload or paste airfoil coordinates</p>
                <p className="text-xs mt-2">to see the shape and analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
