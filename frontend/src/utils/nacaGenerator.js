export function generateNACA(camber, position, thickness, numPoints = 100) {
  const m = camber / 100;
  const p = position / 100;
  const t = thickness / 100;

  const upper = [];
  const lower = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = i / numPoints;

    const yt = 5 * t * (
      0.2969 * Math.sqrt(x) -
      0.1260 * x -
      0.3516 * x * x +
      0.2843 * x * x * x -
      0.1015 * x * x * x * x
    );

    let yc = 0;
    let dyc = 0;

    if (x < p) {
      yc = (m / (p * p)) * (2 * p * x - x * x);
      dyc = (2 * m / (p * p)) * (p - x);
    } else {
      yc = (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * x - x * x);
      dyc = (2 * m / ((1 - p) * (1 - p))) * (p - x);
    }

    const theta = Math.atan(dyc);
    const xu = x - yt * Math.sin(theta);
    const yu = yc + yt * Math.cos(theta);
    const xl = x + yt * Math.sin(theta);
    const yl = yc - yt * Math.cos(theta);

    upper.push({ x: Math.round(xu * 10000) / 10000, y: Math.round(yu * 10000) / 10000 });
    lower.unshift({ x: Math.round(xl * 10000) / 10000, y: Math.round(yl * 10000) / 10000 });
  }

  return [...upper, ...lower];
}

export function nacaName(camber, position, thickness) {
  const m = Math.round(camber);
  const p = Math.round(position / 10);
  const t = Math.round(thickness);
  return `NACA ${m}${p}${String(t).padStart(2, '0')}`;
}

export function describeNACA(camber, position, thickness) {
  const parts = [];
  if (camber === 0) {
    parts.push('Symmetric airfoil (no camber)');
  } else {
    parts.push(`${camber}% max camber at ${position}% chord`);
  }
  parts.push(`${thickness}% maximum thickness`);
  return parts.join(' — ');
}
