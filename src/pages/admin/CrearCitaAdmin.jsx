import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Swal from "sweetalert2";

export default function CrearCitaAdmin() {
  const navigate = useNavigate();
  
  // ── Estados principales ──
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados para typing animation del logo (aislados) ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  // Listas para selectores
  const [pacientes, setPacientes] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [odontologos, setOdontologos] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]);

  // Estado del formulario unificado
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

  // ── Efecto de Typing Animation (100% aislado, reutilizable) ──
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

  // ── 1. Carga inicial de datos ──
  useEffect(() => {
    const cargarBase = async () => {
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
        console.error("Error cargando datos iniciales", err);
      }
    };
    cargarBase();
  }, []);

  // ── 2. Cargar Consultorios cuando cambie la Sede ──
  useEffect(() => {
    if (form.idSede) {
      api.get("/consultorios")
        .then(res => {
          const filtrados = res.data?.filter?.(c => 
            String(c.idSede ?? c.sede?.idSede) === String(form.idSede)
          ) || [];
          setConsultorios(filtrados);
          // Resetear consultorio si la sede cambia
          if (form.idConsultorio && !filtrados.find(c => c.idConsultorio == form.idConsultorio)) {
            setForm(prev => ({ ...prev, idConsultorio: "" }));
          }
        })
        .catch(() => setConsultorios([]));
    } else {
      setConsultorios([]);
      setForm(prev => ({ ...prev, idConsultorio: "" }));
    }
  }, [form.idSede]);

  // ── 3. Cargar Disponibilidad cuando cambie Odontólogo o Fecha ──
  useEffect(() => {
    if (form.idOdontologo && form.fecha) {
      api.get(`/disponibilidad?odontologo=${form.idOdontologo}&fecha=${form.fecha}`)
        .then(res => setHorasDisponibles(res.data || []))
        .catch(() => setHorasDisponibles([]));
    } else {
      setHorasDisponibles([]);
    }
  }, [form.idOdontologo, form.fecha]);

  // ── Cierre de dropdowns al clickear fuera ──
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.dropdown')) setMenuOpen(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "horaInicio" && value) {
        updated.horaFin = sumarUnaHora(value);
      }
      return updated;
    });
    // Limpiar error del campo al modificar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const sumarUnaHora = (hora) => {
    if (!hora) return "";
    const [h, m] = hora.split(":");
    const date = new Date();
    date.setHours(Number(h) + 1, Number(m), 0, 0);
    return date.toTimeString().slice(0, 5);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.idPaciente) newErrors.idPaciente = "Selecciona un paciente";
    if (!form.idSede) newErrors.idSede = "Selecciona una sede";
    if (!form.idConsultorio) newErrors.idConsultorio = "Selecciona un consultorio";
    if (!form.idOdontologo) newErrors.idOdontologo = "Selecciona un odontólogo";
    if (!form.fecha) newErrors.fecha = "Selecciona una fecha";
    if (!form.horaInicio) newErrors.horaInicio = "Selecciona una hora";
    if (!form.motivo?.trim()) newErrors.motivo = "Ingresa el motivo";
    else if (form.motivo.length < 3) newErrors.motivo = "Mínimo 3 caracteres";
    
    // Validar que la fecha no sea pasada
    if (form.fecha && new Date(form.fecha) < new Date(new Date().setHours(0,0,0,0))) {
      newErrors.fecha = "La fecha no puede ser anterior a hoy";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = document.querySelector('.cca-input.error, .cca-select.error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        fecha: form.fecha,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        motivo: form.motivo.trim(),
        observaciones: form.observaciones?.trim() || "",
        idPaciente: Number(form.idPaciente),
        idOdontologo: Number(form.idOdontologo),
        idConsultorio: Number(form.idConsultorio),
        idSede: Number(form.idSede),
        idEstadoCita: form.idEstadoCita,
        fechaRegistro: new Date().toISOString(),
        registradoPor: Number(localStorage.getItem("id_usuario") || 1)
      };

      await api.post("/citas", payload);

      Swal.fire({
        icon: "success",
        title: "✅ Cita Registrada",
        text: "La cita se creó correctamente sin necesidad de pago previo.",
        confirmButtonColor: "#1e40af",
        background: "#fff",
        color: "#1e293b",
        fontFamily: "'Manrope', sans-serif"
      });

      navigate("/admin/citas");
    } catch (error) {
      console.error("Error creando cita:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No se pudo crear la cita",
        confirmButtonColor: "#dc2626",
        background: "#fff",
        color: "#1e293b",
        fontFamily: "'Manrope', sans-serif"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // ── Datos para menús del topbar ──
  const navModules = useMemo(() => [
    { to: "/admin/usuarios", label: "Usuarios", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { to: "/admin/odontologos", label: "Odontólogos", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> },
    { to: "/admin/pacientes", label: "Pacientes", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { to: "/admin/citas", label: "Citas", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { to: "/admin/sedes", label: "Sedes", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { to: "/admin/consultorios", label: "Consultorios", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { to: "/admin/especialidades", label: "Especialidades", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  ], []);

  const quickCreate = useMemo(() => [
    { to: "/admin/crear-usuario", label: "Nuevo Usuario", accent: "#6366f1" },
    { to: "/admin/crear-odontologo", label: "Nuevo Odontólogo", accent: "#1e40af" },
    { to: "/admin/crear-cita", label: "Nueva Cita", accent: "#db2777" },
    { to: "/admin/crear-sede", label: "Nueva Sede", accent: "#059669" },
    { to: "/admin/crear-consultorio", label: "Nuevo Consultorio", accent: "#d97706" },
    { to: "/admin/crear-especialidad", label: "Nueva Especialidad", accent: "#0891b2" },
  ], []);

  // Helper para formatear nombre de odontólogo
  const getOdontologoName = (o) => {
    const nombre = o.usuario?.nombres || o.nombres || "";
    const apellido = o.usuario?.apellidos || o.apellidos || "";
    return `Dr. ${nombre} ${apellido}`.trim();
  };

  // Helper para formatear nombre de paciente
  const getPacienteName = (p) => {
    return `${p.nombres || ""} ${p.apellidos || ""}`.trim();
  };

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
        .cca-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%);background-attachment:fixed}
        
        /* ── TOPBAR ELEGANTE ── */
        .cca-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow);animation:slideDown 0.5s ease}
        @keyframes slideDown{from{opacity:0;transform:translateY(-24px)}to{opacity:1;transform:translateY(0)}}
        .topbar-brand{display:flex;align-items:center;gap:1rem;cursor:pointer;transition:var(--transition)}
        .topbar-brand:hover{transform:scale(1.01)}
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2.5rem;font-weight:500;font-style:italic;color:var(--text-elegant);letter-spacing:0.02em;line-height:1.1;display:flex;align-items:baseline;min-width:0}
        
        /* ── Typing Animation (Aislado) ── */
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
        .dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:260px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg),var(--shadow-glow);padding:0.75rem;opacity:0;visibility:hidden;transform:translateY(-10px) scale(0.98);transition:var(--transition);z-index:101;animation:menuElegant 0.25s ease forwards}
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
        
        /* ── CONTENT ── */
        .cca-content{padding:clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,3rem);max-width:900px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── HEADER DE PÁGINA ── */
        .cca-header{margin-bottom:2rem;animation:fadeInUp 0.5s ease 0.2s both;text-align:center}
        .cca-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);margin-bottom:0.75rem;display:flex;align-items:center;justify-content:center;gap:0.6rem}
        .cca-eyebrow::before,.cca-eyebrow::after{content:'';width:32px;height:1px;background:linear-gradient(90deg,transparent,var(--primary-600));border-radius:1px;opacity:0.6}
        .cca-eyebrow::after{background:linear-gradient(90deg,var(--primary-600),transparent)}
        .cca-title{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.02em;line-height:1.15;margin-bottom:0.5rem}
        .cca-subtitle{font-family:'Manrope',sans-serif;font-size:0.95rem;color:var(--text-500);font-weight:400}
        
        /* ── ACTION BUTTONS ── */
        .cca-actions{display:flex;justify-content:center;margin-bottom:2rem}
        .btn-dashboard{
          display:inline-flex;align-items:center;gap:0.5rem;
          padding:0.7rem 1.25rem;
          background:linear-gradient(135deg,var(--text-elegant),#0f172a);
          color:#fff;border:none;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          cursor:pointer;transition:var(--transition);
          box-shadow:0 4px 16px rgba(15,23,42,0.2);
          text-decoration:none
        }
        .btn-dashboard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,0.3)}
        .btn-dashboard svg{transition:transform 0.2s}
        .btn-dashboard:hover svg{transform:translateX(-2px)}
        
        /* ── FORM CARD ── */
        .cca-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          padding:2rem;animation:fadeInUp 0.5s ease 0.3s both
        }
        .cca-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
        .cca-form-group{display:flex;flex-direction:column;gap:0.4rem}
        .cca-form-group.full{grid-column:1/-1}
        .cca-label{
          font-family:'Manrope',sans-serif;font-size:0.8rem;font-weight:600;
          color:var(--text-elegant);display:flex;align-items:center;gap:0.35rem
        }
        .cca-label .required{color:var(--danger);font-size:1rem;line-height:1}
        .cca-label .hint{
          font-family:'Manrope',sans-serif;font-size:0.7rem;font-weight:400;
          color:var(--text-400);margin-left:auto;font-style:italic
        }
        .cca-select,.cca-input,.cca-textarea{
          width:100%;padding:0.85rem 1.1rem;
          background:var(--surface-100);border:1.5px solid var(--border-light);
          border-radius:12px;font-family:'Manrope',sans-serif;
          font-size:0.9rem;color:var(--text-elegant);outline:none;
          transition:var(--transition);appearance:none
        }
        .cca-select{
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat:no-repeat;background-position:right 1rem center;background-size:16px
        }
        .cca-select::-ms-expand{display:none}
        .cca-select:focus,.cca-input:focus,.cca-textarea:focus{
          border-color:var(--primary-600);
          box-shadow:0 0 0 4px rgba(30,64,175,0.12);
          background:var(--surface)
        }
        .cca-select:disabled,.cca-input:disabled,.cca-textarea:disabled{
          background:var(--surface-50);color:var(--text-400);cursor:not-allowed
        }
        .cca-select.error,.cca-input.error,.cca-textarea.error{
          border-color:var(--danger);animation:shake 0.3s ease
        }
        .cca-select.error:focus,.cca-input.error:focus,.cca-textarea.error:focus{
          box-shadow:0 0 0 4px rgba(220,38,38,0.12)
        }
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        .cca-error{font-family:'Manrope',sans-serif;font-size:0.72rem;color:var(--danger);font-weight:500;padding-left:0.3rem}
        .cca-hint{font-family:'Manrope',sans-serif;font-size:0.72rem;color:var(--text-400);padding-left:0.3rem;display:flex;align-items:center;gap:0.3rem}
        .cca-hint svg{flex-shrink:0;color:var(--primary-600)}
        .cca-textarea{min-height:80px;resize:vertical;line-height:1.5}
        
        /* ── SELECT OPTIONS STYLING ── */
        .cca-select option:disabled{color:var(--text-400);font-style:italic}
        .cca-select option[data-ocupada="true"]{color:var(--danger)}
        .cca-select option[data-ocupada="false"]{color:var(--success)}
        
        /* ── BUTTONS ── */
        .cca-btn-group{display:flex;gap:0.75rem;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border-light)}
        .btn-cancel{
          flex:1;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;
          padding:0.85rem 1.25rem;background:var(--surface-100);color:var(--text-elegant);
          border:1.5px solid var(--border-light);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;
          cursor:pointer;transition:var(--transition);text-decoration:none
        }
        .btn-cancel:hover{background:var(--surface);border-color:var(--primary-600);color:var(--primary-600);transform:translateY(-2px)}
        .btn-submit{
          flex:1.5;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;
          padding:0.85rem 1.25rem;background:linear-gradient(135deg,var(--success),#047857);
          color:#fff;border:none;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;
          cursor:pointer;transition:var(--transition);text-decoration:none;position:relative;overflow:hidden
        }
        .btn-submit::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-submit:hover::before{left:100%}
        .btn-submit:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(5,150,105,0.35);filter:brightness(1.05)}
        .btn-submit:active{transform:translateY(0)}
        .btn-submit:disabled{background:var(--text-400);cursor:not-allowed;transform:none;box-shadow:none}
        .btn-submit:disabled::before{display:none}
        
        /* ── LOADING OVERLAY ── */
        .loading-overlay{
          position:fixed;inset:0;background:rgba(255,255,255,0.92);
          backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;
          z-index:200;animation:fadeIn 0.2s ease
        }
        .loading-card{
          background:var(--surface);border-radius:var(--radius-sm);
          padding:2rem 3rem;display:flex;flex-direction:column;align-items:center;gap:1rem;
          box-shadow:var(--shadow-lg),var(--shadow-glow);animation:scaleIn 0.3s ease
        }
        @keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        .loading-spinner{width:48px;height:48px;border:3px solid var(--border-light);border-top-color:var(--success);border-radius:50%;animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading-text{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--text-elegant);font-style:italic;font-weight:500}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        
        /* ── INFO CARD ── */
        .info-card{
          margin-top:1.5rem;padding:1.25rem 1.5rem;
          background:linear-gradient(135deg,#f0fdf4,#fff);
          border:1px solid #bbf7d0;border-radius:16px;
          display:flex;gap:0.85rem;align-items:flex-start;
          animation:fadeInUp 0.5s ease 0.4s both
        }
        .info-card-icon{
          width:32px;height:32px;background:linear-gradient(135deg,var(--success),#059669);
          border-radius:10px;display:flex;align-items:center;justify-content:center;
          color:#fff;flex-shrink:0
        }
        .info-card-title{font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.25rem}
        .info-card-desc{font-family:'Manrope',sans-serif;font-size:0.8rem;color:var(--text-500);line-height:1.5}
        
        /* ── RESPONSIVE ── */
        @media(max-width:900px){
          .topbar-nav{gap:0.15rem}.dropdown-menu{min-width:220px;right:-10px}.btn-action{padding:0.55rem 1rem;font-size:0.83rem}
          .cca-title{font-size:1.6rem}.cca-form-grid{grid-template-columns:1fr}
        }
        @media(max-width:600px){
          .topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}
          .cca-title{font-size:1.4rem}.cca-btn-group{flex-direction:column}.btn-cancel,.btn-submit{width:100%}
        }
      `}</style>

      <div className="cca-root">

        {/* ── TOPBAR CON TYPING ANIMATION ── */}
        <header className="cca-topbar">
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
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'modules' ? null : 'modules'); }} aria-haspopup="true" aria-expanded={menuOpen === 'modules'}>
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

            {/* Dropdown: Creación */}
            <div className={`dropdown ${menuOpen === 'create' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'create' ? null : 'create'); }} aria-haspopup="true" aria-expanded={menuOpen === 'create'}>
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
        <main className="cca-content">

          {/* Header de Página */}
          <div className="cca-header">
            <p className="cca-eyebrow">Gestión de agenda</p>
            <h1 className="cca-title">Nueva Cita</h1>
            <p className="cca-subtitle">Programa una cita directa desde el panel administrativo</p>
          </div>

          {/* Botón Volver al Dashboard */}
          <div className="cca-actions">
            <button onClick={() => navigate("/admin/citas")} className="btn-dashboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver a Citas
            </button>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="cca-card">
            <div className="cca-form-grid">
              
              {/* Paciente */}
              <div className="cca-form-group full">
                <label className="cca-label" htmlFor="idPaciente">
                  Paciente <span className="required">*</span>
                </label>
                <select
                  id="idPaciente"
                  name="idPaciente"
                  className={`cca-select ${errors.idPaciente ? 'error' : ''}`}
                  value={form.idPaciente}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un paciente...</option>
                  {pacientes.length === 0 ? (
                    <option disabled>Cargando pacientes...</option>
                  ) : (
                    pacientes.map(p => (
                      <option key={p.idPaciente} value={p.idPaciente}>
                        {getPacienteName(p)} {p.documentoIdentidad ? `• ${p.documentoIdentidad}` : ''}
                      </option>
                    ))
                  )}
                </select>
                {errors.idPaciente && <span className="cca-error">{errors.idPaciente}</span>}
              </div>

              {/* Sede */}
              <div className="cca-form-group">
                <label className="cca-label" htmlFor="idSede">
                  Sede <span className="required">*</span>
                </label>
                <select
                  id="idSede"
                  name="idSede"
                  className={`cca-select ${errors.idSede ? 'error' : ''}`}
                  value={form.idSede}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione sede...</option>
                  {sedes.length === 0 ? (
                    <option disabled>Cargando sedes...</option>
                  ) : (
                    sedes.map(s => (
                      <option key={s.idSede} value={s.idSede}>{s.nombreSede}</option>
                    ))
                  )}
                </select>
                {errors.idSede && <span className="cca-error">{errors.idSede}</span>}
              </div>

              {/* Consultorio */}
              <div className="cca-form-group">
                <label className="cca-label" htmlFor="idConsultorio">
                  Consultorio <span className="required">*</span>
                </label>
                <select
                  id="idConsultorio"
                  name="idConsultorio"
                  className={`cca-select ${errors.idConsultorio ? 'error' : ''}`}
                  value={form.idConsultorio}
                  onChange={handleChange}
                  required
                  disabled={!form.idSede}
                >
                  <option value="">
                    {form.idSede ? "Seleccione consultorio..." : "Primero elija sede"}
                  </option>
                  {consultorios.length === 0 && form.idSede ? (
                    <option disabled>No hay consultorios en esta sede</option>
                  ) : (
                    consultorios.map(c => (
                      <option key={c.idConsultorio} value={c.idConsultorio}>
                        {c.nombreConsultorio}
                      </option>
                    ))
                  )}
                </select>
                {errors.idConsultorio && <span className="cca-error">{errors.idConsultorio}</span>}
              </div>

              {/* Odontólogo */}
              <div className="cca-form-group">
                <label className="cca-label" htmlFor="idOdontologo">
                  Odontólogo <span className="required">*</span>
                </label>
                <select
                  id="idOdontologo"
                  name="idOdontologo"
                  className={`cca-select ${errors.idOdontologo ? 'error' : ''}`}
                  value={form.idOdontologo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione odontólogo...</option>
                  {odontologos.length === 0 ? (
                    <option disabled>Cargando odontólogos...</option>
                  ) : (
                    odontologos.map(o => (
                      <option key={o.idOdontologo} value={o.idOdontologo}>
                        {getOdontologoName(o)}
                      </option>
                    ))
                  )}
                </select>
                {errors.idOdontologo && <span className="cca-error">{errors.idOdontologo}</span>}
              </div>

              {/* Fecha */}
              <div className="cca-form-group">
                <label className="cca-label" htmlFor="fecha">
                  Fecha <span className="required">*</span>
                  <span className="hint">Mín. hoy</span>
                </label>
                <input
                  id="fecha"
                  type="date"
                  name="fecha"
                  className={`cca-input ${errors.fecha ? 'error' : ''}`}
                  value={form.fecha}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.fecha && <span className="cca-error">{errors.fecha}</span>}
              </div>

              {/* Hora Inicio */}
              <div className="cca-form-group">
                <label className="cca-label" htmlFor="horaInicio">
                  Hora Inicio <span className="required">*</span>
                </label>
                <select
                  id="horaInicio"
                  name="horaInicio"
                  className={`cca-select ${errors.horaInicio ? 'error' : ''}`}
                  value={form.horaInicio}
                  onChange={handleChange}
                  required
                  disabled={!form.idOdontologo || !form.fecha || !horasDisponibles.length}
                >
                  <option value="">
                    {!form.idOdontologo || !form.fecha 
                      ? "Primero seleccione odontólogo y fecha" 
                      : horasDisponibles.length === 0 
                        ? "Cargando horarios..." 
                        : "Elegir hora..."}
                  </option>
                  {horasDisponibles
                    .filter(h => h.hora?.endsWith(":00"))
                    .map((h, i) => {
                      const [hora] = h.hora.split(":");
                      const horaFin = String(Number(hora) + 1).padStart(2, "0") + ":00";
                      return (
                        <option
                          key={i}
                          value={h.hora}
                          disabled={h.ocupada}
                          data-ocupada={h.ocupada}
                        >
                          {h.hora} - {horaFin} {h.ocupada ? "❌ Ocupado" : "✅ Disponible"}
                        </option>
                      );
                    })}
                </select>
                {errors.horaInicio && <span className="cca-error">{errors.horaInicio}</span>}
                {!form.idOdontologo || !form.fecha ? (
                  <span className="cca-hint">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Seleccione odontólogo y fecha para ver disponibilidad
                  </span>
                ) : horasDisponibles.length === 0 ? (
                  <span className="cca-hint" style={{color:'var(--warning)'}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    No hay horarios disponibles para esta fecha
                  </span>
                ) : null}
              </div>

              {/* Hora Fin (Auto) */}
              <div className="cca-form-group">
                <label className="cca-label" htmlFor="horaFin">
                  Hora Fin <span className="hint">Automático</span>
                </label>
                <input
                  id="horaFin"
                  type="time"
                  name="horaFin"
                  className="cca-input"
                  value={form.horaFin}
                  readOnly
                  style={{ backgroundColor: "var(--surface-50)", cursor: "not-allowed" }}
                />
                <span className="cca-hint">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                  Se calcula automáticamente (+1 hora)
                </span>
              </div>

              {/* Motivo */}
              <div className="cca-form-group full">
                <label className="cca-label" htmlFor="motivo">
                  Motivo de la cita <span className="required">*</span>
                </label>
                <input
                  id="motivo"
                  type="text"
                  name="motivo"
                  className={`cca-input ${errors.motivo ? 'error' : ''}`}
                  value={form.motivo}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Curación de muela, Limpieza dental, Consulta de rutina..."
                />
                {errors.motivo && <span className="cca-error">{errors.motivo}</span>}
              </div>

              {/* Observaciones */}
              <div className="cca-form-group full">
                <label className="cca-label" htmlFor="observaciones">
                  Observaciones Internas
                </label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  className="cca-textarea"
                  value={form.observaciones}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Notas adicionales para el odontólogo o recepcionista..."
                />
                <span className="cca-hint">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Estas notas son visibles solo para el personal administrativo
                </span>
              </div>

            </div>

            {/* Botones de Acción */}
            <div className="cca-btn-group">
              <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:'spin 1s linear infinite'}}><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                    Registrando...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Confirmar Cita Directa
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Card */}
          <div className="info-card">
            <div className="info-card-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <div>
              <p className="info-card-title">Cita administrativa</p>
              <p className="info-card-desc">
                Al crear una cita desde este panel, se registra directamente sin requerir confirmación ni pago previo. 
                El paciente recibirá una notificación con los detalles de su cita.
              </p>
            </div>
          </div>

        </main>

        {/* ── Loading Overlay ── */}
        {loading && (
          <div className="loading-overlay" role="status" aria-live="polite">
            <div className="loading-card">
              <div className="loading-spinner" />
              <span className="loading-text">Registrando cita...</span>
            </div>
          </div>
        )}

      </div>
    </>
  );
}