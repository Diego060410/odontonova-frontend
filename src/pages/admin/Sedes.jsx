import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listarSedes,
  actualizarSede,
  eliminarSede,
} from "../../services/sedeService";

export default function Sedes() {
  const navigate = useNavigate();
  
  // ── Estados principales ──
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados para typing animation del logo (aislados) ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  
  // ── Estados de edición ──
  const [editingSede, setEditingSede] = useState(null);
  const [form, setForm] = useState({
    nombreSede: "", direccion: "", telefono: "", correo: "",
    horaApertura: "08:00", horaCierre: "18:00", estado: true,
  });

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
    fetchSedes();
  }, []);

  const fetchSedes = async () => {
    try {
      const data = await listarSedes();
      setSedes(data || []);
    } catch (err) {
      console.error("Error al cargar sedes:", err);
      setSedes([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleActualizar = async () => {
    if (!editingSede) return;
    try {
      await actualizarSede(editingSede.idSede, form);
      alert("✅ Sede actualizada correctamente");
      setEditingSede(null);
      fetchSedes();
    } catch (err) {
      console.error("Error actualizando sede:", err);
      alert("❌ Error al actualizar la sede");
    }
  };

  const handleEliminar = async (idSede, nombreSede) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombreSede}"?`)) return;
    try {
      await eliminarSede(idSede);
      alert("🗑️ Sede eliminada");
      fetchSedes();
      if (editingSede?.idSede === idSede) setEditingSede(null);
    } catch (err) {
      console.error("Error eliminando sede:", err);
      alert("❌ Error al eliminar la sede");
    }
  };

  const handleEditar = (sede) => {
    setForm({ ...sede });
    setEditingSede(sede);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelar = () => {
    setEditingSede(null);
    setForm({
      nombreSede: "", direccion: "", telefono: "", correo: "",
      horaApertura: "08:00", horaCierre: "18:00", estado: true,
    });
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ width: 52, height: 52, border: "3px solid #e5e7eb", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem", boxShadow: "0 0 0 6px rgba(30,64,175,0.08)" }} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontWeight: 500, letterSpacing: "0.05em", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando sedes...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      </div>
    );
  }

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
        .sedes-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%);background-attachment:fixed}
        
        /* ── TOPBAR ELEGANTE ── */
        .sedes-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow);animation:slideDown 0.5s ease}
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
        .sedes-content{padding:clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,3rem);max-width:1300px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── HEADER DE PÁGINA ── */
        .sedes-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;margin-bottom:2.5rem;animation:fadeInUp 0.5s ease 0.2s both}
        .sedes-header-left{display:flex;flex-direction:column;gap:0.5rem}
        .sedes-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);display:flex;align-items:center;gap:0.5rem}
        .sedes-eyebrow::before{content:'';width:28px;height:1px;background:linear-gradient(90deg,var(--primary-600),transparent);border-radius:1px}
        .sedes-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.02em;line-height:1.1}
        .sedes-subtitle{font-family:'Manrope',sans-serif;font-size:0.95rem;color:var(--text-500);font-weight:400}
        .sedes-count-badge{display:inline-flex;align-items:center;gap:0.45rem;background:linear-gradient(135deg,var(--primary-50),#dbeafe);border:1px solid var(--primary-100);color:var(--primary-600);font-family:'Manrope',sans-serif;font-size:0.75rem;font-weight:600;padding:0.45rem 1rem;border-radius:100px;box-shadow:0 2px 10px rgba(30,64,175,0.1);animation:pulse 2.5s infinite}
        
        /* ── ACTION BUTTONS ── */
        .sedes-actions{display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}
        .btn-back{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:var(--text-elegant);color:#fff;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);box-shadow:0 4px 16px rgba(15,23,42,0.15);text-decoration:none}
        .btn-back:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,0.25);background:#0f172a}
        .btn-back:active{transform:translateY(0)}
        .btn-create{display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;background:linear-gradient(135deg,var(--success),#047857);color:#fff;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);box-shadow:0 4px 18px rgba(5,150,105,0.25);text-decoration:none;position:relative;overflow:hidden}
        .btn-create::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);transition:left 0.5s ease}
        .btn-create:hover::before{left:100%}
        .btn-create:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(5,150,105,0.4);filter:brightness(1.05)}
        .btn-create:active{transform:translateY(0)}
        
        /* ── EDIT CARD ── */
        .edit-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);overflow:hidden;animation:fadeInUp 0.5s ease 0.25s both;margin-bottom:2rem}
        .edit-card-header{padding:1.25rem 2rem;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:1rem;background:linear-gradient(135deg,var(--surface-100),var(--surface))}
        .edit-card-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--primary-600),var(--accent));display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;flex-shrink:0}
        .edit-card-title{font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:600;color:var(--text-elegant)}
        .edit-card-subtitle{font-family:'Manrope',sans-serif;font-size:0.82rem;color:var(--text-500);margin-top:0.2rem}
        .edit-form{padding:1.5rem 2rem}
        .edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem}
        .edit-field{display:flex;flex-direction:column;gap:0.4rem}
        .edit-label{font-family:'Manrope',sans-serif;font-size:0.78rem;font-weight:600;color:var(--text-elegant)}
        .edit-input{padding:0.75rem 1rem;background:var(--surface-100);border:1.5px solid var(--border-light);border-radius:10px;font-family:'Manrope',sans-serif;font-size:0.87rem;color:var(--text-elegant);outline:none;transition:var(--transition)}
        .edit-input::placeholder{color:var(--text-400)}
        .edit-input:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface)}
        .edit-input:disabled{opacity:0.6;cursor:not-allowed;background:var(--surface-50)}
        .edit-actions{display:flex;gap:0.75rem;flex-wrap:wrap}
        .btn-update{padding:0.75rem 1.5rem;background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);display:flex;align-items:center;gap:0.5rem}
        .btn-update:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(30,64,175,0.3)}
        .btn-update:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .btn-cancel{padding:0.75rem 1.5rem;background:var(--surface-100);color:var(--text-500);border:1.5px solid var(--border-light);border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition)}
        .btn-cancel:hover{background:var(--surface);border-color:var(--danger);color:var(--danger)}
        
        /* ── TABLE CARD ── */
        .sedes-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);overflow:hidden;animation:fadeInUp 0.5s ease 0.3s both}
        .sedes-card-header{padding:1.25rem 2rem;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,var(--surface-100),var(--surface))}
        .sedes-card-title{font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:600;color:var(--text-elegant)}
        .sedes-badge{font-family:'Manrope',sans-serif;font-size:0.75rem;font-weight:600;padding:0.4rem 0.9rem;border-radius:100px;background:var(--primary-50);color:var(--primary-600);border:1px solid var(--primary-100)}
        
        /* ── TABLE ── */
        .sedes-table-wrap{overflow-x:auto}
        .sedes-table{width:100%;border-collapse:collapse;table-layout:fixed}
        .sedes-table thead{background:linear-gradient(135deg,var(--surface-100),var(--surface));border-bottom:2px solid var(--border-light)}
        .sedes-table thead th{padding:1rem 1.5rem;text-align:left;font-family:'Cormorant Garamond',serif;font-size:0.7rem;font-weight:600;font-style:italic;color:var(--text-500);text-transform:uppercase;letter-spacing:0.12em;white-space:nowrap}
        .sedes-table tbody tr{border-bottom:1px solid var(--surface-100);transition:var(--transition);position:relative}
        .sedes-table tbody tr::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:var(--transition);border-radius:0 4px 4px 0}
        .sedes-table tbody tr:hover{background:linear-gradient(135deg,var(--surface-100),var(--surface))}
        .sedes-table tbody tr:hover::before{background:var(--primary-600)}
        .sedes-table tbody tr:last-child{border-bottom:none}
        .sedes-table td{padding:1.1rem 1.5rem;font-size:0.85rem;color:var(--text);vertical-align:middle;font-family:'Manrope',sans-serif;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .td-id{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;color:var(--text-400);background:var(--surface-100);padding:0.35rem 0.7rem;border-radius:8px;display:inline-block}
        .td-info{display:flex;flex-direction:column;gap:0.25rem}
        .td-name{font-family:'Manrope',sans-serif;font-weight:600;color:var(--text-elegant);font-size:0.9rem}
        .td-phone{font-family:'Manrope',sans-serif;font-size:0.78rem;color:var(--text-500)}
        .td-address{font-family:'Manrope',sans-serif;font-size:0.82rem;color:var(--text-elegant)}
        .estado-badge{display:inline-flex;align-items:center;gap:0.4rem;font-family:'Manrope',sans-serif;font-size:0.7rem;font-weight:600;padding:0.4rem 0.9rem;border-radius:100px;letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap;border:1px solid currentColor;transition:var(--transition)}
        .estado-badge:hover{transform:scale(1.05)}
        .estado-dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:blink-dot 2s infinite}
        @keyframes blink-dot{50%{opacity:0.5}}
        .action-btn{padding:0.45rem 0.9rem;border:none;border-radius:8px;font-family:'Manrope',sans-serif;font-size:0.75rem;font-weight:600;cursor:pointer;transition:var(--transition);display:inline-flex;align-items:center;gap:0.3rem}
        .btn-edit{background:var(--primary-50);color:var(--primary-600);border:1px solid var(--primary-100)}
        .btn-edit:hover{background:var(--primary-100);border-color:var(--primary-600)}
        .btn-delete{background:#fef2f2;color:var(--danger);border:1px solid #fecdd3}
        .btn-delete:hover{background:#fee2e2;border-color:var(--danger)}
        
        /* ── EMPTY STATE ── */
        .sedes-empty{padding:4rem 2rem;text-align:center}
        .sedes-empty-icon{width:64px;height:64px;background:linear-gradient(135deg,var(--surface-100),var(--surface));border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;color:var(--text-400);animation:float 3s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .sedes-empty-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.4rem}
        .sedes-empty-sub{font-family:'Manrope',sans-serif;font-size:0.85rem;color:var(--text-500)}
        
        /* ── FOOTER ── */
        .sedes-footer{padding:0.95rem 2rem;background:linear-gradient(135deg,var(--surface-100),var(--surface));border-top:1px solid var(--border-light);font-family:'Manrope',sans-serif;font-size:0.75rem;color:var(--text-500);font-weight:500;display:flex;justify-content:space-between;align-items:center}
        
        /* ── SCROLLBAR ── */
        .sedes-table-wrap::-webkit-scrollbar{height:8px}
        .sedes-table-wrap::-webkit-scrollbar-track{background:var(--surface-100);border-radius:4px}
        .sedes-table-wrap::-webkit-scrollbar-thumb{background:linear-gradient(90deg,var(--primary-100),var(--primary-600));border-radius:4px}
        .sedes-table-wrap::-webkit-scrollbar-thumb:hover{background:var(--primary-600)}
        
        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .topbar-nav{gap:0.15rem}
          .dropdown-menu{min-width:220px;right:-10px}
          .btn-action{padding:0.55rem 1rem;font-size:0.83rem}
          .sedes-title{font-size:1.8rem}
          .sedes-actions{width:100%;justify-content:space-between}
        }
        @media(max-width:768px){
          .sedes-header{flex-direction:column;align-items:stretch}
          .edit-grid{grid-template-columns:1fr}
          .sedes-table td,.sedes-table th{padding:0.9rem 1rem;font-size:0.8rem}
        }
        @media(max-width:600px){
          .topbar-brand span{display:none}
          .dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}
          .sedes-title{font-size:1.5rem}
          .sedes-actions{flex-direction:column;align-items:stretch}
          .btn-back,.btn-create{width:100%;justify-content:center}
          .sedes-table thead{display:none}
          .sedes-table tbody tr{display:block;padding:1rem;border-bottom:1px solid var(--border-light)}
          .sedes-table td{display:flex;justify-content:space-between;padding:0.6rem 1rem;font-size:0.8rem}
          .sedes-table td::before{content:attr(data-label);font-family:'Cormorant Garamond',serif;font-weight:600;font-style:italic;color:var(--text-500);text-transform:uppercase;font-size:0.7rem;letter-spacing:0.08em}
        }
      `}</style>

      <div className="sedes-root">

        {/* ── TOPBAR CON TYPING ANIMATION ── */}
        <header className="sedes-topbar">
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

        {/* ── CONTENT ── */}
        <main className="sedes-content">

          {/* Header de Página + Acciones */}
          <div className="sedes-header">
            <div className="sedes-header-left">
              <p className="sedes-eyebrow">Gestión de infraestructura</p>
              <h1 className="sedes-title">Sedes Registradas</h1>
              <p className="sedes-subtitle">Administra las ubicaciones de tu clínica dental</p>
              {!loading && (
                <div className="sedes-count-badge">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  {sedes.length} sedes encontradas
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="sedes-actions">
              <button onClick={() => navigate("/admin/dashboard")} className="btn-back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Volver al Dashboard
              </button>
              
              <Link to="/admin/crear-sede" className="btn-create">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nueva Sede
              </Link>
            </div>
          </div>

          {/* Card de Edición (solo visible cuando hay una sede seleccionada) */}
          {editingSede && (
            <div className="edit-card">
              <div className="edit-card-header">
                <div className="edit-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div>
                  <h3 className="edit-card-title">Editando: {editingSede.nombreSede}</h3>
                  <p className="edit-card-subtitle">Modifica los datos y guarda los cambios</p>
                </div>
              </div>
              <div className="edit-form">
                <div className="edit-grid">
                  <div className="edit-field">
                    <label className="edit-label">Nombre de Sede</label>
                    <input className="edit-input" value={form.nombreSede} onChange={(e) => setForm({...form, nombreSede: e.target.value})} />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label">Dirección</label>
                    <input className="edit-input" value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label">Teléfono</label>
                    <input className="edit-input" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label">Correo</label>
                    <input className="edit-input" type="email" value={form.correo} onChange={(e) => setForm({...form, correo: e.target.value})} />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label">Apertura</label>
                    <input className="edit-input" type="time" value={form.horaApertura} onChange={(e) => setForm({...form, horaApertura: e.target.value})} />
                  </div>
                  <div className="edit-field">
                    <label className="edit-label">Cierre</label>
                    <input className="edit-input" type="time" value={form.horaCierre} onChange={(e) => setForm({...form, horaCierre: e.target.value})} />
                  </div>
                </div>
                <div className="edit-actions">
                  <button className="btn-update" onClick={handleActualizar}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    Actualizar Cambios
                  </button>
                  <button className="btn-cancel" onClick={handleCancelar}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

          {/* Table Card */}
          <div className="sedes-card">
            <div className="sedes-card-header">
              <h2 className="sedes-card-title">Listado de Sedes</h2>
              <span className="sedes-badge">{sedes.length} registros</span>
            </div>

            <div className="sedes-table-wrap">
              <table className="sedes-table">
                <colgroup>
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '280px' }} />
                  <col style={{ width: '320px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '180px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>ID</th>
                    <th style={{ textAlign: 'left' }}>INFORMACIÓN</th>
                    <th style={{ textAlign: 'left' }}>DIRECCIÓN</th>
                    <th style={{ textAlign: 'center' }}>ESTADO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {sedes.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <div className="sedes-empty">
                          <div className="sedes-empty-icon">
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          </div>
                          <p className="sedes-empty-title">Lista vacía</p>
                          <p className="sedes-empty-sub">Las sedes registradas aparecerán aquí automáticamente</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sedes.map((s) => (
                      <tr key={s.idSede}>
                        <td data-label="ID">
                          <span className="td-id">#{s.idSede}</span>
                        </td>
                        <td data-label="Información">
                          <div className="td-info">
                            <span className="td-name">{s.nombreSede}</span>
                            <span className="td-phone">{s.telefono || "—"}</span>
                          </div>
                        </td>
                        <td data-label="Dirección">
                          <span className="td-address">{s.direccion || "—"}</span>
                        </td>
                        <td data-label="Estado" style={{ textAlign: 'center' }}>
                          <span 
                            className="estado-badge" 
                            style={{ 
                              background: s.estado ? "#f0fdf4" : "#fef2f2", 
                              color: s.estado ? "#16a34a" : "#dc2626",
                              borderColor: s.estado ? "#86efac" : "#fca5a5"
                            }}
                          >
                            <span className="estado-dot" />
                            {s.estado ? "ACTIVA" : "INACTIVA"}
                          </span>
                        </td>
                        <td data-label="Acciones" style={{ textAlign: 'center' }}>
                          <button className="action-btn btn-edit" onClick={() => handleEditar(s)}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Editar
                          </button>
                          <button className="action-btn btn-delete" onClick={() => handleEliminar(s.idSede, s.nombreSede)} style={{ marginLeft: '0.5rem' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {sedes.length > 0 && (
              <div className="sedes-footer">
                <span>Mostrando {sedes.length} sedes registradas</span>
                <span style={{opacity:0.7}}>• Última actualización: ahora</span>
              </div>
            )}
          </div>

        </main>
      </div>
    </>
  );
}