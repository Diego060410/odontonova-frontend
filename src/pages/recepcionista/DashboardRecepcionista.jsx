import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function DashboardRecepcionista() {
  const navigate = useNavigate();
  
  // ── Estados del Dashboard ──
  const [stats, setStats] = useState({
    citasHoy: 0,
    pacientesNuevos: 0,
    citasPendientes: 0,
    actividadReciente: []
  });
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  // ── Efecto de Typing para "OdontoNova" ──
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

  // ── Carga de datos ──
  const fetchData = async () => {
    try {
      const [citasRes, pacientesRes] = await Promise.all([
        api.get("/citas"),
        api.get("/pacientes")
      ]);

      const citasData = citasRes.data || [];

      // FECHA DE HOY (sin timezone issues)
      const hoy = new Date();
      const hoyISO = hoy.toISOString().split("T")[0];

      // CITAS DE HOY
      const citasHoy = citasData.filter(c => {
        const fechaCita = c.fecha?.split("T")[0];
        return fechaCita === hoyISO;
      });

      setStats({
        citasHoy: citasHoy.length,
        pacientesNuevos: pacientesRes.data?.length || 0,
        citasPendientes: citasData.length,
        actividadReciente: citasData.slice(-5).reverse()
      });
    } catch (error) {
      console.error("Error en dashboard recepcionista:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Se actualiza cada vez que la página vuelve a enfocarse
    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
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
    localStorage.clear();
    navigate("/", { replace: true });
  };

  // ✅ CORRECCIÓN: Formateo de fecha SIN timezone issues
  const formatearFechaLocal = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split(/[-T/]/).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${day} de ${meses[date.getUTCMonth()]} ${year}`;
  };

  // ── Módulos de navegación ──
  const modulos = useMemo(() => [
    { to: "/recepcion/citas", label: "Agenda de Citas", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color: "#0e71cd" },
    { to: "/recepcion/pacientes", label: "Registro Pacientes", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color: "#10b981" },
    { to: "/recepcion/disponibilidad", label: "Ver Horarios", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, color: "#f59e0b" },
  ], []);

  // ── Tarjetas de estadísticas ──
  const statCards = useMemo(() => [
    { 
      label: "Citas Hoy", value: stats.citasHoy, 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, 
      accent: "#0e71cd", bg: "#eff6ff", desc: "Programadas" 
    },
    { 
      label: "Citas Totales", value: stats.citasPendientes, 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, 
      accent: "#7c3aed", bg: "#f5f3ff", desc: "En sistema" 
    },
    { 
      label: "Pacientes", value: stats.pacientesNuevos, 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, 
      accent: "#10b981", bg: "#f0fdf4", desc: "Registrados" 
    },
  ], [stats]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ width: 52, height: 52, border: "3px solid #e5e7eb", borderTopColor: "#0e71cd", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando panel...</p>
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
          --primary:#0e71cd;--primary-600:#0e71cd;--primary-50:#eff6ff;--primary-100:#dbeafe;
          --surface:#ffffff;--surface-50:#fafafa;--surface-100:#f8fafc;--border:#e2e8f0;--border-light:#f1f5f9;
          --text:#0f172a;--text-500:#64748b;--text-400:#94a3b8;--text-elegant:#1e293b;
          --success:#16a34a;--warning:#d97706;--danger:#dc2626;--accent:#7c3aed;
          --shadow:0 4px 20px rgba(0,0,0,0.04);--shadow-lg:0 12px 48px rgba(0,0,0,0.08);--shadow-glow:0 0 40px rgba(14,113,205,0.12);
          --radius:20px;--radius-sm:14px;--transition:all 0.3s cubic-bezier(0.16,1,0.3,1)
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
        
        /* Typing Animation para OdontoNova */
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:500;font-style:italic;color:var(--text-elegant);letter-spacing:0.01em;line-height:1;display:flex;align-items:baseline}
        .typing-wrapper{display:inline-flex;align-items:baseline;gap:0.01em}
        .typing-char{display:inline-block;transition:transform 0.1s ease}
        .typing-char.nova{color:var(--primary-600);font-style:italic;font-weight:700;background:linear-gradient(135deg,var(--primary-600),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .typing-cursor{display:inline-block;width:2px;height:2rem;background:var(--primary-600);margin-left:2px;vertical-align:middle;border-radius:1px;opacity:0}
        .typing-cursor.active{opacity:1;animation:blink 1s step-end infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        .topbar-nav{display:flex;align-items:center;gap:0.5rem}
        .btn-action{display:flex;align-items:center;gap:0.5rem;padding:0.6rem 1.2rem;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent}
        .btn-profile{background:var(--primary-50);color:var(--primary-600);border-color:var(--primary-100)}
        .btn-profile:hover{background:var(--primary-100);border-color:var(--primary-600)}
        .btn-logout{background:#fff1f2;color:var(--danger);border-color:#fecdd3}
        .btn-logout:hover{background:#ffe4e6;border-color:var(--danger)}
        .topbar-badge{background:var(--primary-100);color:var(--primary-600);font-family:'Cormorant Garamond',serif;font-size:0.7rem;font-weight:600;font-style:italic;padding:0.35rem 0.85rem;border-radius:100px;border:1px solid #93c5fd}
        
        /* ── CONTENIDO ── */
        .dash-content{
          padding:clamp(1.5rem,4vw,2.5rem);
          max-width:1100px;
          margin:0 auto;
          animation:fadeInUp 0.5s ease 0.1s both;
        }
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        
        .page-greeting{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.25rem}
        .page-subtitle{font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-500);margin-bottom:1.75rem}
        
        /* Estadísticas */
        .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.25rem;margin-bottom:2.5rem}
        .stat-card{
          background:var(--surface);border-radius:var(--radius);
          padding:1.25rem;border:1px solid var(--border-light);
          box-shadow:var(--shadow);position:relative;overflow:hidden;
          transition:var(--transition);animation:fadeInUp 0.4s ease both;
          display:flex;align-items:center;gap:1rem
        }
        .stat-card:nth-child(1){animation-delay:0.1s}.stat-card:nth-child(2){animation-delay:0.15s}.stat-card:nth-child(3){animation-delay:0.2s}
        .stat-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg);border-color:var(--primary-100)}
        .stat-icon-wrap{
          width:48px;height:48px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;transition:var(--transition)
        }
        .stat-card:hover .stat-icon-wrap{transform:scale(1.1) rotate(2deg)}
        .stat-info{flex:1}
        .stat-label{
          font-family:'Manrope',sans-serif;
          font-size:0.8rem;font-weight:500;color:var(--text-500);
          margin-bottom:0.25rem
        }
        .stat-number{
          font-family:'Cormorant Garamond',serif;
          font-size:1.8rem;font-weight:700;color:var(--text-elegant);
          line-height:1
        }
        .stat-desc{
          font-family:'Manrope',sans-serif;
          font-size:0.75rem;color:var(--text-400)
        }
        
        /* Módulos */
        .section-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.2rem;font-weight:600;color:var(--text-elegant);
          margin:2rem 0 1rem;letter-spacing:-0.01em
        }
        .module-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.9rem;margin-bottom:2.5rem}
        .module-btn{
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:0.7rem;padding:1.3rem 1rem;
          background:var(--surface);border:1.5px solid var(--border-light);
          border-radius:14px;text-decoration:none;color:var(--text-500);
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          transition:var(--transition);text-align:center;position:relative;overflow:hidden
        }
        .module-btn::before{
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,var(--primary-50),transparent);
          opacity:0;transition:var(--transition);z-index:0
        }
        .module-btn:hover{
          border-color:var(--primary-600);color:var(--primary-600);
          transform:translateY(-4px);box-shadow:var(--shadow-lg)
        }
        .module-btn:hover::before{opacity:1}
        .module-icon{
          width:42px;height:42px;border-radius:11px;
          background:var(--surface-100);
          display:flex;align-items:center;justify-content:center;
          transition:var(--transition);position:relative;z-index:1
        }
        .module-btn:hover .module-icon{
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff;transform:scale(1.08) rotate(-2deg)
        }
        .module-btn.primary{
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff;border-color:transparent
        }
        .module-btn.primary:hover{
          filter:brightness(1.05);box-shadow:0 8px 28px rgba(14,113,205,0.35)
        }
        .module-btn.primary .module-icon{background:rgba(255,255,255,0.15);color:#fff}
        
        /* Actividad reciente */
        .activity-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          overflow:hidden;animation:fadeInUp 0.5s ease 0.3s both
        }
        .activity-item{
          display:flex;align-items:center;justify-content:space-between;
          padding:1.1rem 1.5rem;border-bottom:1px solid var(--surface-100);
          transition:var(--transition)
        }
        .activity-item:last-child{border-bottom:none}
        .activity-item:hover{
          background:linear-gradient(135deg,var(--surface-100),var(--surface));
          padding-left:1.8rem
        }
        .activity-info{flex:1;min-width:0}
        .activity-title{
          font-family:'Cormorant Garamond',serif;
          font-size:0.95rem;font-weight:600;color:var(--text-elegant);
          margin-bottom:0.2rem
        }
        .activity-meta{
          font-family:'Manrope',sans-serif;
          font-size:0.8rem;color:var(--text-500)
        }
        .activity-time{
          font-family:'Manrope',sans-serif;
          font-size:0.82rem;font-weight:700;color:var(--primary-600);
          background:var(--primary-50);padding:0.3rem 0.7rem;
          border-radius:8px;flex-shrink:0
        }
        .activity-empty{
          padding:2.5rem 1.5rem;text-align:center;
          color:var(--text-500);font-family:'Manrope',sans-serif;
          font-size:0.9rem
        }
        
        /* Footer */
        .dash-footer{text-align:center;padding:1.5rem;color:var(--text-400);font-family:'Manrope',sans-serif;font-size:0.83rem}
        .dash-footer a{color:var(--primary-600);text-decoration:none;font-weight:500}
        .dash-footer a:hover{text-decoration:underline}
        
        @media(max-width:700px){
          .dash-topbar{padding:0 1rem;height:66px}
          .topbar-name{font-size:1.7rem}
          .stat-grid{grid-template-columns:1fr}
          .module-grid{grid-template-columns:repeat(2,1fr)}
          .activity-item{flex-direction:column;align-items:flex-start;gap:0.5rem}
          .page-greeting{font-size:1.35rem}
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
          <div>
            <h1 className="page-greeting">¡Hola, Recepcionista! 👋</h1>
            <p className="page-subtitle">Gestiona las citas y pacientes para el día de hoy</p>
          </div>

          {/* ── TARJETAS DE ESTADÍSTICAS ── */}
          <div className="stat-grid">
            {statCards.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon-wrap" style={{ background: s.bg, color: s.accent }}>{s.icon}</div>
                <div className="stat-info">
                  <p className="stat-label">{s.label}</p>
                  <p className="stat-number">{s.value.toLocaleString('es-PE')}</p>
                  <span className="stat-desc">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── ACCESOS RÁPIDOS ── */}
          <h3 className="section-title">Accesos Rápidos</h3>
          <div className="module-grid">
            <Link to="/recepcion/crear-cita" className="module-btn primary">
              <div className="module-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              Nueva Cita
            </Link>
            {modulos.map((m) => (
              <Link to={m.to} className="module-btn" key={m.to}>
                <div className="module-icon">{m.icon}</div>
                {m.label}
              </Link>
            ))}
          </div>

          {/* ── ACTIVIDAD RECIENTE ── */}
          <h3 className="section-title">Últimas Citas Registradas</h3>
          <div className="activity-card">
            {stats.actividadReciente.length > 0 ? (
              stats.actividadReciente.map((c) => (
                <div className="activity-item" key={c.idCita}>
                  <div className="activity-info">
                    <p className="activity-title">{c.paciente?.nombres} {c.paciente?.apellidos || ""}</p>
                    <p className="activity-meta">Motivo: {c.motivo || "Sin especificar"}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span className="activity-time">{c.horaInicio?.substring(0,5)}</span>
                    <p style={{fontFamily:'Manrope',fontSize:'0.75rem',color:'var(--text-400)',marginTop:'0.3rem'}}>
                      {formatearFechaLocal(c.fecha)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-empty">No hay citas recientes registradas.</div>
            )}
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="dash-footer">
          <p>¿Necesitas ayuda? <Link to="/soporte">Contacta a soporte</Link></p>
        </footer>
      </div>
    </>
  );
}