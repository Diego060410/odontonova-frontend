import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function Pacientes() {
  const navigate = useNavigate();
  
  // ── Estados principales ──
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Typing Animation (consistente con el resto de la app) ──
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

  // ── Carga de pacientes ──
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get("/pacientes");
        setPacientes(res.data || []);
      } catch (error) {
        console.error("Error cargando pacientes:", error.response?.data || error);
      } finally { setLoading(false); }
    };
    cargar();
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

  // ── Búsqueda optimizada ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return pacientes;
    return pacientes.filter((p) => (
      p.idPaciente?.toString().includes(q) ||
      p.nombres?.toLowerCase().includes(q) ||
      p.apellidos?.toLowerCase().includes(q) ||
      p.correo?.toLowerCase().includes(q) ||
      p.telefono?.toString().includes(q)
    ));
  }, [pacientes, search]);

  // ── Helpers visuales ──
  const avatarColor = (id) => {
    const colors = ["#1e40af", "#7c3aed", "#059669", "#d97706", "#db2777", "#0891b2"];
    return colors[(id || 0) % colors.length];
  };

  const initials = (nombres, apellidos) => {
    const a = nombres?.[0] || "";
    const b = apellidos?.[0] || "";
    return (a + b).toUpperCase() || "?";
  };

  // ── Menús del topbar (consistentes) ──
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

  // ── Iconos SVG reutilizables ──
  function UsersIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; }
  function DentistIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/></svg>; }
  function PatientIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
  function CalendarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/></svg>; }
  function BuildingIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>; }
  function RoomIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
  function SpecialtyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>; }
  function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>; }
  function PlusIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

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
        body{font-family:'Manrope',system-ui,sans-serif;background:var(--surface-50);-webkit-font-smoothing:antialiased}
        
        /* ── ROOT & TOPBAR ── */
        .pac-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 100%)}
        .pac-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow)}
        .topbar-brand{display:flex;align-items:center;gap:1rem;cursor:pointer;transition:var(--transition)}.topbar-brand:hover{transform:scale(1.01)}
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2.5rem;font-weight:500;font-style:italic;color:var(--text-elegant);line-height:1.1}
        .typing-wrapper{display:inline-flex;gap:0.02em}.typing-char.nova{color:var(--primary-600);font-weight:700;font-style:italic;background:linear-gradient(135deg,var(--primary-600),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.typing-cursor{width:2.5px;height:2.2rem;background:var(--primary-600);margin-left:3px;border-radius:2px;opacity:0;vertical-align:baseline}.typing-cursor.active{opacity:1;animation:blink 1s step-end infinite}@keyframes blink{50%{opacity:0}}
        
        .topbar-nav{display:flex;align-items:center;gap:0.35rem}.dropdown{position:relative}
        .dropdown-btn{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 1.1rem;border-radius:12px;font-size:0.87rem;font-weight:600;color:var(--text-500);background:transparent;border:1px solid transparent;cursor:pointer;transition:var(--transition)}.dropdown-btn:hover,.dropdown-btn.active{color:var(--primary-600);background:var(--primary-50);border-color:var(--primary-100);box-shadow:0 4px 16px rgba(30,64,175,0.1)}
        .dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:260px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg),var(--shadow-glow);padding:0.75rem;opacity:0;visibility:hidden;transform:translateY(-10px) scale(0.98);transition:var(--transition);z-index:101;animation:menuElegant 0.25s ease forwards}.dropdown.active .dropdown-menu{opacity:1;visibility:visible;transform:translateY(0) scale(1)}@keyframes menuElegant{from{opacity:0;transform:translateY(-10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .dropdown-item{display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1.1rem;border-radius:10px;font-size:0.87rem;font-weight:500;color:var(--text-elegant);text-decoration:none;transition:var(--transition);position:relative;overflow:hidden}.dropdown-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:var(--transition)}.dropdown-item:hover{background:linear-gradient(135deg,var(--primary-50),var(--surface));color:var(--primary-600);transform:translateX(6px);padding-left:1.4rem}.dropdown-item:hover::before{background:var(--primary-600)}
        .dropdown-label{padding:0.45rem 1.1rem;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-400);text-transform:uppercase;letter-spacing:0.12em}
        .btn-action{display:flex;align-items:center;gap:0.55rem;padding:0.65rem 1.35rem;border-radius:14px;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent;position:relative;overflow:hidden}.btn-action::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);transition:left 0.5s ease}.btn-action:hover::before{left:100%}.btn-profile{background:linear-gradient(135deg,#eff6ff,#dbeafe);color:var(--primary-600);border-color:#bfdbfe}.btn-logout{background:linear-gradient(135deg,#fff1f2,#ffe4e6);color:var(--danger);border-color:#fecdd3}.btn-action:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,0.12)}
        .topbar-badge{background:linear-gradient(135deg,var(--primary-100),#bfdbfe);border:1px solid #93c5fd;color:var(--primary-600);font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;letter-spacing:0.08em;text-transform:uppercase;padding:0.4rem 0.95rem;border-radius:100px}
        
        /* ── CONTENT ── */
        .pac-content{padding:clamp(2rem,5vw,3rem);max-width:1300px;margin:0 auto;animation:fadeInUp 0.5s ease}@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .pac-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;margin-bottom:2.5rem}
        .pac-header-left{display:flex;flex-direction:column;gap:0.5rem}.pac-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);display:flex;align-items:center;gap:0.5rem}.pac-eyebrow::before{content:'';width:28px;height:1px;background:linear-gradient(90deg,var(--primary-600),transparent);border-radius:1px}.pac-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:600;color:var(--text-elegant);line-height:1.1}
        .pac-count-badge{display:inline-flex;align-items:center;gap:0.45rem;background:linear-gradient(135deg,var(--primary-50),#dbeafe);border:1px solid var(--primary-100);color:var(--primary-600);font-family:'Manrope',sans-serif;font-size:0.75rem;font-weight:600;padding:0.45rem 1rem;border-radius:100px;box-shadow:0 2px 10px rgba(30,64,175,0.1)}
        
        /* ── ACTIONS ── */
        .pac-actions{display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}
        .btn-back{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:var(--text-elegant);color:#fff;border:none;border-radius:12px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none}.btn-back:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,0.25)}
        .btn-create{display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;background:linear-gradient(135deg,var(--success),#047857);color:#fff;border:none;border-radius:12px;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;position:relative;overflow:hidden}.btn-create::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);transition:left 0.5s ease}.btn-create:hover::before{left:100%}.btn-create:hover{transform:translateY(-3px);filter:brightness(1.05)}
        
        /* ── SEARCH ── */
        .pac-search-wrap{position:relative;min-width:260px}.pac-search-icon{position:absolute;left:1.1rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-400);pointer-events:none;transition:var(--transition)}.pac-search{width:100%;padding:0.85rem 1.1rem 0.85rem 2.75rem;background:var(--surface);border:1.5px solid var(--border-light);border-radius:14px;font-size:0.87rem;color:var(--text);outline:none;transition:var(--transition)}.pac-search::placeholder{color:var(--text-400)}.pac-search:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface-100)}.pac-search:focus + .pac-search-icon{color:var(--primary-600)}
        
        /* ── TABLE ── */
        .pac-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);overflow:hidden;animation:fadeInUp 0.5s ease 0.1s both}
        .pac-table{width:100%;border-collapse:collapse}.pac-table thead{background:linear-gradient(135deg,var(--surface-100),var(--surface));border-bottom:1px solid var(--border-light)}
        .pac-table th{padding:1rem 1.5rem;text-align:left;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-500);text-transform:uppercase;letter-spacing:0.12em;white-space:nowrap}
        .pac-table tbody tr{border-bottom:1px solid var(--surface-100);transition:var(--transition);position:relative}.pac-table tbody tr::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:var(--transition)}.pac-table tbody tr:hover{background:linear-gradient(135deg,var(--surface-100),var(--surface));transform:translateX(4px)}.pac-table tbody tr:hover::before{background:var(--primary-600)}
        .pac-table td{padding:1.1rem 1.5rem;font-size:0.87rem;color:var(--text);vertical-align:middle;font-family:'Manrope',sans-serif;font-weight:400}
        .td-id{font-family:'Cormorant Garamond',serif;font-size:0.78rem;font-weight:600;color:var(--text-400);background:var(--surface-100);padding:0.35rem 0.7rem;border-radius:8px}
        .td-user{display:flex;align-items:center;gap:0.8rem}.td-avatar{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:0.8rem;font-weight:700;color:#fff;flex-shrink:0;letter-spacing:0.02em;box-shadow:0 3px 12px rgba(0,0,0,0.12);transition:var(--transition)}.pac-table tbody tr:hover .td-avatar{transform:scale(1.08) rotate(3deg)}
        .td-name{font-weight:600;color:var(--text-elegant);font-size:0.9rem;transition:var(--transition)}.pac-table tbody tr:hover .td-name{color:var(--primary-600)}
        .td-email{color:var(--text-500);font-size:0.83rem}
        
        /* ── EMPTY / LOADING ── */
        .pac-empty{padding:4.5rem 2.5rem;text-align:center}.pac-empty-icon{width:64px;height:64px;background:linear-gradient(135deg,var(--surface-100),var(--surface));border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;color:var(--text-400);box-shadow:0 4px 20px rgba(0,0,0,0.06);animation:float 3s ease-in-out infinite}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .pac-empty-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.4rem}.pac-empty-sub{font-size:0.85rem;color:var(--text-500)}
        .pac-loading{padding:5rem 2rem;display:flex;flex-direction:column;align-items:center;gap:1.25rem;animation:fadeIn 0.4s ease}.spinner{width:44px;height:44px;border:3px solid var(--border-light);border-top-color:var(--primary-600);border-radius:50%;animation:spin 1s linear infinite;box-shadow:0 0 0 4px rgba(30,64,175,0.08)}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}
        
        /* ── FOOTER ── */
        .pac-footer{padding:0.95rem 1.5rem;background:linear-gradient(135deg,var(--surface-100),var(--surface));border-top:1px solid var(--border-light);font-size:0.75rem;color:var(--text-500);font-weight:500;display:flex;align-items:center;gap:0.5rem}
        
        /* ── SCROLLBAR ── */
        .pac-table-wrap{overflow-x:auto}.pac-table-wrap::-webkit-scrollbar{height:8px}.pac-table-wrap::-webkit-scrollbar-track{background:var(--surface-100);border-radius:4px}.pac-table-wrap::-webkit-scrollbar-thumb{background:linear-gradient(90deg,var(--primary-100),var(--primary-600));border-radius:4px}.pac-table-wrap::-webkit-scrollbar-thumb:hover{background:var(--primary-600)}
        
        /* ── RESPONSIVE ── */
        @media(max-width:900px){.topbar-nav{gap:0.15rem}.dropdown-menu{min-width:220px;right:-10px}.btn-action{padding:0.55rem 1rem;font-size:0.83rem}.pac-title{font-size:1.8rem}.pac-actions{width:100%;justify-content:space-between}}
        @media(max-width:768px){.pac-header{flex-direction:column;align-items:stretch}.pac-search-wrap{min-width:100%}.pac-table td,.pac-table th{padding:0.9rem 1rem;font-size:0.82rem}.td-avatar{width:36px;height:36px;font-size:0.75rem}}
        @media(max-width:600px){.topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}.pac-title{font-size:1.5rem}.pac-actions{flex-direction:column;align-items:stretch}.btn-back,.btn-create{width:100%;justify-content:center}.pac-table thead{display:none}.pac-table tbody tr{display:block;padding:1rem;border-bottom:1px solid var(--border-light)}.pac-table td{display:flex;justify-content:space-between;padding:0.6rem 1rem;font-size:0.8rem}.pac-table td::before{content:attr(data-label);font-family:'Cormorant Garamond',serif;font-weight:600;font-style:italic;color:var(--text-500);text-transform:uppercase;font-size:0.7rem;letter-spacing:0.08em}}
      `}</style>

      <div className="pac-root">
        {/* ── TOPBAR CONSISTENTE ── */}
        <header className="pac-topbar">
          <div className="topbar-brand" onClick={() => navigate("/admin/dashboard")}>
            <span className="topbar-name">
              <span className="typing-wrapper" aria-label="OdontoNova">
                {typedText.split("").map((char, i) => (
                  <span key={i} className={`typing-char ${i >= 6 ? 'nova' : ''}`}>{char}</span>
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
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Gestión</span>
                {navModules.map((m) => (
                  <Link key={m.to} to={m.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)}>{m.icon}{m.label}</Link>
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
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Nuevo registro</span>
                {quickCreate.map((q) => (
                  <Link key={q.to} to={q.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)} style={{ borderLeft: `3px solid ${q.accent}`, paddingLeft: '0.65rem' }}>{q.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/admin/perfil" className="btn-action btn-profile">Perfil</Link>
            <span className="topbar-badge">Admin</span>
            <button onClick={handleLogout} className="btn-action btn-logout">Salir</button>
          </nav>
        </header>

        {/* ── CONTENT ── */}
        <main className="pac-content">
          {/* Header de Página */}
          <div className="pac-header">
            <div className="pac-header-left">
              <p className="pac-eyebrow">Gestión Clínica</p>
              <h1 className="pac-title">Pacientes</h1>
              {!loading && (
                <div className="pac-count-badge">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  {pacientes.length} pacientes registrados
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="pac-actions">
              <button onClick={() => navigate("/admin/dashboard")} className="btn-back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Dashboard
              </button>
              
              <Link to="/admin/crear-Usuario" className="btn-create">
                <PlusIcon />
                Nuevo Paciente
              </Link>

              <div className="pac-search-wrap">
                <span className="pac-search-icon"><SearchIcon /></span>
                <input
                  className="pac-search"
                  placeholder="Buscar por nombre, correo o teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar pacientes"
                />
              </div>
            </div>
          </div>

          {/* Card de Tabla */}
          <div className="pac-card">
            {loading ? (
              <div className="pac-loading">
                <div className="spinner" />
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--text-500)" }}>Cargando pacientes...</span>
              </div>
            ) : (
              <>
                <div className="pac-table-wrap">
                  <table className="pac-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Paciente</th>
                        <th>Correo electrónico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan="3">
                            <div className="pac-empty">
                              <div className="pac-empty-icon">
                                <PatientIcon />
                              </div>
                              <p className="pac-empty-title">
                                {search ? "Sin resultados" : "Lista vacía"}
                              </p>
                              <p className="pac-empty-sub">
                                {search 
                                  ? `Ningún paciente coincide con "${search}"` 
                                  : "Los pacientes registrados aparecerán aquí automáticamente"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((p) => (
                          <tr key={p.idPaciente}>
                            <td data-label="ID"><span className="td-id">#{p.idPaciente}</span></td>
                            <td data-label="Paciente">
                              <div className="td-user">
                                <div
                                  className="td-avatar"
                                  style={{ background: avatarColor(p.idPaciente) }}
                                  title={`${p.nombres} ${p.apellidos}`}
                                  aria-label={`Avatar de ${p.nombres} ${p.apellidos}`}
                                >
                                  {initials(p.nombres, p.apellidos)}
                                </div>
                                <span className="td-name">{p.nombres} {p.apellidos}</span>
                              </div>
                            </td>
                            <td data-label="Correo"><span className="td-email">{p.correo || "—"}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer informativo */}
                {filtered.length > 0 && (
                  <div className="pac-footer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Mostrando {filtered.length} de {pacientes.length} pacientes
                    {search && <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>• Filtrado</span>}
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