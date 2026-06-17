import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Simulator from './pages/Simulator';
import CustomAirfoil from './pages/CustomAirfoil';
import Compare from './pages/Compare';
import Learn from './pages/Learn';
import Quiz from './pages/Quiz';
import About from './pages/About';
import ManageContent from './pages/ManageContent';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/custom" element={<CustomAirfoil />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/about" element={<About />} />
          <Route path="/manage-content" element={<ManageContent />} />
        </Routes>
        <footer className="bg-gradient-to-r from-gray-900 to-slate-900 text-gray-400 py-6 mt-12" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-4 text-center text-xs">
            <p>Interactive Airfoil Lift and Drag Visualizer — Educational Engineering Project</p>
            <p className="mt-1 opacity-70">Uses simplified aerodynamic approximations. Not CFD-accurate.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
