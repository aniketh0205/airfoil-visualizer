function naca4Digit(name) {
  const digits = name.replace(/\D/g, '').padStart(4, '0').slice(0, 4);
  const m = parseInt(digits[0]) / 100;
  const p = parseInt(digits[1]) / 10;
  const t = parseInt(digits.slice(2)) / 100;

  function camber(x) {
    if (m === 0) return { yc: 0, dyc: 0 };
    if (x < p) {
      const yc = (m / (p * p)) * (2 * p * x - x * x);
      const dyc = (2 * m / (p * p)) * (p - x);
      return { yc, dyc };
    }
    const yc = (m / ((1 - p) * (1 - p))) * (1 - 2 * p + 2 * p * x - x * x);
    const dyc = (2 * m / ((1 - p) * (1 - p))) * (p - x);
    return { yc, dyc };
  }

  function thickness(x) {
    return 5 * t * (
      0.2969 * Math.sqrt(x) -
      0.1260 * x -
      0.3516 * x * x +
      0.2843 * x * x * x -
      0.1015 * x * x * x * x
    );
  }

  const n = 100;
  const coords = [];
  const r = v => Math.round(v * 10000) / 10000;

  // Upper surface: TE (x=1) → LE (x=0)
  for (let i = n; i >= 0; i--) {
    const x = i / n;
    const yt = thickness(x);
    const { yc, dyc } = camber(x);
    const theta = Math.atan(dyc);
    coords.push({ x: r(x - yt * Math.sin(theta)), y: r(yc + yt * Math.cos(theta)) });
  }
  // Lower surface: LE (x=0) → TE (x=1)
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    const yt = thickness(x);
    const { yc, dyc } = camber(x);
    const theta = Math.atan(dyc);
    coords.push({ x: r(x + yt * Math.sin(theta)), y: r(yc - yt * Math.cos(theta)) });
  }

  return coords;
}

function generateGeometry(name) {
  const digits = name.replace(/\D/g, '').padStart(4, '0').slice(0, 4);
  const m = parseInt(digits[0]) / 100;
  const p = parseInt(digits[1]) / 10;
  const t = parseInt(digits.slice(2)) / 100;

  let type, stallAngle, zeroLiftAngle, description, baseDrag;
  if (m < 0.005) {
    type = 'Symmetric';
    stallAngle = 14;
    zeroLiftAngle = 0;
    description = `A symmetric airfoil with ${(t * 100).toFixed(0)}% thickness. Zero lift at 0° AoA. Used for high-speed applications and control surfaces.`;
  } else if (m < 0.03) {
    type = 'Mildly cambered';
    stallAngle = 14;
    zeroLiftAngle = -(m * 80);
    description = `A ${(m * 100).toFixed(0)}% cambered airfoil with ${(t * 100).toFixed(0)}% thickness. Good general-purpose characteristics with moderate lift.`;
  } else {
    type = 'Moderately cambered';
    stallAngle = 14;
    zeroLiftAngle = -(m * 80);
    description = `A ${(m * 100).toFixed(0)}% cambered airfoil with ${(t * 100).toFixed(0)}% thickness. High lift at low speeds, suitable for light aircraft and gliders.`;
  }

  if (t > 0.15) stallAngle = 13;
  baseDrag = 0.005 + t * 0.015;

  return {
    maxThickness: t,
    maxThicknessLocation: 0.3,
    maxCamber: m,
    maxCamberLocation: p || 0,
    zeroLiftAngle,
    stallAngle,
    baseDragCoefficient: Math.round(baseDrag * 1000) / 1000,
    type,
    description,
    camberDescription: m < 0.005 ? 'No camber (symmetric)' : `${(m * 100).toFixed(0)}% camber at ${digits[1]}0% chord`
  };
}

module.exports = { naca4Digit, generateGeometry };
