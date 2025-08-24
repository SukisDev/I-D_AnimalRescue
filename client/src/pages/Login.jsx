import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const data = await login(email, password);
      // Redirige según rol
      if (data.user.role === "superadmin" || data.user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-cyan-50 to-blue-200 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
      >
        <h1 className="text-xl font-bold mb-4 text-blue-800">Iniciar sesión</h1>

        {err && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Correo</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mb-3 outline-none focus:ring focus:ring-blue-200"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <label className="block text-sm font-medium mb-1">Contraseña</label>
        <input
          className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring focus:ring-blue-200"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2 disabled:opacity-60"
          type="submit"
          disabled={busy}
        >
          {busy ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-blue-700 hover:underline">
            Crea una
          </Link>
        </p>

        {/* Botón para volver a la landing */}
        <Link
          to="/"
          className="mt-3 w-full inline-flex justify-center px-3 py-2 border rounded-lg text-sm font-semibold bg-white hover:bg-slate-50"
        >
          ← Volver al inicio
        </Link>
      </form>
    </div>
  );
}
