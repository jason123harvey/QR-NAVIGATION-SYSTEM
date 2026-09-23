import React, { useState, useEffect } from 'react';
import { 
  Building, QrCode, Layers, GitFork, Plus, Trash2, 
  Edit3, Download, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Eye 
} from 'lucide-react';
import { 
  fetchStats, fetchLocations, fetchConnections, 
  createLocation, updateLocation, deleteLocation, 
  createConnection, deleteConnection, resetDatabase,
  getQRDownloadUrl, getQRBatchDownloadUrl, fetchQRCode
} from '../services/api';
import { formatFloor, getLocationIcon } from '../components/LocationCard';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState('locations'); // 'locations' | 'qrcodes' | 'connections'
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modals state
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [qrPreviewModal, setQrPreviewModal] = useState(null);
  const [qrImages, setQrImages] = useState({});
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);

  // Form states for Location
  const [formData, setFormData] = useState({
    location_code: '',
    name: '',
    building: 'Main Building',
    floor: 0,
    type: 'classroom',
    x_coordinate: 400,
    y_coordinate: 300,
    description: '',
  });

  // Form state for Connection
  const [connFormData, setConnFormData] = useState({
    source_location: '',
    destination_location: '',
    distance: 15,
    direction_hint: '',
    bidirectional: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, locsData, connsData] = await Promise.all([
        fetchStats(),
        fetchLocations(),
        fetchConnections(),
      ]);
      setStats(statsData);
      setLocations(locsData);
      setConnections(connsData);
    } catch (e) {
      console.error(e);
      showNotification('Failed to load admin dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'qrcodes' || locations.length === 0) return;
    let cancelled = false;
    Promise.all(locations.map((loc) => fetchQRCode(loc.location_code)))
      .then((codes) => {
        if (!cancelled) {
          setQrImages(Object.fromEntries(codes.map((code) => [code.location_code, code.qr_image_base64])));
        }
      })
      .catch(() => showNotification('Failed to load QR code previews', 'error'));
    return () => { cancelled = true; };
  }, [activeTab, locations]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAddLocation = () => {
    setEditingLocation(null);
    setFormData({
      location_code: '',
      name: '',
      building: 'Main Building',
      floor: 0,
      type: 'classroom',
      x_coordinate: 400,
      y_coordinate: 300,
      description: '',
    });
    setLocationModalOpen(true);
  };

  const handleOpenEditLocation = (loc) => {
    setEditingLocation(loc);
    setFormData({
      location_code: loc.location_code,
      name: loc.name,
      building: loc.building,
      floor: loc.floor,
      type: loc.type,
      x_coordinate: loc.x_coordinate,
      y_coordinate: loc.y_coordinate,
      description: loc.description || '',
    });
    setLocationModalOpen(true);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.location_code, formData);
        showNotification(`Location ${formData.location_code} updated successfully!`);
      } else {
        await createLocation(formData);
        showNotification(`Location ${formData.location_code} created successfully!`);
      }
      setLocationModalOpen(false);
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteLocation = async (code) => {
    if (window.confirm(`Are you sure you want to delete location "${code}" and all its connections?`)) {
      try {
        await deleteLocation(code);
        showNotification(`Location ${code} deleted.`);
        loadData();
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  const handleSaveConnection = async (e) => {
    e.preventDefault();
    try {
      await createConnection(connFormData);
      showNotification('Connection added successfully!');
      setConnectionModalOpen(false);
      loadData();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteConnection = async (id) => {
    if (window.confirm('Delete this connection edge?')) {
      try {
        await deleteConnection(id);
        showNotification('Connection deleted.');
        loadData();
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  const handleResetDB = async () => {
    if (window.confirm('Reset all campus locations and graph connections to the default campus blueprint?')) {
      try {
        await resetDatabase();
        showNotification('Database reset and seeded with default campus map.');
        loadData();
      } catch (err) {
        showNotification(err.message, 'error');
      }
    }
  };

  const handlePreviewQR = async (code) => {
    try {
      const qr = await fetchQRCode(code);
      setQrPreviewModal(qr);
    } catch (e) {
      showNotification('Failed to generate QR preview', 'error');
    }
  };

  return (
    <div className="admin-container">
      {/* Toast Notification */}
      {notification && (
        <div
          className="toast-notice"
          style={{ background: notification.type === 'error' ? 'var(--danger)' : 'var(--bg-dark)' }}
        >
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>
            Campus Navigation Management Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage indoor nodes, graph routing connections, and generate printable QR code signs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleResetDB} className="btn btn-secondary btn-sm" title="Restore Default Seed Data">
            <RefreshCw size={14} />
            <span>Reset Demo Map</span>
          </button>
          <button onClick={handleOpenAddLocation} className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      {/* Stats KPI Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Building size={24} />
            </div>
            <div>
              <div className="stat-val">{stats.total_locations}</div>
              <div className="stat-label">Total Locations</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <QrCode size={24} />
            </div>
            <div>
              <div className="stat-val">{stats.total_qr_codes}</div>
              <div className="stat-label">Total QR Codes</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Layers size={24} />
            </div>
            <div>
              <div className="stat-val">{stats.total_floors}</div>
              <div className="stat-label">Active Floors</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
              <GitFork size={24} />
            </div>
            <div>
              <div className="stat-val">{stats.total_connections}</div>
              <div className="stat-label">Graph Connections</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('locations')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'locations' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'locations' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          Locations Directory ({locations.length})
        </button>

        <button
          onClick={() => setActiveTab('qrcodes')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'qrcodes' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'qrcodes' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          QR Code Studio
        </button>

        <button
          onClick={() => setActiveTab('connections')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.95rem',
            borderBottom: activeTab === 'connections' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
            color: activeTab === 'connections' ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          Navigation Graph Connections ({connections.length})
        </button>
      </div>

      {/* TAB 1: Locations Table */}
      {activeTab === 'locations' && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Building & Floor</th>
                <th>Type</th>
                <th>Map Coordinates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.location_code}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                    {loc.location_code}
                  </td>
                  <td>{loc.name}</td>
                  <td>
                    {loc.building} • <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatFloor(loc.floor)}</span>
                  </td>
                  <td>
                    <span className={`loc-badge badge-${loc.type}`}>
                      {getLocationIcon(loc.type)}
                      {loc.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ({loc.x_coordinate}, {loc.y_coordinate})
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handlePreviewQR(loc.location_code)}
                        className="btn btn-sm btn-secondary"
                        title="View QR Code"
                      >
                        <QrCode size={13} />
                      </button>
                      <button
                        onClick={() => handleOpenEditLocation(loc)}
                        className="btn btn-sm btn-secondary"
                        title="Edit Location"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(loc.location_code)}
                        className="btn btn-sm btn-danger-outline"
                        title="Delete Location"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: QR Code Studio */}
      {activeTab === 'qrcodes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Download ready-to-print QR codes to mount across the building floors.
            </div>
            <a
              href={getQRBatchDownloadUrl()}
              download="NaviQR_codes.zip"
              className="btn btn-sm btn-primary"
            >
              <Download size={13} />
              <span>Download All ZIP</span>
            </a>
          </div>
          <div className="qr-grid">
            {locations.map((loc) => (
              <div key={loc.location_code} className="qr-card">
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {loc.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formatFloor(loc.floor)} • {loc.location_code}
                </div>

                <img
                  src={qrImages[loc.location_code]}
                  alt={`QR code for ${loc.name}`}
                  className="qr-img-preview"
                />

                <div style={{ display: 'flex', gap: '0.4rem', width: '100%', marginTop: '0.5rem' }}>
                  <a
                    href={getQRDownloadUrl(loc.location_code)}
                    download={`QR_${loc.location_code}.png`}
                    className="btn btn-sm btn-primary"
                    style={{ flex: 1, textDecoration: 'none' }}
                  >
                    <Download size={13} />
                    <span>Download PNG</span>
                  </a>
                  <a
                    href={`/scan?location=${loc.location_code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-secondary"
                    title="Test Scan URL"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Connections Table */}
      {activeTab === 'connections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Graph edges connecting rooms, corridors, stairwells, and elevator links
            </span>
            <button
              onClick={() => setConnectionModalOpen(true)}
              className="btn btn-sm btn-primary"
            >
              <Plus size={14} />
              <span>Add Connection</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source Location</th>
                  <th>Destination Location</th>
                  <th>Distance (m)</th>
                  <th>Turn Guidance Hint</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.source_location}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.source_name} ({formatFloor(c.source_floor)})</div>
                    </td>
                    <td>
                      <strong>{c.destination_location}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.destination_name} ({formatFloor(c.destination_floor)})</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.distance} m</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.direction_hint || '—'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteConnection(c.id)}
                        className="btn btn-sm btn-danger-outline"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Location Modal */}
      {locationModalOpen && (
        <div className="modal-backdrop" onClick={() => setLocationModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveLocation}>
              <div className="modal-header">
                <h3>{editingLocation ? `Edit Location: ${editingLocation.location_code}` : 'Add New Location Node'}</h3>
                <button type="button" onClick={() => setLocationModalOpen(false)}>✕</button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Location Code (ID)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingLocation}
                    className="input-control"
                    style={{ width: '100%', textTransform: 'uppercase' }}
                    placeholder="e.g., CSE_LAB_3, ROBOTICS_HALL"
                    value={formData.location_code}
                    onChange={(e) => setFormData({ ...formData, location_code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Display Name</label>
                  <input
                    type="text"
                    required
                    className="input-control"
                    style={{ width: '100%' }}
                    placeholder="e.g., Artificial Intelligence Research Wing"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Floor</label>
                    <select
                      className="input-control"
                      style={{ width: '100%' }}
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value, 10) })}
                    >
                      <option value="0">Ground Floor (0)</option>
                      <option value="1">1st Floor (1)</option>
                      <option value="2">2nd Floor (2)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Type</label>
                    <select
                      className="input-control"
                      style={{ width: '100%' }}
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="classroom">Classroom</option>
                      <option value="laboratory">Laboratory</option>
                      <option value="department">Department</option>
                      <option value="library">Library</option>
                      <option value="office">Office</option>
                      <option value="facility">Facility / Canteen</option>
                      <option value="auditorium">Auditorium</option>
                      <option value="entrance">Entrance</option>
                      <option value="staircase">Staircase</option>
                      <option value="elevator">Elevator</option>
                      <option value="corridor">Corridor Junction</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>X Coordinate (0 - 800)</label>
                    <input
                      type="number"
                      required
                      className="input-control"
                      style={{ width: '100%' }}
                      value={formData.x_coordinate}
                      onChange={(e) => setFormData({ ...formData, x_coordinate: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Y Coordinate (0 - 600)</label>
                    <input
                      type="number"
                      required
                      className="input-control"
                      style={{ width: '100%' }}
                      value={formData.y_coordinate}
                      onChange={(e) => setFormData({ ...formData, y_coordinate: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Description</label>
                  <textarea
                    className="input-control"
                    style={{ width: '100%', minHeight: '60px' }}
                    placeholder="Short description or instructions for visitors"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setLocationModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Connection Modal */}
      {connectionModalOpen && (
        <div className="modal-backdrop" onClick={() => setConnectionModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveConnection}>
              <div className="modal-header">
                <h3>Add Graph Edge / Route Connection</h3>
                <button type="button" onClick={() => setConnectionModalOpen(false)}>✕</button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Source Location</label>
                  <select
                    required
                    className="input-control"
                    style={{ width: '100%' }}
                    value={connFormData.source_location}
                    onChange={(e) => setConnFormData({ ...connFormData, source_location: e.target.value })}
                  >
                    <option value="">Select source location...</option>
                    {locations.map((loc) => (
                      <option key={loc.location_code} value={loc.location_code}>
                        {loc.name} ({loc.location_code}) - {formatFloor(loc.floor)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Destination Location</label>
                  <select
                    required
                    className="input-control"
                    style={{ width: '100%' }}
                    value={connFormData.destination_location}
                    onChange={(e) => setConnFormData({ ...connFormData, destination_location: e.target.value })}
                  >
                    <option value="">Select destination location...</option>
                    {locations.map((loc) => (
                      <option key={loc.location_code} value={loc.location_code}>
                        {loc.name} ({loc.location_code}) - {formatFloor(loc.floor)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Walking Distance (Meters / Edge Weight)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    className="input-control"
                    style={{ width: '100%' }}
                    value={connFormData.distance}
                    onChange={(e) => setConnFormData({ ...connFormData, distance: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Direction Guidance Hint</label>
                  <input
                    type="text"
                    className="input-control"
                    style={{ width: '100%' }}
                    placeholder="e.g., Turn left down the hallway, Walk past cafeteria"
                    value={connFormData.direction_hint}
                    onChange={(e) => setConnFormData({ ...connFormData, direction_hint: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="biCheck"
                    checked={connFormData.bidirectional}
                    onChange={(e) => setConnFormData({ ...connFormData, bidirectional: e.target.checked })}
                  />
                  <label htmlFor="biCheck" style={{ fontSize: '0.85rem' }}>
                    Create Bi-directional edge (Both directions walkable)
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setConnectionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {qrPreviewModal && (
        <div className="modal-backdrop" onClick={() => setQrPreviewModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>QR Code: {qrPreviewModal.location_code}</h3>
              <button type="button" onClick={() => setQrPreviewModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <img
                src={qrPreviewModal.qr_image_base64}
                alt="QR Code"
                style={{ width: '220px', height: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
              />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Payload:</strong> {qrPreviewModal.qr_payload}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <a
                href={getQRDownloadUrl(qrPreviewModal.location_code)}
                download={`QR_${qrPreviewModal.location_code}.png`}
                className="btn btn-primary btn-sm"
              >
                <Download size={14} />
                Download PNG
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
