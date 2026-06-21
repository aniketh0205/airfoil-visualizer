function parseAirfoilCoordinates(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const coordinates = [];
  const errors = [];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const trimmed = lines[lineNum].trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/[\s,;]+/);
    if (parts.length < 2) {
      errors.push(`Line ${lineNum + 1}: only ${parts.length} value(s) found, expected at least 2 (x y)`);
      continue;
    }

    const clean = p => parseFloat(p.replace(/^["']|["']$/g, ''));
    const x = clean(parts[0]);
    const y = clean(parts[1]);

    if (isNaN(x) || isNaN(y)) {
      errors.push(`Line ${lineNum + 1}: non-numeric values (x=${parts[0]}, y=${parts[1]})`);
      continue;
    }
    if (x < 0 || x > 1) {
      errors.push(`Line ${lineNum + 1}: x=${x} is out of range [0, 1]`);
      continue;
    }

    coordinates.push({ x, y });
  }

  if (coordinates.length < 5) {
    const detail = errors.length > 0
      ? '\n  ' + errors.slice(0, 5).join('\n  ') + (errors.length > 5 ? `\n  ...and ${errors.length - 5} more` : '')
      : '';
    throw new Error(`Invalid airfoil coordinate file. Need at least 5 valid coordinate pairs (got ${coordinates.length}).${detail}`);
  }

  return coordinates;
}

function normalizeCoordinates(coordinates) {
  const xs = coordinates.map(c => c.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  if (minX < 0 || maxX > 1) {
    return coordinates.map(c => ({
      x: (c.x - minX) / (maxX - minX),
      y: c.y
    }));
  }

  return coordinates;
}

function splitUpperLower(coordinates) {
  const upper = [];
  const lower = [];

  for (const pt of coordinates) {
    if (pt.y >= 0) upper.push(pt);
    else lower.push(pt);
  }

  upper.sort((a, b) => a.x - b.x);
  lower.sort((a, b) => a.x - b.x);

  if (upper.length < 3 || lower.length < 3) {
    const sorted = [...coordinates].sort((a, b) => a.x - b.x);
    const mid = Math.floor(sorted.length / 2);
    return {
      upper: sorted.slice(0, mid),
      lower: sorted.slice(mid)
    };
  }

  return { upper, lower };
}

function interpolateY(points, targetX) {
  if (points.length < 2) return 0;
  if (targetX <= points[0].x) return points[0].y;
  if (targetX >= points[points.length - 1].x) return points[points.length - 1].y;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (targetX >= p1.x && targetX <= p2.x) {
      const t = (targetX - p1.x) / (p2.x - p1.x);
      return p1.y + t * (p2.y - p1.y);
    }
  }
  return 0;
}

function calculateGeometry(coordinates) {
  const normalized = normalizeCoordinates(coordinates);
  const { upper, lower } = splitUpperLower(normalized);

  const samplePoints = 50;
  let maxThickness = 0;
  let maxThicknessLocation = 0;
  let maxCamber = 0;
  let maxCamberLocation = 0;

  for (let i = 0; i <= samplePoints; i++) {
    const x = i / samplePoints;
    const upperY = interpolateY(upper, x);
    const lowerY = interpolateY(lower, x);

    const thickness = upperY - lowerY;
    if (thickness > maxThickness) {
      maxThickness = thickness;
      maxThicknessLocation = x;
    }

    const camber = (upperY + lowerY) / 2;
    if (Math.abs(camber) > Math.abs(maxCamber)) {
      maxCamber = camber;
      maxCamberLocation = x;
    }
  }

  let airfoilTypeEstimate;
  if (Math.abs(maxCamber) < 0.005) {
    airfoilTypeEstimate = 'Symmetric airfoil';
  } else if (Math.abs(maxCamber) < 0.03) {
    airfoilTypeEstimate = 'Mildly cambered airfoil';
  } else {
    airfoilTypeEstimate = 'Highly cambered airfoil';
  }

let stallAngleEstimate;
  if (Math.abs(maxCamber) < 0.005) {
    stallAngleEstimate = Math.min(15, 14 + maxThickness * 100 * -0.15 + 0.5);
  } else if (Math.abs(maxCamber) < 0.03) {
    stallAngleEstimate = Math.min(16, 15 + maxThickness * 100 * -0.10 + 0.5);
  } else {
    stallAngleEstimate = 13;
  }
  stallAngleEstimate = Math.max(8, Math.min(20, Math.round(stallAngleEstimate * 10) / 10));

  return {
    maxThickness: Math.round(maxThickness * 10000) / 10000,
    maxThicknessLocation: Math.round(maxThicknessLocation * 100) / 100,
    maxCamber: Math.round(maxCamber * 10000) / 10000,
    maxCamberLocation: Math.round(maxCamberLocation * 100) / 100,
    chordLengthNormalized: 1,
    airfoilTypeEstimate,
    stallAngleEstimate
  };
}

/*
 * Zero-lift angle from thin airfoil theory (Glauert, 1926).
 *
 * α_zeroLift = - 1/π ∫₀^π (dy_c/dx) (cos θ - 1) dθ
 *
 * where x = (1 - cos θ)/2 is the transformation to the angular coordinate θ.
 * The integral is evaluated numerically via finite differences along
 * the camber line. See: Glauert, H., "The Elements of Aerofoil and
 * Airscrew Theory", Cambridge University Press, 1926, Chapter VII.
 */
function computeZeroLiftAngle(upper, lower, numPoints) {
  numPoints = numPoints || 100;
  let integral = 0;

  for (let i = 1; i < numPoints; i++) {
    const x0 = (i - 1) / numPoints;
    const x1 = i / numPoints;
    const yc0 = (interpolateY(upper, x0) + interpolateY(lower, x0)) / 2;
    const yc1 = (interpolateY(upper, x1) + interpolateY(lower, x1)) / 2;
    const dyc_dx = (yc1 - yc0) / (x1 - x0);
    const xm = (x0 + x1) / 2;
    const theta = Math.acos(1 - 2 * xm);
    const width = (x1 - x0);
    integral += dyc_dx * (Math.cos(theta) - 1) * width;
  }

  const alphaZeroLift = -(1 / Math.PI) * integral;
  return alphaZeroLift;
}

/*
 * Compute full aerodynamic estimates from coordinates.
 * Used as fallback when predefined airfoil data is missing fields.
 */
function computeAerodynamicProperties(coordinates) {
  const normalized = normalizeCoordinates(coordinates);
  const { upper, lower } = splitUpperLower(normalized);

  const samplePoints = 100;
  let maxThickness = 0;
  let maxCamber = 0;

  for (let i = 0; i <= samplePoints; i++) {
    const x = i / samplePoints;
    const upperY = interpolateY(upper, x);
    const lowerY = interpolateY(lower, x);
    const thickness = upperY - lowerY;
    const camber = (upperY + lowerY) / 2;
    if (thickness > maxThickness) maxThickness = thickness;
    if (Math.abs(camber) > Math.abs(maxCamber)) maxCamber = camber;
  }

  const zeroLiftAngle = computeZeroLiftAngle(upper, lower, 200);
  const absCamber = Math.abs(maxCamber);

  let stallAngle;
  if (absCamber < 0.005) {
    stallAngle = 14 - 0.12 * maxThickness * 100;
  } else if (absCamber < 0.03) {
    stallAngle = 15 - 0.08 * maxThickness * 100;
  } else {
    stallAngle = 13 - 0.10 * (maxThickness * 100 - 12);
  }
  stallAngle = Math.round(Math.max(8, Math.min(20, stallAngle)) * 10) / 10;

  return {
    stallAngle,
    zeroLiftAngle: Math.round(zeroLiftAngle * 100) / 100,
    maxCamber: Math.round(maxCamber * 10000) / 10000,
    maxThickness: Math.round(maxThickness * 10000) / 10000
  };
}

function processAirfoilData(text) {
  const coordinates = parseAirfoilCoordinates(text);
  const geometry = calculateGeometry(coordinates);
  return { coordinates, geometry };
}

module.exports = {
  parseAirfoilCoordinates,
  normalizeCoordinates,
  splitUpperLower,
  interpolateY,
  calculateGeometry,
  computeZeroLiftAngle,
  computeAerodynamicProperties,
  processAirfoilData
};
