import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";

import MapView from "./components/MapView";
import SplashScreen from "./components/SplashScreen";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Reports from "./pages/admin/Reports";
import UsersAdmin from "./pages/admin/UsersAdmin";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { getReports } from "./services/api";
import "./App.css";

/**
 * Mantengo la lógica de home (Landing/Map) en un componente interno (HomeShell)
 * para que Router quede limpio. Navbar controla la navegación entre secciones,
 * incluso si vienes desde /login u /admin: primero navega a "/", luego hace scroll.
 */
function HomeShell() {
  const [reports, setReports] = useState([]);
  const [showMap, setShowMap] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // --- Refs de secciones de la landing ---
  const inicioRef = useRef(null);
  const porQueRef = useRef(null);
  const objetivosRef = useRef(null);
  const equipoRef = useRef(null);
  const contactoRef = useRef(null);

  // Agrupar refs (memoizado)
  const refsObj = useMemo(
    () => ({
      inicio: inicioRef,
      "por-que": porQueRef,
      objetivos: objetivosRef,
      equipo: equipoRef,
      contacto: contactoRef,
    }),
    []
  );

  // --- Util: scroll con offset del navbar ---
  const scrollToSection = useCallback(
    (key) => {
      const el = refsObj[key]?.current;
      if (!el) return;

      const nav = document.getElementById("app-navbar");
      const offset = (nav?.offsetHeight || 0) + 8;
      const rectTop = el.getBoundingClientRect().top;
      const top = window.scrollY + rectTop - offset;

      window.scrollTo({ top, behavior: "smooth" });
    },
    [refsObj]
  );

  // --- Navegación desde el Navbar ---
  const handleNav = useCallback(
    (sectionId) => {
      // Si NO estamos en "/", vamos primero a home y luego scrolleamos
      if (location.pathname !== "/") {
        navigate("/", { replace: false });
        requestAnimationFrame(() => {
          setTimeout(() => scrollToSection(sectionId || "inicio"), 0);
        });
        return;
      }

      if (showMap) {
        setShowMap(false);
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToSection(sectionId || "inicio");
          }, 0);
        });
      } else {
        scrollToSection(sectionId || "inicio");
      }
    },
    [location.pathname, navigate, showMap, scrollToSection]
  );

  // Toggle mapa desde el Navbar, desde cualquier ruta
  const handleToggleMap = useCallback(
    (target) => {
      // Asegura que estemos en home
      if (location.pathname !== "/") {
        navigate("/", { replace: false });
        requestAnimationFrame(() => {
          setTimeout(() => setShowMap(target === "map"), 0);
        });
      } else {
        setShowMap(target === "map");
      }
    },
    [location.pathname, navigate]
  );

  // Volver a landing desde el mapa
  const handleBackToLanding = useCallback(() => {
    setShowMap(false);
    requestAnimationFrame(() => {
      setTimeout(() => scrollToSection("inicio"), 0);
    });
  }, [scrollToSection]);

  // --- Carga de reportes (solo cuando se abre el mapa) ---
  const fetchReports = useCallback(async () => {
    try {
      const res = await getReports("pendiente");
      setReports(res.data);
    } catch (err) {
      console.error("🔴 Error al obtener reportes", err);
    }
  }, []);

  useEffect(() => {
    if (showMap) fetchReports();
  }, [showMap, fetchReports]);

  return (
    <>
      <Navbar onNav={handleNav} onToggleMap={handleToggleMap} isMap={showMap} />

      <main className="flex-1 flex flex-col">
        {!showMap ? (
          <LandingPage onStart={() => setShowMap(true)} refsObj={refsObj} />
        ) : (
          <MapView
            reports={reports}
            onReportUpdated={fetchReports}
            onBackToLanding={handleBackToLanding}
          />
        )}
      </main>
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  // --- Splash de inicio ---
  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeSplash(true), 1200);
    const hideTimer = setTimeout(() => setShowSplash(false), 1700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (showSplash) return <SplashScreen fadeOut={fadeSplash} />;

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-200">
        <Routes>
          {/* Home (Landing + Mapa controlado por Navbar) */}
          <Route path="/" element={<HomeShell />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Register */}
          <Route path="/register" element={<Register />} />

          {/* Admin protegido */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute roles={["admin", "superadmin"]}>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UsersAdmin />} />
          </Route>

          {/* Fallback simple */}
          <Route path="*" element={<HomeShell />} />
        </Routes>

        {/* Footer */}
        <footer className="w-full py-3 text-center text-xs text-blue-800/80 bg-blue-100 border-t mt-auto">
          © {new Date().getFullYear()} Rescate Animal | UTP Veraguas
        </footer>
      </div>
    </Router>
  );
}

export default App;
