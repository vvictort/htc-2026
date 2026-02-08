import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MonitorPage from "./pages/MonitorPage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AuthShowcase from "./pages/AuthShowcase";
import AboutPage from "./pages/AboutPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/monitor" element={<MonitorPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/auth-showcase" element={<AuthShowcase />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
