import { useEffect, useState, useMemo } from "react";
import { createAdmin, listUsers, updateUserRole } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function UsersAdmin() {
  const { user } = useAuth();
  const isSuper = user?.role === "superadmin";

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);

  // Form crear admin
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [passwordPlain, setPasswordPlain] = useState("");

  const normalizeUsers = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.users)) return payload.users;
    return [];
  };

  const fetchData = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(normalizeUsers(data));
    } catch (_e) {
      setErr("Error al cargar usuarios");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuper) {
      fetchData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuper]);

  const onCreateAdmin = async (e) => {
    e.preventDefault();
    setErr("");
    setCreating(true);
    try {
      await createAdmin({ name, email, password: passwordPlain }); // el server hashea
      setName("");
      setEmail("");
      setPasswordPlain("");
      await fetchData();
    } catch (e) {
      setErr(e?.response?.data?.message || "Error al crear admin");
    } finally {
      setCreating(false);
    }
  };

  const changeRole = async (id, role) => {
    setErr("");
    setBusyId(id);
    try {
      await updateUserRole(id, role);
      await fetchData();
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudo actualizar el rol");
    } finally {
      setBusyId(null);
    }
  };

  const hasUsers = useMemo(() => users && users.length > 0, [users]);

  if (!isSuper) return <Navigate to="/admin" replace />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Crear admin */}
      <section className="lg:col-span-1 bg-white rounded-2xl shadow p-5">
        <h2 className="text-lg font-bold text-blue-800 mb-3">Crear Admin</h2>
        {err && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}
        <form onSubmit={onCreateAdmin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-blue-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-blue-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring focus:ring-blue-200"
              value={passwordPlain}
              onChange={(e) => setPasswordPlain(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2 disabled:opacity-60"
            disabled={creating}
          >
            {creating ? "Creando..." : "Crear admin"}
          </button>
        </form>
      </section>

      {/* Lista usuarios */}
      <section className="lg:col-span-2 bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-blue-800">Usuarios</h2>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded-lg border text-slate-700 hover:bg-slate-50"
            disabled={loading}
            title="Refrescar"
          >
            {loading ? "..." : "Refrescar"}
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-blue-700">Cargando…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-blue-900">
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Rol</th>
                  <th className="text-left px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {hasUsers ? (
                  users.map((u) => {
                    const id = u._id || u.id;
                    return (
                      <tr key={id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">{u.name || "—"}</td>
                        <td className="px-3 py-2">{u.email || "—"}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 flex flex-wrap gap-2">
                          {u.role !== "admin" && (
                            <button
                              onClick={() => changeRole(id, "admin")}
                              className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                              disabled={busyId === id}
                            >
                              {busyId === id ? "..." : "Hacer Admin"}
                            </button>
                          )}
                          {u.role !== "user" && (
                            <button
                              onClick={() => changeRole(id, "user")}
                              className="px-3 py-1 rounded bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-60"
                              disabled={busyId === id}
                            >
                              {busyId === id ? "..." : "Hacer Usuario"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={4}>
                      No hay usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
