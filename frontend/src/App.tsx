import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MonitorPage from "./pages/MonitorPage";

import SmoothScroll from "./components/SmoothScroll";

function App() {
  return (
    <>
      <SmoothScroll />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
