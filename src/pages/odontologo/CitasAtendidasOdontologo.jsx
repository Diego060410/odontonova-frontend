import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import citaService from "../../services/citaService";

export default function CitasAtendidasOdontologo() {
  const navigate = useNavigate();
  
  // ── Estados ──
  const [citas, setCitas] = useState([]);
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

  // ── Carga de citas atendidas ──
  const cargarCitas = async () => {
    try {
      setLoading(true);
      const idOdontologo = localStorage.getItem("id_odontologo");
      const res = await citaService.getCitasOdontologo(idOdontologo);
      const data = Array.isArray(res) ? res : (res?.data || []);

      // ✅ SOLO ATENDIDAS
      const atendidas = data.filter(c => {
        const estado = c?.estadoCita?.nombreEstado || c?.estado?.nombre || "";
        return estado.toUpperCase() === "ATENDIDO";
      });

      // ✅ ORDENAR: Más recientes primero
      atendidas.sort((a, b) =>
        new Date(`${b.fecha}T${b.horaInicio}`) - new Date(`${a.fecha}T${a.horaInicio}`)
      );

      setCitas(atendidas);
    } catch (error) {
      console.error("Error cargando citas atendidas:", error);
    } finally {
      setLoading(false);
    }
  };

  // ── Cierre de dropdowns ──
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.dropdown')) setMenuOpen(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => { cargarCitas(); }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("id_usuario");
    localStorage.removeItem("id_odontologo");
    navigate("/login", { replace: true });
  };

  // ── Módulos de navegación ──
  const navModules = useMemo(() => [
    { to: "/odontologo/mis-citas", label: "Mis Citas", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { to: "/odontologo/horario", label: "Mi Horario", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { to: "/odontologo/citas-atendidas", label: "Historial", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { to: "/odontologo/perfil", label: "Mi Perfil", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ], []);

  // ── Formateo de fecha/hora ──
  const formatearFecha = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split(/[-T/]/);
    return new Date(year, month - 1, day).toLocaleDateString("es-PE", {
      weekday: "short", day: "2-digit", month: "short"
    });
  };

  const formatearHora = (timeString) => {
    if (!timeString) return "";
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("es-PE", {
      hour: "numeric", minute: "2-digit", hour12: true
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ width: 52, height: 52, border: "3px solid #e5e7eb", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando historial...</p>
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
        .topbar-brand{display:flex;align-items:center;gap:0.5rem;cursor:pointer;transition:var(--transition)}
        .topbar-brand:hover{transform:scale(1.01)}
        
        /* Typing Animation para OdontoNova */
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:500;font-style:italic;color:var(--text-elegant);letter-spacing:0.02em;line-height:1.1;display:flex;align-items:baseline}
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
        .dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:240px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg),var(--shadow-glow);padding:0.75rem;opacity:0;visibility:hidden;transform:translateY(-10px) scale(0.98);transition:var(--transition);z-index:101;animation:menuElegant 0.25s ease forwards}
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
        .btn-back{
          display:inline-flex;align-items:center;gap:0.4rem;
          padding:0.5rem 0.9rem;
          background:var(--surface-100);border:1px solid var(--border);
          border-radius:10px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:500;
          color:var(--text-500);text-decoration:none;cursor:pointer;
          transition:var(--transition)
        }
        .btn-back:hover{background:var(--primary-50);border-color:var(--primary-100);color:var(--primary-600);transform:translateX(-3px)}
        
        .dash-content{padding:clamp(2rem,5vw,3rem);max-width:900px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        
        .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:2rem;flex-wrap:wrap;gap:1rem}
        .page-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.8rem;font-weight:600;color:var(--text-elegant);
          letter-spacing:-0.01em;display:flex;align-items:center;gap:0.5rem
        }
        .page-subtitle{font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-500)}
        
        /* Lista de citas atendidas - estilo activity-card con tema "completado" */
        .cita-list{display:flex;flex-direction:column;gap:0.9rem}
        .cita-card{
          background:var(--surface);border-radius:var(--radius-sm);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          padding:1.25rem 1.5rem;transition:var(--transition);
          position:relative;overflow:hidden;border-left:4px solid var(--accent)
        }
        .cita-card:hover{
          transform:translateY(-3px);box-shadow:var(--shadow-lg);
          border-color:var(--accent)
        }
        .cita-card::before{
          content:'';position:absolute;left:0;top:0;bottom:0;
          width:4px;background:var(--accent);
          border-radius:4px 0 0 4px;transition:var(--transition)
        }
        .cita-card:hover::before{width:5px;box-shadow:0 0 12px currentColor}
        
        .cita-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
        .cita-paciente{
          display:flex;align-items:center;gap:0.75rem;
          font-family:'Cormorant Garamond',serif;
          font-size:1.1rem;font-weight:600;color:var(--text-elegant)
        }
        .cita-paciente-icon{
          width:36px;height:36px;border-radius:10px;
          background:linear-gradient(135deg,#f5f3ff,#e9d5ff);
          display:flex;align-items:center;justify-content:center;
          color:var(--accent);flex-shrink:0
        }
        
        .cita-status{
          font-family:'Manrope',sans-serif;
          font-size:0.75rem;font-weight:600;
          padding:0.35rem 0.9rem;border-radius:100px;
          text-transform:uppercase;letter-spacing:0.05em;
          background:#f5f3ff;color:var(--accent);
          border:1px solid #c4b5fd
        }
        
        .cita-grid{
          display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
          gap:1rem;padding-top:0.75rem;border-top:1px dashed var(--border-light)
        }
        .cita-item{display:flex;flex-direction:column;gap:0.25rem}
        .cita-label{
          font-family:'Manrope',sans-serif;
          font-size:0.75rem;color:var(--text-400);
          font-weight:500;text-transform:uppercase;letter-spacing:0.05em
        }
        .cita-value{
          font-family:'Manrope',sans-serif;
          font-size:0.95rem;font-weight:600;color:var(--text-elegant)
        }
        .cita-motivo{grid-column:1/-1}
        .cita-motivo .cita-value{
          font-style:italic;color:var(--text-500);font-weight:400
        }
        
        .empty-state{
          text-align:center;padding:4rem 2rem;
          background:var(--surface);border-radius:var(--radius);
          border:1px dashed var(--border);color:var(--text-500)
        }
        .empty-state-icon{
          font-size:3.5rem;margin-bottom:1rem;display:block;
          animation:float 3s ease-in-out infinite
        }
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .empty-state-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.3rem;font-weight:600;color:var(--text-elegant);
          margin-bottom:0.5rem
        }
        .empty-state-text{font-family:'Manrope',sans-serif;font-size:0.9rem}
        
        @media(max-width:700px){
          .page-header{flex-direction:column;align-items:flex-start}
          .cita-header{flex-direction:column;align-items:flex-start;gap:0.75rem}
          .cita-grid{grid-template-columns:1fr}
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
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
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'modules' ? null : 'modules'); }} aria-haspopup="true" aria-expanded={menuOpen === 'modules'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Módulos
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Navegación</span>
                {navModules.map((m) => (
                  <Link key={m.to} to={m.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)}>{m.icon}{m.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/odontologo/perfil" className="btn-action btn-profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Perfil
            </Link>
            <span className="topbar-badge">Odontólogo</span>
            <button onClick={handleLogout} className="btn-action btn-logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </nav>
        </header>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="dash-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/><circle cx="12" cy="12" r="10"/>
                </svg>
                Citas Atendidas
              </h1>
              <p className="page-subtitle">Historial de pacientes atendidos</p>
            </div>
            <button onClick={() => navigate("/odontologo/dashboard")} className="btn-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Volver al Dashboard
            </button>
          </div>

          {citas.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">✨</span>
              <p className="empty-state-title">Sin citas atendidas</p>
              <p className="empty-state-text">Aún no has registrado citas completadas.</p>
            </div>
          ) : (
            <div className="cita-list">
              {citas.map(c => {
                return (
                  <div className="cita-card" key={c.idCita}>
                    <div className="cita-header">
                      <div className="cita-paciente">
                        <div className="cita-paciente-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        {c.paciente?.nombres} {c.paciente?.apellidos || ""}
                      </div>
                      <span className="cita-status">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{verticalAlign:'middle',marginRight:'4px'}}><polyline points="20 6 9 17 4 12"/></svg>
                        ATENDIDO
                      </span>
                    </div>

                    <div className="cita-grid">
                      <div className="cita-item">
                        <span className="cita-label">Fecha</span>
                        <span className="cita-value">{formatearFecha(c.fecha)}</span>
                      </div>
                      <div className="cita-item">
                        <span className="cita-label">Hora</span>
                        <span className="cita-value">{formatearHora(c.horaInicio)}</span>
                      </div>
                      <div className="cita-item">
                        <span className="cita-label">Servicio</span>
                        <span className="cita-value">{c.servicio?.nombre || "Consulta general"}</span>
                      </div>
                      <div className="cita-item cita-motivo">
                        <span className="cita-label">Motivo</span>
                        <span className="cita-value">{c.motivo || "Sin especificar"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}