const API_BASE = '/api';

export async function fetchLocations({ floor, type, search } = {}) {
  const params = new URLSearchParams();
  if (floor !== undefined && floor !== null && floor !== '') params.append('floor', floor);
  if (type) params.append('type', type);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/locations?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch locations');
  }
  return res.json();
}

export async function fetchLocationByCode(code) {
  const res = await fetch(`${API_BASE}/locations/${encodeURIComponent(code)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Location ${code} not found`);
  }
  return res.json();
}

export async function fetchRoute(source, destination) {
  const res = await fetch(`${API_BASE}/navigation/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, destination }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to compute route');
  }
  return data;
}

export async function fetchQRCode(code) {
  const res = await fetch(`${API_BASE}/qr/${encodeURIComponent(code)}`);
  if (!res.ok) {
    throw new Error(`Failed to load QR code for ${code}`);
  }
  return res.json();
}

export function getQRDownloadUrl(code) {
  return `${API_BASE}/qr/${encodeURIComponent(code)}/download`;
}

export function getQRBatchDownloadUrl(codes = []) {
  const query = codes.length ? `?locations=${codes.map(encodeURIComponent).join(',')}` : '';
  return `${API_BASE}/qr/batch/download${query}`;
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function createLocation(locationData) {
  const res = await fetch(`${API_BASE}/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(locationData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create location');
  return data;
}

export async function updateLocation(code, locationData) {
  const res = await fetch(`${API_BASE}/locations/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(locationData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update location');
  return data;
}

export async function deleteLocation(code) {
  const res = await fetch(`${API_BASE}/locations/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete location');
  return data;
}

export async function fetchConnections() {
  const res = await fetch(`${API_BASE}/connections`);
  if (!res.ok) throw new Error('Failed to fetch connections');
  return res.json();
}

export async function createConnection(connData) {
  const res = await fetch(`${API_BASE}/connections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create connection');
  return data;
}

export async function deleteConnection(id) {
  const res = await fetch(`${API_BASE}/connections/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete connection');
  return res.json();
}

export async function resetDatabase() {
  const res = await fetch(`${API_BASE}/admin/reset-db`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset database');
  return data;
}
