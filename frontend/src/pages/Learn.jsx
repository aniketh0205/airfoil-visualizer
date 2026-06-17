import { useState, useEffect } from 'react';
import { fetchContent } from '../api/airfoilApi';
import AirfoilAnatomy from '../components/AirfoilAnatomy';
import NacaGenerator from '../components/NacaGenerator';

export default function Learn() {
  const [tab, setTab] = useState('theory');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent().then(d => {
      setTopics(d.topics);
      setLoading(false);
    }).catch(() => {
      setTopics([]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 heading-gradient">Learn Aerodynamics</h1>
      <p className="text-gray-400 mb-6">Student-friendly explanations of key aerodynamic concepts</p>

      <div className="flex gap-1 mb-8 rounded-lg p-1 w-fit" style={{ backgroundColor: 'var(--bg-elevated)' }}>
        <button onClick={() => setTab('theory')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'theory' ? 'shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          style={tab === 'theory' ? { backgroundColor: 'var(--bg-card)', color: 'var(--accent-blue)' } : {}}>
          📖 Theory
        </button>
        <button onClick={() => setTab('nomenclature')}
          className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'nomenclature' ? 'shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          style={tab === 'nomenclature' ? { backgroundColor: 'var(--bg-card)', color: 'var(--accent-blue)' } : {}}>
          📐 Nomenclature & Anatomy
        </button>
      </div>

      {tab === 'theory' && (
        <div>
          {loading ? (
            <div className="text-center py-12" style={{ color: 'var(--accent-blue)' }}>Loading topics...</div>
          ) : topics.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No topics available.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {topics.map((topic, i) => (
                <div key={topic.id || i} className={`card border-l-4 ${topic.color || 'border-l-blue-700'} animate-fadeIn`} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl">{topic.icon || '📌'}</span>
                    <div className="flex-1">
                      <h2 className="font-bold text-lg" style={{ color: 'var(--accent-blue)' }}>{topic.title}</h2>
                      {!topic.isDefault && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>Custom</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{topic.content}</p>
                  {topic.formula && (
                    <div className="mt-3 rounded-lg p-3 text-center font-mono text-sm font-medium" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-blue)' }}>
                      {topic.formula}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="notice-box mt-8">
            <strong>💡 Key Takeaway:</strong> Aerodynamics is all about the interaction between the airfoil shape
            and the air flowing around it. Small changes in shape, angle, or speed can have large effects
            on lift and drag. Understanding these relationships is the first step to designing efficient
            aircraft wings.
          </div>
        </div>
      )}

      {tab === 'nomenclature' && (
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--accent-blue)' }}>Airfoil Anatomy</h2>
            <AirfoilAnatomy />
          </div>

          <NacaGenerator />
        </div>
      )}
    </div>
  );
}
