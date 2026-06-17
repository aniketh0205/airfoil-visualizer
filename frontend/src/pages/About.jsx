const sections = [
  {
    title: 'Problem Statement',
    content: 'Students often find it difficult to understand lift and drag using only formulas and static diagrams. This project provides an interactive visual platform to understand how airfoil geometry, velocity, and angle of attack affect aerodynamic forces.'
  },
  {
    title: 'Objectives',
    items: [
      'To visualize lift and drag generation on airfoils',
      'To allow users to change aerodynamic parameters interactively',
      'To support predefined and custom airfoil coordinate files',
      'To calculate lift, drag, Cl, Cd, and L/D ratio',
      'To help students understand stall and pressure difference',
      'To compare different airfoil shapes'
    ]
  },
  {
    title: 'Methodology',
    content: 'This application uses simplified aerodynamic models based on thin airfoil theory and empirical approximations. Predefined airfoil data is stored in JSON format. Custom airfoil coordinates are parsed, normalized, and analyzed to estimate geometric properties. Aerodynamic coefficients are calculated using educational formulas that capture the essential physics without requiring CFD-level computation.'
  },
  {
    title: 'Interdisciplinary Connection',
    content: 'This project bridges Aeronautical Engineering and Computer Science. Aeronautical engineering provides the physics of lift, drag, and airfoil design. Computer science provides interactive visualization, web development, API design, and real-time data processing. The combination creates an engaging educational tool that makes complex concepts accessible.'
  },
  {
    title: 'Applications',
    items: [
      'Aerospace engineering education',
      'Student projects and demonstrations',
      'Understanding airfoil selection for aircraft design',
      'Preliminary aerodynamic analysis',
      'STEM outreach and teaching'
    ]
  },
  {
    title: 'Advantages',
    items: [
      'Interactive real-time visualization',
      'Supports both predefined and custom airfoils',
      'No installation required - runs in a web browser',
      'Clean, intuitive user interface',
      'Educational explanations for every condition',
      'Modular code structure for easy extension'
    ]
  },
  {
    title: 'Limitations',
    items: [
      'Uses simplified aerodynamic approximations, not CFD',
      'Not suitable for real aircraft design without validation',
      'Does not account for compressibility effects at high Mach numbers',
      'Limited to 2D airfoil analysis (no 3D wing effects)',
      'No boundary layer or transition modeling',
      'No wind tunnel data correlation'
    ]
  },
  {
    title: 'Future Scope',
    items: [
      'Add real CFD visualization using panel methods',
      'Integrate with XFOIL for more accurate analysis',
      'Add database for saving simulations (MongoDB/PostgreSQL)',
      'Add user login and authentication',
      'Export results as PDF reports',
      'Add wind tunnel data comparison',
      'Add 3D wing visualization and wingtip effects',
      'Include Reynolds number and Mach number effects',
      'Add multi-element airfoil support (flaps, slats)'
    ]
  }
];

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">✈️</div>
        <h1 className="text-3xl font-bold mb-2 heading-gradient">Interactive Airfoil Lift and Drag Visualizer</h1>
        <p className="text-gray-400">An interdisciplinary engineering education project</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={i} className="card">
            <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--accent-blue)' }}>{section.title}</h2>
            {section.content && (
              <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{section.content}</p>
            )}
            {section.items && (
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mt-0.5" style={{ color: 'var(--accent-blue)' }}>▸</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 card text-center">
        <p className="font-semibold mb-3" style={{ color: 'var(--accent-blue)' }}>Built With</p>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="badge-value">React</span>
          <span className="badge-value">Tailwind CSS</span>
          <span className="badge-value">Recharts</span>
          <span className="badge-value">Node.js</span>
          <span className="badge-value">Express</span>
        </div>
        <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          This tool uses simplified aerodynamic approximations for educational visualization.
          Results are not CFD-accurate and should not be used for real aircraft design without validation.
        </p>
      </div>
    </div>
  );
}
