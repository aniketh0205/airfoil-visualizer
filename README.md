# Interactive Airfoil Lift and Drag Visualizer

An interdisciplinary educational web application combining **Aeronautical Engineering** and **Computer Science** to help students understand how lift and drag are produced on different airfoils through interactive visualization.

## Features

- **Interactive Simulator** — Adjust angle of attack, velocity, air density, chord length, and wing span with sliders and see real-time results
- **Predefined Airfoils** — NACA 0012, NACA 2412, NACA 4412, Clark Y, Selig S1223, Eppler E205
- **Custom Airfoil Upload** — Paste coordinates or upload `.dat`/`.txt` files; supports any valid airfoil coordinate format
- **Airfoil Library** — Save/load/delete custom airfoils in browser localStorage
- **Airfoil Visualization** — SVG-based shape rendering with airflow arrows, lift/drag vectors, pressure labels, and stall warnings
- **Interactive Graphs** — AoA vs CL, AoA vs CD, Velocity vs Lift, Velocity vs Drag, L/D Ratio vs AoA
- **Compare Mode** — Side-by-side aerodynamic comparison of any two airfoils
- **Learn Theory** — Student-friendly explanations of key aerodynamics concepts
- **Quiz** — 5 multiple-choice questions with instant scoring
- **Educational Explanations** — Dynamic "What is happening?" panel with condition-specific explanations

## Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- Recharts
- SVG for airfoil visualization
- React Router for navigation

### Backend
- Node.js
- Express.js
- Multer for file uploads
- JSON-based airfoil data storage

## Folder Structure

```
airfoil-visualizer/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── AirfoilVisualizer.jsx
│       │   └── GraphPanel.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Simulator.jsx
│       │   ├── CustomAirfoil.jsx
│       │   ├── Compare.jsx
│       │   ├── Learn.jsx
│       │   ├── Quiz.jsx
│       │   └── About.jsx
│       ├── api/
│       │   └── airfoilApi.js
│       ├── utils/
│       │   └── airfoilStorage.js
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
├── backend/
│   ├── data/
│   │   └── airfoils.json
│   ├── routes/
│   │   └── airfoilRoutes.js
│   ├── controllers/
│   │   └── airfoilController.js
│   ├── utils/
│   │   ├── aerodynamics.js
│   │   └── airfoilParser.js
│   ├── server.js
│   └── package.json
└── README.md
```

## How to Run

### Prerequisites
- Node.js (v16+)
- npm

### Backend Setup

```bash
cd backend
npm install
node server.js
```

The backend starts on **http://localhost:5000**.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:3000** (with API proxy to backend).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/airfoils` | List all predefined airfoils |
| POST | `/api/calculate` | Calculate lift/drag for given parameters |
| POST | `/api/airfoil/custom` | Process pasted coordinate text |
| POST | `/api/airfoil/upload` | Upload `.dat`/`.txt` coordinate file |
| POST | `/api/compare` | Compare two airfoils side by side |
| GET | `/api/quiz` | Get 5 quiz questions |
| GET | `/api/health` | Health check |

### POST /api/calculate

```json
{
  "airfoil": "NACA 2412",
  "angleOfAttack": 8,
  "velocity": 30,
  "airDensity": 1.225,
  "chordLength": 1,
  "wingSpan": 2,
  "customAirfoil": null
}
```

### POST /api/airfoil/custom

```json
{
  "name": "My Airfoil",
  "coordinatesText": "NACA 2412\n1.0000 0.0013\n0.9500 0.0074\n..."
}
```

## Formulas Used

**Lift:** L = 0.5 × ρ × V² × S × CL

**Drag:** D = 0.5 × ρ × V² × S × CD

Where:
- ρ = air density (kg/m³)
- V = velocity (m/s)
- S = chord length × wing span (m²)
- CL = lift coefficient
- CD = drag coefficient

**Lift Coefficient:** CL = 0.1 × (AoA − zeroLiftAngle)

**Drag Coefficient:** CD = baseDrag + inducedDrag + thicknessDrag

## How Custom Airfoil Upload Works

1. User pastes coordinate data or uploads a `.dat`/`.txt` file
2. Backend parses lines, ignores non-numeric title lines
3. Extracts valid x/y coordinate pairs
4. Normalizes x coordinates to 0–1 range
5. Splits points into upper and lower surfaces
6. Interpolates y-values at common x positions
7. Calculates max thickness, max camber, and their locations
8. Estimates airfoil type (symmetric/mildly/highly cambered) and stall angle
9. Estimates aerodynamic coefficients from geometry

## Limitations

- Uses simplified aerodynamic approximations, not CFD
- Not suitable for real aircraft design without validation
- Does not account for compressibility effects at high Mach numbers
- Limited to 2D airfoil analysis (no 3D wing effects)
- No boundary layer or transition modeling

## Future Scope

- Add real CFD visualization using panel methods
- Integrate with XFOIL for more accurate analysis
- Add database for saving simulations (MongoDB/PostgreSQL)
- Add user login and authentication
- Export results as PDF reports
- Add wind tunnel data comparison
- Add 3D wing visualization and wingtip effects
- Include Reynolds number and Mach number effects
- Add multi-element airfoil support (flaps, slats)

## License

Educational project — free to use and modify for learning purposes.
