import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Swal from "sweetalert2";

export default function CrearCitaRecepcionista() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  // Listas para los selectores
  const [pacientes, setPacientes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [odontologos, setOdontologos] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]);

  // Estado del formulario
  const [form, setForm] = useState({
    idPaciente: "",
    idSede: "",
    idConsultorio: "",
    idOdontologo: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    motivo: "",
    observaciones: "",
    idEstadoCita: 1
  });

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

  // 1. Cargar datos base
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pacRes, sedRes, odoRes] = await Promise.all([
          api.get("/pacientes"),
          api.get("/sedes"),
          api.get("/odontologos")
        ]);
        setPacientes(pacRes.data || []);
        setSedes(sedRes.data || []);
        setOdontologos(odoRes.data || []);
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
      }
    };
    fetchData();
  }, []);

  // 2. Cargar Consultorios por Sede
  useEffect(() => {
    if (form.idSede) {
      api.get("/consultorios").then(res => {
        const filtrados = res.data.filter(c => 
          String(c.idSede ?? c.sede?.idSede) === String(form.idSede)
        );
        setConsultorios(filtrados);
      });
    } else {
      setConsultorios([]);
    }
  }, [form.idSede]);

  // 3. Cargar disponibilidad por odontólogo y fecha
  useEffect(() => {
    if (form.idOdontologo && form.fecha) {
      api.get(`/disponibilidad?odontologo=${form.idOdontologo}&fecha=${form.fecha}`)
        .then(res => setHorasDisponibles(res.data || []))
        .catch(() => setHorasDisponibles([]));
    }
  }, [form.idOdontologo, form.fecha]);

  // ── Cierre de dropdowns ──
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.dropdown')) setMenuOpen(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ── FUNCIONES AUXILIARES CORREGIDAS (TIMEZONE SAFE) ──
  
  // ✅ Calcula fecha mínima HOY en timezone local (evita que sea "ayer")
  const getFechaMinLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ Formatea fecha para mostrar sin shift de timezone
  const formatearFechaParaDisplay = (fechaStr) => {
    if (!fechaStr) return "";
    const [year, month, day] = fechaStr.split("-");
    // Crear fecha con timezone local usando constructor con parámetros
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('es-PE', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // ✅ Auto-completar hora fin (sin depender de new Date() con timezone)
  const autoCompletarFin = (hora) => {
    if (!hora) return "";
    const [h, m] = hora.split(":").map(Number);
    let endH = h + 1;
    let endM = m;
    if (endH >= 24) { endH = 23; endM = 59; } // Límite seguro
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const fechaMin = useMemo(() => getFechaMinLocal(), []);

  // ── Handlers ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "horaInicio") updated.horaFin = autoCompletarFin(value);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Validación adicional antes de enviar
      if (!form.idPaciente || !form.idSede || !form.idConsultorio || 
          !form.idOdontologo || !form.fecha || !form.horaInicio) {
        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Por favor complete todos los campos obligatorios",
          confirmButtonColor: "#0e71cd"
        });
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        idPaciente: Number(form.idPaciente),
        idOdontologo: Number(form.idOdontologo),
        idConsultorio: Number(form.idConsultorio),
        idSede: Number(form.idSede),
        // ✅ Usar fecha en formato YYYY-MM-DD sin timezone shift
        fecha: form.fecha, 
        fechaRegistro: new Date().toISOString(),
        registradoPor: Number(localStorage.getItem("id_usuario")) 
      };

      await api.post("/citas", payload);

      Swal.fire({
        icon: "success",
        title: "¡Cita Guardada!",
        text: "La cita se ha registrado correctamente en el sistema.",
        confirmButtonColor: "#0e71cd"
      });

      navigate(-1);
    } catch (error) {
      console.error("Error al crear cita:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Hubo un problema al crear la cita.",
        confirmButtonColor: "#dc2626"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
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
          --radius:20px;--radius-sm:14px;--radius-xs:10px;
          --transition:all 0.3s cubic-bezier(0.16,1,0.3,1)
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
        
        /* ── CONTENIDO PRINCIPAL ── */
        .dash-content{
          padding:clamp(2rem,5vw,3rem);
          max-width:900px;
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
        
        .btn-back{
          display:inline-flex;align-items:center;gap:0.4rem;
          padding:0.5rem 0.9rem;
          background:var(--surface-100);border:1px solid var(--border);
          border-radius:10px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:500;
          color:var(--text-500);text-decoration:none;cursor:pointer;
          transition:var(--transition);margin-bottom:1.5rem
        }
        .btn-back:hover{background:var(--primary-50);border-color:var(--primary-100);color:var(--primary-600);transform:translateX(-3px)}
        
        /* ── FORMULARIO ELEGANTE ── */
        .form-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow-lg);
          padding:2rem;animation:fadeInUp 0.5s ease 0.2s both;
          position:relative;overflow:hidden
        }
        .form-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:4px;
          background:linear-gradient(90deg,var(--primary-100),var(--primary-600),var(--accent));
          opacity:0.8
        }
        
        .form-section{margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px dashed var(--border-light)}
        .form-section:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
        .form-section-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.1rem;font-weight:600;color:var(--text-elegant);
          margin-bottom:1.25rem;display:flex;align-items:center;gap:0.5rem
        }
        
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem}
        .form-row:last-child{margin-bottom:0}
        .form-group{display:flex;flex-direction:column;gap:0.5rem}
        .form-label{
          font-family:'Manrope',sans-serif;
          font-size:0.85rem;font-weight:600;color:var(--text-elegant);
          display:flex;align-items:center;gap:0.4rem
        }
        .form-label svg{color:var(--text-400)}
        .form-label.required::after{content:'*';color:var(--danger);margin-left:2px}
        
        .form-input,.form-select,.form-textarea{
          width:100%;padding:0.9rem 1.1rem;
          border:1.5px solid var(--border);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;
          color:var(--text-elegant);background:var(--surface);
          transition:var(--transition);outline:none
        }
        .form-input:focus,.form-select:focus,.form-textarea:focus{
          border-color:var(--primary-600);
          box-shadow:0 0 0 4px rgba(14,113,205,0.15);
          background:var(--surface-100)
        }
        .form-input:disabled,.form-select:disabled{
          background:var(--surface-100);color:var(--text-400);cursor:not-allowed
        }
        .form-textarea{min-height:80px;resize:vertical}
        .form-select option:disabled{color:var(--text-400)}
        
        /* Hint de disponibilidad */
        .availability-hint{
          font-family:'Manrope',sans-serif;
          font-size:0.8rem;color:var(--primary-600);
          background:var(--primary-50);padding:0.7rem 1rem;
          border-radius:10px;display:inline-flex;align-items:center;gap:0.5rem;
          margin-bottom:0.75rem;border:1px solid var(--primary-100);
          animation:fadeIn 0.3s ease
        }
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        
        /* Acciones */
        .form-actions{
          display:flex;gap:0.75rem;margin-top:2rem;
          padding-top:1.5rem;border-top:1px solid var(--border-light)
        }
        .btn-submit{
          flex:1;padding:1rem 1.5rem;
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff;border:none;border-radius:14px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;font-weight:600;
          cursor:pointer;transition:var(--transition);
          display:flex;align-items:center;justify-content:center;gap:0.5rem;
          box-shadow:0 4px 16px rgba(14,113,205,0.25);position:relative;overflow:hidden
        }
        .btn-submit::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-submit:hover::before{left:100%}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(14,113,205,0.35)}
        .btn-submit:disabled{opacity:0.7;cursor:not-allowed;transform:none;box-shadow:none}
        
        .btn-cancel{
          flex:0;padding:1rem 1.5rem;
          background:var(--surface-100);color:var(--text-500);
          border:1.5px solid var(--border);border-radius:14px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;font-weight:600;
          cursor:pointer;transition:var(--transition)
        }
        .btn-cancel:hover{background:var(--danger);border-color:var(--danger);color:#fff;transform:translateY(-2px)}
        
        /* Footer */
        .dash-footer{text-align:center;padding:1.5rem;color:var(--text-400);font-family:'Manrope',sans-serif;font-size:0.83rem}
        .dash-footer a{color:var(--primary-600);text-decoration:none;font-weight:500}
        .dash-footer a:hover{text-decoration:underline}
        
        @media(max-width:700px){
          .form-row{grid-template-columns:1fr}
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
          .page-title{font-size:1.5rem}
          .form-actions{flex-direction:column}
          .form-card{padding:1.5rem}
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
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Registrar Nueva Cita
            </h1>
            <p className="page-subtitle">Complete los datos para agendar una consulta dental</p>
          </div>

          <button onClick={() => navigate(-1)} className="btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver al Dashboard
          </button>

          <form onSubmit={handleSubmit} className="form-card">
            {/* SECCIÓN 1: PACIENTE */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Información del Paciente
              </h3>
              <div className="form-group">
                <label className="form-label required">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  Seleccionar Paciente
                </label>
                <select name="idPaciente" value={form.idPaciente} onChange={handleChange} className="form-select" required>
                  <option value="">Seleccione al paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.idPaciente} value={p.idPaciente}>
                      {p.nombres} {p.apellidos} (DNI: {p.dni})
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* SECCIÓN 2: UBICACIÓN */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Ubicación
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11"/></svg>
                    Sede
                  </label>
                  <select name="idSede" value={form.idSede} onChange={handleChange} className="form-select" required>
                    <option value="">Elija Sede...</option>
                    {sedes.map(s => <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14"/></svg>
                    Consultorio
                  </label>
                  <select name="idConsultorio" value={form.idConsultorio} onChange={handleChange} className="form-select" required disabled={!form.idSede}>
                    <option value="">{form.idSede ? "Elija Consultorio..." : "Primero seleccione sede"}</option>
                    {consultorios.map(c => <option key={c.idConsultorio} value={c.idConsultorio}>{c.nombreConsultorio}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* SECCIÓN 3: PROFESIONAL Y FECHA */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profesional y Fecha
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Odontólogo
                  </label>
                  <select name="idOdontologo" value={form.idOdontologo} onChange={handleChange} className="form-select" required>
                    <option value="">Especialista...</option>
                    {odontologos.map(o => (
                      <option key={o.idOdontologo} value={o.idOdontologo}>
                        Dr. {o.usuario?.nombres || o.nombres} {o.usuario?.apellidos || ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Fecha
                  </label>
                  <input 
                    type="date" 
                    name="fecha" 
                    value={form.fecha} 
                    onChange={handleChange} 
                    className="form-input" 
                    required 
                    min={fechaMin} 
                  />
                </div>
              </div>
            </section>

            {/* SECCIÓN 4: HORARIO */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Horario de Atención
              </h3>
              <p className="availability-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {!form.idOdontologo || !form.fecha 
                  ? "Seleccione odontólogo y fecha para ver horas disponibles" 
                  : `Horarios disponibles para ${formatearFechaParaDisplay(form.fecha)}`}
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Hora de Inicio
                  </label>
                  <select name="horaInicio" value={form.horaInicio} onChange={handleChange} className="form-select" required disabled={!horasDisponibles.length}>
                    <option value="">--:--</option>
                    {horasDisponibles
                      .filter(h => h.hora?.endsWith(":00"))
                      .map((h, i) => {
                        const [hora] = h.hora.split(":");
                        const horaFin = String(Number(hora) + 1).padStart(2, "0") + ":00";
                        return (
                          <option key={i} value={h.hora} disabled={h.ocupada}>
                            {h.hora} - {horaFin} {h.ocupada ? "❌ Ocupado" : "✅ Disponible"}
                          </option>
                        );
                      })}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Hora de Fin (automático)
                  </label>
                  <input type="time" name="horaFin" value={form.horaFin} readOnly className="form-input" disabled />
                </div>
              </div>
            </section>

            {/* SECCIÓN 5: DETALLES */}
            <section className="form-section">
              <h3 className="form-section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Detalles de la Cita
              </h3>
              <div className="form-group">
                <label className="form-label required">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Motivo del Servicio
                </label>
                <input type="text" name="motivo" value={form.motivo} onChange={handleChange} className="form-input" required placeholder="Ej: Profilaxis dental, Dolor agudo, Consulta de rutina..." />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Notas Adicionales
                </label>
                <textarea name="observaciones" value={form.observaciones} onChange={handleChange} className="form-textarea" rows="3" placeholder="Información adicional para el odontólogo (alergias, condiciones especiales, etc.)..." />
              </div>
            </section>

            {/* ACCIONES */}
            <div className="form-actions">
              <button type="button" onClick={() => navigate(-1)} className="btn-cancel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? (
                  <><span style={{width:18,height:18,border:'2px solid rgba(255,255,255,0.35)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}></span> Registrando...</>
                ) : (
                  <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/><circle cx="12" cy="12" r="10"/></svg> Crear Cita Directa</>
                )}
              </button>
            </div>
          </form>
        </main>

        {/* ── FOOTER ── */}
        <footer className="dash-footer">
          <p>¿Necesitas ayuda? <Link to="/soporte">Contacta a soporte técnico</Link></p>
        </footer>
      </div>
    </>
  );
}