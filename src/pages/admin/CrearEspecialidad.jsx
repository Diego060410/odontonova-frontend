import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

// Services
import {
  guardarEspecialidad,
  actualizarEspecialidad,
  obtenerEspecialidad,
} from "../../services/especialidadService";

export default function CrearEspecialidad() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ── Estados del formulario ──
  const [especialidad, setEspecialidad] = useState({
    nombreEspecialidad: "",
    descripcion: "",
    estado: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // ── Estados UI ──
  const [menuOpen, setMenuOpen] = useState(null);
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  // ── Typing Animation (100% igual al Dashboard) ──
  useEffect(() => {
    const FULL_TEXT = "OdontoNova";
    let timeouts = [], cursorTimer;
    const cleanup = () => { timeouts.forEach(clearTimeout); clearInterval(cursorTimer); setCursorVisible(false); };
    const startBlink = () => { cursorTimer = setInterval(() => setCursorVisible(v => !v), 530); };
    
    const typeSequence = () => {
      let i = 0; startBlink();
      const step = () => {
        if (i <= FULL_TEXT.length) {
          setTypedText(FULL_TEXT.slice(0, i)); i++;
          timeouts.push(setTimeout(step, 85));
        } else {
          clearInterval(cursorTimer); setCursorVisible(false);
          timeouts.push(setTimeout(eraseSequence, 700));
        }
      };
      timeouts.push(setTimeout(step, 800));
    };
    
    const eraseSequence = () => {
      startBlink(); let i = FULL_TEXT.length;
      const step = () => {
        if (i >= 0) { setTypedText(FULL_TEXT.slice(0, i)); i--; timeouts.push(setTimeout(step, 45)); }
        else { clearInterval(cursorTimer); setCursorVisible(false); timeouts.push(setTimeout(typeSequence, 1000)); }
      };
      timeouts.push(setTimeout(step, 0));
    };
    typeSequence(); return cleanup;
  }, []);

  // ── Cargar datos si es edición ──
  useEffect(() => {
    if (id) {
      obtenerEspecialidad(id)
        .then((data) => setEspecialidad({
          nombreEspecialidad: data.nombreEspecialidad || "",
          descripcion: data.descripcion || "",
          estado: data.estado ?? true,
        }))
        .catch(err => {
          console.error("Error:", err);
          setErrors({ global: "No se pudo cargar la especialidad" });
        });
    }
  }, [id]);

  // ── Cierre de dropdowns ──
  useEffect(() => {
    const handleClick = (e) => { if (!e.target.closest('.dropdown')) setMenuOpen(null); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // ── Validación ──
  const validate = () => {
    const newErrors = {};
    if (!especialidad.nombreEspecialidad.trim()) {
      newErrors.nombreEspecialidad = "El nombre es obligatorio";
    } else if (especialidad.nombreEspecialidad.length < 3) {
      newErrors.nombreEspecialidad = "Mínimo 3 caracteres";
    }
    if (especialidad.descripcion && especialidad.descripcion.length > 500) {
      newErrors.descripcion = "Máximo 500 caracteres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Guardar ──
  const guardar = async () => {
    if (!validate()) return;
    setSubmitting(true);
    
    try {
      if (id) {
        await actualizarEspecialidad(id, especialidad);
      } else {
        await guardarEspecialidad(especialidad);
      }
      navigate("/admin/especialidades", { 
        state: { message: id ? "✅ Actualizado" : "✅ Creado", type: "success" } 
      });
    } catch (error) {
      console.error(error);
      setErrors({ global: "Error al procesar. Intenta nuevamente." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Menús del topbar (consistentes) ──
  const navModules = [
    { to: "/admin/usuarios", label: "Usuarios", icon: <UsersIcon /> },
    { to: "/admin/odontologos", label: "Odontólogos", icon: <DentistIcon /> },
    { to: "/admin/pacientes", label: "Pacientes", icon: <PatientIcon /> },
    { to: "/admin/citas", label: "Citas", icon: <CalendarIcon /> },
    { to: "/admin/sedes", label: "Sedes", icon: <BuildingIcon /> },
    { to: "/admin/consultorios", label: "Consultorios", icon: <RoomIcon /> },
    { to: "/admin/especialidades", label: "Especialidades", icon: <SpecialtyIcon /> },
  ];

  const quickCreate = [
    { to: "/admin/crear-usuario", label: "Nuevo Usuario", accent: "#6366f1" },
    { to: "/admin/crear-odontologo", label: "Nuevo Odontólogo", accent: "#1e40af" },
    { to: "/admin/crear-cita", label: "Nueva Cita", accent: "#db2777" },
    { to: "/admin/crear-sede", label: "Nueva Sede", accent: "#059669" },
    { to: "/admin/crear-consultorio", label: "Nuevo Consultorio", accent: "#d97706" },
    { to: "/admin/crear-especialidad", label: "Nueva Especialidad", accent: "#0891b2" },
  ];

  // ── Iconos SVG ──
  function UsersIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; }
  function DentistIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/></svg>; }
  function PatientIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
  function CalendarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/></svg>; }
  function BuildingIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>; }
  function RoomIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
  function SpecialtyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>; }
  function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }

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
        body{font-family:'Manrope',system-ui,sans-serif;background:var(--surface-50);-webkit-font-smoothing:antialiased}
        
        /* ── ROOT & TOPBAR ── */
        .esp-form-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 100%)}
        .esp-form-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow)}
        .topbar-brand{display:flex;align-items:center;gap:1rem;cursor:pointer;transition:var(--transition)}.topbar-brand:hover{transform:scale(1.01)}
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2.5rem;font-weight:500;font-style:italic;color:var(--text-elegant);line-height:1.1}
        .typing-wrapper{display:inline-flex;gap:0.02em}.typing-char.nova{color:var(--primary-600);font-weight:700;font-style:italic;background:linear-gradient(135deg,var(--primary-600),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.typing-cursor{width:2.5px;height:2.2rem;background:var(--primary-600);margin-left:3px;border-radius:2px;opacity:0;vertical-align:baseline}.typing-cursor.active{opacity:1;animation:blink 1s step-end infinite}@keyframes blink{50%{opacity:0}}
        
        .topbar-nav{display:flex;align-items:center;gap:0.35rem}.dropdown{position:relative}
        .dropdown-btn{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 1.1rem;border-radius:12px;font-size:0.87rem;font-weight:600;color:var(--text-500);background:transparent;border:1px solid transparent;cursor:pointer;transition:var(--transition)}.dropdown-btn:hover,.dropdown-btn.active{color:var(--primary-600);background:var(--primary-50);border-color:var(--primary-100);box-shadow:0 4px 16px rgba(30,64,175,0.1)}
        .dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:260px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg),var(--shadow-glow);padding:0.75rem;opacity:0;visibility:hidden;transform:translateY(-10px) scale(0.98);transition:var(--transition);z-index:101;animation:menuElegant 0.25s ease forwards}.dropdown.active .dropdown-menu{opacity:1;visibility:visible;transform:translateY(0) scale(1)}@keyframes menuElegant{from{opacity:0;transform:translateY(-10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .dropdown-item{display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1.1rem;border-radius:10px;font-size:0.87rem;font-weight:500;color:var(--text-elegant);text-decoration:none;transition:var(--transition);position:relative;overflow:hidden}.dropdown-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:var(--transition)}.dropdown-item:hover{background:linear-gradient(135deg,var(--primary-50),var(--surface));color:var(--primary-600);transform:translateX(6px);padding-left:1.4rem}.dropdown-item:hover::before{background:var(--primary-600)}
        .dropdown-label{padding:0.45rem 1.1rem;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-400);text-transform:uppercase;letter-spacing:0.12em}
        .btn-action{display:flex;align-items:center;gap:0.55rem;padding:0.65rem 1.35rem;border-radius:14px;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent;position:relative;overflow:hidden}.btn-action::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);transition:left 0.5s ease}.btn-action:hover::before{left:100%}.btn-profile{background:linear-gradient(135deg,#eff6ff,#dbeafe);color:var(--primary-600);border-color:#bfdbfe}.btn-logout{background:linear-gradient(135deg,#fff1f2,#ffe4e6);color:var(--danger);border-color:#fecdd3}.btn-action:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,0.12)}
        .topbar-badge{background:linear-gradient(135deg,var(--primary-100),#bfdbfe);border:1px solid #93c5fd;color:var(--primary-600);font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;letter-spacing:0.08em;text-transform:uppercase;padding:0.4rem 0.95rem;border-radius:100px}
        
        /* ── CONTENT ── */
        .esp-form-content{padding:clamp(2rem,5vw,3rem);max-width:680px;margin:0 auto;animation:fadeInUp 0.5s ease}@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .form-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:2rem;flex-wrap:wrap}
        .form-title-group{display:flex;flex-direction:column;gap:0.35rem}.form-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);display:flex;align-items:center;gap:0.5rem}.form-eyebrow::before{content:'';width:28px;height:1px;background:linear-gradient(90deg,var(--primary-600),transparent);border-radius:1px}.form-title{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;color:var(--text-elegant);line-height:1.1}
        .form-nav-btns{display:flex;gap:0.5rem}.btn-nav{display:inline-flex;align-items:center;gap:0.4rem;padding:0.6rem 1rem;background:var(--surface);border:1.5px solid var(--border-light);border-radius:12px;font-size:0.8rem;font-weight:600;color:var(--text-500);cursor:pointer;transition:var(--transition);text-decoration:none}.btn-nav:hover{border-color:var(--primary-600);color:var(--primary-600);background:var(--primary-50);transform:translateY(-2px)}
        
        /* ── FORM CARD ── */
        .form-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);padding:clamp(1.5rem,4vw,2.5rem);animation:fadeInUp 0.5s ease 0.1s both}
        .form-section{margin-bottom:1.75rem}.form-label{display:block;font-family:'Manrope',sans-serif;font-size:0.8rem;font-weight:600;color:var(--text-500);margin-bottom:0.5rem;letter-spacing:0.03em}.form-label.required::after{content:'*';color:var(--danger);margin-left:2px}
        .form-input,.form-textarea{width:100%;padding:0.9rem 1.1rem;background:var(--surface-100);border:1.5px solid var(--border-light);border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text);transition:var(--transition);outline:none}.form-input:focus,.form-textarea:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface)}.form-input.error,.form-textarea.error{border-color:var(--danger);background:#fef2f2}.form-input.error:focus,.form-textarea.error:focus{box-shadow:0 0 0 4px rgba(220,38,38,0.12)}
        .form-textarea{min-height:120px;resize:vertical;font-family:inherit;line-height:1.5}
        .form-error{font-size:0.75rem;color:var(--danger);margin-top:0.4rem;font-weight:500;display:flex;align-items:center;gap:0.35rem}.form-error::before{content:'⚠';font-size:0.8rem}
        .form-hint{font-size:0.75rem;color:var(--text-400);margin-top:0.35rem}
        
        /* ── TOGGLE SWITCH ELEGANTE ── */
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background:linear-gradient(135deg,var(--surface-100),var(--surface));border:1px solid var(--border-light);border-radius:14px;transition:var(--transition)}.toggle-row:hover{border-color:var(--primary-100);box-shadow:0 4px 16px rgba(30,64,175,0.06)}
        .toggle-label{font-size:0.85rem;font-weight:500;color:var(--text-elegant)}.toggle-hint{font-size:0.75rem;color:var(--text-500);margin-top:0.15rem}
        .toggle-switch{position:relative;width:52px;height:30px;flex-shrink:0}.toggle-switch input{opacity:0;width:0;height:0}.toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--border-light);border-radius:30px;transition:var(--transition);box-shadow:inset 0 2px 6px rgba(0,0,0,0.08)}.toggle-slider::before{content:'';position:absolute;width:24px;height:24px;left:3px;top:3px;background:#fff;border-radius:50%;transition:var(--transition);box-shadow:0 2px 8px rgba(0,0,0,0.15)}.input:checked + .toggle-slider{background:linear-gradient(135deg,var(--success),#047857)}.input:checked + .toggle-slider::before{transform:translateX(22px)}.toggle-slider:hover::before{transform:scale(1.05)}.input:checked + .toggle-slider:hover::before{transform:translateX(22px) scale(1.05)}
        
        /* ── ALERT GLOBAL ── */
        .form-alert{padding:0.9rem 1.25rem;border-radius:12px;font-size:0.85rem;font-weight:500;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.6rem;animation:shake 0.4s ease}.form-alert.error{background:#fef2f2;color:var(--danger);border:1px solid #fecaca}.form-alert.success{background:#f0fdf4;color:var(--success);border:1px solid #bbf7d0}@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        
        /* ── SUBMIT BUTTON ── */
        .btn-submit{width:100%;padding:1rem 1.5rem;background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff;border:none;border-radius:14px;font-family:'Manrope',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;transition:var(--transition);display:flex;align-items:center;justify-content:center;gap:0.6rem;box-shadow:0 4px 20px rgba(30,64,175,0.25);position:relative;overflow:hidden}.btn-submit::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);transition:left 0.5s ease}.btn-submit:hover::before{left:100%}.btn-submit:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(30,64,175,0.35)}.btn-submit:active{transform:translateY(0)}.btn-submit:disabled{opacity:0.7;cursor:not-allowed;transform:none;box-shadow:none}.btn-submit .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        
        /* ── FOOTER HELP ── */
        .form-footer{margin-top:2rem;padding-top:1.5rem;border-top:1px dashed var(--border-light);text-align:center;font-size:0.8rem;color:var(--text-500)}.form-footer a{color:var(--primary-600);text-decoration:none;font-weight:600}.form-footer a:hover{text-decoration:underline}
        
        /* ── RESPONSIVE ── */
        @media(max-width:768px){.form-header{flex-direction:column;align-items:stretch}.form-nav-btns{justify-content:space-between}.btn-nav{flex:1;justify-content:center}}
        @media(max-width:600px){.topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}.form-title{font-size:1.6rem}.toggle-row{flex-direction:column;align-items:flex-start;gap:0.75rem}.toggle-switch{align-self:flex-end}}
      `}</style>

      <div className="esp-form-root">
        {/* ── TOPBAR CONSISTENTE ── */}
        <header className="esp-form-topbar">
          <div className="topbar-brand" onClick={() => navigate("/admin/dashboard")}>
            <span className="topbar-name">
              <span className="typing-wrapper" aria-label="OdontoNova">
                {typedText.split("").map((char, i) => (
                  <span key={i} className={`typing-char ${i >= 6 ? 'nova' : ''}`}>{char}</span>
                ))}
              </span>
              <span className={`typing-cursor ${cursorVisible ? 'active' : ''}`} aria-hidden="true" />
            </span>
          </div>

          <nav className="topbar-nav">
            {/* Dropdown Módulos */}
            <div className={`dropdown ${menuOpen === 'modules' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'modules' ? null : 'modules'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Módulos
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Gestión</span>
                {navModules.map((m) => (
                  <Link key={m.to} to={m.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)}>{m.icon}{m.label}</Link>
                ))}
              </div>
            </div>

            {/* Dropdown Crear */}
            <div className={`dropdown ${menuOpen === 'create' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'create' ? null : 'create'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Crear
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Nuevo registro</span>
                {quickCreate.map((q) => (
                  <Link key={q.to} to={q.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)} style={{ borderLeft: `3px solid ${q.accent}`, paddingLeft: '0.65rem' }}>{q.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/admin/perfil" className="btn-action btn-profile">Perfil</Link>
            <span className="topbar-badge">Admin</span>
            <button onClick={handleLogout} className="btn-action btn-logout">Salir</button>
          </nav>
        </header>

        {/* ── FORMULARIO ── */}
        <main className="esp-form-content">
          <div className="form-header">
            <div className="form-title-group">
              <p className="form-eyebrow">{id ? "✎ Edición" : "＋ Nuevo Registro"}</p>
              <h1 className="form-title">{id ? "Editar Especialidad" : "Crear Especialidad"}</h1>
            </div>
            <div className="form-nav-btns">
              <button onClick={() => navigate("/admin/dashboard")} className="btn-nav">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/></svg>
                Panel
              </button>
              <button onClick={() => navigate("/admin/especialidades")} className="btn-nav">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Lista
              </button>
            </div>
          </div>

          <div className="form-card">
            {/* Alerta global */}
            {errors.global && (
              <div className="form-alert error" role="alert">{errors.global}</div>
            )}

            {/* Nombre */}
            <div className="form-section">
              <label className="form-label required" htmlFor="nombre">Nombre de la Especialidad</label>
              <input
                id="nombre"
                className={`form-input ${errors.nombreEspecialidad ? 'error' : ''}`}
                placeholder="Ej: Ortodoncia Invisible, Endodoncia Microscópica..."
                value={especialidad.nombreEspecialidad}
                onChange={(e) => {
                  setEspecialidad({ ...especialidad, nombreEspecialidad: e.target.value });
                  if (errors.nombreEspecialidad) setErrors({ ...errors, nombreEspecialidad: null });
                }}
                maxLength={100}
                aria-invalid={!!errors.nombreEspecialidad}
                aria-describedby={errors.nombreEspecialidad ? "nombre-error" : undefined}
              />
              {errors.nombreEspecialidad && (
                <p id="nombre-error" className="form-error">{errors.nombreEspecialidad}</p>
              )}
              <p className="form-hint">Máximo 100 caracteres. Sé específico y claro.</p>
            </div>

            {/* Descripción */}
            <div className="form-section">
              <label className="form-label" htmlFor="descripcion">Descripción Detallada</label>
              <textarea
                id="descripcion"
                className={`form-textarea ${errors.descripcion ? 'error' : ''}`}
                placeholder="Describe los procedimientos, tecnologías o enfoques que incluye esta especialidad..."
                value={especialidad.descripcion}
                onChange={(e) => {
                  setEspecialidad({ ...especialidad, descripcion: e.target.value });
                  if (errors.descripcion) setErrors({ ...errors, descripcion: null });
                }}
                maxLength={500}
                aria-describedby="desc-hint"
              />
              <p id="desc-hint" className="form-hint">{especialidad.descripcion.length}/500 caracteres</p>
              {errors.descripcion && <p className="form-error">{errors.descripcion}</p>}
            </div>

            {/* Toggle Estado */}
            <div className="form-section">
              <div className="toggle-row">
                <div>
                  <p className="toggle-label">Estatus de la especialidad</p>
                  <p className="toggle-hint">{especialidad.estado ? "Visible en listados y asignable" : "Oculto temporalmente"}</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    className="input"
                    checked={especialidad.estado}
                    onChange={(e) => setEspecialidad({ ...especialidad, estado: e.target.checked })}
                    aria-label="Activar o desactivar especialidad"
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            {/* Botón Submit */}
            <button
              onClick={guardar}
              disabled={submitting}
              className="btn-submit"
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckIcon />
                  {id ? "Guardar Cambios" : "Registrar Especialidad"}
                </>
              )}
            </button>

            {/* Footer help */}
            <div className="form-footer">
              ¿Necesitas ayuda? <a href="#soporte">Contacta al equipo de soporte</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}