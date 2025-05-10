import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import './print.css';
import Dashboard from "./pages/Dashboard";
import Itinerary from "./pages/Itinerary";
import Planner from "./pages/Planner";
import Invoice from "./pages/Invoice";

import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/itinerary" element={<Itinerary />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/invoice" element={<Invoice />} />
      </Routes>
    </Router>
  );
}

export default App;
