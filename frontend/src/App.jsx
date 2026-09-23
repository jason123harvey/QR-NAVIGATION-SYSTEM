import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Navigation from './pages/Navigation';
import MapPage from './pages/Map';
import Admin from './pages/Admin';

export default function App() {
  const [currentLocation, setCurrentLocation] = useState(null);

  return (
    <Router>
      <div className="app-container">
        <Navbar currentLocation={currentLocation} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<Home onSetCurrentLocation={setCurrentLocation} />}
            />
            <Route
              path="/scan"
              element={
                <Scanner
                  currentLocation={currentLocation}
                  onSetCurrentLocation={setCurrentLocation}
                />
              }
            />
            <Route
              path="/navigate"
              element={
                <Navigation
                  currentLocation={currentLocation}
                  onSetCurrentLocation={setCurrentLocation}
                />
              }
            />
            <Route
              path="/map"
              element={
                <MapPage
                  currentLocation={currentLocation}
                  onSetCurrentLocation={setCurrentLocation}
                />
              }
            />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
