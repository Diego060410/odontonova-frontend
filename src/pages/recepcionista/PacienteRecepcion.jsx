import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function PacienteRecepcion() {
  const navigate = useNavigate();
  
  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  // ── Estados originales (LÓGICA INTACTA) ──
  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

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

  // ── Carga de pacientes (LÓGICA ORIGINAL INTACTA) ──
  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      const res = await api.get("/pacientes");
      setPacientes(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtro de búsqueda (LÓGICA ORIGINAL INTACTA) ──
  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter(p =>
      `${p.usuario?.nombres} ${p.usuario?.apellidos}`
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    );
  }, [pacientes, busqueda]);

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
    navigate("/");
  };

  // ── Módulos de navegación ──
  const navModules = useMemo(() => [
    { to: "/recepcion/citas", label: "Agenda de Citas", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { to: "/recepcion/pacientes", label: "Registro Pacientes", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    { to: "/recepcion/disponibilidad", label: "Ver Horarios", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ], []);

  // ── Loading state elegante ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ width: 52, height: 52, border: "3px solid #e5e7eb", borderTopColor: "#0e71cd", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando pacientes...</p>
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
          max-width:1200px;
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
        
        .page-actions{display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap}
        .btn-primary{
          display:inline-flex;align-items:center;gap:0.5rem;
          padding:0.7rem 1.4rem;
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff;border:none;border-radius:14px;
          font-family:'Manrope',sans-serif;font-size:0.9rem;font-weight:600;
          cursor:pointer;transition:var(--transition);text-decoration:none;
          box-shadow:0 4px 16px rgba(14,113,205,0.25);position:relative;overflow:hidden
        }
        .btn-primary::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-primary:hover::before{left:100%}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(14,113,205,0.35)}
        
        .btn-secondary{
          display:inline-flex;align-items:center;gap:0.5rem;
          padding:0.7rem 1.4rem;
          background:var(--surface-100);color:var(--text-500);
          border:1.5px solid var(--border);border-radius:14px;
          font-family:'Manrope',sans-serif;font-size:0.9rem;font-weight:600;
          cursor:pointer;transition:var(--transition);text-decoration:none
        }
        .btn-secondary:hover{background:var(--primary-50);border-color:var(--primary-600);color:var(--primary-600)}
        
        /* Barra de búsqueda elegante */
        .search-box{
          position:relative;margin-bottom:2rem;max-width:400px
        }
        .search-input{
          width:100%;padding:0.9rem 1rem 0.9rem 2.8rem;
          border:1.5px solid var(--border);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;
          color:var(--text-elegant);background:var(--surface);
          transition:var(--transition);outline:none
        }
        .search-input:focus{
          border-color:var(--primary-600);
          box-shadow:0 0 0 4px rgba(14,113,205,0.15);
          background:var(--surface-100)
        }
        .search-icon{
          position:absolute;left:1rem;top:50%;transform:translateY(-50%);
          color:var(--text-400);pointer-events:none
        }
        .search-clear{
          position:absolute;right:0.8rem;top:50%;transform:translateY(-50%);
          width:24px;height:24px;border-radius:6px;
          background:var(--surface-100);border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;
          color:var(--text-400);cursor:pointer;transition:var(--transition)
        }
        .search-clear:hover{background:var(--danger);border-color:var(--danger);color:#fff}
        
        /* Tabla elegante */
        .table-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          overflow:hidden;animation:fadeInUp 0.5s ease 0.25s both
        }
        .table-container{overflow-x:auto}
        .data-table{
          width:100%;border-collapse:separate;border-spacing:0
        }
        .data-table thead{
          background:linear-gradient(135deg,var(--primary-50),var(--surface-100));
          border-bottom:1px solid var(--border)
        }
        .data-table th{
          padding:1rem 1.25rem;
          font-family:'Manrope',sans-serif;
          font-size:0.75rem;font-weight:600;
          color:var(--text-500);text-transform:uppercase;
          letter-spacing:0.08em;text-align:left
        }
        .data-table tbody tr{
          border-bottom:1px solid var(--border-light);
          transition:var(--transition)
        }
        .data-table tbody tr:last-child{border-bottom:none}
        .data-table tbody tr:hover{
          background:linear-gradient(135deg,var(--primary-50),var(--surface));
          transform:translateX(4px)
        }
        .data-table td{
          padding:1rem 1.25rem;
          font-family:'Manrope',sans-serif;
          font-size:0.9rem;color:var(--text-elegant)
        }
        .data-table td:first-child{
          font-weight:600;color:var(--text-elegant)
        }
        .patient-avatar{
          width:36px;height:36px;border-radius:10px;
          background:linear-gradient(135deg,var(--primary-50),#dbeafe);
          display:flex;align-items:center;justify-content:center;
          color:var(--primary-600);font-weight:600;font-size:0.85rem;
          margin-right:0.75rem;flex-shrink:0
        }
        .patient-name{display:flex;align-items:center}
        
        .empty-state{
          text-align:center;padding:3rem 2rem;
          color:var(--text-500);font-family:'Manrope',sans-serif
        }
        .empty-icon{font-size:3rem;margin-bottom:1rem;display:block}
        
        /* Results count */
        .results-count{
          font-family:'Manrope',sans-serif;
          font-size:0.85rem;color:var(--text-500);
          margin-bottom:1rem
        }
        
        /* Footer */
        .dash-footer{text-align:center;padding:1.5rem;color:var(--text-400);font-family:'Manrope',sans-serif;font-size:0.83rem}
        .dash-footer a{color:var(--primary-600);text-decoration:none;font-weight:500}
        .dash-footer a:hover{text-decoration:underline}
        
        @media(max-width:700px){
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
          .page-title{font-size:1.5rem}
          .page-actions{flex-direction:column}
          .data-table th,.data-table td{padding:0.75rem 1rem;font-size:0.85rem}
          .patient-name{flex-direction:column;align-items:flex-start;gap:0.25rem}
          .patient-avatar{margin-right:0;margin-bottom:0.5rem}
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
              Pacientes Registrados
            </h1>
            <p className="page-subtitle">Gestiona y consulta la lista de pacientes del sistema</p>
          </div>

          {/* ── ACCIONES ── */}
          <div className="page-actions">
            <Link to="/recepcion/dashboard" className="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Volver al Dashboard
            </Link>
            <Link to="/recepcion/pacientes/nuevo" className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Paciente
            </Link>
          </div>

          {/* ── BARRA DE BÚSQUEDA ── */}
          <div className="search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre o apellido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button className="search-clear" onClick={() => setBusqueda("")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Contador de resultados */}
          {busqueda && (
            <p className="results-count">
              {pacientesFiltrados.length} resultado{pacientesFiltrados.length !== 1 ? 's' : ''} para "{busqueda}"
            </p>
          )}

          {/* ── TABLA DE PACIENTES ── */}
          <div className="table-card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientesFiltrados.length > 0 ? (
                    pacientesFiltrados.map((p) => {
                      const initials = `${p.usuario?.nombres?.[0] || ''}${p.usuario?.apellidos?.[0] || ''}`.toUpperCase();
                      return (
                        <tr key={p.idPaciente}>
                          <td>
                            <div className="patient-name">
                              <span className="patient-avatar">{initials}</span>
                              {p.usuario?.nombres} {p.usuario?.apellidos}
                            </div>
                          </td>
                          <td>{p.usuario?.documentoIdentidad || "-"}</td>
                          <td>{p.usuario?.telefono || "-"}</td>
                          <td>{p.usuario?.correo || "-"}</td>
                          <td>{p.usuario?.fechaRegistro?.substring(0, 10) || "-"}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        <span className="empty-icon">🔍</span>
                        No se encontraron pacientes para "{busqueda}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="dash-footer">
          <p>¿Necesitas ayuda? <Link to="/soporte">Contacta a soporte técnico</Link></p>
        </footer>
      </div>
    </>
  );
}