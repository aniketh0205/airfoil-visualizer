const airfoils = require('../data/airfoils.json');
const { calculateForPredefined, calculateForCustom, findAirfoil } = require('../utils/aerodynamics');
const { processAirfoilData } = require('../utils/airfoilParser');
const { naca4Digit, generateGeometry } = require('../utils/nacaGenerator');

const getAirfoils = (req, res) => {
  const summary = airfoils.map(a => {
    let isNACA = /^NACA\s/i.test(a.name);
    let result = { ...a };
    if (isNACA) {
      let geo = generateGeometry(a.name);
      result.maxThickness = a.maxThickness ?? geo.maxThickness;
      result.maxThicknessLocation = a.maxThicknessLocation ?? geo.maxThicknessLocation;
      result.maxCamber = a.maxCamber ?? geo.maxCamber;
      result.maxCamberLocation = a.maxCamberLocation ?? geo.maxCamberLocation;
      result.zeroLiftAngle = a.zeroLiftAngle ?? geo.zeroLiftAngle;
      result.stallAngle = a.stallAngle ?? geo.stallAngle;
      result.baseDragCoefficient = a.baseDragCoefficient ?? geo.baseDragCoefficient;
      result.type = a.type || geo.type;
      result.description = a.description || geo.description;
      result.camberDescription = a.camberDescription || geo.camberDescription;
    }
    return result;
  });
  res.json({ airfoils: summary });
};

const calculate = (req, res) => {
  try {
    const { airfoil, angleOfAttack, velocity, airDensity, chordLength, customAirfoil } = req.body;

    if (angleOfAttack === undefined || velocity === undefined || airDensity === undefined || chordLength === undefined) {
      return res.status(400).json({ error: 'Missing required parameters: angleOfAttack, velocity, airDensity, chordLength' });
    }

    const aoa = parseFloat(angleOfAttack);
    const vel = parseFloat(velocity);
    const rho = parseFloat(airDensity);
    const chord = parseFloat(chordLength);

    if (isNaN(aoa) || isNaN(vel) || isNaN(rho) || isNaN(chord)) {
      return res.status(400).json({ error: 'Invalid numeric parameters' });
    }

    if (customAirfoil && customAirfoil.geometry) {
      const result = calculateForCustom({ angleOfAttack: aoa, velocity: vel, airDensity: rho, chordLength: chord }, customAirfoil.geometry);
      return res.json(result);
    }

    const airfoilData = findAirfoil(airfoil);
    if (!airfoilData) {
      return res.status(404).json({ error: `Airfoil "${airfoil}" not found` });
    }

    const result = calculateForPredefined(airfoilData, { angleOfAttack: aoa, velocity: vel, airDensity: rho, chordLength: chord });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const processCustomAirfoil = (req, res) => {
  try {
    const { name, coordinatesText } = req.body;
    const clean = (coordinatesText || '').replace(/^\uFEFF/, '');

    if (!clean.trim()) {
      return res.status(400).json({ error: 'No coordinate data provided' });
    }

    const { coordinates, geometry } = processAirfoilData(clean);

    res.json({
      name: name || 'Custom Airfoil',
      coordinates,
      geometry,
      message: 'Airfoil uploaded successfully'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const uploadAirfoilFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    if (ext !== 'dat' && ext !== 'txt' && ext !== 'csv') {
      return res.status(400).json({ error: 'Only .dat, .txt, and .csv files are accepted' });
    }

    const content = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'File is empty' });
    }

    const name = req.body.name || req.file.originalname.replace(/\.[^/.]+$/, '');
    const { coordinates, geometry } = processAirfoilData(content);

    res.json({
      name,
      coordinates,
      geometry,
      message: 'Airfoil file uploaded successfully'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const compareAirfoils = (req, res) => {
  try {
    const { airfoilA, airfoilB, angleOfAttack, velocity, airDensity, chordLength, customAirfoils } = req.body;

    if (!airfoilA || !airfoilB) {
      return res.status(400).json({ error: 'Both airfoilA and airfoilB are required' });
    }

    const aoa = parseFloat(angleOfAttack);
    const vel = parseFloat(velocity);
    const rho = parseFloat(airDensity);
    const chord = parseFloat(chordLength);

    let dataA, dataB;
    let geoA, geoB;

    const customA = customAirfoils && customAirfoils.find(c => c.name === airfoilA);
    const customB = customAirfoils && customAirfoils.find(c => c.name === airfoilB);

    if (customA) {
      geoA = customA.geometry;
    } else {
      const found = findAirfoil(airfoilA);
      if (!found) return res.status(404).json({ error: `Airfoil "${airfoilA}" not found` });
      const { coordinates, ...rest } = found;
      geoA = rest;
    }

    if (customB) {
      geoB = customB.geometry;
    } else {
      const found = findAirfoil(airfoilB);
      if (!found) return res.status(404).json({ error: `Airfoil "${airfoilB}" not found` });
      const { coordinates, ...rest } = found;
      geoB = rest;
    }

    const params = { angleOfAttack: aoa, velocity: vel, airDensity: rho, chordLength: chord };

    if (customA) {
      dataA = calculateForCustom(params, geoA);
    } else {
      dataA = calculateForPredefined(geoA, params);
    }

    if (customB) {
      dataB = calculateForCustom(params, geoB);
    } else {
      dataB = calculateForPredefined(geoB, params);
    }

    res.json({
      airfoilA: { name: airfoilA, ...dataA, geometry: geoA },
      airfoilB: { name: airfoilB, ...dataB, geometry: geoB }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getQuiz = (req, res) => {
  const questions = [
    {
      id: 1,
      question: 'What happens to lift when velocity increases?',
      options: ['Lift decreases', 'Lift increases proportionally to V²', 'Lift stays the same', 'Lift increases proportionally to V'],
      correctAnswer: 1
    },
    {
      id: 2,
      question: 'Which force acts opposite to the direction of aircraft motion?',
      options: ['Lift', 'Thrust', 'Drag', 'Weight'],
      correctAnswer: 2
    },
    {
      id: 3,
      question: 'What is angle of attack?',
      options: [
        'The angle between the wing chord line and the relative wind',
        'The angle of the aircraft relative to the ground',
        'The angle of the tail relative to the fuselage',
        'The angle between the upper and lower wing surfaces'
      ],
      correctAnswer: 0
    },
    {
      id: 4,
      question: 'What happens to lift after the stall angle is exceeded?',
      options: ['Lift continues to increase', 'Lift remains constant', 'Lift decreases rapidly', 'Lift becomes zero instantly'],
      correctAnswer: 2
    },
    {
      id: 5,
      question: 'Why do cambered airfoils generate lift at low angle of attack?',
      options: [
        'They are lighter than symmetric airfoils',
        'The curved upper surface creates a pressure difference even at 0° AoA',
        'They have lower thickness',
        'They create more drag which increases lift'
      ],
      correctAnswer: 1
    },
    {
      id: 6,
      question: 'What does Reynolds number represent?',
      options: [
        'Ratio of lift to drag',
        'Ratio of inertial to viscous forces in the flow',
        'The speed of sound in air',
        'The density of the airfoil material'
      ],
      correctAnswer: 1
    },
    {
      id: 7,
      question: 'What effect does a low Reynolds number have on an airfoil?',
      options: [
        'Lift increases and drag decreases',
        'Laminar separation bubbles reduce lift and increase drag',
        'The stall angle increases significantly',
        'The airfoil becomes more efficient'
      ],
      correctAnswer: 1
    },
    {
      id: 8,
      question: 'What is the zero-lift angle of attack?',
      options: [
        'The angle at which drag is zero',
        'The angle at which the airfoil produces no lift',
        'The angle at which stall occurs',
        'The angle between the upper and lower camber line'
      ],
      correctAnswer: 1
    },
    {
      id: 9,
      question: 'For a symmetric airfoil like NACA 0012, the zero-lift angle is:',
      options: ['0°', 'About -2°', 'About 5°', 'Depends on thickness'],
      correctAnswer: 0
    },
    {
      id: 10,
      question: 'What is the chord line of an airfoil?',
      options: [
        'The line of maximum thickness',
        'The straight line connecting the leading and trailing edges',
        'The curved upper surface of the airfoil',
        'The line along the camber at 50% chord'
      ],
      correctAnswer: 1
    },
    {
      id: 11,
      question: 'What does the lift-to-drag ratio (L/D) measure?',
      options: [
        'How fast the aircraft can fly',
        'Aerodynamic efficiency — how much lift is produced per unit of drag',
        'The structural strength of the wing',
        'The stall speed of the aircraft'
      ],
      correctAnswer: 1
    },
    {
      id: 12,
      question: 'What is the main difference between NACA 0012 and NACA 2412?',
      options: [
        '0012 is thicker',
        '2412 has 2% camber while 0012 is symmetric',
        '2412 has a higher stall angle',
        '0012 is cambered and 2412 is symmetric'
      ],
      correctAnswer: 1
    },
    {
      id: 13,
      question: 'What is the drag polar?',
      options: [
        'A graph showing lift coefficient vs drag coefficient',
        'The distribution of pressure on the airfoil surface',
        'The angle at which minimum drag occurs',
        'A polar coordinate representation of the airfoil shape'
      ],
      correctAnswer: 0
    },
    {
      id: 14,
      question: 'In the standard atmosphere at sea level, air density is approximately:',
      options: ['0.5 kg/m³', '1.225 kg/m³', '2.5 kg/m³', '10 kg/m³'],
      correctAnswer: 1
    },
    {
      id: 15,
      question: 'What causes induced drag?',
      options: [
        'Friction between the air and the wing surface',
        'The generation of lift, due to trailing vortices deflecting the airflow',
        'The thickness of the airfoil',
        'Compressibility effects at high speed'
      ],
      correctAnswer: 1
    }
  ];
  res.json({ questions });
};

module.exports = {
  getAirfoils,
  calculate,
  processCustomAirfoil,
  uploadAirfoilFile,
  compareAirfoils,
  getQuiz
};
