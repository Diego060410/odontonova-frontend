import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { getUsuarioByUsername } from "../services/usuarioService";
import { getPacienteByUsuario } from "../services/pacienteService";
import { getOdontologoByUsuario } from "../services/odontologoService"; 

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Login inicial
      const res = await login({ username, password });
      
      localStorage.setItem("token", res.token);
      localStorage.setItem("rol", res.rol);
      localStorage.setItem("username", username);

      // 2. Obtener datos del usuario base
      const usuario = await getUsuarioByUsername(username);
      if (!usuario || (!usuario.idUsuario && !usuario.id)) {
        throw new Error("No se pudo obtener el id del usuario");
      }
      
      const idUsuarioLogueado = usuario.idUsuario || usuario.id;
      localStorage.setItem("id_usuario", idUsuarioLogueado);

      // --- LÓGICA DE REDIRECCIÓN POR ROL ---

      if (res.rol === "ADMIN") {
        navigate("/admin/dashboard");
        return;
      }

      // ✅ NUEVO: Redirección para Recepcionista
      if (res.rol === "RECEPCIONISTA") {
        navigate("/recepcion/dashboard");
        return;
      }
      
      if (res.rol === "ODONTOLOGO") {
        try {
          // Intentamos obtener el perfil de odontólogo
          const odontologo = await getOdontologoByUsuario(idUsuarioLogueado);
          
          if (odontologo) {
            // Guardamos el ID específico del odontólogo (importante para sus citas)
            const realIdOdontologo = odontologo.idOdontologo || odontologo.id;
            localStorage.setItem("id_odontologo", realIdOdontologo);
            navigate("/odontologo/dashboard");
          } else {
            // Si el login fue exitoso pero no hay perfil, notificamos al usuario
            setError("Error: Perfil profesional de odontólogo no encontrado.");
          }
        } catch (err) {
          console.error("Error al obtener perfil de odontólogo:", err);
          setError("No se pudo cargar tu perfil profesional. Contacta al admin.");
        }
        return;
      }

      if (res.rol === "USER") {
        try {
          const paciente = await getPacienteByUsuario(idUsuarioLogueado);
          if (!paciente) {
            navigate("/paciente/completar-perfil");
          } else {
            localStorage.setItem("id_paciente", paciente.idPaciente || paciente.id);
            navigate("/paciente/dashboard");
          }
        } catch (err) {
          navigate("/paciente/completar-perfil");
        }
        return;
      }

    } catch (err) {
      console.error("ERROR LOGIN:", err);
      const mensajeError = err.response?.data?.message || err.message || "Usuario o contraseña incorrectos";
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f4f8;
          font-family: 'DM Sans', sans-serif;
          padding: 1.5rem;
        }

        .login-card {
          display: flex;
          width: 100%;
          max-width: 980px;
          min-height: 620px;
          background: #ffffff;
          border-radius: 2rem;
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.04),
            0 20px 60px -10px rgba(14, 113, 205, 0.12),
            0 0 0 1px rgba(14, 113, 205, 0.06);
          overflow: hidden;
        }

        .login-panel-left {
          display: none;
          flex-direction: column;
          justify-content: flex-end;
          position: relative;
          width: 46%;
          flex-shrink: 0;
          background: #0a1628;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .login-panel-left { display: flex; }
        }

        .login-panel-left img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.35;
        }

        .deco-circle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(14,113,205,0.3) 0%, transparent 70%);
          pointer-events: none;
        }
        .deco-circle-1 { width: 300px; height: 300px; top: -80px; right: -80px; }
        .deco-circle-2 { width: 200px; height: 200px; bottom: 120px; left: -60px; }

        .left-badges {
          position: absolute;
          top: 2.5rem;
          left: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 2;
        }
        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(8px);
          color: rgba(255,255,255,0.85);
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
        }
        .badge-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #4ade80;
          flex-shrink: 0;
        }

        .left-content {
          position: relative;
          z-index: 2;
          padding: 2.5rem;
          border-top: 1px solid rgba(255,255,255,0.08);
          background: linear-gradient(to top, rgba(10,22,40,0.95) 0%, transparent 100%);
        }

        .left-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }
        .left-logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #0e71cd, #38bdf8);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .left-logo-name {
          font-family: 'DM Serif Display', serif;
          font-size: 1.2rem;
          color: #ffffff;
          letter-spacing: 0.01em;
        }
        .left-logo-name span { color: #38bdf8; }

        .left-tagline {
          font-size: 1.55rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.3;
          margin-bottom: 0.75rem;
          font-family: 'DM Serif Display', serif;
        }
        .left-tagline em { color: #38bdf8; font-style: normal; }

        .left-sub {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          font-weight: 400;
          line-height: 1.6;
        }

        .left-stats {
          display: flex;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }
        .stat-item { display: flex; flex-direction: column; }
        .stat-num {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
        }
        .stat-label {
          font-size: 0.62rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-top: 0.2rem;
        }
        .stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.12);
          align-self: stretch;
        }

        .login-panel-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 3.5rem;
        }

        @media (max-width: 767px) {
          .login-panel-right { padding: 2.5rem 1.75rem; }
        }

        .right-header { margin-bottom: 2.25rem; }

        .right-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          margin-bottom: 1rem;
        }

        .right-title {
          font-size: 1.7rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.3rem;
          letter-spacing: -0.02em;
          font-family: 'DM Serif Display', serif;
        }

        .right-subtitle {
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 400;
        }

        .field-group { margin-bottom: 1.1rem; }

        .field-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.45rem;
        }

        .field-wrap { position: relative; }

        .field-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.2s;
          flex-shrink: 0;
        }

        .field-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.75rem;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.875rem;
          font-size: 0.88rem;
          color: #0f172a;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .field-input::placeholder { color: #cbd5e1; }

        .field-input:focus {
          background: #ffffff;
          border-color: #0e71cd;
          box-shadow: 0 0 0 3px rgba(14,113,205,0.1);
        }

        .field-input.has-error {
          border-color: #f87171;
          background: #fff5f5;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.75rem;
          padding: 0.7rem 1rem;
          margin-bottom: 1.1rem;
          font-size: 0.8rem;
          color: #dc2626;
          font-weight: 500;
        }

        .btn-primary {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #0e71cd 0%, #1a83e0 100%);
          color: #ffffff;
          border: none;
          border-radius: 0.875rem;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
        }

        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
        }
        .divider-line { flex: 1; height: 1px; background: #e2e8f0; }
        .divider-label {
          font-size: 0.7rem;
          color: #cbd5e1;
          font-weight: 600;
          text-transform: uppercase;
        }

        .btn-secondary {
          width: 100%;
          padding: 0.9rem 1.5rem;
          background: #f8fafc;
          color: #475569;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.875rem;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .right-footer {
          margin-top: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid #f1f5f9;
        }
        .footer-shield { width: 14px; height: 14px; color: #94a3b8; }
        .footer-text {
          font-size: 0.65rem;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 600;
        }

        .field-wrap:focus-within .field-icon { color: #0e71cd; }
      `}</style>

      <div className="login-root">
        <div className="login-card">

          <div className="login-panel-left">
            <img
              src="https://img.freepik.com/fotos-premium/visual-interfaz-compras-linea-tiendas-electronica-consumo-pantallas-interactivas-productos_1314467-15652.jpg?w=740"
              alt="Clínica Dental"
            />
            <div className="deco-circle deco-circle-1" />
            <div className="deco-circle deco-circle-2" />

            <div className="left-badges">
              <span className="badge-pill">
                <span className="badge-dot" />
                Sistema activo
              </span>
              <span className="badge-pill">🔒 Datos seguros</span>
            </div>

            <div className="left-content">
              <div className="left-logo">
                <div className="left-logo-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                <span className="left-logo-name">Odonto <span>Nova</span></span>
              </div>

              <p className="left-tagline">
                Tu salud dental,<br /><em>en tus manos</em>
              </p>
              <p className="left-sub">
                Gestiona citas, historial clínico y tratamientos desde un solo lugar.
              </p>

              <div className="left-stats">
                <div className="stat-item">
                  <span className="stat-num">+2.4k</span>
                  <span className="stat-label">Pacientes</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-num">98%</span>
                  <span className="stat-label">Satisfacción</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-num">24/7</span>
                  <span className="stat-label">Disponible</span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-panel-right">
            <div className="right-header">
              <span className="right-eyebrow">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                Portal de pacientes
              </span>
              <h1 className="right-title">Bienvenido de vuelta</h1>
              <p className="right-subtitle">Clínica OdontoNova · Ingresa con tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label" htmlFor="username">Usuario</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    id="username"
                    type="text"
                    placeholder="Ej: jeison123"
                    className={`field-input${error ? " has-error" : ""}`}
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">Contraseña</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`field-input${error ? " has-error" : ""}`}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="error-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Validando...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-label">¿Primera vez?</span>
              <div className="divider-line" />
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/registro")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Crear una cuenta nueva
            </button>

            <div className="right-footer">
              <svg className="footer-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span className="footer-text">Conexión cifrada y protegida</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}