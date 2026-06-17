const API_BASE = '/api';

export async function fetchAirfoils() {
  const res = await fetch(`${API_BASE}/airfoils`);
  if (!res.ok) throw new Error('Failed to fetch airfoils');
  return res.json();
}

export async function calculate(params) {
  const res = await fetch(`${API_BASE}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Calculation failed');
  return res.json();
}

export async function processCustomAirfoil(name, coordinatesText) {
  const res = await fetch(`${API_BASE}/airfoil/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, coordinatesText })
  });
  if (!res.ok) throw new Error('Failed to process custom airfoil');
  return res.json();
}

export async function uploadAirfoilFile(file, name) {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  const res = await fetch(`${API_BASE}/airfoil/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'File upload failed');
  }
  return res.json();
}

export async function compareAirfoils(params) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Comparison failed');
  return res.json();
}

export async function fetchQuiz() {
  const res = await fetch(`${API_BASE}/quiz`);
  if (!res.ok) throw new Error('Failed to fetch quiz');
  return res.json();
}

export async function login(password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

export async function fetchContent() {
  const res = await fetch(`${API_BASE}/content`);
  if (!res.ok) throw new Error('Failed to fetch content');
  return res.json();
}

export async function createTopic(topic, token) {
  const res = await fetch(`${API_BASE}/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(topic)
  });
  if (!res.ok) throw new Error('Failed to create topic');
  return res.json();
}

export async function updateTopic(id, fields, token) {
  const res = await fetch(`${API_BASE}/content/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(fields)
  });
  if (!res.ok) throw new Error('Failed to update topic');
  return res.json();
}

export async function deleteTopic(id, token) {
  const res = await fetch(`${API_BASE}/content/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete topic');
  return res.json();
}
