import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CitasAdmin() {
  const navigate = useNavigate();
  
  // ── Estados principales ──
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados para typing animation del logo ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  
  // ── Estados de búsqueda y filtros ──
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const searchTimeoutRef = useRef(null);

  // ── Typing Animation ──
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

  // ── Debounce para búsqueda ──
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchTerm]);

  // ── Carga de citas ──
  useEffect(() => {
    const cargarCitas = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8080/api/citas", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCitas(res.data || []);
      } catch (err) {
        console.error("Error cargando citas:", err);
        setCitas([]);
      } finally {
        setLoading(false);
      }
    };
    cargarCitas();
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

  const getEstadoStyle = (estado) => {
    const e = estado?.toUpperCase();
    const styles = {
      PENDIENTE:   { bg: "#fffbeb", color: "#d97706", label: "Pendiente" },
      CONFIRMADA:  { bg: "#f0fdf4", color: "#16a34a", label: "Confirmada" },
      CANCELADA:   { bg: "#fef2f2", color: "#dc2626", label: "Cancelada" },
    };
    return styles[e] || { bg: "#f8fafc", color: "#64748b", label: estado || "—" };
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "—";
    const [y, m, d] = fechaStr.split("-");
    return new Date(y, m - 1, d).toLocaleDateString("es-PE", { 
      day: "2-digit", month: "short", year: "numeric" 
    });
  };

  const formatHora = (horaStr) => {
    if (!horaStr) return "—";
    return horaStr.substring(0, 5);
  };

  const getInitials = (nombres, apellidos) => {
    const n = nombres?.[0] || "";
    const a = apellidos?.[0] || "";
    return (n + a).toUpperCase() || "?";
  };

  const getAvatarColor = (id) => {
    const colors = ["#1e40af", "#7c3aed", "#059669", "#d97706", "#db2777", "#0891b2"];
    return colors[(id || 0) % colors.length];
  };

  // ── FILTRADO ──
  const citasFiltradas = useMemo(() => {
    return citas.filter((c) => {
      if (debouncedSearch) {
        const paciente = `${c.paciente?.nombres || ""} ${c.paciente?.apellidos || ""}`.toLowerCase();
        const odontologo = `${c.odontologo?.usuario?.nombres || c.odontologo?.nombres || ""}`.toLowerCase();
        const idCita = String(c.idCita || "");
        if (!paciente.includes(debouncedSearch) && !odontologo.includes(debouncedSearch) && !idCita.includes(debouncedSearch)) {
          return false;
        }
      }
      if (fechaFiltro && c.fecha !== fechaFiltro) return false;
      if (estadoFiltro) {
        const estadoCita = c.estadoCita?.nombreEstado || c.estado?.nombre || "";
        if (estadoCita.toUpperCase() !== estadoFiltro.toUpperCase()) return false;
      }
      return true;
    });
  }, [citas, debouncedSearch, fechaFiltro, estadoFiltro]);

  const stats = useMemo(() => ({
    total: citas.length,
    confirmadas: citas.filter(c => c.estadoCita?.nombreEstado === "CONFIRMADA").length,
    canceladas: citas.filter(c => c.estadoCita?.nombreEstado === "CANCELADA").length,
  }), [citas]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setFechaFiltro("");
    setEstadoFiltro("");
  };

  const hasActiveFilters = searchTerm || fechaFiltro || estadoFiltro;

  // ── Menús del topbar ──
  const navModules = [
    { to: "/admin/usuarios", label: "Usuarios" },
    { to: "/admin/odontologos", label: "Odontólogos" },
    { to: "/admin/pacientes", label: "Pacientes" },
    { to: "/admin/citas", label: "Citas" },
    { to: "/admin/sedes", label: "Sedes" },
    { to: "/admin/consultorios", label: "Consultorios" },
    { to: "/admin/especialidades", label: "Especialidades" },
  ];

  const quickCreate = [
    { to: "/admin/crear-usuario", label: "Nuevo Usuario" },
    { to: "/admin/crear-odontologo", label: "Nuevo Odontólogo" },
    { to: "/admin/crear-cita", label: "Nueva Cita" },
    { to: "/admin/crear-sede", label: "Nueva Sede" },
    { to: "/admin/crear-consultorio", label: "Nuevo Consultorio" },
    { to: "/admin/crear-especialidad", label: "Nueva Especialidad" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --primary:#1e40af;--primary-600:#2563eb;--primary-50:#eff6ff;--primary-100:#dbeafe;
          --surface:#ffffff;--surface-50:#fafafa;--surface-100:#f8fafc;--border:#e2e8f0;--border-light:#f1f5f9;
          --text:#0f172a;--text-500:#64748b;--text-400:#94a3b8;--text-elegant:#1e293b;
          --success:#16a34a;--warning:#d97706;--danger:#dc2626;
          --shadow:0 4px 20px rgba(0,0,0,0.04);--shadow-lg:0 12px 48px rgba(0,0,0,0.08);
          --radius:20px;--radius-sm:14px;
          --transition:all 0.3s cubic-bezier(0.16,1,0.3,1)
        }
        body{font-family:'Manrope',system-ui,-apple-system,sans-serif;background:var(--surface-50)}
        .ca-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%)}
        
        /* ── TOPBAR ── */
        .ca-topbar{
          background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);
          border-bottom:1px solid rgba(226,232,240,0.6);
          padding:0 clamp(1.5rem,4vw,3rem);height:76px;
          display:flex;align-items:center;justify-content:space-between;
          position:sticky;top:0;z-index:100;box-shadow:var(--shadow)
        }
        .topbar-brand{display:flex;align-items:center;gap:1rem;cursor:pointer}
        .topbar-name{
          font-family:'Cormorant Garamond',serif;font-size:2.5rem;
          font-weight:500;font-style:italic;color:var(--text-elegant);
          letter-spacing:0.02em;line-height:1.1
        }
        .typing-wrapper{display:inline-flex;align-items:baseline;gap:0.02em}
        .typing-char{display:inline-block}
        .typing-char.nova{
          color:var(--primary-600);font-style:italic;font-weight:700;
          background:linear-gradient(135deg,var(--primary-600),#7c3aed);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent
        }
        .typing-cursor{
          display:inline-block;width:2.5px;height:2.2rem;
          background:var(--primary-600);margin-left:3px;
          vertical-align:baseline;border-radius:2px;opacity:0
        }
        .typing-cursor.active{opacity:1;animation:blink 1s step-end infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        .topbar-nav{display:flex;align-items:center;gap:0.35rem}
        .dropdown{position:relative}
        .dropdown-btn{
          display:flex;align-items:center;gap:0.5rem;
          padding:0.55rem 1.1rem;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;
          color:var(--text-500);background:transparent;border:1px solid transparent;
          cursor:pointer;transition:var(--transition)
        }
        .dropdown-btn:hover,.dropdown-btn.active{
          color:var(--primary-600);background:var(--primary-50);
          border-color:var(--primary-100);box-shadow:0 4px 16px rgba(30,64,175,0.1)
        }
        .dropdown-btn svg{transition:transform 0.25s}
        .dropdown.active .dropdown-btn svg{transform:rotate(180deg)}
        .dropdown-menu{
          position:absolute;top:calc(100% + 10px);right:0;
          min-width:220px;background:var(--surface);
          border:1px solid var(--border-light);border-radius:var(--radius-sm);
          box-shadow:var(--shadow-lg);padding:0.75rem;
          opacity:0;visibility:hidden;transform:translateY(-10px);
          transition:var(--transition);z-index:101
        }
        .dropdown.active .dropdown-menu{
          opacity:1;visibility:visible;transform:translateY(0)
        }
        .dropdown-item{
          display:flex;align-items:center;gap:0.7rem;
          padding:0.65rem 1rem;border-radius:8px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;
          color:var(--text-elegant);text-decoration:none;
          transition:var(--transition)
        }
        .dropdown-item:hover{
          background:var(--primary-50);color:var(--primary-600);
          transform:translateX(4px)
        }
        .dropdown-label{
          padding:0.4rem 1rem;font-family:'Cormorant Garamond',serif;
          font-size:0.7rem;font-weight:600;font-style:italic;
          color:var(--text-400);text-transform:uppercase;letter-spacing:0.1em
        }
        .topbar-badge{
          background:var(--primary-50);border:1px solid var(--primary-100);
          color:var(--primary-600);font-family:'Manrope',sans-serif;
          font-size:0.72rem;font-weight:600;padding:0.35rem 0.8rem;
          border-radius:100px
        }
        .btn-action{
          display:flex;align-items:center;gap:0.5rem;
          padding:0.65rem 1.2rem;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          cursor:pointer;transition:var(--transition);text-decoration:none;
          border:1px solid transparent
        }
        .btn-profile{
          background:var(--primary-50);color:var(--primary-600);
          border-color:var(--primary-100)
        }
        .btn-profile:hover{
          background:var(--primary-100);border-color:var(--primary-600)
        }
        .btn-logout{
          background:#fff1f2;color:var(--danger);border-color:#fecdd3
        }
        .btn-logout:hover{
          background:#ffe4e6;border-color:var(--danger)
        }
        
        /* ── CONTENT ── */
        .ca-content{padding:clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,3rem) 0;max-width:1200px;margin:0 auto}
        
        /* Header */
        .ca-header{
          display:flex;align-items:flex-start;justify-content:space-between;
          flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem
        }
        .ca-title-area h1{
          font-family:'Cormorant Garamond',serif;font-size:2rem;
          font-weight:600;color:var(--text-elegant);letter-spacing:-0.02em
        }
        .ca-title-area p{
          font-family:'Manrope',sans-serif;font-size:0.95rem;
          color:var(--text-500);margin-top:0.25rem
        }
        .btn-dashboard{
          display:inline-flex;align-items:center;gap:0.5rem;
          padding:0.7rem 1.25rem;
          background:linear-gradient(135deg,var(--text-elegant),#0f172a);
          color:#fff;border:none;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          cursor:pointer;transition:var(--transition);
          box-shadow:0 4px 16px rgba(15,23,42,0.2)
        }
        .btn-dashboard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,0.3)}
        
        /* Stats */
        .stats-grid{
          display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
          gap:1rem;margin-bottom:1.5rem
        }
        .stat-card{
          background:var(--surface);border-radius:var(--radius-sm);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          padding:1.25rem;text-align:center
        }
        .stat-label{
          font-family:'Manrope',sans-serif;font-size:0.75rem;
          font-weight:600;color:var(--text-500);text-transform:uppercase;letter-spacing:0.08em
        }
        .stat-value{
          font-family:'Cormorant Garamond',serif;font-size:1.8rem;
          font-weight:700;color:var(--text-elegant);margin-top:0.5rem
        }
        
        /* Table Card */
        .ca-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          overflow:hidden
        }
        .ca-card-header{
          padding:1.25rem 1.75rem;border-bottom:1px solid var(--border-light);
          display:flex;align-items:center;justify-content:space-between;
          background:linear-gradient(135deg,var(--surface-100),var(--surface))
        }
        .ca-card-title{
          font-family:'Cormorant Garamond',serif;font-size:1.2rem;
          font-weight:600;color:var(--text-elegant)
        }
        .ca-badge{
          font-family:'Manrope',sans-serif;font-size:0.75rem;font-weight:600;
          padding:0.4rem 0.9rem;border-radius:100px;
          background:var(--primary-50);color:var(--primary-600)
        }
        
        /* Filters */
        .ca-filters{
          padding:1.25rem 1.75rem;border-bottom:1px solid var(--border-light);
          display:flex;flex-direction:column;gap:1rem;background:var(--surface)
        }
        .filters-row{display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}
        .search-wrap{position:relative;flex:1;min-width:240px;max-width:360px}
        .search-icon{
          position:absolute;left:1rem;top:50%;transform:translateY(-50%);
          width:16px;height:16px;color:var(--text-400);pointer-events:none
        }
        .search-input{
          width:100%;padding:0.75rem 1rem 0.75rem 2.5rem;
          background:var(--surface-100);border:1.5px solid var(--border-light);
          border-radius:12px;font-family:'Manrope',sans-serif;
          font-size:0.85rem;color:var(--text-elegant);outline:none;transition:var(--transition)
        }
        .search-input::placeholder{color:var(--text-400)}
        .search-input:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface)}
        .search-clear{
          position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);
          width:20px;height:20px;border:none;background:transparent;
          color:var(--text-400);cursor:pointer;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          opacity:0;pointer-events:none;transition:var(--transition)
        }
        .search-wrap.has-value .search-clear{opacity:1;pointer-events:auto}
        .search-clear:hover{background:var(--surface-100);color:var(--danger)}
        .filter-select{
          padding:0.75rem 2.5rem 0.75rem 1rem;
          background:var(--surface-100);border:1.5px solid var(--border-light);
          border-radius:12px;font-family:'Manrope',sans-serif;
          font-size:0.85rem;color:var(--text-elegant);outline:none;
          transition:var(--transition);appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat:no-repeat;background-position:right 0.75rem center;background-size:16px;
          min-width:150px
        }
        .filter-select::-ms-expand{display:none}
        .filter-select:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface)}
        .btn-clear{
          padding:0.75rem 1rem;
          background:var(--surface-100);color:var(--text-500);
          border:1.5px solid var(--border-light);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.8rem;font-weight:500;
          cursor:pointer;transition:var(--transition)
        }
        .btn-clear:hover{background:var(--surface);border-color:var(--danger);color:var(--danger)}
        .btn-clear:disabled{opacity:0.5;cursor:not-allowed}
        .active-filters{display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap}
        .filter-tag{
          display:inline-flex;align-items:center;gap:0.3rem;
          padding:0.25rem 0.6rem;background:var(--primary-50);
          color:var(--primary-600);border-radius:6px;
          font-family:'Manrope',sans-serif;font-size:0.7rem;font-weight:500
        }
        .filter-tag button{
          background:transparent;border:none;color:inherit;
          cursor:pointer;padding:0;margin:0;line-height:1
        }
        .filter-tag button:hover{color:var(--danger)}
        
        /* Table */
        .ca-table-wrap{overflow-x:auto}
        .ca-table{width:100%;border-collapse:collapse;min-width:750px}
        .ca-table thead{background:linear-gradient(135deg,var(--surface-100),var(--surface));border-bottom:1px solid var(--border-light)}
        .ca-table thead th{
          padding:1rem 1.5rem;text-align:left;
          font-family:'Cormorant Garamond',serif;font-size:0.7rem;
          font-weight:600;font-style:italic;color:var(--text-500);
          text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap
        }
        .ca-table tbody tr{border-bottom:1px solid var(--surface-100);transition:var(--transition)}
        .ca-table tbody tr:hover{background:var(--surface-100)}
        .ca-table tbody tr:last-child{border-bottom:none}
        .ca-table td{padding:1.1rem 1.5rem;font-size:0.85rem;color:var(--text);vertical-align:middle;font-family:'Manrope',sans-serif}
        .td-id{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;color:var(--text-400);background:var(--surface-100);padding:0.3rem 0.65rem;border-radius:8px}
        .td-user{display:flex;align-items:center;gap:0.75rem}
        .td-avatar{
          width:38px;height:38px;border-radius:10px;
          display:flex;align-items:center;justify-content:center;
          font-family:'Cormorant Garamond',serif;font-size:0.7rem;font-weight:700;
          color:#fff;flex-shrink:0
        }
        .td-name{font-family:'Manrope',sans-serif;font-weight:600;color:var(--text-elegant);font-size:0.88rem}
        .td-fecha{font-family:'Manrope',sans-serif;font-size:0.82rem;color:var(--text-elegant)}
        .td-hora{font-family:monospace;font-size:0.8rem;color:var(--text-500)}
        .estado-badge{
          display:inline-flex;align-items:center;gap:0.4rem;
          font-family:'Manrope',sans-serif;font-size:0.7rem;font-weight:600;
          padding:0.35rem 0.85rem;border-radius:100px;
          letter-spacing:0.04em;text-transform:uppercase
        }
        .estado-dot{width:5px;height:5px;border-radius:50%;background:currentColor}
        
        /* Empty / Loading */
        .ca-empty,.ca-loading{padding:4rem 2rem;text-align:center;color:var(--text-500)}
        .ca-spinner{
          width:36px;height:36px;border:3px solid var(--border-light);
          border-top-color:var(--primary-600);border-radius:50%;
          animation:spin 1s linear infinite;margin:0 auto 1rem
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        
        /* Footer */
        .ca-footer{
          padding:0.85rem 1.5rem;background:var(--surface-100);
          border-top:1px solid var(--border-light);
          font-family:'Manrope',sans-serif;font-size:0.72rem;color:var(--text-500);
          display:flex;justify-content:space-between;align-items:center
        }
        
        /* Responsive */
        @media(max-width:768px){
          .ca-header{flex-direction:column;align-items:stretch}
          .filters-row{flex-direction:column;align-items:stretch}
          .search-wrap{max-width:100%}
          .ca-table td,.ca-table th{padding:0.9rem 1rem;font-size:0.8rem}
          .ca-table thead{display:none}
          .ca-table tbody tr{display:block;padding:1rem;border-bottom:1px solid var(--border-light)}
          .ca-table td{display:flex;justify-content:space-between;padding:0.6rem 1rem}
          .ca-table td::before{
            content:attr(data-label);font-family:'Cormorant Garamond',serif;
            font-weight:600;font-style:italic;color:var(--text-500);
            text-transform:uppercase;font-size:0.68rem;letter-spacing:0.08em
          }
        }
      `}</style>

      <div className="ca-root">

        {/* ── TOPBAR CON TYPING ANIMATION ── */}
        <header className="ca-topbar">
          <div className="topbar-brand" onClick={() => navigate("/admin/dashboard")}>
            <span className="topbar-name">
              <span className="typing-wrapper" aria-label="OdontoNova">
                {typedText.split("").map((char, index) => (
                  <span key={index} className={`typing-char ${index >= 6 ? 'nova' : ''}`}>{char}</span>
                ))}
              </span>
              <span className={`typing-cursor ${cursorVisible ? 'active' : ''}`} aria-hidden="true" />
            </span>
          </div>

          <nav className="topbar-nav">
            {/* Dropdown: Módulos */}
            <div className={`dropdown ${menuOpen === 'modules' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'modules' ? null : 'modules'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Módulos
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu">
                <span className="dropdown-label">Gestión</span>
                {navModules.map((m) => (
                  <Link key={m.to} to={m.to} className="dropdown-item" onClick={() => setMenuOpen(null)}>{m.label}</Link>
                ))}
              </div>
            </div>

            {/* Dropdown: Crear */}
            <div className={`dropdown ${menuOpen === 'create' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'create' ? null : 'create'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Crear
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu">
                <span className="dropdown-label">Nuevo registro</span>
                {quickCreate.map((q) => (
                  <Link key={q.to} to={q.to} className="dropdown-item" onClick={() => setMenuOpen(null)}>{q.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/admin/perfil" className="btn-action btn-profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Perfil
            </Link>
            <span className="topbar-badge">Admin</span>
            <button onClick={handleLogout} className="btn-action btn-logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Salir
            </button>
          </nav>
        </header>

        {/* ── CONTENT ── */}
        <main className="ca-content">

          {/* Header */}
          <div className="ca-header">
            <div className="ca-title-area">
              <h1>Panel de Citas</h1>
              <p>Gestión general de todas las citas odontológicas registradas</p>
            </div>
            <button className="btn-dashboard" onClick={() => navigate("/admin/dashboard")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Volver al Dashboard
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Confirmadas</div>
              <div className="stat-value" style={{color:'var(--success)'}}>{stats.confirmadas}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Canceladas</div>
              <div className="stat-value" style={{color:'var(--danger)'}}>{stats.canceladas}</div>
            </div>
          </div>

          {/* Table Card */}
          <div className="ca-card">
            <div className="ca-card-header">
              <h2 className="ca-card-title">Lista de citas</h2>
              <span className="ca-badge">{citasFiltradas.length} registros</span>
            </div>

            {/* Filters */}
            <div className="ca-filters">
              <div className="filters-row">
                {/* Search */}
                <div className={`search-wrap ${searchTerm ? 'has-value' : ''}`}>
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar por paciente, odontólogo o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button type="button" className="search-clear" onClick={() => setSearchTerm("")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>

                {/* Estado */}
                <select className="filter-select" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="CONFIRMADA">Confirmada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>

                {/* Fecha */}
                <input type="date" className="filter-select" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)} />

                {/* Clear */}
                <button className="btn-clear" onClick={clearAllFilters} disabled={!hasActiveFilters}>
                  Limpiar
                </button>
              </div>

              {/* Active Filter Tags */}
              {hasActiveFilters && (
                <div className="active-filters">
                  <span style={{fontSize:'0.7rem',color:'var(--text-500)'}}>Filtros:</span>
                  {debouncedSearch && (
                    <span className="filter-tag">🔍 "{searchTerm}" <button onClick={() => setSearchTerm("")}>✕</button></span>
                  )}
                  {fechaFiltro && (
                    <span className="filter-tag">📅 {formatFecha(fechaFiltro)} <button onClick={() => setFechaFiltro("")}>✕</button></span>
                  )}
                  {estadoFiltro && (
                    <span className="filter-tag">🏷️ {getEstadoStyle(estadoFiltro).label} <button onClick={() => setEstadoFiltro("")}>✕</button></span>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className="ca-loading">
                <div className="ca-spinner" />
                Cargando citas...
              </div>
            ) : (
              <>
                <div className="ca-table-wrap">
                  <table className="ca-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Paciente</th>
                        <th>Odontólogo</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan="6">
                            <div className="ca-empty">
                              {debouncedSearch || fechaFiltro || estadoFiltro 
                                ? "No se encontraron citas con los filtros aplicados" 
                                : "No hay citas registradas"}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        citasFiltradas.map((c) => {
                          const estado = c.estadoCita?.nombreEstado || c.estado?.nombre || "PENDIENTE";
                          const { bg, color, label } = getEstadoStyle(estado);
                          return (
                            <tr key={c.idCita}>
                              <td data-label="ID"><span className="td-id">#{c.idCita}</span></td>
                              <td data-label="Paciente">
                                <div className="td-user">
                                  <div className="td-avatar" style={{ background: getAvatarColor(c.paciente?.idPaciente) }}>
                                    {getInitials(c.paciente?.nombres, c.paciente?.apellidos)}
                                  </div>
                                  <span className="td-name">{c.paciente?.nombres} {c.paciente?.apellidos}</span>
                                </div>
                              </td>
                              <td data-label="Odontólogo">
                                <span className="td-name">{c.odontologo?.usuario?.nombres || c.odontologo?.nombres || "—"}</span>
                              </td>
                              <td data-label="Fecha"><span className="td-fecha">{formatFecha(c.fecha)}</span></td>
                              <td data-label="Hora"><span className="td-hora">{formatHora(c.horaInicio)}</span></td>
                              <td data-label="Estado">
                                <span className="estado-badge" style={{ background: bg, color }}>
                                  <span className="estado-dot" />{label}
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
                {citasFiltradas.length > 0 && (
                  <div className="ca-footer">
                    <span>Mostrando {citasFiltradas.length} de {citas.length} citas</span>
                    {hasActiveFilters && <span style={{opacity:0.7}}>• Filtrado</span>}
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