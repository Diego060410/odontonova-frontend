import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import horarioService from "../../services/horarioService";
import { listarSedes } from "../../services/sedeService";
import { listarConsultorios } from "../../services/consultorioService";

export default function HorarioForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // ── Estados ──
  const [sedes, setSedes] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [consultoriosFiltrados, setConsultoriosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  const [form, setForm] = useState({
    fecha: "",
    horaInicio: "08:00",
    horaFin: "12:00",
    idSede: "",
    idConsultorio: ""
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

  // ── Carga de datos iniciales ──
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoading(true);

        const sedesRes = await listarSedes();
        const dataSedes = sedesRes.data || sedesRes;
        setSedes(dataSedes);

        const consultoriosRes = await listarConsultorios();
        const dataConsultorios = consultoriosRes.data || consultoriosRes;
        setConsultorios(dataConsultorios);

        if (id) {
          const horarioExistente = await horarioService.obtenerPorId(id);
          setForm({
            fecha: horarioExistente.fecha,
            horaInicio: horarioExistente.horaInicio?.substring(0, 5) || "08:00",
            horaFin: horarioExistente.horaFin?.substring(0, 5) || "12:00",
            idSede: horarioExistente.sede?.idSede || "",
            idConsultorio: horarioExistente.consultorio?.idConsultorio || ""
          });
        } else if (dataSedes?.length > 0) {
          setForm(prev => ({ ...prev, idSede: dataSedes[0].idSede }));
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, [id]);

  // ── Filtrar consultorios por sede seleccionada ──
  useEffect(() => {
    if (!form.idSede) {
      setConsultoriosFiltrados([]);
      return;
    }
    const filtrados = consultorios.filter(
      c => String(c.sede?.idSede) === String(form.idSede)
    );
    setConsultoriosFiltrados(filtrados);
  }, [form.idSede, consultorios]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("id_usuario");
    localStorage.removeItem("id_odontologo");
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const idOdontologo = localStorage.getItem("id_odontologo");

    if (!idOdontologo) {
      alert("❌ Error: No se encontró tu perfil.");
      return;
    }

    try {
      setSubmitting(true);
      
      const obtenerNombreDia = (fechaString) => {
        const dias = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
        const [year, month, day] = fechaString.split('-').map(Number);
        const fechaObj = new Date(year, month - 1, day);
        return dias[fechaObj.getDay()];
      };

      const asegurarSegundos = (time) => {
        if (!time) return "00:00:00";
        return time.length === 5 ? `${time}:00` : time;
      };

      const datosHorario = {
        idOdontologo: Number(idOdontologo),
        idSede: Number(form.idSede),
        idConsultorio: Number(form.idConsultorio),
        fecha: form.fecha,
        diaSemana: obtenerNombreDia(form.fecha),
        horaInicio: asegurarSegundos(form.horaInicio),
        horaFin: asegurarSegundos(form.horaFin),
        estado: true
      };

      if (id) {
        await horarioService.actualizar(id, datosHorario);
        alert("✅ Horario actualizado correctamente");
      } else {
        await horarioService.crear(datosHorario);
        alert("✅ Horario guardado correctamente");
      }
      navigate("/odontologo/horario");

    } catch (error) {
      const mensajeError = error.response?.data?.message || "Error al procesar";
      alert(`❌ Error: ${mensajeError}`);
    } finally {
      setSubmitting(false);
    }
  };

  const fechaActual = useMemo(() => new Date().toISOString().split("T")[0], []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ width: 52, height: 52, border: "3px solid #e5e7eb", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando formulario...</p>
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
        .btn-action{display:flex;align-items:center;gap:0.55rem;padding:0.65rem 1.35rem;border-radius:14px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent;position:relative;overflow:hidden}
        .btn-action::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);transition:left 0.5s ease}
        .btn-action:hover::before{left:100%}
        .btn-profile{background:linear-gradient(135deg,#eff6ff,#dbeafe);color:var(--primary-600);border-color:#bfdbfe;box-shadow:0 4px 16px rgba(30,64,175,0.08)}
        .btn-profile:hover{background:linear-gradient(135deg,#dbeafe,#bfdbfe);border-color:var(--primary-600);transform:translateY(-3px);box-shadow:0 8px 28px rgba(30,64,175,0.15)}
        .btn-logout{background:linear-gradient(135deg,#fff1f2,#ffe4e6);color:var(--danger);border-color:#fecdd3;box-shadow:0 4px 16px rgba(220,38,38,0.08)}
        .btn-logout:hover{background:linear-gradient(135deg,#ffe4e6,#fecdd3);border-color:var(--danger);transform:translateY(-3px);box-shadow:0 8px 28px rgba(220,38,38,0.15)}
        .topbar-badge{background:linear-gradient(135deg,var(--primary-100),#bfdbfe);border:1px solid #93c5fd;color:var(--primary-600);font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;letter-spacing:0.08em;text-transform:uppercase;padding:0.4rem 0.95rem;border-radius:100px}
        
        .dash-content{padding:clamp(2rem,5vw,3rem);max-width:700px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        
        .form-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);padding:2rem;margin-top:1.5rem;animation:fadeInUp 0.5s ease both}
        .form-header{display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid var(--border-light)}
        .form-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.01em}
        .form-subtitle{font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-500)}
        
        .form-group{margin-bottom:1.25rem}
        .form-label{display:block;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.5rem;letter-spacing:0.02em}
        .form-label.required::after{content:'*';color:var(--danger);margin-left:3px}
        
        .form-input,.form-select{
          width:100%;
          padding:0.85rem 1rem;
          border:1.5px solid var(--border);
          border-radius:12px;
          font-family:'Manrope',sans-serif;
          font-size:0.95rem;
          color:var(--text-elegant);
          background:var(--surface);
          transition:var(--transition);
          outline:none
        }
        .form-input:focus,.form-select:focus{
          border-color:var(--primary-600);
          box-shadow:0 0 0 4px rgba(30,64,175,0.1);
          background:var(--surface-100)
        }
        .form-input::placeholder{color:var(--text-400)}
        
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        
        .btn-submit{
          width:100%;
          padding:0.95rem 1.5rem;
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff;
          border:none;
          border-radius:14px;
          font-family:'Manrope',sans-serif;
          font-size:0.95rem;
          font-weight:600;
          cursor:pointer;
          transition:var(--transition);
          position:relative;
          overflow:hidden;
          margin-top:0.5rem;
          box-shadow:0 4px 16px rgba(30,64,175,0.25)
        }
        .btn-submit::before{
          content:'';
          position:absolute;
          top:0;left:-100%;
          width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-submit:hover::before{left:100%}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(30,64,175,0.35)}
        .btn-submit:active{transform:translateY(0)}
        .btn-submit:disabled{opacity:0.7;cursor:not-allowed;transform:none}
        
        .btn-back{
          display:inline-flex;
          align-items:center;
          gap:0.4rem;
          padding:0.5rem 0.9rem;
          background:var(--surface-100);
          border:1px solid var(--border);
          border-radius:10px;
          font-family:'Manrope',sans-serif;
          font-size:0.85rem;
          font-weight:500;
          color:var(--text-500);
          text-decoration:none;
          cursor:pointer;
          transition:var(--transition);
          margin-bottom:1rem
        }
        .btn-back:hover{background:var(--primary-50);border-color:var(--primary-100);color:var(--primary-600);transform:translateX(-3px)}
        
        .select-empty{color:var(--text-400)}
        .select-disabled{background:var(--surface-100);color:var(--text-400);cursor:not-allowed}
        
        @media(max-width:600px){
          .form-row{grid-template-columns:1fr}
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
          .form-card{padding:1.5rem}
          .form-title{font-size:1.3rem}
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

        {/* ── CONTENIDO DEL FORMULARIO ── */}
        <main className="dash-content">
          <button onClick={() => navigate("/odontologo/horario")} className="btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver a la Lista
          </button>

          <div className="form-card">
            <div className="form-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div>
                <h1 className="form-title">{id ? "Editar Horario" : "Registrar Nuevo Horario"}</h1>
                <p className="form-subtitle">Configura tu disponibilidad de atención</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* SEDE */}
              <div className="form-group">
                <label className="form-label required">Sede</label>
                <select 
                  className="form-select" 
                  value={form.idSede} 
                  onChange={(e) => setForm({...form, idSede: e.target.value, idConsultorio: ""})} 
                  required
                >
                  <option value="" className="select-empty">Seleccione una sede</option>
                  {sedes.map(s => (
                    <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>
                  ))}
                </select>
              </div>

              {/* CONSULTORIO */}
              <div className="form-group">
                <label className="form-label required">Consultorio</label>
                <select
                  className={`form-select ${!form.idSede ? 'select-disabled' : ''}`}
                  value={form.idConsultorio}
                  onChange={(e) => setForm({...form, idConsultorio: e.target.value})}
                  required
                  disabled={!form.idSede}
                >
                  <option value="" className="select-empty">
                    {form.idSede ? "Seleccione consultorio" : "Primero seleccione una sede"}
                  </option>
                  {consultoriosFiltrados.map(c => (
                    <option key={c.idConsultorio} value={c.idConsultorio}>
                      {c.nombreConsultorio}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* FECHA */}
              <div className="form-group">
                <label className="form-label required">Fecha de Atención</label>
                <input 
                  type="date"
                  min={fechaActual}
                  className="form-input"
                  value={form.fecha}
                  onChange={(e) => setForm({...form, fecha: e.target.value})}
                  required
                />
              </div>

              {/* HORAS */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Hora Inicio</label>
                  <input type="time" className="form-input" value={form.horaInicio} onChange={(e) => setForm({...form, horaInicio: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Hora Fin</label>
                  <input type="time" className="form-input" value={form.horaFin} onChange={(e) => setForm({...form, horaFin: e.target.value})} required />
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={submitting || !form.idConsultorio}>
                {submitting ? (
                  <span style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <span style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
                    Procesando...
                  </span>
                ) : (
                  <>{id ? "Actualizar Horario" : "Guardar Horario"}</>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}