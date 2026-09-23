# 🧭 NaviQR — QR-Based Indoor Navigation System

A full-stack, intelligent **Indoor Navigation System** designed for large campuses, colleges, hospitals, shopping malls, and corporate office complexes. The system enables visitors and new students to pinpoint their exact indoor position by scanning physical QR codes and follow turn-by-turn routes visualized on an interactive, custom multi-floor SVG map calculated using Dijkstra's shortest path algorithm.

---

## 📌 Problem Statement

Traditional GPS systems fail inside buildings due to concrete walls, multiple floor elevations, and signal attenuation. Visitors in large complexes (such as first-year college students, hospital patients, or seminar guests) often get disoriented trying to locate specific laboratories, lecture halls, administrative desks, or amenities across multiple floors.

**NaviQR solves this problem** by utilizing strategically placed QR code signs at doorways, entrance lobbies, stairwells, and elevator hubs to establish instant ground truth positioning without requiring complex hardware beacons or GPS.

---

## 🎯 System Workflow

```
       [ Physical QR Code Placed on Wall / Door ]
                           │
                           ▼
          User Scans QR Code via Phone Camera
          (or opens /scan?location=MAIN_ENTRANCE)
                           │
                           ▼
    Backend Identifies Location & Floor Coordinates
                           │
                           ▼
               User Selects Destination
      (Search by Room, Dept, Facility, or Floor)
                           │
                           ▼
       Manual Dijkstra Algorithm Calculates Route
   (Weights = Distance + Floor Elevation Penalties)
                           │
                           ▼
    Dynamic Multi-Floor SVG Map Renders Route Line
  (Animated glowing dash paths + Turn-by-Turn Guidance)
                           │
                           ▼
         User Follows Route & Arrives at Venue
```

---

## 🚀 Key Features

1. **Camera QR Code Scanner (`html5-qrcode`)**:
   - Scans camera QR codes seamlessly in mobile and desktop browsers.
   - Includes manual code fallback and instant sample location testing pills.
   - Automatically handles direct QR query URLs (`http://localhost:5173/scan?location=CSE_LAB_1`).

2. **Custom SVG Multi-Floor Indoor Map**:
   - Fully interactive 3-Floor Architectural Map for *"ABC Engineering College - Main Block"*.
   - Renders Ground Floor (0), First Floor (1), and Second Floor (2).
   - Dynamic path overlay with glowing animated dashed line transitions.
   - Distinct color-coded nodes for laboratories, classrooms, libraries, elevators, stairwells, and cafeterias.
   - Clickable room nodes with popovers to "Set Start" or "Set Destination".
   - Zoom in, Zoom out, and Reset controls.

3. **Manual Dijkstra Shortest Path Algorithm**:
   - Implemented from scratch in Python (`navigation.py`).
   - Computes exact walking distance (meters) and estimated walking time.
   - Generates human-readable, step-by-step turn guidance including staircase climbing and elevator transitions.

4. **Multi-Floor Vertical Navigation**:
   - Supports vertical routing across floors through Staircases (Stair 1, Stair 2) and Elevators (Lift 1).
   - Visual floor indicators and automatic floor switching on the map as the user advances through the route.

5. **Destination Search & Autocomplete**:
   - Search by room name, department, room code, or facility type.
   - Category filter pills (Labs, Classrooms, Departments, Amenities, All Floors).

6. **Admin Management Dashboard & QR Studio**:
   - Live KPI Metrics: Total Locations, Active QR Codes, Floors, and Graph Connections.
   - **Locations Directory**: Add, edit, or delete indoor nodes with coordinate assignment.
   - **QR Code Studio**: Live QR preview with college branding, individual PNG downloads, and batch printing support.
   - **Graph Connection Manager**: Add or remove hallway and stair connections with custom distance weights.
   - **Database Reset**: 1-click restore to sample college building dataset.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React.js 18 (Vite) |
| **Routing** | React Router DOM v6 |
| **Icons & UI** | Lucide React |
| **QR Code Engine** | `html5-qrcode` (camera capture) |
| **Animations** | CSS3 SVG Animations & Canvas-Confetti |
| **Backend Framework** | Python 3 (Flask) with Flask-CORS |
| **Database** | SQLite3 (`database.db`) |
| **QR Code Generation** | `qrcode` & Pillow (PIL) |
| **Shortest Path Algorithm** | Dijkstra Algorithm (Min-Heap Priority Queue) |
| **Automated Testing** | Pytest |

---

## 📁 Project Structure

```
navigation/
├── backend/
│   ├── app.py                   # Flask REST API endpoints and CORS configuration
│   ├── database.py              # SQLite schema, connection pool, and seed data
│   ├── models.py                # Data access layer for locations, connections, QR codes
│   ├── navigation.py            # Dijkstra algorithm & turn-by-turn guidance engine
│   ├── qr_generator.py          # QR generator with base64 encoding and PNG streaming
│   ├── requirements.txt         # Python backend dependencies
│   ├── database.db              # SQLite database (auto-generated)
│   ├── test_navigation.py       # Unit tests for Dijkstra routing & edge cases
│   └── test_api.py              # Integration tests for Flask REST endpoints
├── frontend/
│   ├── index.html               # HTML entry point with responsive viewport
│   ├── package.json             # NPM dependencies and build scripts
│   ├── vite.config.js           # Vite dev server configuration with API proxy
│   └── src/
│       ├── main.jsx             # React entry point
│       ├── App.jsx              # Global route provider and location state
│       ├── styles.css           # Modern design system, glassmorphism, and SVG animations
│       ├── services/
│       │   └── api.js           # Frontend API client
│       ├── components/
│       │   ├── Navbar.jsx           # Global navigation bar with active location pill
│       │   ├── IndoorMap.jsx        # Interactive multi-floor SVG map component
│       │   ├── QRScanner.jsx        # Camera QR scanner with manual fallback
│       │   ├── DestinationSearch.jsx# Autocomplete destination search
│       │   ├── NavigationPanel.jsx  # Turn-by-turn guidance and audio assistance
│       │   └── LocationCard.jsx     # Reusable venue detail cards
│       └── pages/
│           ├── Home.jsx             # Landing page with hero & workflow guide
│           ├── Scanner.jsx          # Dedicated QR scanning & verification page
│           ├── Navigation.jsx       # Real-time indoor navigation screen
│           ├── Map.jsx              # Campus directory & floor explorer
│           └── Admin.jsx            # Management dashboard & QR code studio
└── README.md                    # Comprehensive documentation
```

---

## ⚡ Installation & Running Instructions

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** and **npm**

### 2. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask backend server
python app.py
```
> The backend server will start on `http://127.0.0.1:5000`. The SQLite database initializes and seeds automatically on startup.

### 3. Frontend Setup
```bash
# In a new terminal window, navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
> The frontend application will launch on `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run the backend Pytest test suite:
```bash
cd backend
venv\Scripts\pytest -v
```
All 19 unit and integration tests will execute, validating:
- Dijkstra shortest path calculations
- Multi-floor staircase and elevator transitions
- Unreachable and non-existent destination error handling
- QR code image generation and downloading
- REST API response schemas

---

## 📡 REST API Documentation

### 1. Get All Locations
- **`GET /api/locations`**
- **Query Parameters**:
  - `floor` (optional, integer): `0`, `1`, `2`
  - `type` (optional, string): `laboratory`, `classroom`, `library`, etc.
  - `search` (optional, string): Search query
- **Sample Response**:
```json
[
  {
    "id": 1,
    "location_code": "MAIN_ENTRANCE",
    "name": "Main Entrance",
    "building": "Main Building",
    "floor": 0,
    "type": "entrance",
    "x_coordinate": 400.0,
    "y_coordinate": 540.0,
    "description": "Primary campus entrance gateway with security desk"
  }
]
```

### 2. Get Single Location
- **`GET /api/locations/<location_code>`**
- **Response**: Returns location object or `404 Not Found`.

### 3. Compute Navigation Route
- **`POST /api/navigation/route`**
- **Request Body**:
```json
{
  "source": "MAIN_ENTRANCE",
  "destination": "CSE_LAB_1"
}
```
- **Response**:
```json
{
  "success": true,
  "source": "MAIN_ENTRANCE",
  "source_name": "Main Entrance",
  "source_floor": 0,
  "destination": "CSE_LAB_1",
  "destination_name": "Computer Science Lab 1 (AI & ML)",
  "destination_floor": 1,
  "distance": 85.0,
  "distance_unit": "meters",
  "estimated_time": "1 min 30 sec",
  "estimated_time_seconds": 90,
  "floors_crossed": 1,
  "floors_in_route": [0, 1],
  "route": [
    "MAIN_ENTRANCE",
    "RECEPTION",
    "CORRIDOR_G1",
    "CORRIDOR_G_WEST",
    "STAIR_1",
    "STAIR_1_F1",
    "CORRIDOR_F1_WEST",
    "CSE_LAB_1"
  ],
  "instructions": [
    "Start at Main Entrance on Ground Floor.",
    "Walk straight ahead into the lobby (12m).",
    "Continue past reception towards central hallway (10m).",
    "Turn left toward the West corridor (15m).",
    "Walk north towards West Staircase 1 (14m).",
    "Take Staircase 1 up to First Floor.",
    "Walk north-west into Computer Science Lab 1 (AI & ML) (18m).",
    "Arrive at destination: Computer Science Lab 1 (AI & ML) on First Floor."
  ]
}
```

### 4. Get QR Code Base64 Data
- **`GET /api/qr/<location_code>`**
- **Response**:
```json
{
  "location_code": "MAIN_ENTRANCE",
  "name": "Main Entrance",
  "floor": 0,
  "qr_payload": "http://localhost:5173/scan?location=MAIN_ENTRANCE",
  "qr_image_base64": "data:image/png;base64,..."
}
```

### 5. Download QR Code PNG
- **`GET /api/qr/<location_code>/download`**
- **Response**: PNG image attachment file `QR_MAIN_ENTRANCE.png`.

---

## 🔬 Dijkstra Algorithm Explanation

The indoor graph $G = (V, E)$ is modeled with:
- **Vertices ($V$)**: Every indoor room, corridor junction, entrance, stairwell landing, and elevator stop.
- **Edges ($E$)**: Physical walkable pathways connecting adjacent nodes with weight $w(u, v)$ equal to physical walking distance in meters.
- **Vertical Transitions**: Staircases and elevators create inter-floor edges between $(u, v)$ where $floor(u) \ne floor(v)$.

### Algorithm Steps in `navigation.py`:
1. Initialize distance to start node $d(start) = 0$ and all other nodes $d(v) = \infty$.
2. Maintain a Min-Heap priority queue of $(distance, node)$.
3. Pop the unvisited node $u$ with minimum distance.
4. For every neighbor $v$ of $u$, calculate candidate distance:
   $$new\_dist = d(u) + w(u, v)$$
5. If $new\_dist < d(v)$, update $d(v) = new\_dist$, record predecessor $prev(v) = u$, and push $(new\_dist, v)$ into the priority queue.
6. Once destination node is popped, trace back from destination via $prev$ pointers to construct the optimal route path.
7. Post-process path nodes to extract floor transitions, compute estimated walking duration ($1.2\text{ m/s} + \text{floor penalties}$), and construct turn-by-turn guidance sentences.

---

## 🏢 Sample Building Blueprint

**Building Name**: ABC Engineering College - Main Block
- **Ground Floor (Floor 0)**: Main Entrance, Reception & Info Desk, College Canteen, Main Auditorium, Admin Office, West Staircase 1, East Staircase 2, Central Elevator 1, Corridors.
- **First Floor (Floor 1)**: CSE Department Office, Computer Science Lab 1 (AI & ML), Computer Science Lab 2 (Software Dev), Classroom 101, Classroom 102, Central Digital Library, CSE Faculty Room, West Staircase 1, East Staircase 2, Elevator 1.
- **Second Floor (Floor 2)**: ECE Department Office, VLSI & Embedded Systems Lab, Mechanical Engineering Dept, Executive Seminar Hall, Robotics Research Lab, West Staircase 1, East Staircase 2, Elevator 1.

---

## 🔮 Future Enhancements

- **A\* Pathfinding Integration**: Incorporate Euclidean coordinate heuristics for even faster path calculations in massive university campuses.
- **Wheelchair / Accessibility Routing Mode**: Add route preference filters that avoid staircases and prioritize elevator paths only.
- **BLE Beacon Snapping**: Hybrid BLE RSSI signal fusion to automatically advance navigation steps as user walks through hallways.
- **3D Digital Twin Visualization**: Interactive Three.js 3D building exploration.
#   Q R - N A V I G A T I O N - S Y S T E M  
 