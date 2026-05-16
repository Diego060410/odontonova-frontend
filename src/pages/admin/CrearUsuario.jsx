import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CrearUsuario() {
  const navigate = useNavigate();

  // ── Estados para typing animation del logo (aislados) ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  // ── Estado para toggle de contraseña ──
  const [showPassword, setShowPassword] = useState(false);

  // ── Efecto de Typing Animation (100% aislado) ──
  useEffect(() => {
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
          setTypedText(FULL_TEXT.slice(0, i));
          i++;
          timeouts.push(setTimeout(step, 85));
        } else {
          clearInterval(cursorTimer);
          setCursorVisible(false);
          timeouts.push(setTimeout(eraseSequence, 700));
        }
      };
      timeouts.push(setTimeout(step, 800));
    };

    const eraseSequence = () => {
      startBlink();
      let i = FULL_TEXT.length;
      const step = () => {
        if (i >= 0) {
          setTypedText(FULL_TEXT.slice(0, i));
          i--;
          timeouts.push(setTimeout(step, 45));
        } else {
          clearInterval(cursorTimer);
          setCursorVisible(false);
          timeouts.push(setTimeout(typeSequence, 1000));
        }
      };
      timeouts.push(setTimeout(step, 0));
    };

    typeSequence();
    return cleanup;
  }, []);

  // ── Cierre de dropdowns al clickear fuera ──
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.dropdown')) setMenuOpen(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const [usuario, setUsuario] = useState({
    nombres: "",
    apellidos: "",
    documentoIdentidad: "",
    correo: "",
    telefono: "",
    username: "",
    password: "",
    nombreRol: "",
    idRol: "",
    estado: true
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const guardarUsuario = async () => {
    if (
      !usuario.nombres ||
      !usuario.apellidos ||
      !usuario.documentoIdentidad ||
      !usuario.correo ||
      !usuario.telefono ||
      !usuario.username ||
      !usuario.password ||
      !usuario.nombreRol
    ) {
      setFormError("⚠️ Complete todos los campos obligatorios");
      setTimeout(() => setFormError(""), 3000);
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      console.log("USUARIO A ENVIAR:", usuario);
      await api.post("/usuarios", usuario);
      
      setFormError("✅ Usuario registrado correctamente");
      setTimeout(() => {
        navigate("/admin/usuarios");
      }, 1200);

    } catch (error) {
      console.log("ERROR:", error.response);
      console.log("DATA:", error.response?.data);
      setFormError(`❌ ${error.response?.data?.message || "Error al registrar usuario"}`);
      setTimeout(() => setFormError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormError("");
    setUsuario({
      ...usuario,
      [e.target.name]: e.target.value
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // ── Datos para menús del topbar (memorizados) ──
  const navModules = useMemo(() => [
    { to: "/admin/usuarios", label: "Usuarios", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { to: "/admin/odontologos", label: "Odontólogos", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> },
    { to: "/admin/pacientes", label: "Pacientes", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { to: "/admin/citas", label: "Citas", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { to: "/admin/sedes", label: "Sedes", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { to: "/admin/consultorios", label: "Consultorios", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { to: "/admin/especialidades", label: "Especialidades", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  ], []);

  const quickCreate = useMemo(() => [
    { to: "/admin/crear-usuario", label: "Nuevo Usuario", accent: "#6366f1", active: true },
    { to: "/admin/crear-odontologo", label: "Nuevo Odontólogo", accent: "#1e40af" },
    { to: "/admin/crear-cita", label: "Nueva Cita", accent: "#db2777" },
    { to: "/admin/crear-sede", label: "Nueva Sede", accent: "#059669" },
    { to: "/admin/crear-consultorio", label: "Nuevo Consultorio", accent: "#d97706" },
    { to: "/admin/crear-especialidad", label: "Nueva Especialidad", accent: "#0891b2" },
  ], []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --primary:#1e40af;--primary-600:#2563eb;--primary-50:#eff6ff;--primary-100:#dbeafe;
          --surface:#ffffff;--surface-50:#fafafa;--surface-100:#f8fafc;--border:#e2e8f0;--border-light:#f1f5f9;
          --text:#0f172a;--text-500:#64748b;--text-400:#94a3b8;--text-elegant:#1e293b;
          --success:#16a34a;--warning:#d97706;--danger:#dc2626;--accent:#7c3aed;
          --shadow:0 4px 20px rgba(0,0,0,0.04);--shadow-lg:0 12px 48px rgba(0,0,0,0.08);--shadow-glow:0 0 40px rgba(30,64,175,0.12);
          --radius:20px;--radius-sm:14px;--radius-xs:10px;
          --transition:all 0.3s cubic-bezier(0.16,1,0.3,1)
        }
        body{font-family:'Manrope',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;background:var(--surface-50)}
        .usr-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%);background-attachment:fixed}
        
        /* ── TOPBAR ELEGANTE ── */
        .usr-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow);animation:slideDown 0.5s ease}
        @keyframes slideDown{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}
        .topbar-brand{display:flex;align-items:center;gap:1rem;cursor:pointer;transition:var(--transition)}
        .topbar-brand:hover{transform:scale(1.01)}
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2.5rem;font-weight:500;font-style:italic;color:var(--text-elegant);letter-spacing:0.02em;line-height:1.1;display:flex;align-items:baseline;min-width:0}
        
        /* ── Typing Animation (Aislado) ── */
        .typing-wrapper{display:inline-flex;align-items:baseline;gap:0.02em;min-width:0}
        .typing-char{display:inline-block;transition:transform 0.1s ease}
        .typing-char.nova{color:var(--primary-600);font-style:italic;font-weight:700;background:linear-gradient(135deg,var(--primary-600),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .typing-cursor{display:inline-block;width:2.5px;height:2.2rem;background:var(--primary-600);margin-left:3px;vertical-align:baseline;border-radius:2px;opacity:0;transition:opacity 0.15s ease}
        .typing-cursor.active{opacity:1;animation:blink 1s step-end infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        .topbar-nav{display:flex;align-items:center;gap:0.35rem}
        .dropdown{position:relative}
        .dropdown-btn{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 1.1rem;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;color:var(--text-500);background:transparent;border:1px solid transparent;cursor:pointer;transition:var(--transition);letter-spacing:0.01em}
        .dropdown-btn:hover,.dropdown-btn.active{color:var(--primary-600);background:var(--primary-50);border-color:var(--primary-100);box-shadow:0 4px 16px rgba(30,64,175,0.1)}
        .dropdown-btn svg{transition:transform 0.25s var(--transition)}
        .dropdown.active .dropdown-btn svg{transform:rotate(180deg)}
        .dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:260px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg),var(--shadow-glow);padding:0.75rem;opacity:0;visibility:hidden;transform:translateY(-10px) scale(0.98);transition:var(--transition);z-index:101;animation:menuElegant 0.25s ease forwards}
        .dropdown.active .dropdown-menu{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
        @keyframes menuElegant{from{opacity:0;transform:translateY(-10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .dropdown-item{display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1.1rem;border-radius:10px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:500;color:var(--text-elegant);text-decoration:none;transition:var(--transition);position:relative;overflow:hidden}
        .dropdown-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:var(--transition);border-radius:0 4px 4px 0}
        .dropdown-item:hover{background:linear-gradient(135deg,var(--primary-50),var(--surface));color:var(--primary-600);transform:translateX(6px);padding-left:1.4rem}
        .dropdown-item:hover::before{background:var(--primary-600)}
        .dropdown-item svg{color:var(--text-400);transition:var(--transition);flex-shrink:0}
        .dropdown-item:hover svg{color:var(--primary-600);transform:scale(1.1)}
        .dropdown-item.active{background:var(--primary-50);color:var(--primary-600);border-left:3px solid var(--primary-600);padding-left:0.8rem}
        .dropdown-divider{height:1px;background:linear-gradient(90deg,transparent,var(--border-light),transparent);margin:0.6rem 0}
        .dropdown-label{padding:0.45rem 1.1rem;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-400);text-transform:uppercase;letter-spacing:0.12em}
        .topbar-badge{background:linear-gradient(135deg,var(--primary-100),#bfdbfe);border:1px solid #93c5fd;color:var(--primary-600);font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;letter-spacing:0.08em;text-transform:uppercase;padding:0.4rem 0.95rem;border-radius:100px;animation:pulse 2.5s infinite;box-shadow:0 2px 10px rgba(30,64,175,0.15)}
        @keyframes pulse{0%,100%{box-shadow:0 2px 10px rgba(30,64,175,0.15)}50%{box-shadow:0 4px 20px rgba(30,64,175,0.35),0 0 0 2px rgba(30,64,175,0.1)}}
        .btn-action{display:flex;align-items:center;gap:0.55rem;padding:0.65rem 1.35rem;border-radius:14px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent;position:relative;overflow:hidden}
        .btn-action::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);transition:left 0.5s ease}
        .btn-action:hover::before{left:100%}
        .btn-profile{background:linear-gradient(135deg,#eff6ff,#dbeafe);color:var(--primary-600);border-color:#bfdbfe;box-shadow:0 4px 16px rgba(30,64,175,0.08)}
        .btn-profile:hover{background:linear-gradient(135deg,#dbeafe,#bfdbfe);border-color:var(--primary-600);transform:translateY(-3px);box-shadow:0 8px 28px rgba(30,64,175,0.15)}
        .btn-logout{background:linear-gradient(135deg,#fff1f2,#ffe4e6);color:var(--danger);border-color:#fecdd3;box-shadow:0 4px 16px rgba(220,38,38,0.08)}
        .btn-logout:hover{background:linear-gradient(135deg,#ffe4e6,#fecdd3);border-color:var(--danger);transform:translateY(-3px);box-shadow:0 8px 28px rgba(220,38,38,0.15)}
        
        /* ── CONTENT ── */
        .usr-content{padding:clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,3rem);max-width:900px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── FORM CARD ── */
        .form-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          padding:clamp(2rem,5vw,3rem);animation:fadeInUp 0.5s ease 0.25s both
        }
        
        .form-header{margin-bottom:2.5rem;text-align:center}
        .form-eyebrow{
          font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;
          letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);
          margin-bottom:0.5rem
        }
        .form-title{
          font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;
          color:var(--text-elegant);letter-spacing:-0.02em;line-height:1.1
        }
        .form-subtitle{
          font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-500);
          margin-top:0.5rem
        }
        
        /* ── FORM GRID ── */
        .form-grid{
          display:grid;grid-template-columns:repeat(2,1fr);gap:1.25rem
        }
        @media(max-width:768px){.form-grid{grid-template-columns:1fr}}
        
        .form-group{display:flex;flex-direction:column;gap:0.5rem;position:relative}
        .form-label{
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          color:var(--text-elegant);letter-spacing:0.01em
        }
        .form-label.required::after{
          content:'*';color:var(--danger);margin-left:2px;font-weight:700
        }
        
        .form-input,.form-select{
          padding:0.9rem 1.1rem;border:1.5px solid var(--border-light);
          border-radius:12px;background:var(--surface-100);
          font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-elegant);
          outline:none;transition:var(--transition);width:100%
        }
        .form-input:focus,.form-select:focus{
          border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);
          background:var(--surface)
        }
        .form-input::placeholder{color:var(--text-400);font-weight:400}
        .form-select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 1rem center;padding-right:2.5rem}
        
        /* ── PASSWORD TOGGLE ── */
        .password-wrapper{position:relative}
        .password-toggle{
          position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;padding:4px;
          color:var(--text-400);transition:var(--transition);
          display:flex;align-items:center;justify-content:center;
          border-radius:6px;z-index:2
        }
        .password-toggle:hover{
          color:var(--primary-600);background:var(--primary-50)
        }
        .password-toggle:focus{outline:2px solid var(--primary-600);outline-offset:2px}
        .password-toggle svg{width:18px;height:18px}
        
        /* ── FORM MESSAGE ── */
        .form-message{
          padding:0.85rem 1.25rem;border-radius:12px;margin-bottom:1.5rem;
          font-family:'Manrope',sans-serif;font-size:0.9rem;font-weight:500;
          display:flex;align-items:center;gap:0.5rem;animation:fadeIn 0.3s ease
        }
        .form-message.success{
          background:linear-gradient(135deg,#f0fdf4,#dcfce7);
          border:1px solid #bbf7d0;color:#166534
        }
        .form-message.error{
          background:linear-gradient(135deg,#fef2f2,#fecaca);
          border:1px solid #fecaca;color:#991b1b
        }
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── FORM ACTIONS ── */
        .form-actions{
          display:flex;gap:1rem;margin-top:2.5rem;padding-top:2rem;
          border-top:1px solid var(--border-light)
        }
        @media(max-width:600px){.form-actions{flex-direction:column}}
        
        .btn-form{
          flex:1;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;
          padding:0.9rem 1.5rem;border-radius:14px;font-family:'Manrope',sans-serif;
          font-size:0.9rem;font-weight:600;cursor:pointer;transition:var(--transition);
          text-decoration:none;border:1px solid transparent;position:relative;overflow:hidden
        }
        .btn-form::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-form:hover::before{left:100%}
        
        .btn-back{
          background:var(--surface);color:var(--text-elegant);
          border-color:var(--border-light);box-shadow:0 2px 10px rgba(0,0,0,0.04)
        }
        .btn-back:hover{
          background:var(--surface-100);border-color:var(--primary-100);
          transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.08)
        }
        
        .btn-save{
          background:linear-gradient(135deg,var(--success),#047857);
          color:#fff;border:none;box-shadow:0 4px 18px rgba(5,150,105,0.25)
        }
        .btn-save:hover{
          transform:translateY(-3px);box-shadow:0 8px 28px rgba(5,150,105,0.4);
          filter:brightness(1.05)
        }
        .btn-save:active{transform:translateY(0)}
        .btn-save:disabled{
          opacity:0.7;cursor:not-allowed;transform:none;filter:none
        }
        
        /* ── LOADING SPINNER ── */
        .btn-loading{
          display:inline-flex;align-items:center;gap:0.5rem;pointer-events:none
        }
        .spinner-sm{
          width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);
          border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        
        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .topbar-nav{gap:0.15rem}
          .dropdown-menu{min-width:220px;right:-10px}
          .btn-action{padding:0.55rem 1rem;font-size:0.83rem}
          .form-title{font-size:1.8rem}
        }
        @media(max-width:600px){
          .topbar-brand span{display:none}
          .dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}
          .form-actions{flex-direction:column}
          .btn-form{width:100%}
        }
      `}</style>

      <div className="usr-root">

        {/* ── TOPBAR CON TYPING ANIMATION ── */}
        <header className="usr-topbar">
          <div className="topbar-brand" onClick={() => navigate("/admin/dashboard")}>
            <span className="topbar-name">
              <span className="typing-wrapper" aria-label="OdontoNova">
                {typedText.split("").map((char, index) => (
                  <span 
                    key={index} 
                    className={`typing-char ${index >= 6 ? 'nova' : ''}`}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className={`typing-cursor ${cursorVisible ? 'active' : ''}`} aria-hidden="true" />
            </span>
          </div>

          <nav className="topbar-nav">
            {/* Dropdown: Módulos */}
            <div className={`dropdown ${menuOpen === 'modules' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'modules' ? null : 'modules'); }} aria-haspopup="true" aria-expanded={menuOpen === 'modules'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Módulos
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Gestión</span>
                {navModules.map((m) => (
                  <Link key={m.to} to={m.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)}>{m.icon}{m.label}</Link>
                ))}
              </div>
            </div>

            {/* Dropdown: Creación */}
            <div className={`dropdown ${menuOpen === 'create' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'create' ? null : 'create'); }} aria-haspopup="true" aria-expanded={menuOpen === 'create'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Crear
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Nuevo registro</span>
                {quickCreate.map((q) => (
                  <Link 
                    key={q.to} 
                    to={q.to} 
                    className={`dropdown-item ${q.active ? 'active' : ''}`} 
                    role="menuitem" 
                    onClick={() => setMenuOpen(null)} 
                    style={!q.active ? { borderLeft: `3px solid ${q.accent}`, paddingLeft: '0.65rem' } : {}}
                  >
                    {q.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/admin/perfil" className="btn-action btn-profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Perfil
            </Link>
            <span className="topbar-badge">Admin</span>
            <button onClick={handleLogout} className="btn-action btn-logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Salir
            </button>
          </nav>
        </header>

        {/* ── CONTENT ── */}
        <main className="usr-content">

          <div className="form-card">
            
            {/* Header del Formulario */}
            <div className="form-header">
              <p className="form-eyebrow">Gestión de usuarios</p>
              <h1 className="form-title">Crear Nuevo Usuario</h1>
              <p className="form-subtitle">Complete los campos para registrar un nuevo usuario en el sistema</p>
            </div>

            {/* Mensaje de Feedback */}
            {formError && (
              <div className={`form-message ${formError.includes('✅') ? 'success' : 'error'}`}>
                <span>{formError.includes('✅') ? '✓' : '⚠️'}</span>
                <span>{formError.replace('✅ ', '').replace('⚠️ ', '').replace('❌ ', '')}</span>
              </div>
            )}

            {/* Form Grid */}
            <div className="form-grid">
              
              <div className="form-group">
                <label className="form-label required">Nombres</label>
                <input type="text" name="nombres" value={usuario.nombres} onChange={handleChange} className="form-input" placeholder="Ej: Juan Carlos" />
              </div>

              <div className="form-group">
                <label className="form-label required">Apellidos</label>
                <input type="text" name="apellidos" value={usuario.apellidos} onChange={handleChange} className="form-input" placeholder="Ej: Pérez López" />
              </div>

              <div className="form-group">
                <label className="form-label required">DNI</label>
                <input type="text" name="documentoIdentidad" value={usuario.documentoIdentidad} onChange={handleChange} className="form-input" placeholder="Ej: 12345678" maxLength="8" />
              </div>

              <div className="form-group">
                <label className="form-label required">Correo</label>
                <input type="email" name="correo" value={usuario.correo} onChange={handleChange} className="form-input" placeholder="ejemplo@correo.com" />
              </div>

              <div className="form-group">
                <label className="form-label required">Teléfono</label>
                <input type="tel" name="telefono" value={usuario.telefono} onChange={handleChange} className="form-input" placeholder="Ej: 987654321" maxLength="9" />
              </div>

              <div className="form-group">
                <label className="form-label required">Usuario</label>
                <input type="text" name="username" value={usuario.username} onChange={handleChange} className="form-input" placeholder="Nombre de usuario para login" />
              </div>

              {/* 🔐 Campo de Contraseña con Toggle */}
              <div className="form-group">
                <label className="form-label required">Contraseña</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={usuario.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="••••••••"
                    minLength="6"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Rol</label>
                <select name="idRol" value={usuario.idRol} onChange={(e) => {
                    const rolId = e.target.value;
                    let rolNombre = "";
                    if (rolId === "1") rolNombre = "ADMIN";
                    if (rolId === "2") rolNombre = "USER";
                    if (rolId === "4") rolNombre = "RECEPCIONISTA";
                    setUsuario({ ...usuario, idRol: Number(rolId), nombreRol: rolNombre });
                  }} className="form-select">
                  <option value="">Seleccione un rol</option>
                  <option value="1">ADMIN</option>
                  <option value="2">USER</option>
                  <option value="4">RECEPCIONISTA</option>
                </select>
              </div>

            </div>

            {/* ✅ Acciones del Formulario CON BOTÓN VOLVER AL DASHBOARD */}
            <div className="form-actions">
              <button
                className="btn-form btn-back"
                onClick={() => navigate("/admin/dashboard")}
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Volver al Dashboard
              </button>

              <button
                className="btn-form btn-save"
                onClick={guardarUsuario}
                disabled={loading}
                type="button"
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner-sm"></span>
                    Registrando...
                  </span>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 12 8"/>
                    </svg>
                    Registrar Usuario
                  </>
                )}
              </button>
            </div>

          </div>

        </main>
      </div>
    </>
  );
}