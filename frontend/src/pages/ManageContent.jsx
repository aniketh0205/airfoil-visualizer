import { useState, useEffect } from 'react';
import { login, fetchContent, createTopic, updateTopic, deleteTopic } from '../api/airfoilApi';

const ICON_OPTIONS = ['📌', '✈️', '⬆️', '⬅️', '📐', '⚠️', '📊', '📉', '🎯', '🔄', '📏', '🔽🔼', '🌊', '💡', '🔬', '📚', '⚡', '🛩️'];

export default function ManageContent() {
  const [token, setToken] = useState(sessionStorage.getItem('admin-token'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [topics, setTopics] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', icon: '📌', content: '', formula: '', color: 'border-l-blue-700' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchContent().then(d => setTopics(d.topics)).catch(console.error);
    }
  }, [token]);

  const handleLogin = async () => {
    try {
      const data = await login(password);
      sessionStorage.setItem('admin-token', data.token);
      setToken(data.token);
      setLoginError('');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin-token');
    setToken(null);
    setEditing(null);
    setForm({ title: '', icon: '📌', content: '', formula: '', color: 'border-l-blue-700' });
  };

  const resetForm = () => setForm({ title: '', icon: '📌', content: '', formula: '', color: 'border-l-blue-700' });

  const handleEdit = (topic) => {
    setEditing(topic.id);
    setForm({ title: topic.title, icon: topic.icon, content: topic.content, formula: topic.formula || '', color: topic.color });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) { setMessage('Title and content required'); return; }
    setSaving(true);
    setMessage('');
    try {
      const payload = { ...form, formula: form.formula.trim() || null };
      if (editing) {
        await updateTopic(editing, payload, token);
        setMessage('Topic updated');
      } else {
        await createTopic(payload, token);
        setMessage('Topic created');
      }
      resetForm();
      setEditing(null);
      const data = await fetchContent(token);
      setTopics(data.topics);
    } catch (err) {
      setMessage(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await deleteTopic(id, token);
      setMessage('Topic deleted');
      const data = await fetchContent(token);
      setTopics(data.topics);
      if (editing === id) { setEditing(null); resetForm(); }
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="card text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--accent-blue)' }}>Content Management</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Enter admin password to manage theory content</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Admin password" className="w-full mb-3 text-center"
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button onClick={handleLogin} className="btn-primary w-full">Login</button>
          {loginError && <p className="text-sm mt-2" style={{ color: 'var(--accent-red)' }}>{loginError}</p>}
        </div>
      </div>
    );
  }

  const colors = [
    'border-l-blue-700', 'border-l-green-500', 'border-l-orange-500', 'border-l-purple-500',
    'border-l-red-500', 'border-l-amber-500', 'border-l-teal-500', 'border-l-indigo-500',
    'border-l-cyan-500', 'border-l-violet-500', 'border-l-rose-500', 'border-l-pink-500'
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Content Manager</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add, edit, or remove theory topics</p>
        </div>
        <button onClick={handleLogout} className="text-sm px-3 py-1.5 rounded-lg" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
          onMouseEnter={e => e.target.style.color = 'var(--accent-red)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>Logout</button>
      </div>

      {message && (
        <div className="rounded-lg p-3 text-sm mb-4" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--accent-green)' }}>{message}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>{editing ? 'Edit Topic' : 'New Topic'}</h2>
          <div className="space-y-3">
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Boundary Layer" />
            </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Icon (click to select)</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {ICON_OPTIONS.map(ico => (
                  <button key={ico} onClick={() => setForm(f => ({ ...f, icon: ico }))}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm border transition-all ${form.icon === ico ? 'scale-110' : 'hover:border-blue-400'}`}
                    style={form.icon === ico ? { borderColor: 'var(--accent-blue)', backgroundColor: 'rgba(59,130,246,0.15)' } : { borderColor: 'var(--border-color)' }}>
                    {ico}
                  </button>
                ))}
              </div>
            </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Content *</label>
                <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} className="text-sm" />
              </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Formula (optional)</label>
              <input type="text" value={form.formula} onChange={e => setForm(f => ({ ...f, formula: e.target.value }))} placeholder="e.g. CL = 0.1 × (AoA − zeroLiftAngle)" />
            </div>
              <div>
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Color accent</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {colors.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? 'scale-125' : ''}`}
                    style={{
                      borderColor: form.color === c ? 'var(--accent-blue)' : 'var(--border-color)',
                      backgroundColor: c.replace('border-l-', '') === 'blue-700' ? '#1a237e' : c.replace('border-l-', '') === 'green-500' ? '#4caf50' : c.replace('border-l-', '') === 'orange-500' ? '#ff9800' : c.replace('border-l-', '') === 'purple-500' ? '#9c27b0' : c.replace('border-l-', '') === 'red-500' ? '#ef5350' : c.replace('border-l-', '') === 'amber-500' ? '#ffc107' : c.replace('border-l-', '') === 'teal-500' ? '#009688' : c.replace('border-l-', '') === 'indigo-500' ? '#3f51b5' : c.replace('border-l-', '') === 'cyan-500' ? '#00bcd4' : c.replace('border-l-', '') === 'violet-500' ? '#7c4dff' : c.replace('border-l-', '') === 'rose-500' ? '#e91e63' : '#e91e63'
                    }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : editing ? 'Update Topic' : 'Create Topic'}
              </button>
              {editing && <button onClick={() => { setEditing(null); resetForm(); }} className="btn-secondary">Cancel</button>}
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          <h2 className="font-bold mb-2" style={{ color: 'var(--accent-blue)' }}>All Topics ({topics.length})</h2>
          {topics.map(topic => (
            <div key={topic.id} className={`card border-l-4 ${topic.color} py-3 px-4`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-xl flex-shrink-0">{topic.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{topic.title}</h3>
                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{topic.content}</p>
                    <span className={`text-xs mt-1 inline-block px-1.5 py-0.5 rounded ${topic.isDefault ? '' : ''}`}
                      style={topic.isDefault ? { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' } : { backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>
                      {topic.isDefault ? 'Default' : 'Custom'}
                    </span>
                  </div>
                </div>
                {!topic.isDefault && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(topic)} className="text-xs hover:underline" style={{ color: 'var(--accent-blue)' }}>Edit</button>
                    <button onClick={() => handleDelete(topic.id)} className="text-xs hover:underline" style={{ color: 'var(--accent-red)' }}>Del</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
