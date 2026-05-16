import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function PacienteForm() {
  const navigate = useNavigate();

  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  // ── Estado del formulario (LÓGICA ORIGINAL INTACTA) ──
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    documentoIdentidad: "",
    telefono: "",
    correo: "",
    username: "",
    password: "",
    fechaNacimiento: "",
    sexo: "",
    direccion: "",
    alergias: "",
    observaciones: "",
    idRol: 2,
    estado: true
  });

  const [loading, setLoading] = useState(false);

  // ── Efecto de Typing para "OdontoNova" ──
  useState(() => {
    const FULL_TEXT = "OdontoNova";
    let timeouts = [];
    let cursorTimer;

    const cleanup = () => {
      timeouts.forEach(clearTimeout);
      clearInterval(cursorTimer);
      setCursorVisible(false);
    };

    const startBlink = () => {
      cursorTimer = setInterval(() => setCursorVisible(v => !v), 530);
    };

    const typeSequence = () => {
      let i = 0;
      startBlink();
      const step = () => {
        if (i <= FULL_TEXT.length) {
          setTypedLogo(FULL_TEXT.slice(0, i));
          i++;
          timeouts.push(setTimeout(step, 85));
        } else {
          clearInterval(cursorTimer);
          setCursorVisible(false);
          timeouts.push(setTimeout(eraseSequence, 2000));
        }
      };
      timeouts.push(setTimeout(step, 600));
    };

    const eraseSequence = () => {
      startBlink();
      let i = FULL_TEXT.length;
      const step = () => {
        if (i >= 0) {
          setTypedLogo(FULL_TEXT.slice(0, i));
          i--;
          timeouts.push(setTimeout(step, 45));
        } else {
          clearInterval(cursorTimer);
          setCursorVisible(false);
          timeouts.push(setTimeout(typeSequence, 800));
        }
      };
      timeouts.push(setTimeout(step, 0));
    };

    typeSequence();
    return cleanup;
  }, []);

  // ── Handlers originales (LÓGICA INTACTA) ──
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // 1️⃣ CREAR USUARIO
      const usuarioRes = await api.post("/usuarios", form);
      const usuario = usuarioRes.data;
      console.log("USUARIO CREADO:", usuario);

      // 2️⃣ CREAR PACIENTE
      await api.post("/pacientes", {
        idUsuario: usuario.idUsuario,
        nombres: form.nombres,
        apellidos: form.apellidos,
        documentoIdentidad: form.documentoIdentidad,
        fechaNacimiento: form.fechaNacimiento,
        sexo: form.sexo,
        telefono: form.telefono,
        correo: form.correo,
        direccion: form.direccion,
        alergias: form.alergias,
        observaciones: form.observaciones,
        estado: true
      });

      alert("✅ Paciente registrado");
      navigate("/recepcion/pacientes");

    } catch (error) {
      console.log(error.response?.data);
      alert(JSON.stringify(error.response?.data, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // ── Cierre de dropdowns ──
  useState(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.dropdown')) setMenuOpen(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ── Módulos de navegación ──
  const navModules = useMemo(() => [
    { to: "/recepcion/citas", label: "Agenda de Citas", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { to: "/recepcion/pacientes", label: "Registro Pacientes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    { to: "/recepcion/disponibilidad", label: "Ver Horarios", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ], []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --primary:#0e71cd;--primary-600:#0e71cd;--primary-50:#eff6ff;--primary-100:#dbeafe;
          --surface:#ffffff;--surface-50:#fafafa;--surface-100:#f8fafc;--border:#e2e8f0;--border-light:#f1f5f9;
          --text:#0f172a;--text-500:#64748b;--text-400:#94a3b8;--text-elegant:#1e293b;
          --success:#16a34a;--warning:#d97706;--danger:#dc2626;--accent:#7c3aed;
          --shadow:0 4px 20px rgba(0,0,0,0.04);--shadow-lg:0 12px 48px rgba(0,0,0,0.08);--shadow-glow:0 0 40px rgba(14,113,205,0.12);
          --radius:20px;--radius-sm:14px;--radius-xs:10px;
          --transition:all 0.3s cubic-bezier(0.16,1,0.3,1)
        }
        body{font-family:'Manrope',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;background:var(--surface-50)}
        .dash-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%);background-attachment:fixed}
        
        /* ── TOPBAR ── */
        .dash-topbar{
          background:rgba(255,255,255,0.95);
          backdrop-filter:blur(12px);
          border-bottom:1px solid rgba(226,232,240,0.7);
          padding:0 clamp(1.25rem,4vw,2.5rem);
          height:72px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          position:sticky;
          top:0;
          z-index:100;
          box-shadow:var(--shadow);
          animation:slideDown 0.4s ease;
        }
        @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
        
        .topbar-brand{display:flex;align-items:center;gap:0.5rem;cursor:pointer;transition:var(--transition)}
        .topbar-brand:hover{transform:scale(1.02)}
        
        /* Typing Animation */
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:500;font-style:italic;color:var(--text-elegant);letter-spacing:0.01em;line-height:1;display:flex;align-items:baseline}
        .typing-wrapper{display:inline-flex;align-items:baseline;gap:0.01em}
        .typing-char{display:inline-block;transition:transform 0.1s ease}
        .typing-char.nova{color:var(--primary-600);font-style:italic;font-weight:700;background:linear-gradient(135deg,var(--primary-600),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .typing-cursor{display:inline-block;width:2px;height:2rem;background:var(--primary-600);margin-left:2px;vertical-align:middle;border-radius:1px;opacity:0}
        .typing-cursor.active{opacity:1;animation:blink 1s step-end infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        .topbar-nav{display:flex;align-items:center;gap:0.5rem}
        .dropdown{position:relative}
        .dropdown-btn{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 1.1rem;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;color:var(--text-500);background:transparent;border:1px solid transparent;cursor:pointer;transition:var(--transition)}
        .dropdown-btn:hover,.dropdown-btn.active{color:var(--primary-600);background:var(--primary-50);border-color:var(--primary-100)}
        .dropdown-btn svg{transition:transform 0.25s var(--transition)}
        .dropdown.active .dropdown-btn svg{transform:rotate(180deg)}
        .dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:240px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg);padding:0.75rem;opacity:0;visibility:hidden;transform:translateY(-10px) scale(0.98);transition:var(--transition);z-index:101}
        .dropdown.active .dropdown-menu{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
        .dropdown-item{display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1.1rem;border-radius:10px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:500;color:var(--text-elegant);text-decoration:none;transition:var(--transition)}
        .dropdown-item:hover{background:var(--primary-50);color:var(--primary-600);transform:translateX(4px)}
        .dropdown-label{padding:0.45rem 1.1rem;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-400);text-transform:uppercase;letter-spacing:0.12em}
        
        .btn-action{display:flex;align-items:center;gap:0.5rem;padding:0.6rem 1.2rem;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent}
        .btn-profile{background:var(--primary-50);color:var(--primary-600);border-color:var(--primary-100)}
        .btn-profile:hover{background:var(--primary-100);border-color:var(--primary-600)}
        .btn-logout{background:#fff1f2;color:var(--danger);border-color:#fecdd3}
        .btn-logout:hover{background:#ffe4e6;border-color:var(--danger)}
        .topbar-badge{background:var(--primary-100);color:var(--primary-600);font-family:'Cormorant Garamond',serif;font-size:0.7rem;font-weight:600;font-style:italic;padding:0.35rem 0.85rem;border-radius:100px;border:1px solid #93c5fd}
        
        /* ── CONTENIDO ── */
        .dash-content{
          padding:clamp(2rem,5vw,3rem);
          max-width:900px;
          margin:0 auto;
          animation:fadeInUp 0.6s ease 0.15s both;
        }
        @keyframes fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        
        .page-header{margin-bottom:2rem}
        .page-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.8rem;font-weight:600;color:var(--text-elegant);
          letter-spacing:-0.01em;display:flex;align-items:center;gap:0.75rem
        }
        .page-subtitle{font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-500);margin-top:0.25rem}
        
        .btn-back{
          display:inline-flex;align-items:center;gap:0.4rem;
          padding:0.5rem 0.9rem;
          background:var(--surface-100);border:1px solid var(--border);
          border-radius:10px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:500;
          color:var(--text-500);text-decoration:none;cursor:pointer;
          transition:var(--transition);margin-bottom:1.5rem
        }
        .btn-back:hover{background:var(--primary-50);border-color:var(--primary-100);color:var(--primary-600);transform:translateX(-3px)}
        
        /* ── FORMULARIO ELEGANTE ── */
        .form-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow-lg);
          padding:2rem;animation:fadeInUp 0.5s ease 0.2s both;
          position:relative;overflow:hidden
        }
        .form-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:4px;
          background:linear-gradient(90deg,var(--primary-100),var(--primary-600),var(--accent));
          opacity:0.8
        }
        
        .form-section{margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px dashed var(--border-light)}
        .form-section:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
        .form-section-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.1rem;font-weight:600;color:var(--text-elegant);
          margin-bottom:1.25rem;display:flex;align-items:center;gap:0.5rem
        }
        
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem}
        .form-row:last-child{margin-bottom:0}
        .form-group{display:flex;flex-direction:column;gap:0.5rem}
        .form-label{
          font-family:'Manrope',sans-serif;
          font-size:0.85rem;font-weight:600;color:var(--text-elegant);
          display:flex;align-items:center;gap:0.4rem
        }
        .form-label svg{color:var(--text-400)}
        .form-label.required::after{content:'*';color:var(--danger);margin-left:2px}
        
        .form-input,.form-select,.form-textarea{
          width:100%;padding:0.9rem 1.1rem;
          border:1.5px solid var(--border);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;
          color:var(--text-elegant);background:var(--surface);
          transition:var(--transition);outline:none
        }
        .form-input:focus,.form-select:focus,.form-textarea:focus{
          border-color:var(--primary-600);
          box-shadow:0 0 0 4px rgba(14,113,205,0.15);
          background:var(--surface-100)
        }
        .form-input:disabled,.form-select:disabled{
          background:var(--surface-100);color:var(--text-400);cursor:not-allowed
        }
        .form-textarea{min-height:80px;resize:vertical}
        
        /* Acciones */
        .form-actions{
          display:flex;gap:0.75rem;margin-top:2rem;
          padding-top:1.5rem;border-top:1px solid var(--border-light)
        }
        .btn-submit{
          flex:1;padding:1rem 1.5rem;
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff;border:none;border-radius:14px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;font-weight:600;
          cursor:pointer;transition:var(--transition);
          display:flex;align-items:center;justify-content:center;gap:0.5rem;
          box-shadow:0 4px 16px rgba(14,113,205,0.25);position:relative;overflow:hidden
        }
        .btn-submit::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-submit:hover::before{left:100%}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(14,113,205,0.35)}
        .btn-submit:disabled{opacity:0.7;cursor:not-allowed;transform:none;box-shadow:none}
        
        .btn-cancel{
          flex:0;padding:1rem 1.5rem;
          background:var(--surface-100);color:var(--text-500);
          border:1.5px solid var(--border);border-radius:14px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;font-weight:600;
          cursor:pointer;transition:var(--transition)
        }
        .btn-cancel:hover{background:var(--danger);border-color:var(--danger);color:#fff;transform:translateY(-2px)}
        
        /* Footer */
        .dash-footer{text-align:center;padding:1.5rem;color:var(--text-400);font-family:'Manrope',sans-serif;font-size:0.83rem}
        .dash-footer a{color:var(--primary-600);text-decoration:none;font-weight:500}
        .dash-footer a:hover{text-decoration:underline}
        
        @media(max-width:700px){
          .form-row{grid-template-columns:1fr}
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
          .page-title{font-size:1.5rem}
          .form-actions{flex-direction:column}
          .form-card{padding:1.5rem}
        }
      `}</style>

      <div className="dash-root">
        {/* ── TOPBAR ── */}
        <header className="dash-topbar">
          <div className="topbar-brand">
            <span className="topbar-name">
              <span className="typing-wrapper" aria-label="OdontoNova">
                {typedLogo.split("").map((char, index) => (
                  <span key={index} className={`typing-char ${index >= 6 ? 'nova' : ''}`}>{char}</span>
                ))}
              </span>
              <span className={`typing-cursor ${cursorVisible ? 'active' : ''}`} aria-hidden="true" />
            </span>
          </div>

          <nav className="topbar-nav">
            <div className={`dropdown ${menuOpen === 'modules' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'modules' ? null : 'modules'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Módulos
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu">
                <span className="dropdown-label">Navegación</span>
                {navModules.map((m) => (
                  <Link key={m.to} to={m.to} className="dropdown-item" onClick={() => setMenuOpen(null)}>{m.icon}{m.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/recepcion/perfil" className="btn-action btn-profile" title="Mi Perfil">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
            <span className="topbar-badge">Recepción</span>
            <button onClick={handleLogout} className="btn-action btn-logout" title="Cerrar Sesión">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </nav>
        </header>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="dash-content">
          <div className="page-header">
            <h1 className="page-title">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Registrar Nuevo Paciente
            </h1>
            <p className="page-subtitle">Complete los datos para crear un nuevo paciente en el sistema</p>
          </div>

          <button onClick={() => navigate("/recepcion/pacientes")} className="btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver a Pacientes
          </button>

          <form onSubmit={handleSubmit} className="form-card">
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Datos Personales
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Nombres
                  </label>
                  <input type="text" name="nombres" value={form.nombres} onChange={handleChange} className="form-input" required placeholder="Ingrese nombres completos" />
                </div>
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Apellidos
                  </label>
                  <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} className="form-input" required placeholder="Ingrese apellidos completos" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    DNI / Documento
                  </label>
                  <input type="text" name="documentoIdentidad" value={form.documentoIdentidad} onChange={handleChange} className="form-input" required placeholder="Número de documento" />
                </div>
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Fecha de Nacimiento
                  </label>
                  <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} className="form-input" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Sexo
                  </label>
                  <input type="text" name="sexo" value={form.sexo} onChange={handleChange} className="form-input" required placeholder="Masculino / Femenino / Otro" />
                </div>
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Teléfono
                  </label>
                  <input type="text" name="telefono" value={form.telefono} onChange={handleChange} className="form-input" required placeholder="Número de contacto" />
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: CONTACTO Y UBICACIÓN */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Contacto y Ubicación
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M22 12h-4"/><path d="M2 12h4"/><path d="M12 2v4"/><path d="M12 22v-4"/></svg>
                    Correo Electrónico
                  </label>
                  <input type="email" name="correo" value={form.correo} onChange={handleChange} className="form-input" required placeholder="correo@ejemplo.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Dirección
                  </label>
                  <input type="text" name="direccion" value={form.direccion} onChange={handleChange} className="form-input" placeholder="Dirección completa" />
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: INFORMACIÓN MÉDICA */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                Información Médica
              </h3>
              <div className="form-group">
                <label className="form-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Alergias
                </label>
                <input type="text" name="alergias" value={form.alergias} onChange={handleChange} className="form-input" placeholder="Alergias conocidas (separar por comas)" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Observaciones
                </label>
                <textarea name="observaciones" value={form.observaciones} onChange={handleChange} className="form-textarea" rows="3" placeholder="Notas adicionales sobre el paciente..." />
              </div>
            </section>

            {/* SECCIÓN 4: CREDENCIALES DE ACCESO */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Credenciales de Acceso
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Username
                  </label>
                  <input type="text" name="username" value={form.username} onChange={handleChange} className="form-input" required placeholder="Nombre de usuario para acceso" />
                </div>
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Contraseña
                  </label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} className="form-input" required placeholder="••••••••" />
                </div>
              </div>
            </section>

            {/* ACCIONES */}
            <div className="form-actions">
              <button type="button" onClick={() => navigate("/recepcion/pacientes")} className="btn-cancel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? (
                  <><span style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.35)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}></span> Registrando...</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Registrar Paciente</>
                )}
              </button>
            </div>
          </form>
        </main>

        {/* ── FOOTER ── */}
        <footer className="dash-footer">
          <p>¿Necesitas ayuda? <Link to="/soporte">Contacta a soporte técnico</Link></p>
        </footer>
      </div>
    </>
  );
}