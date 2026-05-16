import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listarSedes } from "../../services/sedeService";
import { crearConsultorio } from "../../services/consultorioService";

export default function CrearConsultorio() {
  const navigate = useNavigate();
  
  // ── Estados del formulario ──
  const [nombre, setNombre] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [piso, setPiso] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados para typing animation del logo (aislados) ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

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

  // ── Carga de sedes ──
  useEffect(() => {
    const fetchSedes = async () => {
      try {
        const data = await listarSedes();
        setSedes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar sedes:", error);
        setFeedback({ type: "error", text: "No se pudieron cargar las sedes" });
        setSedes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSedes();
  }, []);

  // ── Cierre de dropdowns al clickear fuera ──
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.dropdown')) setMenuOpen(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!sedeId || !nombre.trim()) {
      setFeedback({ type: "error", text: "⚠️ Los campos marcados con * son obligatorios" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        idSede: Number(sedeId),
        nombreConsultorio: nombre,
        piso,
        descripcion,
        estado: true,
      };
      await crearConsultorio(payload);
      setFeedback({ type: "success", text: "✅ Consultorio creado correctamente" });
      setNombre("");
      setSedeId("");
      setPiso("");
      setDescripcion("");
      setTimeout(() => setFeedback(null), 4000);
    } catch (error) {
      console.error("Error al crear consultorio:", error);
      setFeedback({
        type: "error",
        text: `❌ ${error.response?.data?.mensaje || "Error al crear consultorio"}`,
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Menús del topbar (memorizados) ──
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
    { to: "/admin/crear-usuario", label: "Nuevo Usuario", accent: "#6366f1" },
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
        .cc-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%);background-attachment:fixed}
        
        /* ── TOPBAR ELEGANTE ── */
        .cc-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow);animation:slideDown 0.5s ease}
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
        .cc-content{padding:clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,3rem);max-width:720px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── HEADER DE PÁGINA ── */
        .cc-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;margin-bottom:2.5rem;animation:fadeInUp 0.5s ease 0.2s both}
        .cc-header-left{display:flex;flex-direction:column;gap:0.5rem}
        .cc-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);display:flex;align-items:center;gap:0.5rem}
        .cc-eyebrow::before{content:'';width:28px;height:1px;background:linear-gradient(90deg,var(--primary-600),transparent);border-radius:1px}
        .cc-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.02em;line-height:1.1}
        .cc-subtitle{font-family:'Manrope',sans-serif;font-size:0.95rem;color:var(--text-500);font-weight:400}
        
        /* ── ACTION BUTTONS ── */
        .cc-actions{display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}
        .btn-back{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:var(--text-elegant);color:#fff;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);box-shadow:0 4px 16px rgba(15,23,42,0.15);text-decoration:none}
        .btn-back:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,0.25);background:#0f172a}
        .btn-back:active{transform:translateY(0)}
        .btn-list{display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);box-shadow:0 4px 18px rgba(30,64,175,0.25);text-decoration:none;position:relative;overflow:hidden}
        .btn-list::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);transition:left 0.5s ease}
        .btn-list:hover::before{left:100%}
        .btn-list:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(30,64,175,0.4);filter:brightness(1.05)}
        .btn-list:active{transform:translateY(0)}
        
        /* ── CARD DE FORMULARIO ── */
        .cc-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);overflow:hidden;animation:fadeInUp 0.5s ease 0.3s both}
        .cc-card-header{padding:1.5rem 2rem;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:1rem;background:linear-gradient(135deg,var(--surface-100),var(--surface))}
        .cc-card-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,var(--primary-600),var(--accent));display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.4rem;box-shadow:0 4px 14px rgba(30,64,175,0.25);flex-shrink:0}
        .cc-card-title-group{flex:1}
        .cc-card-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:600;color:var(--text-elegant)}
        .cc-card-subtitle{font-family:'Manrope',sans-serif;font-size:0.85rem;color:var(--text-500);margin-top:0.25rem}
        
        /* ── FEEDBACK BANNER ── */
        .cc-feedback{margin:1.5rem 2rem 0;padding:1rem 1.25rem;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:500;display:flex;align-items:center;gap:0.6rem;animation:slideIn 0.3s ease}
        @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .cc-feedback.success{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;color:#166534}
        .cc-feedback.error{background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fca5a5;color:#991b1b}
        .cc-feedback svg{flex-shrink:0}
        
        /* ── FORMULARIO ── */
        .cc-form{padding:1.75rem 2rem}
        .cc-section{margin-bottom:2rem}
        .cc-section:last-child{margin-bottom:0}
        .cc-section-title{font-family:'Cormorant Garamond',serif;font-size:0.9rem;font-weight:600;font-style:italic;color:var(--text-elegant);margin-bottom:1.25rem;padding-left:1rem;border-left:3px solid var(--primary-600);display:flex;align-items:center;gap:0.5rem}
        .cc-section-title::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--primary-600)}
        
        .cc-field{margin-bottom:1.25rem}
        .cc-field:last-child{margin-bottom:0}
        .cc-label{display:flex;align-items:center;gap:0.3rem;font-family:'Manrope',sans-serif;font-size:0.82rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.5rem;letter-spacing:0.02em}
        .cc-label .required{color:var(--danger);margin-left:2px}
        .cc-label .optional{font-size:0.72rem;font-weight:400;color:var(--text-400);font-style:italic}
        .cc-input,.cc-select,.cc-textarea{width:100%;padding:0.85rem 1.1rem;background:var(--surface-100);border:1.5px solid var(--border-light);border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-elegant);outline:none;transition:var(--transition)}
        .cc-input::placeholder,.cc-textarea::placeholder{color:var(--text-400);font-weight:400}
        .cc-input:focus,.cc-select:focus,.cc-textarea:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface)}
        .cc-input:disabled,.cc-select:disabled{opacity:0.6;cursor:not-allowed;background:var(--surface-50)}
        .cc-textarea{resize:vertical;min-height:100px;line-height:1.5}
        .cc-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 1rem center;background-size:16px;padding-right:2.5rem;cursor:pointer}
        .cc-select::-ms-expand{display:none}
        
        .cc-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem}
        
        /* ── BOTÓN PRIMARIO ── */
        .cc-btn-submit{width:100%;padding:1rem 1.5rem;background:linear-gradient(135deg,var(--success),#047857);color:#fff;border:none;border-radius:14px;font-family:'Manrope',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;transition:var(--transition);display:flex;align-items:center;justify-content:center;gap:0.5rem;box-shadow:0 4px 18px rgba(5,150,105,0.25);position:relative;overflow:hidden;margin-top:0.5rem}
        .cc-btn-submit::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);transition:left 0.5s ease}
        .cc-btn-submit:hover:not(:disabled)::before{left:100%}
        .cc-btn-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(5,150,105,0.4);filter:brightness(1.05)}
        .cc-btn-submit:active:not(:disabled){transform:translateY(0)}
        .cc-btn-submit:disabled{opacity:0.65;cursor:not-allowed;transform:none;background:linear-gradient(135deg,#94a3b8,#cbd5e1)}
        
        /* ── FOOTER NOTE ── */
        .cc-footer-note{text-align:center;font-family:'Manrope',sans-serif;font-size:0.75rem;color:var(--text-400);margin-top:1.25rem;font-style:italic}
        .cc-footer-note .required{color:var(--danger);font-weight:600}
        
        /* ── LOADING STATE ── */
        .cc-loading{padding:3rem 2rem;text-align:center}
        .cc-spinner{width:44px;height:44px;border:3px solid var(--border-light);border-top-color:var(--primary-600);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem;box-shadow:0 0 0 4px rgba(30,64,175,0.08)}
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading-text{font-family:'Cormorant Garamond',serif;font-size:0.95rem;color:var(--text-500);font-style:italic}
        
        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .topbar-nav{gap:0.15rem}
          .dropdown-menu{min-width:220px;right:-10px}
          .btn-action{padding:0.55rem 1rem;font-size:0.83rem}
        }
        @media(max-width:768px){
          .cc-header{flex-direction:column;align-items:stretch}
          .cc-actions{width:100%;justify-content:space-between}
          .cc-title{font-size:1.8rem}
          .cc-card-header{flex-direction:column;text-align:center;padding:1.25rem 1.5rem}
          .cc-form{padding:1.5rem}
          .cc-row{grid-template-columns:1fr}
          .cc-feedback{margin:1rem}
        }
        @media(max-width:600px){
          .topbar-brand span{display:none}
          .dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}
          .cc-title{font-size:1.5rem}
          .cc-actions{flex-direction:column;align-items:stretch}
          .btn-back,.btn-list{width:100%;justify-content:center}
        }
      `}</style>

      <div className="cc-root">

        {/* ── TOPBAR CON TYPING ANIMATION ── */}
        <header className="cc-topbar">
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
                  <Link key={q.to} to={q.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)} style={{ borderLeft: `3px solid ${q.accent}`, paddingLeft: '0.65rem' }}>{q.label}</Link>
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

        {/* ── CONTENT ─ */}
        <main className="cc-content">

          {/* Header de Página + Acciones */}
          <div className="cc-header">
            <div className="cc-header-left">
              <p className="cc-eyebrow">Registro</p>
              <h1 className="cc-title">Nuevo Consultorio</h1>
              <p className="cc-subtitle">Configura y asigna el consultorio a una sede</p>
            </div>

            {/* Acciones: Volver al Dashboard + Ver Consultorios */}
            <div className="cc-actions">
              <button onClick={() => navigate("/admin/dashboard")} className="btn-back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Volver al Dashboard
              </button>
              
              <button onClick={() => navigate("/admin/consultorios")} className="btn-list">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                Ver Consultorios
              </button>
            </div>
          </div>

          {/* Card de Formulario */}
          <div className="cc-card">
            <div className="cc-card-header">
              <div className="cc-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <div className="cc-card-title-group">
                <h2 className="cc-card-title">Datos del Consultorio</h2>
                <p className="cc-card-subtitle">Información de ubicación y detalles</p>
              </div>
            </div>

            {/* Feedback Banner */}
            {feedback && (
              <div className={`cc-feedback ${feedback.type}`}>
                {feedback.type === "success" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
                {feedback.text}
              </div>
            )}

            {loading ? (
              <div className="cc-loading">
                <div className="cc-spinner" />
                <p className="loading-text">Cargando sedes disponibles...</p>
              </div>
            ) : (
              <form className="cc-form" onSubmit={handleSubmit}>
                
                {/* Sección: Ubicación */}
                <div className="cc-section">
                  <h3 className="cc-section-title">Ubicación</h3>
                  
                  <div className="cc-field">
                    <label className="cc-label">
                      Sede <span className="required">*</span>
                    </label>
                    <select
                      className="cc-select"
                      value={sedeId}
                      onChange={(e) => setSedeId(e.target.value)}
                      required
                      disabled={sedes.length === 0}
                    >
                      <option value="">Selecciona una sede</option>
                      {sedes.length > 0 ? (
                        sedes.map((s) => (
                          <option key={s.idSede} value={s.idSede}>
                            {s.nombreSede || s.nombre}
                          </option>
                        ))
                      ) : (
                        <option disabled>No hay sedes disponibles</option>
                      )}
                    </select>
                  </div>

                  <div className="cc-row">
                    <div className="cc-field">
                      <label className="cc-label">
                        Nombre del Consultorio <span className="required">*</span>
                      </label>
                      <input
                        className="cc-input"
                        type="text"
                        placeholder="Ej. Consultorio 01"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                      />
                    </div>
                    <div className="cc-field">
                      <label className="cc-label">
                        Piso <span className="optional">opcional</span>
                      </label>
                      <input
                        className="cc-input"
                        type="text"
                        placeholder="Ej. 2do piso"
                        value={piso}
                        onChange={(e) => setPiso(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Sección: Detalles */}
                <div className="cc-section">
                  <h3 className="cc-section-title">Detalles</h3>
                  
                  <div className="cc-field">
                    <label className="cc-label">
                      Descripción <span className="optional">opcional</span>
                    </label>
                    <textarea
                      className="cc-textarea"
                      placeholder="Equipamiento, uso especial, notas relevantes..."
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    />
                  </div>
                </div>

                {/* Botón de Envío */}
                <button 
                  type="submit" 
                  className="cc-btn-submit" 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                      Crear Consultorio
                    </>
                  )}
                </button>

                <p className="cc-footer-note">
                  Los campos marcados con <span className="required">*</span> son obligatorios
                </p>
              </form>
            )}
          </div>

        </main>
      </div>
    </>
  );
}