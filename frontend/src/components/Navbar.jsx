import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/simulator', label: 'Simulator', icon: '⚡' },
  { path: '/custom', label: 'Custom Airfoil', icon: '📐' },
  { path: '/compare', label: 'Compare', icon: '📊' },
  { path: '/learn', label: 'Learn', icon: '📖' },
  { path: '/quiz', label: 'Quiz', icon: '❓' },
  { path: '/manage-content', label: 'Manage', icon: '⚙️' },
  { path: '/about', label: 'About', icon: 'ℹ️' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0"
      style={{ borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl transition-transform group-hover:scale-110 animate-float">✈️</span>
            <span className="font-bold text-lg hidden sm:block shimmer-text">Airfoil Visualizer</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
                style={location.pathname === item.path
                  ? { background: 'rgba(59,130,246,0.15)', boxShadow: '0 0 12px rgba(59,130,246,0.1)' }
                  : {}}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-white/5"
            onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 pt-2">
            {navItems.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === item.path ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`}
                style={location.pathname === item.path
                  ? { background: 'rgba(59,130,246,0.12)' }
                  : {}}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
