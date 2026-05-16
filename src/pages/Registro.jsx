import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Registro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    documentoIdentidad: "",
    correo: "",
    telefono: "",
    username: "",
    password: "",
    nombreRol: "USER",
    estado: true
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.documentoIdentidad.length !== 8) {
      setErrors({ ...errors, documentoIdentidad: true });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", formData);
      alert("✅ ¡Perfil de paciente creado con éxito!");
      navigate("/");
    } catch (error) {
      const msg = error.response?.data?.message || "Error al registrar";
      alert("❌ " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

        .reg-root {
          min-height: 100vh;
          background: #f0f4f8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
        }

        .reg-card {
          width: 100%;
          max-width: 680px;
          background: #ffffff;
          border-radius: 2rem;
          box-shadow:
            0 4px 6px -1px rgba(0,0,0,0.04),
            0 20px 60px -10px rgba(14,113,205,0.12),
            0 0 0 1px rgba(14,113,205,0.06);
          overflow: hidden;
        }

        /* ── TOP ACCENT BAR ── */
        .reg-accent-bar {
          height: 4px;
          background: linear-gradient(90deg, #0e71cd 0%, #38bdf8 60%, #0e71cd 100%);
          background-size: 200% 100%;
        }

        /* ── HEADER ── */
        .reg-header {
          padding: 2.5rem 3rem 1.75rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .reg-eyebrow {
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

        .reg-title {
          font-family: 'DM Serif Display', serif;
          font-size: 2rem;
          font-weight: 400;
          color: #0f172a;
          line-height: 1.2;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .reg-title span { color: #0e71cd; }

        .reg-subtitle {
          font-size: 0.82rem;
          color: #94a3b8;
          line-height: 1.6;
          font-weight: 400;
          max-width: 420px;
        }

        /* ── SECURITY BANNER ── */
        .reg-security {
          margin: 0 3rem 0;
          padding: 0.9rem 1.1rem;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.875rem;
          position: relative;
          overflow: hidden;
        }

        .security-icon-wrap {
          width: 36px; height: 36px;
          background: #ffffff;
          border-radius: 0.625rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(14,113,205,0.12);
        }

        .security-text-title {
          font-size: 0.68rem;
          font-weight: 700;
          color: #0c4a6e;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 0.15rem;
        }

        .security-text-body {
          font-size: 0.73rem;
          color: #0369a1;
          font-weight: 400;
          line-height: 1.4;
        }

        .security-bg-icon {
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 70px;
          height: 70px;
          color: #0e71cd;
          opacity: 0.06;
        }

        /* ── FORM ── */
        .reg-form {
          padding: 1.75rem 3rem 2.5rem;
        }

        /* Section label */
        .section-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0 1.25rem;
        }
        .section-divider-line {
          flex: 1; height: 1px;
          background: #e2e8f0;
        }
        .section-divider-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        /* Grid */
        .field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 560px) {
          .field-grid { grid-template-columns: 1fr; }
          .reg-header { padding: 2rem 1.75rem 1.5rem; }
          .reg-security { margin: 0 1.75rem 0; }
          .reg-form { padding: 1.5rem 1.75rem 2rem; }
        }

        /* Field */
        .field-group { margin-bottom: 1rem; }

        .field-label {
          display: block;
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.4rem;
        }

        .field-wrap { position: relative; }

        .field-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          width: 15px; height: 15px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.2s;
          flex-shrink: 0;
        }

        .field-wrap:focus-within .field-icon { color: #0e71cd; }

        .field-input {
          width: 100%;
          padding: 0.8rem 0.9rem 0.8rem 2.5rem;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.85rem;
          color: #0f172a;
          font-family: 'DM Sans', sans-serif;
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

        .field-input.error {
          border-color: #f87171;
          background: #fff5f5;
        }
        .field-input.error:focus {
          box-shadow: 0 0 0 3px rgba(248,113,113,0.12);
        }

        .field-error-msg {
          font-size: 0.7rem;
          color: #dc2626;
          font-weight: 500;
          margin-top: 0.3rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        /* Submit */
        .btn-primary {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #0e71cd 0%, #1a83e0 100%);
          color: #ffffff;
          border: none;
          border-radius: 0.875rem;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 20px rgba(14,113,205,0.3), 0 1px 3px rgba(14,113,205,0.2);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(14,113,205,0.38), 0 2px 6px rgba(14,113,205,0.2);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(14,113,205,0.25);
        }

        .btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer link */
        .reg-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid #f1f5f9;
          font-size: 0.78rem;
          color: #94a3b8;
        }

        .reg-footer-link {
          color: #0e71cd;
          font-weight: 700;
          cursor: pointer;
          margin-left: 0.35rem;
          text-decoration: none;
          transition: color 0.15s;
        }

        .reg-footer-link:hover { color: #1a83e0; text-decoration: underline; }

        /* Step indicators */
        .reg-steps {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 1rem;
        }

        .step-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #e2e8f0;
          transition: all 0.2s;
        }
        .step-dot.active {
          background: #0e71cd;
          width: 18px;
          border-radius: 3px;
        }
      `}</style>

      <div className="reg-root">
        <div className="reg-card">

          {/* Accent bar */}
          <div className="reg-accent-bar" />

          {/* Header */}
          <div className="reg-header">
            <span className="reg-eyebrow">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
              Clínica Aura Dental
            </span>
            <h1 className="reg-title">
              Crea tu perfil de<br /><span>Paciente</span>
            </h1>
            <p className="reg-subtitle">
              Únete para gestionar tus citas y tratamientos con total seguridad desde cualquier lugar.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="reg-form">

            {/* Security banner */}
            <div className="reg-security" style={{ marginBottom: "1.5rem" }}>
              <div className="security-icon-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0e71cd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <div>
                <p className="security-text-title">Seguridad Aura</p>
                <p className="security-text-body">Tus datos médicos están cifrados bajo estándares clínicos de alta seguridad.</p>
              </div>
              <svg className="security-bg-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
            </div>

            {/* ── Datos personales ── */}
            <div className="section-divider">
              <div className="section-divider-line" />
              <span className="section-divider-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Datos personales
              </span>
              <div className="section-divider-line" />
            </div>

            {/* Nombres / Apellidos */}
            <div className="field-grid">
              <div className="field-group">
                <label className="field-label">Nombres</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    name="nombres"
                    placeholder="Ej: Juan Carlos"
                    onChange={handleChange}
                    className="field-input"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Apellidos</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    name="apellidos"
                    placeholder="Ej: García Pérez"
                    onChange={handleChange}
                    className="field-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* DNI */}
            <div className="field-group">
              <label className="field-label">Documento de identidad</label>
              <div className="field-wrap">
                <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
                <input
                  name="documentoIdentidad"
                  placeholder="DNI (8 dígitos)"
                  onChange={handleChange}
                  className={`field-input${errors.documentoIdentidad ? " error" : ""}`}
                  required
                />
              </div>
              {errors.documentoIdentidad && (
                <p className="field-error-msg">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  El DNI debe tener exactamente 8 dígitos
                </p>
              )}
            </div>

            {/* Correo / Teléfono */}
            <div className="field-grid">
              <div className="field-group">
                <label className="field-label">Correo electrónico</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    name="correo"
                    type="email"
                    placeholder="email@ejemplo.com"
                    onChange={handleChange}
                    className="field-input"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Teléfono</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.37 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <input
                    name="telefono"
                    placeholder="+51 9XX XXX XXX"
                    onChange={handleChange}
                    className="field-input"
                  />
                </div>
              </div>
            </div>

            {/* ── Datos de acceso ── */}
            <div className="section-divider">
              <div className="section-divider-line" />
              <span className="section-divider-label">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Datos de acceso
              </span>
              <div className="section-divider-line" />
            </div>

            <div className="field-grid">
              <div className="field-group">
                <label className="field-label">Nombre de usuario</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    name="username"
                    placeholder="Ej: juan123"
                    onChange={handleChange}
                    className="field-input"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Contraseña</label>
                <div className="field-wrap">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    name="password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    onChange={handleChange}
                    className="field-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Procesando...
                </>
              ) : (
                <>
                  Crear mi cuenta
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

            {/* Footer */}
            <div className="reg-footer">
              ¿Ya tienes una cuenta?
              <span className="reg-footer-link" onClick={() => navigate("/")}>
                Inicia sesión
              </span>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}