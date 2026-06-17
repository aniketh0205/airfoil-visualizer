const STORAGE_KEY = 'airfoil-visualizer-custom-airfoils';

export function getCustomAirfoils() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCustomAirfoil(airfoil) {
  const airfoils = getCustomAirfoils();
  airfoils.push({
    ...airfoil,
    id: Date.now().toString(),
    addedAt: new Date().toISOString()
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(airfoils));
  return airfoils;
}

export function deleteCustomAirfoil(id) {
  const airfoils = getCustomAirfoils().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(airfoils));
  return airfoils;
}

export function clearCustomAirfoils() {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}
