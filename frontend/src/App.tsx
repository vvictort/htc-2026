import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MonitorPage from "./pages/MonitorPage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import AuthShowcase from "./pages/AuthShowcase";
import AboutPage from "./pages/AboutPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import OnboardingPage from "./pages/OnboardingPage";
import BabyDevicePage from "./pages/BabyDevicePage";
import CVDebug from "./components/CVDebug";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/monitor" element={<MonitorPage />} />
        <Route path="/baby" element={<BabyDevicePage />} />
        <Route path="/cv-debug" element={<CVDebug />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/auth-showcase" element={<AuthShowcase />} />

        {/* Onboarding Route */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
