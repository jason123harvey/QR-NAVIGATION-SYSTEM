# Implementation Plan: QR-Based Indoor Navigation System

Build a complete, production-ready, full-stack **QR-Based Indoor Navigation System** designed for large complexes (universities, hospitals, shopping malls, corporate campuses). The application enables users to scan a QR code at any physical location to immediately pinpoint their position, select any destination room or facility across multiple floors, and follow an animated, turn-by-turn indoor route visualized on an interactive custom SVG map.

---

## User Review Required

> [!IMPORTANT]
> - **Custom SVG Indoor Map**: Rather than depending on standard GPS mapping (which fails indoors and does not have indoor floor geometry), the system will use a dedicated custom SVG-based indoor mapping engine with 3 floors (Ground, First, Second Floor) for the sample building *"ABC Engineering College - Main Block"*.
> - **Manual Dijkstra Implementation**: We will implement Dijkstra's shortest-path algorithm from scratch in Python (`navigation.py`) and provide structured turn-by-turn navigation instructions (including hallway turns, staircase climbing, elevator transitions, and distance/time estimations).
> - **QR Integration**: Supports real camera scanning via `html5-qrcode`, manual code entry fallback, direct URL parameters (`/scan?location=MAIN_ENTRANCE`), and an admin dashboard to generate and download printable QR code batches.

---

## Proposed Architecture & File Structure

```
qr-indoor-navigation/
├── backend/
│   ├── app.py                   # Flask REST API server with CORS and error handlers
│   ├── database.py              # SQLite connection, table schema creation, seed building data
│   ├── models.py                # Location, Connection, QRCode data models & DB helpers
│   ├── navigation.py            # Custom Dijkstra shortest-path algorithm & instruction generator
│   ├── qr_generator.py          # QR code generation with base64 data URLs & PNG export
│   ├── requirements.txt         # Python dependencies (Flask, Flask-CORS, qrcode, Pillow, etc.)
│   ├── test_navigation.py       # Unit tests for Dijkstra routing, multi-floor transitions, edge cases
│   └── test_api.py              # Integration tests for REST API endpoints & QR logic
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── styles.css           # Modern, responsive design system with glassmorphism & map styles
│       ├── components/
│       │   ├── Navbar.jsx           # Global responsive navigation bar with active location indicator
│       │   ├── QRScanner.jsx        # Camera-based QR scanner with html5-qrcode + fallback
│       │   ├── IndoorMap.jsx        # Interactive multi-floor SVG map with animated path overlays
│       │   ├── DestinationSearch.jsx# Autocomplete search by room, department, facility, or floor
│       │   ├── NavigationPanel.jsx  # Turn-by-turn direction cards, time/distance meters, floor steps
│       │   └── LocationCard.jsx     # Card displaying location details, type badge, & direct actions
│       ├── pages/
│       │   ├── Home.jsx             # Landing page with hero banner, quick start, and feature guide
│       │   ├── Scanner.jsx          # Dedicated QR scan page with camera + manual code entry
│       │   ├── Navigation.jsx       # Real-time indoor navigation route & live SVG floor map
│       │   ├── Map.jsx              # Floor-by-floor interactive explorer & directory
│       │   └── Admin.jsx            # Management dashboard for locations, connections & QR generator
│       └── services/
│           └── api.js               # Axios/Fetch API client connecting to Flask backend
└── README.md                    # Complete setup, architecture, and deployment guide
```

---

## Proposed Changes

### Backend Component

#### [NEW] [backend/requirements.txt](file:///c:/Users/Jason%20Harvey/navigation/backend/requirements.txt)
- Dependencies: `Flask==3.0.3`, `Flask-Cors==4.0.1`, `qrcode==7.4.2`, `Pillow==10.4.0`, `pytest==8.2.2`.

#### [NEW] [backend/database.py](file:///c:/Users/Jason%20Harvey/navigation/backend/database.py)
- SQLite database initialization.
- Schema creation:
  - `locations` table (`id`, `location_code`, `name`, `building`, `floor`, `type`, `x_coordinate`, `y_coordinate`, `description`)
  - `connections` table (`id`, `source_location`, `destination_location`, `distance`, `direction_hint`)
  - `qr_codes` table (`id`, `location_code`, `qr_data`, `created_at`)
- Automated seed script with realistic campus map for *"ABC Engineering College - Main Block"* spanning Ground Floor (Floor 0), First Floor (Floor 1), and Second Floor (Floor 2) with rooms, corridors, staircases, elevators, and cross-floor links.

#### [NEW] [backend/models.py](file:///c:/Users/Jason%20Harvey/navigation/backend/models.py)
- Helper classes and repository methods to fetch, create, update, and delete locations, connections, and QR records.

#### [NEW] [backend/navigation.py](file:///c:/Users/Jason%20Harvey/navigation/backend/navigation.py)
- Custom implementation of Dijkstra's algorithm:
  - Takes graph with weighted edges.
  - Priority queue / min-distance tracking to compute optimal route.
  - Generates detailed turn-by-turn guidance (detects floor changes via stair/elevator, straight corridors, left/right turns, destination arrival).
  - Calculates estimated walking time based on distance (1.2 m/s average speed) + floor transition delays (15s per stair flight, 25s per elevator ride).
  - Returns floor-by-floor segment breakdown for multi-floor map visualization.

#### [NEW] [backend/qr_generator.py](file:///c:/Users/Jason%20Harvey/navigation/backend/qr_generator.py)
- Generates QR codes encoded with standard scan URLs (`http://localhost:5173/scan?location=<code>`) or JSON payload.
- Returns Base64 data URLs for immediate frontend rendering and image stream downloads for batch printing.

#### [NEW] [backend/app.py](file:///c:/Users/Jason%20Harvey/navigation/backend/app.py)
- REST APIs:
  - `GET /api/locations` (supports filtering by floor, type, search term)
  - `GET /api/locations/<location_code>`
  - `POST /api/locations` (Admin: add location)
  - `PUT /api/locations/<location_code>` (Admin: edit location)
  - `DELETE /api/locations/<location_code>` (Admin: delete location)
  - `GET /api/connections` (Admin: list all graph edges)
  - `POST /api/connections` (Admin: add edge)
  - `DELETE /api/connections/<id>` (Admin: delete edge)
  - `POST /api/navigation/route` ({source, destination} -> Dijkstra path, distance, time, instructions, floor segments)
  - `GET /api/qr/<location_code>` (fetch/generate QR code base64)
  - `GET /api/stats` (Admin summary: total locations, QR codes, floors, routes)
  - `POST /api/admin/reset-db` (reset and reseed default college building map)

#### [NEW] [backend/test_navigation.py](file:///c:/Users/Jason%20Harvey/navigation/backend/test_navigation.py) & [test_api.py](file:///c:/Users/Jason%20Harvey/navigation/backend/test_api.py)
- Comprehensive test suite for Dijkstra shortest-path calculations, multi-floor transitions, unreachable destinations, same source/dest, and REST API validation.

---

### Frontend Component

#### [NEW] [frontend/package.json](file:///c:/Users/Jason%20Harvey/navigation/frontend/package.json) & [vite.config.js](file:///c:/Users/Jason%20Harvey/navigation/frontend/vite.config.js)
- React 18 / 19, React Router DOM v6, Lucide-React icons, html5-qrcode for browser camera QR scanning, canvas-confetti for destination arrival celebration.

#### [NEW] [frontend/src/styles.css](file:///c:/Users/Jason%20Harvey/navigation/frontend/styles.css)
- Premium design system:
  - Modern color tokens: Indigo/Violet primary, Emerald green for source, Crimson red for destination, Amber for stairs, Purple for elevators, Deep slate / clean light theme.
  - SVG map animations: Glowing pulsating source/destination markers, dash-animated walking paths, floor elevation badges.
  - Fully responsive for mobile phones, tablets, laptops, and desktop screens.

#### [NEW] [frontend/src/services/api.js](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/services/api.js)
- Fetch API client connecting to backend endpoints with fallback handling and unified response parsing.

#### [NEW] [frontend/src/components/IndoorMap.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/components/IndoorMap.jsx)
- Custom interactive SVG indoor floor map:
  - Renders building rooms, corridors, stairs, elevators, entrance, labels, and icons.
  - Displays currently selected floor (Floor 0, Floor 1, Floor 2) with smooth transitions.
  - Overlays calculated route paths for the selected floor with glowing animated dashed lines.
  - Room click inspection modal (View details, "Set as Start", "Set as Destination").
  - Pan/Zoom controls and mini-legend.

#### [NEW] [frontend/src/components/QRScanner.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/components/QRScanner.jsx)
- Device camera scanner using `html5-qrcode`.
- Graceful camera permission error handling with informative guide.
- Quick search / manual location code fallback input with instant suggestions.

#### [NEW] [frontend/src/components/DestinationSearch.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/components/DestinationSearch.jsx)
- Search destination by Room name, code, department (CSE, ECE, Mech), facility (Canteen, Library, Auditorium), or floor.
- Filter category pills and quick popular destination shortcuts.

#### [NEW] [frontend/src/components/NavigationPanel.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/components/NavigationPanel.jsx)
- Turn-by-turn guidance with step icons (Walk, Turn Left/Right, Take Staircase, Take Elevator, Arrive).
- Progress bar, remaining meters, estimated walking time countdown, multi-floor transition alerts.

#### [NEW] [frontend/src/pages/Home.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/pages/Home.jsx)
- Hero section with action buttons ("Scan QR Code", "Explore Map", "Browse Directory").
- Interactive 4-step workflow showcase.
- Quick-start sample location launcher (e.g., "Simulate standing at Main Entrance").

#### [NEW] [frontend/src/pages/Scanner.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/pages/Scanner.jsx)
- Full QR Scanner page supporting direct URL scan parameters (`/scan?location=MAIN_ENTRANCE`).
- Verified location card with building & floor indicators and 1-click "Choose Destination" transition.

#### [NEW] [frontend/src/pages/Navigation.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/pages/Navigation.jsx)
- Unified split/tab navigation view combining the dynamic multi-floor SVG map with the turn-by-turn instruction drawer.
- Automatic floor switching as user tracks route through stairs or elevators.
- Route reversal and shareable link generator.

#### [NEW] [frontend/src/pages/Map.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/pages/Map.jsx)
- Complete directory & map explorer with room search, floor selector tabs, and category filters.

#### [NEW] [frontend/src/pages/Admin.jsx](file:///c:/Users/Jason%20Harvey/navigation/frontend/src/pages/Admin.jsx)
- Administrator dashboard:
  - Metric cards: Total Locations, QR Codes, Floors, Active Routes.
  - Location CRUD management (Add, Edit, Delete location coordinates and metadata).
  - Graph connection manager (Add or remove hallway/stair links with distance weights).
  - QR Code Studio: Preview QR codes with college branding, download individual PNGs, or download all QR codes in a batch for physical printing.

---

## Verification Plan

### Automated Tests
1. Run backend unit tests using pytest:
   ```bash
   pytest backend/test_navigation.py backend/test_api.py -v
   ```
2. Verify:
   - Dijkstra finds true shortest path between ground floor and 2nd floor labs.
   - Floor transition logic accurately identifies staircases/elevators and calculates correct walking times.
   - Error handling for unreachable nodes and non-existent locations returns proper 404/400 status codes.

### Manual Verification Flows
1. **QR Scan Simulation**:
   - Navigate to `/scan?location=MAIN_ENTRANCE` and verify the app detects "Main Entrance, Ground Floor, Main Building".
   - Click "Choose Destination" -> Select "Computer Science Laboratory (CSE_LAB_1)".
   - Verify shortest route calculation: `MAIN_ENTRANCE -> CORRIDOR_G1 -> STAIR_1 -> STAIR_1_F1 -> CORRIDOR_F1_1 -> CSE_LAB_1`.
   - Verify interactive SVG map switches floors from Ground Floor to First Floor properly with animated route polyline.
2. **Turn-by-Turn Directions**:
   - Check distance in meters, estimated walking time in minutes, and step-by-step guidance cards.
3. **Admin & QR Management**:
   - Open `/admin`, add a new location, generate a new QR code, preview and test the generated link.
4. **Responsive Mobile View**:
   - Verify layout on mobile viewports (collapsible navigation panel, responsive map controls, touch-friendly UI).
