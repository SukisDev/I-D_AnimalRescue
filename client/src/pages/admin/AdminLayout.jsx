// client/src/pages/admin/AdminLayout.jsx
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const linkBase =
    "block px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 hover:text-white/90 transition";
  const linkActive = "bg-white/15 text-white";

  return (
    // ✅ NO cambiamos la grilla ni añadimos gap (así no se encoge el contenido)
    <div className="min-h-screen bg-slate-50 overflow-x-hidden lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside
        className={`z-40 bg-slate-900 text-white p-4 transition-transform
    fixed inset-y-0 left-0 w-72
    lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
    ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold leading-tight">Rescate Animal</h1>
            <p className="text-xs opacity-70 -mt-0.5">Panel de administración</p>
          </div>
          <button
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded hover:bg-white/10"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            type="button"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : "text-white/80"}`}
            onClick={() => setOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : "text-white/80"}`}
            onClick={() => setOpen(false)}
          >
            Reportes
          </NavLink>
          {user?.role === "superadmin" && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : "text-white/80"}`}
              onClick={() => setOpen(false)}
            >
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs opacity-80 space-y-2">
          <div>Sesión: {user?.email}</div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/")}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 font-semibold"
              title="Ver sitio público"
              type="button"
            >
              Ver sitio
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 font-semibold"
              type="button"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Topbar móvil */}
      <header className="lg:hidden sticky top-0 z-30 bg-white border-b">
        <div className="h-14 flex items-center justify-between px-4">
          <button
            className="inline-flex items-center justify-center w-10 h-10 rounded hover:bg-slate-100"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            type="button"
          >
            ☰
          </button>
          <div className="font-bold">Admin</div>
          <button
            className="text-sm px-3 py-1 rounded border hover:bg-slate-50"
            onClick={() => navigate("/")}
            type="button"
          >
            Ver sitio
          </button>
        </div>
      </header>

      {/* Contenido */}
      {/* ✅ Solo agregamos separación visual en desktop */}
      <main className="pt-14 lg:pt-6 p-4 lg:p-8 lg:border-l lg:border-slate-200 lg:pl-8">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Backdrop móvil */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
