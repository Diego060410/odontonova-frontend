import { useEffect, useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../../services/api";

moment.locale("es");
const localizer = momentLocalizer(moment);

export default function DisponibilidadRecepcion() {
  const navigate = useNavigate();

  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  // ── Estados originales (LÓGICA INTACTA) ──
  const [odontologos, setOdontologos] = useState([]);
  const [citas, setCitas] = useState([]);
  const [odontologoSeleccionado, setOdontologoSeleccionado] = useState("");
  const [vistaActual, setVistaActual] = useState("month");

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

  // ── Carga de datos (LÓGICA ORIGINAL INTACTA) ──
  useEffect(() => {
    cargarOdontologos();
    cargarCitas();
  }, []);

  const cargarOdontologos = async () => {
    try {
      const res = await api.get("/odontologos");
      setOdontologos(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarCitas = async () => {
    try {
      const res = await api.get("/citas");
      console.log("CITAS:", res.data);
      setCitas(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // ── Filtro por odontólogo (LÓGICA ORIGINAL INTACTA) ──
  const citasFiltradas = odontologoSeleccionado
    ? citas.filter(
        c =>
          String(
            c.odontologo?.idOdontologo ||
            c.idOdontologo
          ) === String(odontologoSeleccionado)
      )
    : citas;

  // ── Horarios base (LÓGICA ORIGINAL INTACTA) ──
  const horariosBase = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00"
  ];

  // ── Generación de eventos (LÓGICA ORIGINAL INTACTA) ──
  const eventos = useMemo(() => {
    // EVENTOS OCUPADOS
    const eventosCitas = citasFiltradas.map(c => {
      const fecha = c.fecha.split("T")[0];
      return {
        title: `OCUPADO • ${c.horaInicio} • ${
          c.paciente?.usuario?.nombres ||
          c.paciente?.nombres ||
          ""
        }`,
        start: new Date(`${fecha}T${c.horaInicio}`),
        end: new Date(`${fecha}T${c.horaFin}`),
        estado: c.estadoCita?.nombreEstado || "CONFIRMADA"
      };
    });

    // DISPONIBLES
    const eventosDisponibles = [];
    const hoy = new Date();

    for (let i = 0; i < 30; i++) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() + i);
      const fechaISO = fecha.toISOString().split("T")[0];

      horariosBase.forEach(hora => {
        const ocupado = citasFiltradas.some(c => {
          const fechaCita = c.fecha.split("T")[0];
          return (
            fechaCita === fechaISO &&
            c.horaInicio.substring(0,5) === hora
          );
        });

        if (!ocupado) {
          const [h, m] = hora.split(":");
          const fin = new Date();
          fin.setHours(Number(h) + 1);
          const horaFin = fin.toTimeString().slice(0,5);

          eventosDisponibles.push({
            title: `DISPONIBLE • ${hora}`,
            start: new Date(`${fechaISO}T${hora}`),
            end: new Date(`${fechaISO}T${horaFin}`),
            estado: "DISPONIBLE"
          });
        }
      });
    }

    return [...eventosDisponibles, ...eventosCitas];
  }, [citasFiltradas]);

  // ── Estilos de eventos (LÓGICA ORIGINAL INTACTA) ──
  const eventStyleGetter = (event) => {
    let backgroundColor = "#10b981";
    if (event.estado === "DISPONIBLE") backgroundColor = "#f59e0b";
    if (event.estado === "CANCELADA") backgroundColor = "#ef4444";
    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        color: "white",
        border: "none",
        padding: "4px",
        fontSize: "12px",
        fontWeight: "600"
      }
    };
  };

  // ── Reporte semanal (LÓGICA ORIGINAL INTACTA) ──
  const citasSemana = citasFiltradas.filter(c => {
    return moment(c.fecha).isSame(moment(), "week");
  });

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
        
        .page-header{margin-bottom:2rem}
        .page-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.8rem;font-weight:600;color:var(--text-elegant);
          letter-spacing:-0.01em;display:flex;align-items:center;gap:0.75rem
        }
        .page-subtitle{font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-500);margin-top:0.25rem}
        
        /* Filtros card */
        .filters-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          padding:1.5rem;margin-bottom:2rem;animation:fadeInUp 0.5s ease 0.2s both
        }
        .filters-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
        .filter-group{display:flex;flex-direction:column;gap:0.5rem}
        .filter-label{
          font-family:'Manrope',sans-serif;
          font-size:0.85rem;font-weight:600;color:var(--text-elegant)
        }
        .filter-select{
          width:100%;padding:0.9rem 1.1rem;
          border:1.5px solid var(--border);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;
          color:var(--text-elegant);background:var(--surface);
          transition:var(--transition);outline:none
        }
        .filter-select:focus{
          border-color:var(--primary-600);
          box-shadow:0 0 0 4px rgba(14,113,205,0.15);
          background:var(--surface-100)
        }
        
        /* Vista buttons */
        .view-buttons{display:flex;gap:0.5rem}
        .view-btn{
          padding:0.7rem 1.2rem;border:none;border-radius:10px;
          font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;
          cursor:pointer;transition:var(--transition);
          background:var(--surface-100);color:var(--text-500)
        }
        .view-btn.active{
          background:var(--primary-600);color:#fff;
          box-shadow:0 4px 12px rgba(14,113,205,0.25)
        }
        .view-btn:hover:not(.active){
          background:var(--primary-50);color:var(--primary-600)
        }
        
        /* Reporte semanal */
        .report-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          padding:1.5rem;margin-bottom:2rem;animation:fadeInUp 0.5s ease 0.25s both
        }
        .report-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.2rem;font-weight:600;color:var(--text-elegant);
          margin-bottom:1.25rem
        }
        .report-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}
        .report-item{
          padding:1.25rem;border-radius:14px;text-align:center
        }
        .report-item.total{background:var(--primary-50)}
        .report-item.confirmada{background:#f0fdf4}
        .report-item.cancelada{background:#fef2f2}
        .report-label{
          font-family:'Manrope',sans-serif;
          font-size:0.8rem;color:var(--text-500);margin-bottom:0.5rem
        }
        .report-value{
          font-family:'Cormorant Garamond',serif;
          font-size:2rem;font-weight:700
        }
        .report-item.total .report-value{color:var(--primary-600)}
        .report-item.confirmada .report-value{color:var(--success)}
        .report-item.cancelada .report-value{color:var(--danger)}
        
        /* Leyenda */
        .legend{display:flex;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap}
        .legend-item{display:flex;align-items:center;gap:0.5rem;font-family:'Manrope',sans-serif;font-size:0.85rem;color:var(--text-500)}
        .legend-dot{width:12px;height:12px;border-radius:4px}
        .legend-dot.ocupado{background:var(--success)}
        .legend-dot.disponible{background:var(--warning)}
        .legend-dot.cancelado{background:var(--danger)}
        
        /* Calendario card */
        .calendar-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow-lg);
          padding:1.5rem;animation:fadeInUp 0.5s ease 0.3s both
        }
        
        /* Custom styles for react-big-calendar */
        .rbc-calendar{font-family:'Manrope',sans-serif}
        .rbc-toolbar{margin-bottom:1rem}
        .rbc-toolbar button{
          background:var(--surface-100);border:1px solid var(--border);
          border-radius:8px;color:var(--text-500);font-weight:500;
          transition:var(--transition)
        }
        .rbc-toolbar button:hover{
          background:var(--primary-50);border-color:var(--primary-600);color:var(--primary-600)
        }
        .rbc-toolbar button.rbc-active{
          background:var(--primary-600);border-color:var(--primary-600);color:#fff
        }
        .rbc-header{
          font-family:'Manrope',sans-serif;font-size:0.8rem;font-weight:600;
          color:var(--text-500);text-transform:uppercase;letter-spacing:0.05em;
          padding:0.75rem 0.5rem;border-bottom-color:var(--border-light)
        }
        .rbc-date-cell{font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-elegant)}
        .rbc-off-range{color:var(--text-400)}
        .rbc-today{background:rgba(14,113,205,0.05)}
        .rbc-event{
          border-radius:8px!important;font-size:11px!important;
          font-weight:600!important;padding:4px!important
        }
        .rbc-event-label{font-size:10px!important}
        .rbc-event-content{font-size:11px!important}
        .rbc-time-view .rbc-time-header-content{border-left-color:var(--border-light)}
        .rbc-time-view .rbc-time-gutter{border-right-color:var(--border-light)}
        .rbc-time-slot{border-top-color:var(--border-light)!important}
        .rbc-timeslot-group{border-bottom-color:var(--border-light)!important}
        
        /* Footer */
        .dash-footer{text-align:center;padding:1.5rem;color:var(--text-400);font-family:'Manrope',sans-serif;font-size:0.83rem}
        .dash-footer a{color:var(--primary-600);text-decoration:none;font-weight:500}
        .dash-footer a:hover{text-decoration:underline}
        
        @media(max-width:900px){
          .filters-grid{grid-template-columns:1fr}
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
          .page-title{font-size:1.5rem}
          .report-grid{grid-template-columns:1fr}
          .legend{gap:1rem}
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
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Disponibilidad Odontológica
            </h1>
            <p className="page-subtitle">Visualiza horarios ocupados y disponibles por especialista</p>
          </div>

          {/* ── FILTROS ── */}
          <div className="filters-card">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">Filtrar por Odontólogo</label>
                <select
                  value={odontologoSeleccionado}
                  onChange={(e) => setOdontologoSeleccionado(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos los odontólogos</option>
                  {odontologos.map(o => (
                    <option key={o.idOdontologo} value={o.idOdontologo}>
                      Dr. {o.usuario?.nombres || o.nombres} {o.usuario?.apellidos || ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Vista del Calendario</label>
                <div className="view-buttons">
                  <button
                    onClick={() => setVistaActual("month")}
                    className={`view-btn ${vistaActual === "month" ? "active" : ""}`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => setVistaActual("week")}
                    className={`view-btn ${vistaActual === "week" ? "active" : ""}`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => setVistaActual("day")}
                    className={`view-btn ${vistaActual === "day" ? "active" : ""}`}
                  >
                    Día
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── REPORTE SEMANAL (solo en vista semana) ── */}
          {vistaActual === "week" && (
            <div className="report-card">
              <h2 className="report-title">📊 Reporte Semanal</h2>
              <div className="report-grid">
                <div className="report-item total">
                  <p className="report-label">Total Citas</p>
                  <p className="report-value">{citasSemana.length}</p>
                </div>
                <div className="report-item confirmada">
                  <p className="report-label">Confirmadas</p>
                  <p className="report-value">
                    {citasSemana.filter(c => c.estadoCita?.nombreEstado === "CONFIRMADA").length}
                  </p>
                </div>
                <div className="report-item cancelada">
                  <p className="report-label">Canceladas</p>
                  <p className="report-value">
                    {citasSemana.filter(c => c.estadoCita?.nombreEstado === "CANCELADA").length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── LEYENDA ── */}
          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot ocupado"></span>
              Ocupado
            </div>
            <div className="legend-item">
              <span className="legend-dot disponible"></span>
              Disponible
            </div>
            <div className="legend-item">
              <span className="legend-dot cancelado"></span>
              Cancelada
            </div>
          </div>

          {/* ── CALENDARIO ── */}
          <div className="calendar-card">
            <Calendar
              culture="es"
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 800 }}
              selectable
              popup
              views={["month", "week", "day"]}
              view={vistaActual}
              onView={(view) => setVistaActual(view)}
              step={30}
              timeslots={2}
              defaultDate={new Date()}
              eventPropGetter={eventStyleGetter}
              messages={{
                next: "Siguiente",
                previous: "Anterior",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                agenda: "Agenda",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                noEventsInRange: "No hay citas"
              }}
              formats={{
                weekdayFormat: (date, culture, localizer) =>
                  localizer.format(date, "dddd", culture),
                dayFormat: (date, culture, localizer) =>
                  localizer.format(date, "DD", culture),
                monthHeaderFormat: (date, culture, localizer) =>
                  localizer.format(date, "MMMM YYYY", culture),
                dayHeaderFormat: (date, culture, localizer) =>
                  localizer.format(date, "dddd DD MMMM", culture),
                dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                  `${localizer.format(start, "DD MMM", culture)} - ${localizer.format(end, "DD MMM YYYY", culture)}`,
                timeGutterFormat: "HH:mm"
              }}
            />
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