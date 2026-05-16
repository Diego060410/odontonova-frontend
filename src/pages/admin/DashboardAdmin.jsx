import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function DashboardAdmin() {
  const navigate = useNavigate();
  
  // ── Estados del Dashboard (sin cambios) ──
  const [stats, setStats] = useState({
    totalCitas: 0, totalOdontologos: 0, totalPacientes: 0,
    totalSedes: 0, totalEspecialidades: 0, totalConsultorios: 0,
    actividadReciente: []
  });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados aislados para animación del logo ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  // ── Efecto de Typing (100% aislado, no afecta el resto del UI) ──
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
          // Pausa visible -> borrar -> esperar 10s total -> repetir
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
          // ~8.5s de espera + 1.5s pausa anterior = ~10s ciclo exacto
          timeouts.push(setTimeout(typeSequence, 1000));
        }
      };
      timeouts.push(setTimeout(step, 0));
    };

    typeSequence();
    return cleanup;
  }, []);

  // ── Carga de datos ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citasRes, odontosRes, pacientesRes, sedesRes, especialidadesRes, consultoriosRes] =
          await Promise.all([
            api.get("/citas"), api.get("/odontologos"), api.get("/pacientes"),
            api.get("/sedes"), api.get("/especialidades"), api.get("/consultorios")
          ]);

        const citasData = citasRes.data || [];
        setStats({
          totalCitas: citasData.length,
          totalOdontologos: odontosRes.data?.length || 0,
          totalPacientes: pacientesRes.data?.length || 0,
          totalSedes: sedesRes.data?.length || 0,
          totalEspecialidades: especialidadesRes.data?.length || 0,
          totalConsultorios: consultoriosRes.data?.length || 0,
          actividadReciente: citasData.slice(-3).reverse()
        });
      } catch (error) {
        console.error("Error Dashboard:", error.response?.data || error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Cierre de dropdowns ──
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

  const estadoColor = (estado) => {
    const map = {
      CONFIRMADA: { bg: "#f0fdf4", color: "#16a34a" },
      PENDIENTE:  { bg: "#fffbeb", color: "#d97706" },
      CANCELADA:  { bg: "#fef2f2", color: "#dc2626" },
    };
    return map[estado?.toUpperCase()] || { bg: "#f8fafc", color: "#475569" };
  };

  const formatearFechaLocal = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split(/[-T/]/);
    return new Date(year, month - 1, day).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  };

  const statCards = useMemo(() => [
    { label: "Total Citas", value: stats.totalCitas, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, accent: "#1e40af", bg: "#eff6ff", badge: "Sincronizado", badgeColor: "#16a34a" },
    { label: "Odontólogos", value: stats.totalOdontologos, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>, accent: "#7c3aed", bg: "#f5f3ff" },
    { label: "Pacientes", value: stats.totalPacientes, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, accent: "#059669", bg: "#f0fdf4" },
    { label: "Sedes", value: stats.totalSedes, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, accent: "#d97706", bg: "#fffbeb" },
    { label: "Consultorios", value: stats.totalConsultorios, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, accent: "#db2777", bg: "#fdf2f8" },
    { label: "Especialidades", value: stats.totalEspecialidades, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>, accent: "#0891b2", bg: "#ecfeff" }
  ], [stats]);

  const navModules = useMemo(() => [
    { to: "/admin/usuarios", label: "Usuarios", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { to: "/admin/odontologos", label: "Odontólogos", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> },
    { to: "/admin/pacientes", label: "Pacientes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { to: "/admin/citas", label: "Citas", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { to: "/admin/sedes", label: "Sedes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { to: "/admin/consultorios", label: "Consultorios", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { to: "/admin/especialidades", label: "Especialidades", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
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
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontWeight: 500, letterSpacing: "0.05em", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando panel...</p>
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
        .dash-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%);background-attachment:fixed}
        .dash-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow);animation:slideDown 0.5s ease}
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
        .dash-content{padding:clamp(2rem,5vw,3rem);max-width:1300px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        .page-heading{margin-bottom:3rem;animation:fadeInUp 0.6s ease 0.25s both;text-align:center}
        .page-heading-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);margin-bottom:0.75rem;display:flex;align-items:center;justify-content:center;gap:0.6rem}
        .page-heading-eyebrow::before,.page-heading-eyebrow::after{content:'';width:32px;height:1px;background:linear-gradient(90deg,transparent,var(--primary-600));border-radius:1px;opacity:0.6}
        .page-heading-eyebrow::after{background:linear-gradient(90deg,var(--primary-600),transparent)}
        .page-heading-title{font-family:'Cormorant Garamond',serif;font-size:2.4rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.02em;line-height:1.15;margin-bottom:0.5rem}
        .page-heading-subtitle{font-family:'Manrope',sans-serif;font-size:1rem;color:var(--text-500);font-weight:400;letter-spacing:0.01em}
        .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1.5rem;margin-bottom:3.5rem}
        .stat-card{background:var(--surface);border-radius:var(--radius);padding:1.75rem;border:1px solid var(--border-light);box-shadow:var(--shadow);position:relative;overflow:hidden;transition:var(--transition);animation:fadeInUp 0.5s ease both}
        .stat-card:nth-child(1){animation-delay:0.1s}.stat-card:nth-child(2){animation-delay:0.15s}.stat-card:nth-child(3){animation-delay:0.2s}.stat-card:nth-child(4){animation-delay:0.25s}.stat-card:nth-child(5){animation-delay:0.3s}.stat-card:nth-child(6){animation-delay:0.35s}
        .stat-card:hover{transform:translateY(-8px);box-shadow:var(--shadow-lg),var(--shadow-glow);border-color:var(--primary-100)}
        .stat-card::before{content:'';position:absolute;top:-50%;right:-50%;width:200px;height:200px;background:radial-gradient(circle,rgba(30,64,175,0.06) 0%,transparent 70%);border-radius:50%;transition:var(--transition);opacity:0}
        .stat-card:hover::before{opacity:1;transform:scale(1.2)}
        .stat-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}
        .stat-icon-wrap{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:var(--transition);box-shadow:0 4px 14px rgba(0,0,0,0.06)}
        .stat-card:hover .stat-icon-wrap{transform:scale(1.12) rotate(4deg);box-shadow:0 8px 24px rgba(0,0,0,0.12)}
        .stat-label{font-family:'Cormorant Garamond',serif;font-size:0.78rem;font-weight:600;font-style:italic;color:var(--text-500);letter-spacing:0.06em;text-transform:uppercase;margin-bottom:0.35rem}
        .stat-number{font-family:'Cormorant Garamond',serif;font-size:2.8rem;font-weight:700;color:var(--text-elegant);line-height:1;margin-bottom:0.6rem;letter-spacing:-0.03em}
        .stat-card:hover .stat-number{transform:scale(1.03)}
        .stat-badge{display:inline-flex;align-items:center;gap:0.4rem;font-family:'Manrope',sans-serif;font-size:0.72rem;font-weight:600;color:var(--success)}
        .stat-badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;animation:blink-dot 1.8s infinite}
        @keyframes blink-dot{50%{opacity:0.4}}
        .stat-accent-bar{position:absolute;left:0;top:22%;bottom:22%;width:4px;border-radius:0 6px 6px 0;transition:var(--transition)}
        .stat-card:hover .stat-accent-bar{width:5px;box-shadow:0 0 16px currentColor}
        .section-header{display:flex;align-items:center;gap:1.25rem;margin:3.5rem 0 1.5rem;animation:fadeInUp 0.5s ease both}
        .section-header:nth-of-type(2){animation-delay:0.1s}.section-header:nth-of-type(3){animation-delay:0.15s}
        .section-title{font-family:'Cormorant Garamond',serif;font-size:1.35rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.01em;position:relative;padding-left:1.25rem}
        .section-title::before{content:'';position:absolute;left:0;top:50%;width:4px;height:22px;background:linear-gradient(180deg,var(--primary-600),var(--accent));border-radius:3px;transform:translateY(-50%);box-shadow:0 2px 8px rgba(30,64,175,0.3)}
        .section-line{flex:1;height:1px;background:linear-gradient(90deg,var(--border-light),transparent)}
        .module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:1rem;margin-bottom:3rem}
        .module-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;padding:1.4rem 1rem;background:var(--surface);border:1.5px solid var(--border-light);border-radius:16px;text-decoration:none;color:var(--text-500);font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;transition:var(--transition);text-align:center;position:relative;overflow:hidden}
        .module-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--primary-50),transparent);opacity:0;transition:var(--transition);z-index:0}
        .module-btn:hover{border-color:var(--primary-600);color:var(--primary-600);transform:translateY(-5px);box-shadow:var(--shadow-lg)}
        .module-btn:hover::before{opacity:1}
        .module-icon{width:44px;height:44px;background:var(--surface-100);border-radius:12px;display:flex;align-items:center;justify-content:center;transition:var(--transition);position:relative;z-index:1;box-shadow:0 2px 10px rgba(0,0,0,0.04)}
        .module-btn:hover .module-icon{background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff;transform:scale(1.1) rotate(-3deg);box-shadow:0 6px 20px rgba(30,64,175,0.35)}
        .quick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:1rem;margin-bottom:3.5rem}
        .quick-btn{display:flex;align-items:center;justify-content:center;gap:0.7rem;padding:1rem 1.35rem;border:none;border-radius:14px;color:#ffffff;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;text-decoration:none;transition:var(--transition);box-shadow:0 4px 18px rgba(0,0,0,0.1);position:relative;overflow:hidden}
        .quick-btn::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);transition:left 0.5s ease}
        .quick-btn:hover::before{left:100%}
        .quick-btn:hover{filter:brightness(1.08);transform:translateY(-5px) scale(1.02);box-shadow:0 12px 36px rgba(0,0,0,0.18)}
        .quick-btn:active{transform:translateY(0) scale(0.99)}
        .activity-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);overflow:hidden;animation:fadeInUp 0.5s ease 0.4s both}
        .activity-item{display:flex;align-items:center;gap:1.25rem;padding:1.35rem 2rem;border-bottom:1px solid var(--surface-100);transition:var(--transition);position:relative}
        .activity-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:var(--transition);border-radius:0 4px 4px 0}
        .activity-item:hover::before{background:linear-gradient(180deg,var(--primary-600),var(--accent))}
        .activity-item:last-child{border-bottom:none}
        .activity-item:hover{background:linear-gradient(135deg,var(--surface-100),var(--surface));padding-left:2.35rem}
        .activity-dot{width:44px;height:44px;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--primary-600);transition:var(--transition);box-shadow:0 4px 14px rgba(30,64,175,0.15)}
        .activity-item:hover .activity-dot{transform:scale(1.12) rotate(6deg);background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff;box-shadow:0 8px 24px rgba(30,64,175,0.35)}
        .activity-info{flex:1;min-width:0}
        .activity-title{font-family:'Cormorant Garamond',serif;font-size:0.95rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.3rem;transition:var(--transition)}
        .activity-item:hover .activity-title{color:var(--primary-600)}
        .activity-meta{font-family:'Manrope',sans-serif;font-size:0.8rem;color:var(--text-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:400}
        .activity-status{font-family:'Manrope',sans-serif;font-size:0.74rem;font-weight:600;padding:0.4rem 0.95rem;border-radius:100px;white-space:nowrap;letter-spacing:0.05em;text-transform:uppercase;flex-shrink:0;transition:var(--transition);box-shadow:0 2px 8px rgba(0,0,0,0.06)}
        .activity-item:hover .activity-status{transform:scale(1.06)}
        .activity-empty{padding:3.5rem 2.5rem;text-align:center;color:var(--text-500);font-family:'Manrope',sans-serif;font-size:0.95rem;animation:fadeIn 0.4s ease}
        .activity-empty::before{content:'✦';display:block;font-family:'Cormorant Garamond',serif;font-size:3rem;color:var(--primary-600);margin-bottom:1rem;animation:sparkle 2.5s infinite}
        @keyframes sparkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.1)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @media(max-width:900px){.topbar-nav{gap:0.15rem}.dropdown-menu{min-width:220px;right:-10px}.btn-action{padding:0.55rem 1rem;font-size:0.83rem}.page-heading-title{font-size:2rem}.stat-number{font-size:2.4rem}.stat-grid{grid-template-columns:repeat(2,1fr)}.module-grid{grid-template-columns:repeat(3,1fr)}.quick-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}.stat-grid{grid-template-columns:1fr}.module-grid{grid-template-columns:repeat(2,1fr)}.quick-grid{grid-template-columns:1fr}.page-heading-title{font-size:1.7rem}.section-title{font-size:1.2rem}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}.animate-float{animation:float 3.5s ease-in-out infinite}
      `}</style>

      <div className="dash-root">
        <header className="dash-topbar">
          <div className="topbar-brand" onClick={() => window.location.reload()}>
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

        <main className="dash-content">
          <div className="page-heading">
            <p className="page-heading-eyebrow">Panel de Gestión</p>
            <h1 className="page-heading-title">Dashboard Del Administrador</h1>
            <p className="page-heading-subtitle">Gestión integral de tu clínica dental</p>
          </div>

          <div className="stat-grid">
            {statCards.map((s, i) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-accent-bar" style={{ background: s.accent }} />
                <div className="stat-card-top">
                  <div className="stat-icon-wrap" style={{ background: s.bg, color: s.accent }}>{s.icon}</div>
                </div>
                <p className="stat-label">{s.label}</p>
                <p className="stat-number">{s.value.toLocaleString('es-PE')}</p>
                {s.badge && (
                  <span className="stat-badge" style={{ color: s.badgeColor }}>
                    <span className="stat-badge-dot" /> {s.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="section-header">
            <span className="section-title">Acceso a Módulos</span>
            <div className="section-line" />
          </div>
          <div className="module-grid">
            {navModules.map((m) => (
              <Link to={m.to} className="module-btn" key={m.to}>
                <div className="module-icon">{m.icon}</div>
                {m.label}
              </Link>
            ))}
          </div>

          <div className="section-header">
            <span className="section-title">Creación Rápida</span>
            <div className="section-line" />
          </div>
          <div className="quick-grid">
            {quickCreate.map((q) => (
              <Link to={q.to} key={q.to} className="quick-btn" style={{ background: `linear-gradient(135deg, ${q.accent}, ${q.accent}cc)` }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {q.label}
              </Link>
            ))}
          </div>

          <div className="section-header">
            <span className="section-title">Actividad Reciente</span>
            <div className="section-line" />
          </div>
          <div className="activity-card">
            {stats.actividadReciente.length > 0 ? (
              stats.actividadReciente.map((c) => {
                const estado = c.estadoCita?.nombreEstado || "PROCESADA";
                const { bg, color } = estadoColor(estado);
                return (
                  <div className="activity-item" key={c.idCita}>
                    <div className="activity-dot">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div className="activity-info">
                      <p className="activity-title">Cita #{c.idCita}</p>
                      <p className="activity-meta">{c.paciente?.nombres || "Paciente registrado"} &middot; {formatearFechaLocal(c.fecha)}</p>
                    </div>
                    <span className="activity-status" style={{ background: bg, color }}>{estado}</span>
                  </div>
                );
              })
            ) : (
              <div className="activity-empty">No hay citas recientes registradas.</div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}