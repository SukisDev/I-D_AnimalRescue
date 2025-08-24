// client/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo_AR.png";

const navLinks = [
  { label: "Inicio", href: "inicio" },
  { label: "¿Por qué?", href: "por-que" },
  { label: "Objetivos", href: "objetivos" },
  { label: "Equipo", href: "equipo" },
  { label: "Contacto", href: "contacto" },
];

export default function Navbar({ onNav, onToggleMap, isMap, id = "app-navbar" }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const prevOverflow = useRef("");
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // <- sesión
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll cuando el menú está abierto + restaurar correctamente
  useEffect(() => {
    if (menuOpen) {
      prevOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow.current || "";
    }
    return () => {
      document.body.style.overflow = prevOverflow.current || "";
    };
  }, [menuOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && setMenuOpen(false);
    if (menuOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // Si cambia a escritorio, cerramos el menú para evitar overflow trabado
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false); // lg
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const logoSize = navScrolled ? "w-9 h-9" : "w-14 h-14";

  const handleNavClick = (section) => {
    setMenuOpen(false);
    onNav?.(section);
  };

  const goMapOrHome = () => {
    if (isMap) {
      // Volver al landing y scrollear a inicio
      setMenuOpen(false);
      onToggleMap?.("landing");
      onNav?.("inicio");
    } else {
      // Ir al mapa
      setMenuOpen(false);
      onToggleMap?.("map");
    }
  };

  const goLogin = () => {
    setMenuOpen(false);
    navigate("/login");
  };

  const goAdmin = () => {
    setMenuOpen(false);
    navigate("/admin");
  };

  const doLogout = () => {
    setMenuOpen(false);
    logout();
    // Llevar a inicio visualmente
    onToggleMap?.("landing");
    onNav?.("inicio");
  };

  return (
    <header
      id={id}
      className={`fixed top-0 left-0 w-full z-40 transition-all duration-300
        ${
          navScrolled
            ? "bg-[#181d22]/90 shadow-lg py-1 border-b-2 border-blue-200"
            : "bg-[#1d232a]/90 border-b border-blue-100 py-2"
        }
      `}
    >
      <nav
        className="container mx-auto flex items-center justify-between px-4 md:px-8"
        role="navigation"
        aria-label="Principal"
      >
        <a
          href="#inicio"
          className="flex items-center gap-2 select-none group transition-all duration-200"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick("inicio");
          }}
        >
          <img
            src={logo}
            alt="Logo Rescate Animal"
            className={`${logoSize} object-contain rounded-full bg-white/80 shadow-md border-2 border-green-200 transition-all duration-200`}
            style={{ transitionProperty: "width, height" }}
          />
          <span
            className={`ml-2 font-extrabold tracking-tight transition-all duration-200
              ${navScrolled ? "text-base" : "text-xl"}
              text-yellow-400 drop-shadow-[0_1px_6px_rgba(30,70,130,0.08)] group-hover:text-yellow-300
            `}
          >
            Rescate Animal
          </span>
        </a>

        {/* Links desktop */}
        <ul className="hidden lg:flex items-center gap-2 font-semibold">
          {navLinks.map((link) => (
            <li key={link.href}>
              <button
                className="px-3 py-2 rounded-md text-white hover:text-blue-300 hover:bg-blue-900/30 transition"
                onClick={() => handleNavClick(link.href)}
              >
                {link.label}
              </button>
            </li>
          ))}

          {/* Ir al mapa / volver al inicio */}
          <li>
            <button
              className="ml-3 px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 via-blue-400 to-blue-700 font-bold text-white shadow hover:scale-105 hover:from-yellow-300 hover:to-blue-800 transition-all duration-200"
              onClick={goMapOrHome}
              aria-label={isMap ? "Volver al inicio" : "Explorar el mapa"}
              title={isMap ? "Volver al inicio" : "Explorar el mapa"}
            >
              {isMap ? "Volver al inicio" : "Explorar el Mapa"}
            </button>
          </li>

          {/* Auth */}
          {!user ? (
            <li>
              <button
                className="ml-2 px-4 py-2 rounded-lg border text-white hover:bg-blue-900/30 transition"
                onClick={goLogin}
              >
                Iniciar sesión
              </button>
            </li>
          ) : (
            <>
              {isAdmin && (
                <li>
                  <button
                    className="ml-2 px-4 py-2 rounded-lg border text-white hover:bg-blue-900/30 transition"
                    onClick={goAdmin}
                  >
                    Admin
                  </button>
                </li>
              )}
              <li>
                <button
                  className="ml-2 px-4 py-2 rounded-lg border text-white hover:bg-red-900/30 hover:text-red-200 transition"
                  onClick={doLogout}
                  title={`Cerrar sesión${user?.email ? `: ${user.email}` : ""}`}
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Botón hamburguesa mobile */}
        <button
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="lg:hidden relative z-50 flex flex-col items-center justify-center w-10 h-10"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span
            className={`block w-7 h-1 rounded-full bg-yellow-400 transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-7 h-1 rounded-full bg-yellow-400 transition-all duration-300 my-1 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-7 h-1 rounded-full bg-yellow-400 transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </nav>

      {/* Menú mobile (overlay) */}
      <div
        id="mobile-menu"
        className={`
          fixed inset-0 bg-[#181d22]/95 backdrop-blur-sm z-50 transition-all duration-300 flex flex-col
          ${menuOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"}
        `}
        style={{ minHeight: "100vh" }}
        aria-hidden={!menuOpen}
      >
        <div className="flex justify-end px-6 pt-6">
          <button
            className="text-yellow-400 text-4xl hover:text-yellow-300 transition"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          >
            &times;
          </button>
        </div>

        <nav className="flex flex-col items-end pr-10 mt-4 gap-7">
          {navLinks.map((link) => (
            <button
              key={link.href}
              className="text-xl text-white font-semibold hover:text-yellow-400 transition text-right"
              onClick={() => handleNavClick(link.href)}
            >
              {link.label}
            </button>
          ))}

          <button
            className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-blue-400 to-blue-700 font-bold text-white text-lg shadow hover:scale-105 hover:from-yellow-300 hover:to-blue-800 transition-all duration-200"
            onClick={goMapOrHome}
            aria-label={isMap ? "Volver al inicio" : "Explorar el mapa"}
            title={isMap ? "Volver al inicio" : "Explorar el mapa"}
          >
            {isMap ? "Volver al inicio" : "Explorar el Mapa"}
          </button>

          {/* Auth (mobile) */}
          {!user ? (
            <button
              className="mt-2 px-6 py-3 rounded-xl border text-white hover:bg-blue-900/30 transition"
              onClick={goLogin}
            >
              Iniciar sesión
            </button>
          ) : (
            <>
              {isAdmin && (
                <button
                  className="mt-2 px-6 py-3 rounded-xl border text-white hover:bg-blue-900/30 transition"
                  onClick={goAdmin}
                >
                  Admin
                </button>
              )}
              <button
                className="mt-2 px-6 py-3 rounded-xl border text-white hover:bg-red-900/30 hover:text-red-200 transition"
                onClick={doLogout}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
