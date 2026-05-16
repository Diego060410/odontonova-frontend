import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Usuarios() {
  const navigate = useNavigate();
  
  // ── Estados principales ──
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  // ── Carga de usuarios ──
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const res = await api.get("/usuarios");
        console.log("USUARIOS:", res.data);
        setUsuarios(res.data);
      } catch (error) {
        console.error("Error cargando usuarios:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    cargarUsuarios();
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

  const rolColor = (rol) => {
    const map = {
      ADMIN:      { bg: "#eff6ff", color: "#1d4ed8", label: "Admin", border: "#bfdbfe" },
      ODONTOLOGO: { bg: "#f0fdf4", color: "#16a34a", label: "Odontólogo", border: "#bbf7d0" },
      USER:       { bg: "#fdf4ff", color: "#7e22ce", label: "Paciente", border: "#f5d0fe" },
      RECEPCIONISTA: { bg: "#fff7ed", color: "#ea580c", label: "Recepcionista", border: "#fdba74" },
    };
    return map[rol?.toUpperCase()] || { bg: "#f8fafc", color: "#475569", label: rol || "—", border: "#e2e8f0" };
  };

  const filtered = usuarios.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.idUsuario?.toString().includes(q) ||
      u.nombres?.toLowerCase().includes(q) ||
      u.apellidos?.toLowerCase().includes(q) ||
      u.correo?.toLowerCase().includes(q) ||
      u.rol?.nombreRol?.toLowerCase().includes(q)
    );
  });

  const initials = (nombres, apellidos) => {
    const a = nombres?.[0] || "";
    const b = apellidos?.[0] || "";
    return (a + b).toUpperCase() || "?";
  };

  const avatarColor = (id) => {
    const colors = ["#1e40af", "#7c3aed", "#059669", "#d97706", "#db2777", "#0891b2"];
    return colors[(id || 0) % colors.length];
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
        .usr-content{padding:clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,3rem);max-width:1300px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── HEADER DE PÁGINA ── */
        .usr-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;margin-bottom:2.5rem;animation:fadeInUp 0.5s ease 0.2s both}
        .usr-header-left{display:flex;flex-direction:column;gap:0.5rem}
        .usr-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);display:flex;align-items:center;gap:0.5rem}
        .usr-eyebrow::before{content:'';width:28px;height:1px;background:linear-gradient(90deg,var(--primary-600),transparent);border-radius:1px}
        .usr-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.02em;line-height:1.1}
        .usr-count-badge{display:inline-flex;align-items:center;gap:0.45rem;background:linear-gradient(135deg,var(--primary-50),#dbeafe);border:1px solid var(--primary-100);color:var(--primary-600);font-family:'Manrope',sans-serif;font-size:0.75rem;font-weight:600;padding:0.45rem 1rem;border-radius:100px;box-shadow:0 2px 10px rgba(30,64,175,0.1);animation:pulse 2.5s infinite}
        
        /* ── ACTION BUTTONS ── */
        .usr-actions{display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}
        .btn-back{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:var(--text-elegant);color:#fff;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);box-shadow:0 4px 16px rgba(15,23,42,0.15);text-decoration:none}
        .btn-back:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,0.25);background:#0f172a}
        .btn-back:active{transform:translateY(0)}
        .btn-create{display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;background:linear-gradient(135deg,var(--success),#047857);color:#fff;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);box-shadow:0 4px 18px rgba(5,150,105,0.25);text-decoration:none;position:relative;overflow:hidden}
        .btn-create::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);transition:left 0.5s ease}
        .btn-create:hover::before{left:100%}
        .btn-create:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(5,150,105,0.4);filter:brightness(1.05)}
        .btn-create:active{transform:translateY(0)}
        
        /* ── SEARCH ── */
        .usr-search-wrap{position:relative;min-width:280px}
        .usr-search-icon{position:absolute;left:1.1rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-400);pointer-events:none;transition:var(--transition)}
        .usr-search{width:100%;padding:0.85rem 1.1rem 0.85rem 2.75rem;background:var(--surface);border:1.5px solid var(--border-light);border-radius:14px;font-family:'Manrope',sans-serif;font-size:0.87rem;color:var(--text-elegant);outline:none;transition:var(--transition)}
        .usr-search::placeholder{color:var(--text-400);font-weight:400}
        .usr-search:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface-100)}
        .usr-search:focus + .usr-search-icon,.usr-search-wrap:hover .usr-search-icon{color:var(--primary-600)}
        
        /* ── TABLE ── */
        .usr-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);overflow:hidden;animation:fadeInUp 0.5s ease 0.3s both}
        .usr-table{width:100%;border-collapse:collapse}
        .usr-table thead{background:linear-gradient(135deg,var(--surface-100),var(--surface));border-bottom:1px solid var(--border-light)}
        .usr-table thead th{padding:1rem 1.5rem;text-align:left;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-500);text-transform:uppercase;letter-spacing:0.12em;white-space:nowrap}
        .usr-table tbody tr{border-bottom:1px solid var(--surface-100);transition:var(--transition);position:relative}
        .usr-table tbody tr::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:var(--transition);border-radius:0 4px 4px 0}
        .usr-table tbody tr:hover{background:linear-gradient(135deg,var(--surface-100),var(--surface));transform:translateX(4px)}
        .usr-table tbody tr:hover::before{background:var(--primary-600)}
        .usr-table tbody tr:last-child{border-bottom:none}
        .usr-table td{padding:1.1rem 1.5rem;font-size:0.87rem;color:var(--text);vertical-align:middle;font-family:'Manrope',sans-serif;font-weight:400}
        .td-id{font-family:'Cormorant Garamond',serif;font-size:0.78rem;font-weight:600;color:var(--text-400);font-variant-numeric:tabular-nums;background:var(--surface-100);padding:0.35rem 0.7rem;border-radius:8px}
        .td-user{display:flex;align-items:center;gap:0.8rem}
        .td-avatar{width:30px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:0.8rem;font-weight:700;color:#fff;flex-shrink:0;letter-spacing:0.02em;box-shadow:0 3px 12px rgba(0,0,0,0.12);transition:var(--transition)}
        .usr-table tbody tr:hover .td-avatar{transform:scale(1.08) rotate(3deg)}
        .td-name{font-family:'Manrope',sans-serif;font-weight:600;color:var(--text-elegant);font-size:0.9rem;transition:var(--transition)}
        .usr-table tbody tr:hover .td-name{color:var(--primary-600)}
        .td-email{color:var(--text-500);font-size:0.83rem;font-family:'Manrope',sans-serif}
        .rol-badge{display:inline-flex;align-items:center;gap:0.4rem;font-family:'Manrope',sans-serif;font-size:0.72rem;font-weight:600;padding:0.4rem 0.9rem;border-radius:100px;letter-spacing:0.05em;text-transform:uppercase;white-space:nowrap;border:1px solid currentColor;transition:var(--transition)}
        .rol-badge:hover{transform:scale(1.05);box-shadow:0 4px 14px rgba(0,0,0,0.1)}
        .rol-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;animation:blink 2s infinite}
        @keyframes blink{50%{opacity:0.5}}
        
        /* ── EMPTY / LOADING ── */
        .usr-empty{padding:4.5rem 2.5rem;text-align:center}
        .usr-empty-icon{width:64px;height:64px;background:linear-gradient(135deg,var(--surface-100),var(--surface));border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;color:var(--text-400);box-shadow:0 4px 20px rgba(0,0,0,0.06);animation:float 3s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .usr-empty-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.4rem}
        .usr-empty-sub{font-family:'Manrope',sans-serif;font-size:0.85rem;color:var(--text-500);font-weight:400}
        .usr-loading{padding:5rem 2rem;display:flex;flex-direction:column;align-items:center;gap:1.25rem;animation:fadeIn 0.4s ease}
        .spinner{width:44px;height:44px;border:3px solid var(--border-light);border-top-color:var(--primary-600);border-radius:50%;animation:spin 1s linear infinite;box-shadow:0 0 0 4px rgba(30,64,175,0.08)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .loading-text{font-family:'Cormorant Garamond',serif;font-size:0.95rem;color:var(--text-500);font-style:italic;font-weight:500}
        
        /* ── FOOTER ── */
        .usr-footer{padding:0.95rem 1.5rem;background:linear-gradient(135deg,var(--surface-100),var(--surface));border-top:1px solid var(--border-light);font-family:'Manrope',sans-serif;font-size:0.75rem;color:var(--text-500);font-weight:500;display:flex;align-items:center;gap:0.5rem}
        .usr-footer svg{color:var(--primary-600)}
        
        /* ── SCROLLBAR ── */
        .usr-table-wrap{overflow-x:auto}
        .usr-table-wrap::-webkit-scrollbar{height:8px}
        .usr-table-wrap::-webkit-scrollbar-track{background:var(--surface-100);border-radius:4px}
        .usr-table-wrap::-webkit-scrollbar-thumb{background:linear-gradient(90deg,var(--primary-100),var(--primary-600));border-radius:4px}
        .usr-table-wrap::-webkit-scrollbar-thumb:hover{background:var(--primary-600)}
        
        /* ── RESPONSIVE ── */
        @media(max-width:900px){.topbar-nav{gap:0.15rem}.dropdown-menu{min-width:220px;right:-10px}.btn-action{padding:0.55rem 1rem;font-size:0.83rem}.usr-title{font-size:1.8rem}.usr-actions{width:100%;justify-content:space-between}}
        @media(max-width:768px){.usr-header{flex-direction:column;align-items:stretch}.usr-search-wrap{min-width:100%}.usr-table td,.usr-table th{padding:0.9rem 1rem;font-size:0.82rem}.td-avatar{width:36px;height:36px;font-size:0.75rem}}
        @media(max-width:600px){.topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}.usr-title{font-size:1.5rem}.usr-actions{flex-direction:column;align-items:stretch}.btn-back,.btn-create{width:100%;justify-content:center}.usr-table thead{display:none}.usr-table tbody tr{display:block;padding:1rem;border-bottom:1px solid var(--border-light)}.usr-table td{display:flex;justify-content:space-between;padding:0.6rem 1rem;font-size:0.8rem}.usr-table td::before{content:attr(data-label);font-family:'Cormorant Garamond',serif;font-weight:600;font-style:italic;color:var(--text-500);text-transform:uppercase;font-size:0.7rem;letter-spacing:0.08em}}
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
        <main className="usr-content">

          {/* Header de Página + Acciones */}
          <div className="usr-header">
            <div className="usr-header-left">
              <p className="usr-eyebrow">Gestión de sistema</p>
              <h1 className="usr-title">Usuarios</h1>
              {!loading && (
                <div className="usr-count-badge">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  {usuarios.length} usuarios registrados
                </div>
              )}
            </div>

            {/* Acciones: Volver + Crear + Buscar */}
            <div className="usr-actions">
              <button onClick={() => navigate("/admin/dashboard")} className="btn-back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Volver al Dashboard
              </button>
              
              <Link to="/admin/crear-usuario" className="btn-create">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Crear Usuario
              </Link>

              <div className="usr-search-wrap">
                <svg className="usr-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  className="usr-search"
                  placeholder="Buscar usuario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card de Tabla */}
          <div className="usr-card">
            {loading ? (
              <div className="usr-loading">
                <div className="spinner" />
                <span className="loading-text">Cargando usuarios...</span>
              </div>
            ) : (
              <>
                <div className="usr-table-wrap">
                  <table className="usr-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Usuario</th>
                        <th>Correo electrónico</th>
                        <th>Rol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan="4">
                            <div className="usr-empty">
                              <div className="usr-empty-icon">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                              </div>
                              <p className="usr-empty-title">
                                {search ? "Sin resultados" : "Lista vacía"}
                              </p>
                              <p className="usr-empty-sub">
                                {search 
                                  ? `Ningún usuario coincide con "${search}"` 
                                  : "Los usuarios registrados aparecerán aquí automáticamente"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((u) => {
                          const { bg, color, label, border } = rolColor(u.rol?.nombreRol);
                          return (
                            <tr key={u.idUsuario}>
                              <td data-label="ID"><span className="td-id">#{u.idUsuario}</span></td>
                              <td data-label="Usuario">
                                <div className="td-user">
                                  <div
                                    className="td-avatar"
                                    style={{ background: avatarColor(u.idUsuario) }}
                                    title={`${u.nombres} ${u.apellidos}`}
                                  >
                                    {initials(u.nombres, u.apellidos)}
                                  </div>
                                  <span className="td-name">{u.nombres} {u.apellidos}</span>
                                </div>
                              </td>
                              <td data-label="Correo"><span className="td-email">{u.correo || "—"}</span></td>
                              <td data-label="Rol">
                                <span 
                                  className="rol-badge" 
                                  style={{ background: bg, color, borderColor: border }}
                                  title={`Rol: ${label}`}
                                >
                                  <span className="rol-dot" />
                                  {label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                  <div className="usr-footer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Mostrando {filtered.length} de {usuarios.length} usuarios
                    {search && <span style={{marginLeft:'0.5rem',opacity:0.7}}>• Filtrado</span>}
                  </div>
                )}
              </>
            )}
          </div>

        </main>
      </div>
    </>
  );
}