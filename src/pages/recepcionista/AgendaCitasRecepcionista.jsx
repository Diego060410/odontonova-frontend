import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Swal from "sweetalert2";

export default function AgendaCitasRecepcionista() {
  const navigate = useNavigate();
  
  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  // ── Estados originales (LÓGICA INTACTA) ──
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  
  // ── NUEVO: Filtro por estado de cita ──
  const [filtroEstado, setFiltroEstado] = useState("todas"); // "todas" | "proximas" | "confirmadas" | "canceladas"

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

  // ── Carga de citas (LÓGICA ORIGINAL INTACTA) ──
  useEffect(() => {
    fetchCitas();
  }, []);

  const fetchCitas = async () => {
    try {
      const response = await api.get("/citas");
      const data = response.data || [];
      const ordenadas = data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setCitas(ordenadas);
    } catch (error) {
      console.error("Error al cargar citas:", error);
      Swal.fire("Error", "No se pudo obtener la lista de citas", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers originales (LÓGICA INTACTA) ──
  const getStatusStyle = (estado) => {
    switch (estado?.toUpperCase()) {
      case "CONFIRMADA": return { background: "#dcfce7", color: "#166534", border: "#86efac" };
      case "PENDIENTE": return { background: "#fef9c3", color: "#854d0e", border: "#fcd34d" };
      case "CANCELADA": return { background: "#fee2e2", color: "#991b1b", border: "#fca5a5" };
      default: return { background: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
    }
  };

  const formatearFecha = (fechaStr) => {
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(fechaStr + "T00:00:00").toLocaleDateString('es-PE', opciones);
  };

  const esCitaProxima = (cita) => {
    if (!cita.fecha) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCita = new Date(cita.fecha);
    return fechaCita >= hoy;
  };

  // ── Filtrado combinado: búsqueda + estado (LÓGICA MEJORADA) ──
  const citasFiltradas = useMemo(() => {
    return citas.filter(c => {
      // Filtro por búsqueda (nombre o DNI)
      const coincideBusqueda = 
        c.paciente?.nombres?.toLowerCase().includes(filtro.toLowerCase()) ||
        c.paciente?.dni?.includes(filtro);
      
      if (!coincideBusqueda) return false;
      
      // Filtro por estado
      const estado = c.estadoCita?.nombreEstado?.toUpperCase();
      
      if (filtroEstado === "todas") return true;
      if (filtroEstado === "confirmadas") return estado === "CONFIRMADA";
      if (filtroEstado === "canceladas") return estado === "CANCELADA";
      if (filtroEstado === "proximas") return esCitaProxima(c) && estado !== "CANCELADA";
      
      return true;
    });
  }, [citas, filtro, filtroEstado]);

  // ── Contadores para badges ──
  const conteos = useMemo(() => {
    return {
      todas: citas.length,
      proximas: citas.filter(c => esCitaProxima(c) && c.estadoCita?.nombreEstado?.toUpperCase() !== "CANCELADA").length,
      confirmadas: citas.filter(c => c.estadoCita?.nombreEstado?.toUpperCase() === "CONFIRMADA").length,
      canceladas: citas.filter(c => c.estadoCita?.nombreEstado?.toUpperCase() === "CANCELADA").length,
    };
  }, [citas]);

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
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando agenda...</p>
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
          max-width:1400px;
          margin:0 auto;
          animation:fadeInUp 0.6s ease 0.15s both;
        }
        @keyframes fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        
        .page-header{margin-bottom:2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
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
          transition:var(--transition)
        }
        .btn-back:hover{background:var(--primary-50);border-color:var(--primary-100);color:var(--primary-600);transform:translateX(-3px)}
        
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
        
        /* Barra de búsqueda */
        .search-box{
          position:relative;margin-bottom:1.5rem;max-width:400px
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
        
        /* Tabs de filtro de estado */
        .filter-tabs{
          display:flex;gap:0.4rem;margin-bottom:1.5rem;
          overflow-x:auto;padding-bottom:0.25rem;
          scrollbar-width:none;-ms-overflow-style:none
        }
        .filter-tabs::-webkit-scrollbar{display:none}
        .filter-tab{
          flex:0 0 auto;padding:0.6rem 1.1rem;
          border:none;border-radius:10px;
          font-family:'Manrope',sans-serif;
          font-size:0.83rem;font-weight:600;
          background:var(--surface-100);color:var(--text-500);
          cursor:pointer;transition:var(--transition);
          display:flex;align-items:center;gap:0.4rem;
          border:1px solid var(--border-light);
          white-space:nowrap
        }
        .filter-tab.active{
          background:var(--primary-600);color:#fff;
          border-color:var(--primary-600);
          box-shadow:0 4px 12px rgba(14,113,205,0.25)
        }
        .filter-tab:hover:not(.active){
          background:var(--primary-50);border-color:var(--primary-100);
          color:var(--primary-600)
        }
        .filter-badge{
          background:rgba(255,255,255,0.25);color:inherit;
          font-size:0.68rem;font-weight:700;
          padding:0.1rem 0.45rem;border-radius:100px
        }
        .filter-tab:not(.active) .filter-badge{
          background:var(--primary-100);color:var(--primary-600)
        }
        
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
          letter-spacing:0.08em;text-align:left;white-space:nowrap
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
          font-size:0.9rem;color:var(--text-elegant);
          vertical-align:middle
        }
        .data-table td:first-child{font-weight:600}
        
        .patient-info{display:flex;flex-direction:column;gap:0.25rem}
        .patient-name{font-weight:600;color:var(--text-elegant)}
        .patient-dni{font-size:0.8rem;color:var(--text-500)}
        
        .location-info{display:flex;flex-direction:column;gap:0.25rem}
        .location-name{color:var(--text-elegant)}
        .location-detail{font-size:0.8rem;color:var(--text-500)}
        
        .time-info{display:flex;flex-direction:column;gap:0.25rem}
        .time-date{font-weight:600;color:var(--text-elegant)}
        .time-range{font-size:0.85rem;color:var(--primary-600);font-weight:500}
        
        .status-badge{
          display:inline-flex;align-items:center;gap:0.3rem;
          padding:0.35rem 0.85rem;border-radius:100px;
          font-family:'Manrope',sans-serif;font-size:0.75rem;
          font-weight:600;text-transform:uppercase;letter-spacing:0.04em;
          border:1px solid
        }
        .status-badge::before{
          content:'';width:6px;height:6px;border-radius:50%;
          background:currentColor;opacity:0.7
        }
        
        .btn-view{
          display:inline-flex;align-items:center;gap:0.3rem;
          padding:0.45rem 0.9rem;
          background:var(--surface-100);color:var(--primary-600);
          border:1.5px solid var(--border);border-radius:10px;
          font-family:'Manrope',sans-serif;font-size:0.8rem;font-weight:600;
          cursor:pointer;transition:var(--transition)
        }
        .btn-view:hover{
          background:var(--primary-50);border-color:var(--primary-600);
          transform:translateY(-1px)
        }
        
        .empty-state{
          text-align:center;padding:3rem 2rem;
          color:var(--text-500);font-family:'Manrope',sans-serif
        }
        .empty-icon{font-size:3rem;margin-bottom:1rem;display:block}
        
        .results-count{
          font-family:'Manrope',sans-serif;
          font-size:0.85rem;color:var(--text-500);
          margin-bottom:1rem
        }
        
        /* Footer */
        .dash-footer{text-align:center;padding:1.5rem;color:var(--text-400);font-family:'Manrope',sans-serif;font-size:0.83rem}
        .dash-footer a{color:var(--primary-600);text-decoration:none;font-weight:500}
        .dash-footer a:hover{text-decoration:underline}
        
        @media(max-width:900px){
          .page-header{flex-direction:column;align-items:flex-start}
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
          .page-title{font-size:1.5rem}
          .filter-tabs{flex-wrap:wrap}
          .data-table th,.data-table td{padding:0.75rem 1rem;font-size:0.85rem}
          .patient-info,.location-info,.time-info{gap:0.15rem}
          .status-badge{font-size:0.7rem;padding:0.3rem 0.7rem}
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
            <div>
              <h1 className="page-title">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Agenda Global de Citas
              </h1>
              <p className="page-subtitle">Gestiona y visualiza todas las citas médicas de AuraDental</p>
            </div>
            <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
              <button onClick={() => navigate("/recepcion/dashboard")} className="btn-back">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Volver
              </button>
              <Link to="/recepcion/crear-cita" className="btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nueva Cita
              </Link>
            </div>
          </div>

          {/* ── BARRA DE BÚSQUEDA ── */}
          <div className="search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por paciente o DNI..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            {filtro && (
              <button className="search-clear" onClick={() => setFiltro("")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* ── TABS DE FILTRO DE ESTADO ── */}
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filtroEstado === 'todas' ? 'active' : ''}`} 
              onClick={() => setFiltroEstado('todas')}
            >
              Todas
              <span className="filter-badge">{conteos.todas}</span>
            </button>
            <button 
              className={`filter-tab ${filtroEstado === 'proximas' ? 'active' : ''}`} 
              onClick={() => setFiltroEstado('proximas')}
            >
              Próximas
              <span className="filter-badge">{conteos.proximas}</span>
            </button>
            <button 
              className={`filter-tab ${filtroEstado === 'confirmadas' ? 'active' : ''}`} 
              onClick={() => setFiltroEstado('confirmadas')}
            >
              Confirmadas
              <span className="filter-badge">{conteos.confirmadas}</span>
            </button>
            <button 
              className={`filter-tab ${filtroEstado === 'canceladas' ? 'active' : ''}`} 
              onClick={() => setFiltroEstado('canceladas')}
            >
              Canceladas
              <span className="filter-badge">{conteos.canceladas}</span>
            </button>
          </div>

          {/* Contador de resultados */}
          {(filtro || filtroEstado !== 'todas') && (
            <p className="results-count">
              {citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? 's' : ''} 
              {filtro && ` para "${filtro}"`}
              {filtroEstado !== 'todas' && ` • ${filtroEstado}`}
            </p>
          )}

          {/* ── TABLA DE CITAS ── */}
          <div className="table-card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Paciente</th>
                    <th>Odontólogo</th>
                    <th>Sede / Consultorio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.length > 0 ? (
                    citasFiltradas.map((cita) => {
                      const status = getStatusStyle(cita.estadoCita?.nombreEstado);
                      return (
                        <tr key={cita.idCita}>
                          <td>
                            <div className="time-info">
                              <span className="time-date">{formatearFecha(cita.fecha)}</span>
                              <span className="time-range">{cita.horaInicio} - {cita.horaFin}</span>
                            </div>
                          </td>
                          <td>
                            <div className="patient-info">
                              <span className="patient-name">{cita.paciente?.nombres} {cita.paciente?.apellidos}</span>
                              <span className="patient-dni">DNI: {cita.paciente?.dni || "-"}</span>
                            </div>
                          </td>
                          <td>
                            Dr(a). {cita.odontologo?.usuario?.nombres || cita.odontologo?.nombres || "-"}
                          </td>
                          <td>
                            <div className="location-info">
                              <span className="location-name">{cita.sede?.nombreSede || "-"}</span>
                              <span className="location-detail">{cita.consultorio?.nombreConsultorio || "-"}</span>
                            </div>
                          </td>
                          <td>
                            <span className="status-badge" style={{ background: status.background, color: status.color, borderColor: status.border }}>
                              {cita.estadoCita?.nombreEstado || "PENDIENTE"}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => Swal.fire("Info", `Motivo: ${cita.motivo || "Sin especificar"}`, "info")}
                              className="btn-view"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        <span className="empty-icon">🔍</span>
                        <p style={{marginBottom:'0.5rem',fontWeight:600}}>
                          {filtro 
                            ? `No se encontraron citas para "${filtro}"`
                            : filtroEstado === 'todas' ? 'No hay citas registradas'
                            : filtroEstado === 'proximas' ? 'No hay citas próximas'
                            : filtroEstado === 'confirmadas' ? 'No hay citas confirmadas'
                            : 'No hay citas canceladas'}
                        </p>
                        <p style={{fontSize:'0.85rem'}}>
                          {filtroEstado === 'proximas' && !filtro && 'Las citas futuras aparecerán aquí una vez programadas.'}
                          {(filtroEstado !== 'proximas' || filtro) && 'Las citas aparecerán aquí una vez registradas.'}
                        </p>
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