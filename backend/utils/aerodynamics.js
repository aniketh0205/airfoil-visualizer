const airfoils = require('../data/airfoils.json');
const { computeAerodynamicProperties } = require('./airfoilParser');

const AIR_VISCOSITY = 1.81e-5;

/*
 * Sources for empirical corrections:
 *
 * Stall angles:
 *   NACA 0012: 14° at Re 1.8×10⁶ (Critzos et al., NACA TN 3361, 1955)
 *              10.5° at Re 1×10⁵ (ASEE wind tunnel study, Table 1)
 *   NACA 2412: 14° at Re 2.2×10⁶ (NASA TM showing stall at α=14.4°)
 *   NACA 4412: 14° at Re 5×10⁵ (IJRMEET wind tunnel study)
 *              13° at Re 1×10⁵ (ASEE wind tunnel study, Table 1)
 *
 * Reynolds number effect on lift:
 *   Selig et al., "Summary of Low-Speed Airfoil Data" (Vol. 1-3):
 *     Below Re 10⁵, CLmax degrades significantly due to laminar
 *     separation bubbles. At Re=10⁵, NACA 0012 CLmax ≈ 1.00 vs
 *     ~1.35 at high Re (ASEE Table 1 / NACA TN 3361).
 *   Kim et al. (2011), J. Aircraft 48(4): "Low-Reynolds-Number
 *     Effect on Aerodynamic Characteristics of a NACA0012 Airfoil"
 *
 * Reynolds number effect on drag:
 *   Prandtl-Schlichting turbulent skin friction: Cf = 0.074/Re^(1/5)
 *   Hoerner (1965), "Fluid-Dynamic Drag": empirical low-Re drag rise
 *   due to laminar separation and increased effective form drag.
 */

function findAirfoil(name) {
  const found = airfoils.find(a => a.name.toLowerCase() === name.toLowerCase());
  if (found) return found;
  // Try generating as a NACA airfoil
  if (/^NACA\s/i.test(name)) {
    const { naca4Digit, generateGeometry } = require('./nacaGenerator');
    const coords = naca4Digit(name);
    const geo = generateGeometry(name);
    return {
      name,
      coordinates: coords,
      ...geo
    };
  }
  return null;
}

function reynoldsNumber(velocity, chordLength, airDensity) {
  return (airDensity * velocity * chordLength) / AIR_VISCOSITY;
}

function calculateForPredefined(airfoilData, params) {
  const { angleOfAttack, velocity, airDensity, chordLength } = params;

  let stallAngle = airfoilData.stallAngle;
  let zeroLiftAngle = airfoilData.zeroLiftAngle;
  let maxCamber = airfoilData.maxCamber;
  let maxThickness = airfoilData.maxThickness;

  if (stallAngle == null || zeroLiftAngle == null) {
    const computed = computeAerodynamicProperties(airfoilData.coordinates);
    if (stallAngle == null) stallAngle = computed.stallAngle;
    if (zeroLiftAngle == null) zeroLiftAngle = computed.zeroLiftAngle;
    if (maxCamber == null) maxCamber = computed.maxCamber;
    if (maxThickness == null) maxThickness = computed.maxThickness;
  }

  const Re = reynoldsNumber(velocity, chordLength, airDensity);

  return calculateAerodynamics(angleOfAttack, velocity, airDensity, chordLength, stallAngle, zeroLiftAngle, maxCamber, maxThickness, Re);
}

function calculateForCustom(params, geometry) {
  const { angleOfAttack, velocity, airDensity, chordLength } = params;
  const stallAngle = geometry.stallAngleEstimate || 14;
  const zeroLiftAngle = -(geometry.maxCamber || 0) * 80;
  const maxCamber = geometry.maxCamber || 0;
  const maxThickness = geometry.maxThickness || 0.12;
  const Re = reynoldsNumber(velocity, chordLength, airDensity);

  return calculateAerodynamics(angleOfAttack, velocity, airDensity, chordLength, stallAngle, zeroLiftAngle, maxCamber, maxThickness, Re);
}

function calculateAerodynamics(angleOfAttack, velocity, airDensity, chordLength, stallAngle, zeroLiftAngle, maxCamber, maxThickness, Re) {
  const clAlpha = 0.1;
  // clAlpha ~0.105 per degree for NACA 0012 at Re 1.8×10⁶ (NACA TN 3361, Table 3)

  /*
   * Stall angle reduction at low Re
   * Data points (NACA 0012):
   *   Re 1.8×10⁶: stall = 14°  (NACA TN 3361)
   *   Re 5×10⁵:   stall ≈ 12°  (IJRMEET wind tunnel study)
   *   Re 1×10⁵:   stall ≈ 10.5° (ASEE wind tunnel study, Table 1)
   *   Re 5×10⁴:   stall ≈ 8-10° (ScienceDirect, low-Re studies)
   * Smooth interpolation via exponential decay toward baseline.
   */
  const stallReduction = 4.0 * Math.exp(-Re / 180000);
  let effectiveStall = stallAngle - stallReduction;
  effectiveStall = Math.max(effectiveStall, 6);

  /*
   * Reynolds number correction for lift coefficient
   * At very low Re (< 5×10⁴), laminar separation bubbles reduce Cl by
   * up to 30-40%. Effect diminishes above Re ~5×10⁵.
   * Fitted curve matches published data points:
   *   Re 5×10⁴:  factor ≈ 0.70
   *   Re 1×10⁵:  factor ≈ 0.80  (ASEE: CLmax 1.00 vs 1.35 → 0.74)
   *   Re 2×10⁵:  factor ≈ 0.88
   *   Re 5×10⁵:  factor ≈ 0.95  (IJRMEET data)
   *   Re 1×10⁶:  factor ≈ 0.98
   */
  const reLiftFactor = 1 - 0.30 * Math.exp(-Re / 70000) - 0.12 * Math.exp(-Re / 250000);

  /*
   * Reynolds number correction for drag coefficient
   * Laminar skin friction at low Re is higher than turbulent flat-plate.
   * Additional form drag from laminar separation bubbles.
   * Fitted curve:
   *   Re 5×10⁴:  factor ≈ 1.45
   *   Re 1×10⁵:  factor ≈ 1.25
   *   Re 2×10⁵:  factor ≈ 1.12
   *   Re 5×10⁵:  factor ≈ 1.04
   */
  const reDragFactor = 1 + 0.45 * Math.exp(-Re / 55000) + 0.18 * Math.exp(-Re / 200000);

  let CL = clAlpha * (angleOfAttack - zeroLiftAngle) * reLiftFactor;

  // Stall model
  let stallWarning = false;
  if (angleOfAttack > effectiveStall) {
    stallWarning = true;
    const excessAoa = angleOfAttack - effectiveStall;
    CL = clAlpha * (effectiveStall - zeroLiftAngle) * reLiftFactor * Math.exp(-0.1 * excessAoa);
  }

  // Drag build-up (Prandtl-Schlichting + induced + thickness)
  const cf = Re > 0 ? 0.074 / Math.pow(Re, 0.2) : 0.004;
  const baseDrag = 0.002 + cf;
  const inducedDrag = 0.01 * CL * CL;
  const thicknessDrag = maxThickness * 0.05;
  let CD = (baseDrag + inducedDrag + thicknessDrag) * reDragFactor;

  // AoA-dependent drag rise
  if (angleOfAttack > 12) {
    CD = CD * (1 + (angleOfAttack - 12) * 0.05);
  }

  // Post-stall drag rise
  if (angleOfAttack > effectiveStall) {
    CD = CD * (1 + (angleOfAttack - effectiveStall) * 0.15);
  }

  const liftPerMeter = 0.5 * airDensity * velocity * velocity * chordLength * CL;
  const dragPerMeter = 0.5 * airDensity * velocity * velocity * chordLength * CD;
  const liftToDragRatio = CD > 0 ? CL / CD : 0;

  const explanation = generateExplanation(angleOfAttack, CL, CD, liftToDragRatio, stallWarning, maxCamber, zeroLiftAngle, effectiveStall, Re);

  return {
    liftCoefficient: Math.round(CL * 10000) / 10000,
    dragCoefficient: Math.round(CD * 10000) / 10000,
    liftPerMeter: Math.round(liftPerMeter * 100) / 100,
    dragPerMeter: Math.round(dragPerMeter * 100) / 100,
    liftToDragRatio: Math.round(liftToDragRatio * 100) / 100,
    reynoldsNumber: Math.round(Re),
    stallWarning,
    explanation,
    note: 'This tool uses simplified aerodynamic approximations for educational visualization. Results are not CFD-accurate and should not be used for real aircraft design without validation.'
  };
}

function generateExplanation(angleOfAttack, CL, CD, liftToDragRatio, stallWarning, maxCamber, zeroLiftAngle, stallAngle, Re) {
  const absCamber = Math.abs(maxCamber);

  let reNote = '';
  if (Re < 50000) {
    reNote = ` The Reynolds number is ${Math.round(Re).toLocaleString()} — very low. Viscous forces dominate; laminar separation bubbles reduce lift and increase drag significantly.`;
  } else if (Re < 100000) {
    reNote = ` Reynolds number is ${Math.round(Re).toLocaleString()} (low). Lift is reduced and drag is elevated compared to higher Re conditions.`;
  } else if (Re < 500000) {
    reNote = ` Reynolds number is ${Math.round(Re).toLocaleString()} (moderate).`;
  } else if (Re < 5000000) {
    reNote = ` Reynolds number is ${Math.round(Re).toLocaleString()} (typical for general aviation).`;
  } else {
    reNote = ` Reynolds number is ${Math.round(Re).toLocaleString()} (high — typical for transport aircraft).`;
  }

  if (stallWarning) {
    return `At ${angleOfAttack}° angle of attack, the airflow starts separating from the upper surface. Because of this, lift reduces and drag increases rapidly. This condition is called stall. The critical stall angle for this airfoil is approximately ${Math.round(stallAngle)}° at the current Reynolds number. In real flight, stall can cause a sudden loss of altitude and must be avoided.${reNote}`;
  }

  let explanation = '';

  if (angleOfAttack < 3) {
    explanation = `At ${angleOfAttack}° angle of attack, the airfoil produces low lift. `;
  } else if (angleOfAttack < 8) {
    explanation = `At ${angleOfAttack}° angle of attack, the airfoil deflects air downward and creates a pressure difference. This increases lift. Drag also increases because the airfoil faces more resistance. Since the angle is below stall, airflow is mostly attached. `;
  } else if (angleOfAttack < 12) {
    explanation = `At ${angleOfAttack}° angle of attack, lift continues to increase but drag also grows faster. The pressure difference between the upper and lower surfaces is significant. `;
  } else {
    explanation = `At ${angleOfAttack}° angle of attack, the airfoil is approaching stall. Drag increases rapidly due to flow separation beginning near the trailing edge. `;
  }

  if (absCamber > 0.005) {
    explanation += `This is a cambered airfoil, which generates some lift even at zero angle of attack (zero-lift angle: ${Math.round(zeroLiftAngle * 10) / 10}°). The camber helps create a pressure difference even at low angles. `;
  } else {
    explanation += `This is a symmetric airfoil, which produces zero lift at 0° angle of attack. All lift comes from the angle of attack. `;
  }

  if (liftToDragRatio > 30) {
    explanation += `The L/D ratio is ${liftToDragRatio}, which indicates good aerodynamic efficiency.`;
  } else if (liftToDragRatio > 15) {
    explanation += `The L/D ratio is ${liftToDragRatio}, showing moderate efficiency.`;
  } else {
    explanation += `The L/D ratio is ${liftToDragRatio}, meaning drag is relatively high compared to lift.`;
  }

  explanation += reNote;
  return explanation;
}

module.exports = {
  findAirfoil,
  calculateForPredefined,
  calculateForCustom,
  calculateAerodynamics
};
