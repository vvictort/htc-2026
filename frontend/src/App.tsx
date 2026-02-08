import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MonitorPage from './pages/MonitorPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/monitor" element={<MonitorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
