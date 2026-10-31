# 🧭 NaviQR – QR-Based Indoor Navigation System

<p align="center">
  <strong>Smart Indoor Navigation Using QR Codes, Voice Interaction, and Shortest-Path Algorithms</strong>
</p>

<p align="center">
  <a href="https://navora-hm7w.onrender.com/">🌐 Live Demo</a> •
  <a href="https://github.com/jason123harvey/QR-NAVIGATION-SYSTEM">💻 GitHub Repository</a>
</p>

---

## 📌 Project Overview

**NaviQR** is a QR-based indoor navigation system designed to help visitors, students, and newcomers navigate complex indoor environments such as colleges, universities, offices, hospitals, and commercial buildings.

Traditional GPS navigation systems are not always suitable for indoor environments because GPS signals may be weak or unavailable inside buildings. NaviQR addresses this challenge by using QR codes to identify a user's known starting location and providing directions to a selected destination.

The system combines QR-code scanning, text-based destination selection, voice interaction, visual navigation, and shortest-path route calculation to create an accessible and user-friendly indoor navigation experience.

## 🌐 Live Application

**Try NaviQR here:**

🔗 https://navora-hm7w.onrender.com/

## 🎯 Problem Statement

Finding specific rooms, laboratories, departments, or facilities inside large buildings can be difficult, particularly for first-time visitors.

Existing outdoor navigation solutions often cannot provide reliable indoor directions. Visitors may need to depend on signboards, printed maps, or assistance from other people.

NaviQR aims to simplify indoor navigation by providing a digital solution that identifies a known starting location through QR scanning and calculates a suitable route to the user's selected destination.

## 💡 Proposed Solution

NaviQR provides an interactive indoor navigation platform with the following workflow:

1. Scan a QR code placed at a known indoor location.
2. Identify the corresponding starting location.
3. Select or enter the required destination.
4. Retrieve indoor location and connection information.
5. Calculate a minimum-distance route using Dijkstra's algorithm.
6. Display navigation information through the application interface.
7. Provide supported voice commands and spoken navigation instructions.

## ✨ Key Features

### 1. QR-Based Location Identification
- Scan QR codes using a device camera.
- Identify the location associated with the scanned QR code.
- Use the identified location as the navigation starting point.

### 2. Smart Indoor Navigation
- Select or enter an indoor destination.
- Calculate routes between connected locations.
- Generate navigation directions using indoor map data.

### 3. Shortest-Path Route Calculation
- Uses Dijkstra's shortest-path algorithm.
- Represents indoor locations using a weighted graph.
- Calculates a minimum-distance route based on available connection weights.

### 4. Voice-Based Interaction
- Supports spoken navigation commands.
- Uses browser speech recognition capabilities.
- Allows users to interact with supported navigation functions through voice.

### 5. Text-to-Speech Navigation
- Converts navigation instructions into spoken audio.
- Provides audio guidance through the browser's speech synthesis functionality.

### 6. Visual Navigation Interface
- Displays navigation information through an interactive web interface.
- Helps users understand the selected route and destination.

### 7. Indoor Location Management
- Stores indoor location and connection information.
- Uses a structured SQLite database.
- Supports retrieval of navigation data through the backend.

### 8. Multimodal Interaction
Combines multiple input and output modalities:
- QR-code/camera input
- Text input and output
- Voice input
- Visual navigation output
- Spoken audio directions

## 🧠 Navigation Algorithm

### Dijkstra's Shortest-Path Algorithm

NaviQR uses **Dijkstra's algorithm** to calculate a minimum-distance route between the starting location and the destination.

The indoor environment is represented as a weighted graph:

- **Nodes (Vertices):** Rooms, corridors, entrances, and other indoor locations.
- **Edges:** Walkable connections between locations.
- **Weights:** Distance or route cost associated with each connection.

The algorithm uses a priority queue to process the location with the smallest known distance and updates route costs until the destination's shortest distance is determined.

**Core technologies used:**
- Python `heapq` module
- Weighted graph representation
- Distance tracking
- Previous-node tracking
- Shortest-path reconstruction

**Note:** The current implementation uses Dijkstra's algorithm. A* pathfinding is not part of the identified current implementation.

## 🤖 Multimodal Technologies

NaviQR combines multiple interaction technologies to improve the navigation experience.

| Modality | Technology | Purpose |
|---|---|---|
| QR / Camera | html5-qrcode | Identifies a known starting location |
| Text | React and JavaScript | Destination selection and written instructions |
| Voice Input | Web Speech API | Recognizes supported spoken commands |
| Voice Output | Speech Synthesis API | Reads navigation instructions aloud |
| Visual Output | React UI | Displays navigation information |

**AI clarification:** The project uses algorithmic route planning and browser-based speech technologies. It does not currently rely on a separately trained machine-learning model or a generative AI model such as GPT or Gemini.

## 🛠️ Technology Stack

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite
- React Router
- Lucide React

### Backend
- Python
- Flask
- Flask-CORS
- REST API architecture

### Database
- SQLite

### Navigation and Interaction
- Dijkstra's shortest-path algorithm
- Python `heapq`
- html5-qrcode
- Web Speech API
- Speech Synthesis API

### Development and Deployment
- Visual Studio Code
- Git
- GitHub
- Render
- Gunicorn
- Pytest

## 🏗️ System Architecture

The application follows a frontend-backend architecture.

```text
             USER
               |
               v
       REACT FRONTEND
               |
      +--------+--------+
      |        |        |
      v        v        v
     QR      TEXT     VOICE
   SCANNER   INPUT    INPUT
      |        |        |
      +--------+--------+
               |
               v
          REST API
               |
               v
        PYTHON / FLASK
               |
       +-------+-------+
       |               |
       v               v
  SQLITE DATABASE   DIJKSTRA
       |               |
       +-------+-------+
               |
               v
       ROUTE DIRECTIONS
               |
       +-------+-------+
       |               |
       v               v
   VISUAL OUTPUT   SPEECH OUTPUT
```

### System Workflow

1. The user accesses the NaviQR web application.
2. The user scans a QR code to identify the starting location.
3. The user selects a destination.
4. The frontend communicates with the backend through REST API requests.
5. The backend retrieves location and connection information from SQLite.
6. Dijkstra's algorithm calculates the minimum-distance route.
7. The application presents navigation information through visual, text, and supported audio interactions.

## 🔄 Data Management

NaviQR uses a structured indoor navigation dataset stored in SQLite.

The application works with information such as:

- Indoor location identifiers
- Location names and descriptions
- Floor information
- Connections between locations
- Route distance or cost
- QR-code and location mappings

The backend can initialize sample indoor navigation data for demonstration and testing.

**Dataset Type:** Custom/sample indoor navigation data.

**Database:** SQLite.

**Training Dataset:** No separate machine-learning training dataset is required for the current Dijkstra-based navigation implementation.

## 📂 Project Structure

The project is organized into frontend and backend components.

```text
QR-NAVIGATION-SYSTEM/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NavigationPanel.jsx
│   │   │   └── QRScanner.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app.py
│   ├── navigation.py
│   ├── ...
│   └── ...
│
└── README.md
```

*Note: This is a simplified representation of the project structure. Additional files and folders may be present in the repository.*

## ⚙️ Installation and Setup

Follow these steps to run NaviQR locally.

### Prerequisites

Install the following software:

- Python 3.10 or later
- Node.js and npm
- Git
- Visual Studio Code (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/jason123harvey/QR-NAVIGATION-SYSTEM.git
```

### Step 2: Navigate to the Project

```bash
cd QR-NAVIGATION-SYSTEM
```

### Step 3: Set Up the Backend

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```powershell
venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask backend using the project's configured entry point:

```bash
python app.py
```

### Step 4: Set Up the Frontend

Open another terminal:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

### Step 5: Access the Application

Open the local URL displayed by Vite in your browser.

**Important:** Ensure that the frontend API configuration points to your locally running Flask backend when testing locally. QR scanning also requires browser camera permission and a supported secure context.

## 🧪 Testing

Testing helps ensure the reliability of the navigation system.

The project uses Pytest for backend testing.

Key areas for testing include:

- QR-code scanning and location identification
- Indoor location retrieval
- Route calculation
- Destination selection
- API communication
- Voice command interaction
- Navigation response handling
- Error and invalid-location handling

## 🚀 Deployment

The application is deployed using **Render**.

| Component | Platform / Technology |
|---|---|
| Source Code | GitHub |
| Frontend | React + Vite |
| Backend | Python + Flask |
| Database | SQLite |
| Application Hosting | Render |
| Production Server | Gunicorn |

**Live URL:** https://navora-hm7w.onrender.com/

## 🔮 Future Enhancements

Potential improvements for future versions include:

- A* pathfinding as an alternative to Dijkstra's algorithm.
- More detailed interactive 2D and 3D indoor maps.
- Improved voice recognition and multilingual support.
- More comprehensive accessibility features.
- Live indoor position tracking using additional positioning infrastructure.
- Dynamic route recalculation when paths become unavailable.
- Integration with additional building-floor datasets.
- Machine-learning-based navigation assistance, if supported by suitable data and requirements.

## 🎯 Applications

NaviQR can be adapted for indoor navigation in:

- Colleges and universities
- Hospitals and healthcare facilities
- Shopping malls
- Airports and railway stations
- Corporate offices
- Libraries and museums
- Large commercial buildings

## 👥 Project Information

**Project Name:** NaviQR – QR-Based Indoor Navigation System

**Project Category:** Web Application / Indoor Navigation

**Core Concept:** QR-Based Location Identification + Shortest-Path Navigation + Multimodal Interaction

**Main Algorithm:** Dijkstra's Shortest-Path Algorithm

**Backend Language:** Python

**Frontend Framework:** React.js

**Database:** SQLite

**Deployment:** Render

## 👨‍💻 Repository

GitHub Repository:

https://github.com/jason123harvey/QR-NAVIGATION-SYSTEM

Live Application:

https://navora-hm7w.onrender.com/

---

<p align="center">
  <strong>NaviQR – Navigate Smarter. Find Your Destination.</strong>
</p>

<p align="center">
  Built to make indoor navigation simpler, smarter, and more accessible.
</p>
