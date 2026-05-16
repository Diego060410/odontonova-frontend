import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listarEspecialidades, eliminarEspecialidad } from "../../services/especialidadService";
import api from "../../services/api";

export default function Especialidades() {
  const navigate = useNavigate();
  
  // ── Estados principales ──
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Typing Animation (aislado, igual que Dashboard) ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    const FULL_TEXT = "OdontoNova";
    let timeouts = [], cursorTimer;
    const cleanup = () => { timeouts.forEach(clearTimeout); clearInterval(cursorTimer); setCursorVisible(false); };
    const startBlink = () => { cursorTimer = setInterval(() => setCursorVisible(v => !v), 530); };
    
    const typeSequence = () => {
      let i = 0; startBlink();
      const step = () => {
        if (i <= FULL_TEXT.length) {
          setTypedText(FULL_TEXT.slice(0, i)); i++;
          timeouts.push(setTimeout(step, 85));
        } else {
          clearInterval(cursorTimer); setCursorVisible(false);
          timeouts.push(setTimeout(eraseSequence, 700));
        }
      };
      timeouts.push(setTimeout(step, 800));
    };
    
    const eraseSequence = () => {
      startBlink(); let i = FULL_TEXT.length;
      const step = () => {
        if (i >= 0) { setTypedText(FULL_TEXT.slice(0, i)); i--; timeouts.push(setTimeout(step, 45)); }
        else { clearInterval(cursorTimer); setCursorVisible(false); timeouts.push(setTimeout(typeSequence, 1000)); }
      };
      timeouts.push(setTimeout(step, 0));
    };
    typeSequence(); return cleanup;
  }, []);

  // ── Carga de datos ──
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await listarEspecialidades();
        setEspecialidades(data);
      } catch (err) { console.error("Error:", err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  // ── Cierre de dropdowns ──
  useEffect(() => {
    const handleClick = (e) => { if (!e.target.closest('.dropdown')) setMenuOpen(null); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // ── Filtro de búsqueda ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return especialidades.filter(e => 
      e.nombreEspecialidad?.toLowerCase().includes(q) ||
      e.descripcion?.toLowerCase().includes(q) ||
      e.idEspecialidad?.toString().includes(q)
    );
  }, [especialidades, search]);

  // ── Badge de estado ──
  const estadoBadge = (activo) => activo 
    ? { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "ACTIVA" }
    : { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "INACTIVA" };

  // ── Menús del topbar ──
  const navModules = useMemo(() => [
    { to: "/admin/usuarios", label: "Usuarios", icon: <UsersIcon /> },
    { to: "/admin/odontologos", label: "Odontólogos", icon: <DentistIcon /> },
    { to: "/admin/pacientes", label: "Pacientes", icon: <PatientIcon /> },
    { to: "/admin/citas", label: "Citas", icon: <CalendarIcon /> },
    { to: "/admin/sedes", label: "Sedes", icon: <BuildingIcon /> },
    { to: "/admin/consultorios", label: "Consultorios", icon: <RoomIcon /> },
    { to: "/admin/especialidades", label: "Especialidades", icon: <SpecialtyIcon /> },
  ], []);

  const quickCreate = useMemo(() => [
    { to: "/admin/crear-usuario", label: "Nuevo Usuario", accent: "#6366f1" },
    { to: "/admin/crear-odontologo", label: "Nuevo Odontólogo", accent: "#1e40af" },
    { to: "/admin/crear-cita", label: "Nueva Cita", accent: "#db2777" },
    { to: "/admin/crear-sede", label: "Nueva Sede", accent: "#059669" },
    { to: "/admin/crear-consultorio", label: "Nuevo Consultorio", accent: "#d97706" },
    { to: "/admin/crear-especialidad", label: "Nueva Especialidad", accent: "#0891b2" },
  ], []);

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta especialidad?")) return;
    try {
      await eliminarEspecialidad(id);
      setEspecialidades(prev => prev.filter(e => e.idEspecialidad !== id));
    } catch { alert("❌ Error al eliminar"); }
  };

  // ── Iconos SVG reutilizables ──
  function UsersIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; }
  function DentistIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/></svg>; }
  function PatientIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
  function CalendarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/></svg>; }
  function BuildingIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>; }
  function RoomIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
  function SpecialtyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>; }
  function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>; }
  function EditIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
  function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>; }

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
          --shadow:0 4px 20px rgba(0,0,0,0.04);--shadow-lg:0 12px 48px rgba(0,0,0,0.08);
          --radius:20px;--radius-sm:14px;--transition:all 0.3s cubic-bezier(0.16,1,0.3,1)
        }
        body{font-family:'Manrope',system-ui,sans-serif;background:var(--surface-50);-webkit-font-smoothing:antialiased}
        
        /* ── ROOT & TOPBAR ── */
        .esp-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 100%)}
        .esp-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow)}
        .topbar-brand{display:flex;align-items:center;gap:1rem;cursor:pointer}
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2.5rem;font-weight:500;font-style:italic;color:var(--text-elegant)}
        .typing-wrapper{display:inline-flex;gap:0.02em}.typing-char.nova{color:var(--primary-600);font-weight:700;background:linear-gradient(135deg,var(--primary-600),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.typing-cursor{width:2.5px;height:2.2rem;background:var(--primary-600);margin-left:3px;border-radius:2px;opacity:0}.typing-cursor.active{opacity:1;animation:blink 1s step-end infinite}@keyframes blink{50%{opacity:0}}
        
        .topbar-nav{display:flex;align-items:center;gap:0.35rem}.dropdown{position:relative}
        .dropdown-btn{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 1.1rem;border-radius:12px;font-size:0.87rem;font-weight:600;color:var(--text-500);background:transparent;border:1px solid transparent;cursor:pointer;transition:var(--transition)}
        .dropdown-btn:hover,.dropdown-btn.active{color:var(--primary-600);background:var(--primary-50);border-color:var(--primary-100)}
        .dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:260px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg);padding:0.75rem;opacity:0;visibility:hidden;transform:translateY(-10px);transition:var(--transition);z-index:101}.dropdown.active .dropdown-menu{opacity:1;visibility:visible;transform:translateY(0)}
        .dropdown-item{display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1.1rem;border-radius:10px;font-size:0.87rem;font-weight:500;color:var(--text-elegant);text-decoration:none;transition:var(--transition)}.dropdown-item:hover{background:var(--primary-50);color:var(--primary-600);transform:translateX(4px)}
        .dropdown-label{padding:0.45rem 1.1rem;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-400);text-transform:uppercase;letter-spacing:0.12em}
        .btn-action{display:flex;align-items:center;gap:0.55rem;padding:0.65rem 1.35rem;border-radius:14px;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent}.btn-profile{background:var(--primary-50);color:var(--primary-600);border-color:var(--primary-100)}.btn-logout{background:#fff1f2;color:var(--danger);border-color:#fecdd3}.btn-action:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
        .topbar-badge{background:var(--primary-100);border:1px solid #93c5fd;color:var(--primary-600);font-size:0.72rem;font-weight:600;font-style:italic;padding:0.4rem 0.95rem;border-radius:100px}
        
        /* ── CONTENT ── */
        .esp-content{padding:clamp(2rem,5vw,3rem);max-width:1300px;margin:0 auto;animation:fadeInUp 0.5s ease}@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .esp-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;margin-bottom:2.5rem}
        .esp-header-left{display:flex;flex-direction:column;gap:0.5rem}.esp-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600)}.esp-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:600;color:var(--text-elegant)}
        .esp-actions{display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}
        .btn-back{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:var(--text-elegant);color:#fff;border:none;border-radius:12px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition)}.btn-back:hover{transform:translateY(-2px)}
        .btn-create{display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;background:linear-gradient(135deg,var(--success),#047857);color:#fff;border:none;border-radius:12px;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition)}.btn-create:hover{transform:translateY(-3px);filter:brightness(1.05)}
        
        /* ── SEARCH ── */
        .esp-search-wrap{position:relative;min-width:260px}.esp-search-icon{position:absolute;left:1.1rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-400)}.esp-search{width:100%;padding:0.85rem 1.1rem 0.85rem 2.75rem;background:var(--surface);border:1.5px solid var(--border-light);border-radius:14px;font-size:0.87rem;color:var(--text);outline:none;transition:var(--transition)}.esp-search:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12)}
        
        /* ── TABLE ── */
        .esp-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);overflow:hidden}
        .esp-table{width:100%;border-collapse:collapse}.esp-table thead{background:var(--surface-100);border-bottom:1px solid var(--border-light)}
        .esp-table th{padding:1rem 1.5rem;text-align:left;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-500);text-transform:uppercase;letter-spacing:0.12em}
        .esp-table tbody tr{border-bottom:1px solid var(--surface-100);transition:var(--transition)}.esp-table tbody tr:hover{background:var(--surface-100);transform:translateX(4px)}
        .esp-table td{padding:1.1rem 1.5rem;font-size:0.87rem;color:var(--text);vertical-align:middle}
        .td-id{font-family:'Cormorant Garamond',serif;font-size:0.78rem;font-weight:600;color:var(--text-400);background:var(--surface-100);padding:0.35rem 0.75rem;border-radius:8px}
        .td-name{font-weight:600;color:var(--text-elegant)}.td-desc{color:var(--text-500);max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .estado-badge{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.72rem;font-weight:600;padding:0.4rem 0.95rem;border-radius:100px;letter-spacing:0.05em;text-transform:uppercase;border:1px solid currentColor;transition:var(--transition)}.estado-badge:hover{transform:scale(1.05)}
        .estado-dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:blink 2s infinite}@keyframes blink{50%{opacity:0.5}}
        .action-btns{display:flex;gap:0.5rem;justify-content:flex-end}.action-btn{display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.9rem;border:none;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer;transition:var(--transition)}.action-btn.edit{background:#f0f7ff;color:#007bff}.action-btn.delete{background:#fff1f2;color:#e11d48}.action-btn:hover{transform:translateY(-1px)}
        
        /* ── EMPTY / LOADING ── */
        .esp-empty{padding:4rem 2rem;text-align:center}.esp-empty-icon{width:56px;height:56px;background:var(--surface-100);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:var(--text-400)}.esp-empty-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.4rem}.esp-empty-sub{font-size:0.85rem;color:var(--text-500)}
        .esp-loading{padding:4rem 2rem;display:flex;flex-direction:column;align-items:center;gap:1rem}.spinner{width:40px;height:40px;border:3px solid var(--border-light);border-top-color:var(--primary-600);border-radius:50%;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        
        /* ── RESPONSIVE ── */
        @media(max-width:768px){.esp-header{flex-direction:column;align-items:stretch}.esp-actions{width:100%;justify-content:space-between}.esp-search-wrap{min-width:100%}}
        @media(max-width:600px){.topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem}.esp-table thead{display:none}.esp-table tbody tr{display:block;padding:1rem;border-bottom:1px solid var(--border-light)}.esp-table td{display:flex;justify-content:space-between;padding:0.6rem 1rem;font-size:0.8rem}.esp-table td::before{content:attr(data-label);font-family:'Cormorant Garamond',serif;font-weight:600;font-style:italic;color:var(--text-500);text-transform:uppercase;font-size:0.7rem}}
      `}</style>

      <div className="esp-root">
        {/* ── TOPBAR ── */}
        <header className="esp-topbar">
          <div className="topbar-brand" onClick={() => navigate("/admin/dashboard")}>
            <span className="topbar-name">
              <span className="typing-wrapper">
                {typedText.split("").map((char, i) => (
                  <span key={i} className={`typing-char ${i >= 6 ? 'nova' : ''}`}>{char}</span>
                ))}
              </span>
              <span className={`typing-cursor ${cursorVisible ? 'active' : ''}`} />
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
                <span className="dropdown-label">Gestión</span>
                {navModules.map((m) => (
                  <Link key={m.to} to={m.to} className="dropdown-item" onClick={() => setMenuOpen(null)}>{m.icon}{m.label}</Link>
                ))}
              </div>
            </div>
            <div className={`dropdown ${menuOpen === 'create' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'create' ? null : 'create'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Crear
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu">
                <span className="dropdown-label">Nuevo registro</span>
                {quickCreate.map((q) => (
                  <Link key={q.to} to={q.to} className="dropdown-item" onClick={() => setMenuOpen(null)} style={{ borderLeft: `3px solid ${q.accent}`, paddingLeft: '0.65rem' }}>{q.label}</Link>
                ))}
              </div>
            </div>
            <Link to="/admin/perfil" className="btn-action btn-profile">Perfil</Link>
            <span className="topbar-badge">Admin</span>
            <button onClick={handleLogout} className="btn-action btn-logout">Salir</button>
          </nav>
        </header>

        {/* ── CONTENT ── */}
        <main className="esp-content">
          <div className="esp-header">
            <div className="esp-header-left">
              <p className="esp-eyebrow">Catálogo Médico</p>
              <h1 className="esp-title">Especialidades</h1>
              {!loading && <span style={{ fontSize: "0.8rem", color: "var(--text-500)" }}>{filtered.length} especialidades</span>}
            </div>
            <div className="esp-actions">
              <button onClick={() => navigate("/admin/dashboard")} className="btn-back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Dashboard
              </button>
              <Link to="/admin/crear-especialidad" className="btn-create">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nueva Especialidad
              </Link>
              <div className="esp-search-wrap">
                <span className="esp-search-icon"><SearchIcon /></span>
                <input className="esp-search" placeholder="Buscar especialidad..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="esp-card">
            {loading ? (
              <div className="esp-loading">
                <div className="spinner" />
                <span style={{ color: "var(--text-500)", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando...</span>
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table className="esp-table">
                    <thead>
                      <tr>
                        <th>ID</th><th>Especialidad</th><th>Descripción</th><th>Estado</th><th style={{ textAlign: "right" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan="5"><div className="esp-empty"><div className="esp-empty-icon"><SpecialtyIcon /></div><p className="esp-empty-title">{search ? "Sin resultados" : "Lista vacía"}</p><p className="esp-empty-sub">{search ? `Nada coincide con "${search}"` : "Las especialidades aparecerán aquí"}</p></div></td></tr>
                      ) : filtered.map((e) => {
                        const badge = estadoBadge(e.estado);
                        return (
                          <tr key={e.idEspecialidad}>
                            <td data-label="ID"><span className="td-id">#{e.idEspecialidad}</span></td>
                            <td data-label="Especialidad"><span className="td-name">{e.nombreEspecialidad}</span></td>
                            <td data-label="Descripción"><span className="td-desc" title={e.descripcion}>{e.descripcion || "—"}</span></td>
                            <td data-label="Estado"><span className="estado-badge" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}><span className="estado-dot" />{badge.label}</span></td>
                            <td data-label="Acciones">
                              <div className="action-btns">
                                <button className="action-btn edit" onClick={() => navigate(`/admin/editar-especialidad/${e.idEspecialidad}`)}><EditIcon />Editar</button>
                                <button className="action-btn delete" onClick={() => handleEliminar(e.idEspecialidad)}><TrashIcon />Eliminar</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 0 && (
                  <div style={{ padding: "0.75rem 1.5rem", background: "var(--surface-100)", borderTop: "1px solid var(--border-light)", fontSize: "0.75rem", color: "var(--text-500)", display: "flex", justifyContent: "space-between" }}>
                    <span>Mostrando {filtered.length} de {especialidades.length}</span>
                    {search && <span style={{ opacity: 0.7 }}>• Filtrado</span>}
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