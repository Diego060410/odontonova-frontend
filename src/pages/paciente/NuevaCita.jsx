import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { crearCita } from "../../services/citaService";
import { listarConsultorios } from "../../services/consultorioService";
import { listarOdontologosPorConsultorio } from "../../services/odontologoService";
import { listarSedes } from "../../services/sedeService";
import { getPacienteByUsuario } from "../../services/pacienteService";
import { obtenerDisponibilidad } from "../../services/disponibilidadService";
import { crearPago } from "../../services/pagoService";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

/* ================= ICONOS SVG ================= */
const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="22.01"/>
    <line x1="15" y1="22" x2="15" y2="22.01"/><line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ================= COMPONENTE ================= */
export default function NuevaCita() {
  const navigate = useNavigate();

  const [sedes, setSedes] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [odontologos, setOdontologos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [idPaciente, setIdPaciente] = useState(null);
  
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [montoPago, setMontoPago] = useState(30);
  
  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  const [form, setForm] = useState({
    fecha: "", horaInicio: "", horaFin: "", motivo: "", observaciones: "",
    idSede: "", idConsultorio: "", idOdontologo: "", idEstadoCita: 1
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

  useEffect(() => {
    const init = async () => {
      const idUsuario = localStorage.getItem("id_usuario");
      const paciente = await getPacienteByUsuario(idUsuario);
      if (paciente) setIdPaciente(paciente.idPaciente);
      
      const sedesRes = await listarSedes();
      setSedes(sedesRes.data || sedesRes);
    };
    init();
  }, []);

  useEffect(() => {
    const cargarHoras = async () => {
      if (!form.idOdontologo || !form.fecha) {
        setHorasDisponibles([]);
        return;
      }
      try {
        const res = await obtenerDisponibilidad(form.idOdontologo, form.fecha);
        setHorasDisponibles(res.data || res);
      } catch (err) {
        console.error("Error cargando disponibilidad", err);
        setHorasDisponibles([]);
      }
    };
    cargarHoras();
  }, [form.idOdontologo, form.fecha]);

  const cargarConsultorios = async (idSede) => {
    if (!idSede) return setConsultorios([]);
    const res = await listarConsultorios();
    const data = res.data || res;
    setConsultorios(data.filter(c => String(c.idSede ?? c.sede?.idSede) === String(idSede)));
  };

  const cargarOdontologosPorConsultorio = async (idConsultorio) => {
    if (!idConsultorio) { setOdontologos([]); return; }
    try {
      const res = await listarOdontologosPorConsultorio(idConsultorio);
      setOdontologos(res.data || []);
    } catch (error) {
      console.error("Error cargando odontólogos", error);
      setOdontologos([]);
    }
  };

  const sumarUnaHora = (hora) => {
    if (!hora || !hora.includes(":")) return "";
    const [h, m] = hora.split(":");
    const date = new Date();
    date.setHours(Number(h) + 1, Number(m));
    return date.toTimeString().slice(0, 5);
  };

  const esHoraPasada = (hora) => {
    if (!form.fecha) return false;
    const ahora = new Date();
    const [year, month, day] = form.fecha.split("-").map(Number);
    const fechaSeleccionada = new Date(year, month - 1, day);
    const esHoy = fechaSeleccionada.getDate() === ahora.getDate() &&
                  fechaSeleccionada.getMonth() === ahora.getMonth() &&
                  fechaSeleccionada.getFullYear() === ahora.getFullYear();
    if (!esHoy) return false;
    const [h, m] = hora.split(":").map(Number);
    const horaCita = new Date();
    horaCita.setHours(h, m, 0, 0);
    return horaCita <= ahora;
  };

  // ✅ CORRECCIÓN DEFINITIVA: Formateo de fecha SIN timezone issues
  const formatFecha = (fechaString) => {
    if (!fechaString) return "";
    const [year, month, day] = fechaString.split('-').map(Number);
    
    // Crear fecha en UTC para evitar offset del navegador
    const date = new Date(Date.UTC(year, month - 1, day));
    
    // Arrays para formateo manual en español
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const diaSemana = dias[date.getUTCDay()];
    const mes = meses[date.getUTCMonth()];
    
    return `${diaSemana}, ${day} de ${mes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "horaInicio") updated.horaFin = sumarUnaHora(value);
      return updated;
    });
    if (name === "idSede") {
      setForm(prev => ({ ...prev, idConsultorio: "", idOdontologo: "" }));
      cargarConsultorios(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idPaciente) return alert("Paciente no encontrado");
    if (!form.fecha || !form.horaInicio) return alert("Complete fecha y hora");
    if (!form.idSede || !form.idConsultorio || !form.idOdontologo) {
      return alert("Seleccione sede, consultorio y odontólogo");
    }
    setMostrarPago(true);
  };

  const pagarConYape = () => setMostrarQR(true);

  const finalizarReserva = async (metodoPago) => {
    try {
      setLoading(true);
      const citaRes = await crearCita({
        ...form, fechaRegistro: new Date().toISOString(),
        idPaciente: Number(idPaciente), idConsultorio: Number(form.idConsultorio),
        idOdontologo: Number(form.idOdontologo), idSede: Number(form.idSede),
        registradoPor: Number(localStorage.getItem("id_usuario"))
      });
      const citaData = citaRes.data || citaRes;
      const token = localStorage.getItem("token");
      await fetch("http://localhost:8080/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ monto: montoPago, metodoPago, estado: "PAGADO", idCita: citaData.idCita })
      });
      alert("✅ Cita registrada. Verificaremos tu pago de Yape.");
      setMostrarPago(false);
      navigate("/paciente/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error al registrar la cita");
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fechaMin = useMemo(() => new Date().toISOString().split('T')[0], []);

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
        body{font-family:'Manrope',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;background:var(--surface-50)}
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
        
        .dash-content{padding:clamp(2rem,5vw,3rem);max-width:800px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
        
        .page-header{margin-bottom:2rem}
        .page-title{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.01em;display:flex;align-items:center;gap:0.75rem}
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
        
        /* Formulario elegante */
        .form-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          padding:1.75rem;animation:fadeInUp 0.5s ease 0.2s both
        }
        .form-section{margin-bottom:1.75rem;padding-bottom:1.5rem;border-bottom:1px dashed var(--border-light)}
        .form-section:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
        .form-section-title{
          font-family:'Manrope',sans-serif;
          font-size:0.78rem;font-weight:600;color:var(--text-500);
          text-transform:uppercase;letter-spacing:0.08em;
          margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem
        }
        
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem}
        .form-row:last-child{margin-bottom:0}
        .form-group{display:flex;flex-direction:column;gap:0.4rem}
        .form-label{
          font-family:'Manrope',sans-serif;
          font-size:0.85rem;font-weight:500;color:var(--text-elegant);
          display:flex;align-items:center;gap:0.4rem
        }
        .form-label svg{color:var(--text-400)}
        
        .form-input,.form-select,.form-textarea{
          width:100%;padding:0.85rem 1rem;
          border:1.5px solid var(--border);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;
          color:var(--text-elegant);background:var(--surface);
          transition:var(--transition);outline:none
        }
        .form-input:focus,.form-select:focus,.form-textarea:focus{
          border-color:var(--primary-600);
          box-shadow:0 0 0 4px rgba(30,64,175,0.1);
          background:var(--surface-100)
        }
        .form-input:disabled,.form-select:disabled{
          background:var(--surface-100);color:var(--text-400);cursor:not-allowed
        }
        .form-textarea{min-height:70px;resize:vertical}
        
        /* Cards de selección */
        .selection-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0.85rem}
        .selection-card{
          display:flex;align-items:center;gap:0.75rem;
          padding:1rem;border:2px solid var(--border);
          border-radius:14px;background:var(--surface);
          cursor:pointer;transition:var(--transition);
          position:relative;overflow:hidden
        }
        .selection-card:hover{
          border-color:var(--primary-100);
          transform:translateY(-3px);
          box-shadow:var(--shadow-lg)
        }
        .selection-card.selected{
          border-color:var(--primary-600);
          background:linear-gradient(135deg,var(--primary-50),var(--surface));
          box-shadow:0 0 0 3px rgba(30,64,175,0.15)
        }
        .selection-card::after{
          content:'';position:absolute;top:0;left:0;right:0;bottom:0;
          background:linear-gradient(135deg,transparent,rgba(30,64,175,0.03));
          opacity:0;transition:var(--transition);pointer-events:none
        }
        .selection-card:hover::after{opacity:1}
        
        .selection-icon{
          width:38px;height:38px;border-radius:10px;
          background:var(--surface-100);
          display:flex;align-items:center;justify-content:center;
          color:var(--text-500);flex-shrink:0;transition:var(--transition)
        }
        .selection-card.selected .selection-icon{
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff
        }
        .selection-content{flex:1;min-width:0}
        .selection-title{
          font-family:'Manrope',sans-serif;
          font-size:0.9rem;font-weight:600;color:var(--text-elegant);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis
        }
        .selection-subtitle{
          font-family:'Manrope',sans-serif;
          font-size:0.78rem;color:var(--text-500)
        }
        .selection-badge{
          width:24px;height:24px;border-radius:50%;
          background:var(--primary-600);color:#fff;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;opacity:0;transform:scale(0.8);transition:var(--transition)
        }
        .selection-card.selected .selection-badge{opacity:1;transform:scale(1)}
        
        .empty-state{
          padding:1.5rem;text-align:center;
          background:var(--surface-100);border-radius:12px;
          border:2px dashed var(--border);color:var(--text-400);
          font-family:'Manrope',sans-serif;font-size:0.9rem
        }
        
        /* Horas disponibles */
        .time-hint{
          font-family:'Manrope',sans-serif;
          font-size:0.8rem;color:var(--primary-600);
          background:var(--primary-50);padding:0.6rem 1rem;
          border-radius:10px;display:inline-flex;align-items:center;gap:0.4rem;
          margin-bottom:0.75rem;border:1px solid var(--primary-100)
        }
        .time-select{
          width:100%;padding:0.85rem 1rem;
          border:2px solid var(--success);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;
          color:var(--text-elegant);background:var(--surface);
          transition:var(--transition);outline:none;cursor:pointer
        }
        .time-select:disabled{
          border-color:var(--border);background:var(--surface-100);
          color:var(--text-400);cursor:not-allowed
        }
        .time-select option:disabled{color:var(--text-400);background:var(--surface-100)}
        
        /* Botón submit */
        .btn-submit{
          width:100%;padding:1rem 1.5rem;
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff;border:none;border-radius:14px;
          font-family:'Manrope',sans-serif;font-size:0.95rem;font-weight:600;
          cursor:pointer;transition:var(--transition);
          display:flex;align-items:center;justify-content:center;gap:0.5rem;
          box-shadow:0 4px 16px rgba(30,64,175,0.25);position:relative;overflow:hidden
        }
        .btn-submit::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-submit:hover::before{left:100%}
        .btn-submit:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(30,64,175,0.35)}
        .btn-submit:disabled{opacity:0.7;cursor:not-allowed;transform:none;box-shadow:none}
        .btn-submit .spinner{
          width:18px;height:18px;border:2px solid rgba(255,255,255,0.35);
          border-top-color:#fff;border-radius:50%;
          animation:spin 0.8s linear infinite
        }
        @keyframes spin{to{transform:rotate(360deg)}}
        
        /* Modal de pago */
        .modal-overlay{
          position:fixed;top:0;left:0;right:0;bottom:0;
          background:rgba(15,23,42,0.6);backdrop-filter:blur(8px);
          display:flex;align-items:center;justify-content:center;
          z-index:1000;animation:fadeIn 0.2s ease
        }
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .modal-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow-lg),var(--shadow-glow);
          padding:2rem;max-width:420px;width:90%;
          animation:modalSlide 0.3s ease;position:relative
        }
        @keyframes modalSlide{from{opacity:0;transform:translateY(20px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .modal-close{
          position:absolute;top:1rem;right:1rem;
          width:32px;height:32px;border-radius:8px;
          background:var(--surface-100);border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;
          color:var(--text-500);cursor:pointer;transition:var(--transition)
        }
        .modal-close:hover{background:var(--danger);border-color:var(--danger);color:#fff}
        .modal-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.4rem;font-weight:600;color:var(--text-elegant);
          margin-bottom:0.5rem;text-align:center
        }
        .modal-subtitle{
          text-align:center;color:var(--text-500);
          font-family:'Manrope',sans-serif;font-size:0.9rem;
          margin-bottom:1.5rem
        }
        .payment-methods{display:flex;flex-direction:column;gap:0.85rem}
        .payment-btn{
          display:flex;align-items:center;justify-content:center;gap:0.6rem;
          padding:0.9rem 1.2rem;border:none;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.9rem;font-weight:600;
          cursor:pointer;transition:var(--transition);position:relative;overflow:hidden
        }
        .payment-btn::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .payment-btn:hover::before{left:100%}
        .paypal-btn{
          background:linear-gradient(135deg,#0070ba,#009cde);color:#fff;
          box-shadow:0 4px 16px rgba(0,112,186,0.25)
        }
        .paypal-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,112,186,0.35)}
        .yape-btn{
          background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;
          box-shadow:0 4px 16px rgba(124,58,237,0.25)
        }
        .yape-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(124,58,237,0.35)}
        
        /* Modal QR Yape */
        .qr-modal{
          text-align:center;padding:1.5rem
        }
        .qr-placeholder{
          width:180px;height:180px;margin:0 auto 1.25rem;
          background:linear-gradient(135deg,var(--surface-100),var(--surface));
          border:2px dashed var(--border);border-radius:16px;
          display:flex;align-items:center;justify-content:center;
          color:var(--text-400);font-size:3rem
        }
        .qr-instructions{
          font-family:'Manrope',sans-serif;font-size:0.9rem;
          color:var(--text-500);margin-bottom:1.25rem;line-height:1.5
        }
        .qr-actions{display:flex;gap:0.75rem}
        .btn-qr-secondary{
          flex:1;padding:0.75rem;border:1.5px solid var(--border);
          border-radius:12px;background:var(--surface);
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          color:var(--text-500);cursor:pointer;transition:var(--transition)
        }
        .btn-qr-secondary:hover{border-color:var(--primary-600);color:var(--primary-600);background:var(--primary-50)}
        .btn-qr-primary{
          flex:1;padding:0.75rem;border:none;border-radius:12px;
          background:linear-gradient(135deg,var(--success),#15803d);
          color:#fff;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          cursor:pointer;transition:var(--transition);box-shadow:0 4px 14px rgba(22,163,74,0.25)
        }
        .btn-qr-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(22,163,74,0.35)}
        
        /* Alertas */
        .alert{
          background:#fef2f2;border:1px solid #fecaca;
          color:#dc2626;padding:0.85rem 1.25rem;
          border-radius:12px;font-family:'Manrope',sans-serif;
          font-size:0.9rem;font-weight:500;margin-bottom:1.5rem;
          display:flex;align-items:center;gap:0.5rem
        }
        
        @media(max-width:700px){
          .form-row{grid-template-columns:1fr}
          .selection-grid{grid-template-columns:1fr}
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
          .page-title{font-size:1.5rem}
          .modal-card{padding:1.5rem;width:95%}
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
            <Link to="/paciente/perfil" className="btn-action btn-profile" title="Mi Perfil">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
            <span className="topbar-badge">Paciente</span>
            <button onClick={handleLogout} className="btn-action btn-logout" title="Cerrar Sesión">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </nav>
        </header>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="dash-content">
          <button onClick={() => navigate("/paciente/dashboard")} className="btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver al Dashboard
          </button>

          <div className="page-header">
            <h1 className="page-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Nueva Cita
            </h1>
            <p className="page-subtitle">Agenda tu consulta en segundos</p>
          </div>

          {!idPaciente && <div className="alert">⚠️ No hay paciente vinculado a tu cuenta</div>}

          <form onSubmit={handleSubmit} className="form-card">
            {/* INFORMACIÓN BÁSICA */}
            <section className="form-section">
              <h3 className="form-section-title">
                <CalendarIcon /> Información de la cita
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Fecha
                  </label>
                  <input type="date" name="fecha" value={form.fecha} onChange={handleChange} 
                    className="form-input" required min={fechaMin} />
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo de consulta</label>
                  <input type="text" name="motivo" placeholder="Ej. Revisión general, dolor de muela..." 
                    value={form.motivo} onChange={handleChange} className="form-input" required />
                </div>
              </div>
            </section>

            {/* SEDES */}
            <section className="form-section">
              <h3 className="form-section-title">
                <BuildingIcon /> Selecciona tu Sede
              </h3>
              <div className="selection-grid">
                {sedes.map(s => (
                  <div key={s.idSede} onClick={() => {
                      setForm(prev => ({...prev, idSede: s.idSede, idConsultorio: "", idOdontologo: ""}));
                      setOdontologos([]);
                      cargarConsultorios(s.idSede);
                    }}
                    className={`selection-card ${form.idSede == s.idSede ? 'selected' : ''}`}>
                    <div className="selection-icon"><BuildingIcon /></div>
                    <div className="selection-content">
                      <div className="selection-title">{s.nombreSede}</div>
                      <div className="selection-subtitle">{s.direccion || 'Ver detalles'}</div>
                    </div>
                    <div className="selection-badge"><CheckIcon /></div>
                  </div>
                ))}
              </div>
            </section>

            {/* CONSULTORIOS */}
            <section className="form-section">
              <h3 className="form-section-title">
                <LocationIcon /> Consultorio
              </h3>
              {!form.idSede ? (
                <div className="empty-state">Selecciona una sede primero</div>
              ) : (
                <div className="selection-grid">
                  {consultorios.map(c => (
                    <div key={c.idConsultorio} onClick={() => {
                        setForm(prev => ({...prev, idConsultorio: c.idConsultorio, idOdontologo: ""}));
                        cargarOdontologosPorConsultorio(c.idConsultorio);
                      }}
                      className={`selection-card ${form.idConsultorio == c.idConsultorio ? 'selected' : ''}`}>
                      <div className="selection-icon"><LocationIcon /></div>
                      <div className="selection-content">
                        <div className="selection-title">{c.nombreConsultorio}</div>
                        <div className="selection-subtitle">{c.piso ? `Piso ${c.piso}` : ''}</div>
                      </div>
                      <div className="selection-badge"><CheckIcon /></div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ODONTÓLOGOS */}
            <section className="form-section">
              <h3 className="form-section-title">
                <UserIcon /> Odontólogo
              </h3>
              {!form.idConsultorio ? (
                <div className="empty-state">Selecciona un consultorio primero</div>
              ) : odontologos.length === 0 ? (
                <div className="empty-state">No hay odontólogos disponibles en este consultorio</div>
              ) : (
                <div className="selection-grid">
                  {odontologos.map(o => {
                    const isSelected = form.idOdontologo == o.idOdontologo;
                    return (
                      <div key={o.idOdontologo} onClick={() => setForm(prev => ({...prev, idOdontologo: o.idOdontologo}))}
                        className={`selection-card ${isSelected ? 'selected' : ''}`}>
                        <div className="selection-icon"><UserIcon /></div>
                        <div className="selection-content">
                          <div className="selection-title">Dr. {o.usuario?.nombres}</div>
                          <div className="selection-subtitle">{o.especialidad?.nombreEspecialidad || "General"}</div>
                        </div>
                        <div className="selection-badge"><CheckIcon /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* HORAS DISPONIBLES - ✅ FECHA CORREGIDA SIN TIMEZONE ISSUES */}
            <section className="form-section">
              <h3 className="form-section-title">
                <ClockIcon /> Horario Disponible
              </h3>
              <div className="form-group">
                <p className="time-hint">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {!form.idOdontologo || !form.fecha 
                    ? "Selecciona fecha y odontólogo para ver horas disponibles" 
                    : `Disponibilidad para ${formatFecha(form.fecha)}`}
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <ClockIcon /> Hora de inicio
                    </label>
                    <select name="horaInicio" value={form.horaInicio} onChange={handleChange}
                      className={`form-select ${form.horaInicio && horasDisponibles.find(h => h.hora === form.horaInicio)?.ocupada ? 'border-red-400' : ''}`}
                      disabled={horasDisponibles.length === 0} required>
                      <option value="">
                        {horasDisponibles.length > 0 ? "Seleccionar hora" : "Cargando disponibilidad..."}
                      </option>
                      {horasDisponibles.filter(item => {
                        if (esHoraPasada(item.hora)) return false;
                        const minutos = item.hora.split(":")[1];
                        return minutos === "00";
                      }).map((item) => {
                        const horaFin = sumarUnaHora(item.hora);
                        return (
                          <option key={item.hora} value={item.hora} disabled={item.ocupada}>
                            {item.ocupada 
                              ? `❌ ${item.hora} - ${horaFin} Ocupado` 
                              : `✅ ${item.hora} - ${horaFin} Disponible`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <ClockIcon /> Hora fin (estimada)
                    </label>
                    <input type="time" name="horaFin" value={form.horaFin} readOnly 
                      className="form-input" disabled />
                  </div>
                </div>
              </div>
            </section>

            {/* OBSERVACIONES */}
            <section className="form-section">
              <div className="form-group">
                <label className="form-label">Observaciones adicionales</label>
                <textarea name="observaciones" placeholder="Detalles adicionales sobre tu consulta..." 
                  value={form.observaciones} onChange={handleChange} 
                  className="form-textarea" rows="2" />
              </div>
            </section>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? <><span className="spinner"></span> Procesando...</> : "✅ Confirmar y Pagar Cita"}
            </button>
          </form>
        </main>
      </div>

      {/* ── MODAL DE PAGO ── */}
      {mostrarPago && !mostrarQR && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setMostrarPago(false)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setMostrarPago(false)}>
              <XIcon />
            </button>
            <h2 className="modal-title">💳 Método de Pago</h2>
            <p className="modal-subtitle">Total a pagar: <strong style={{color:'var(--primary-600)'}}>S/ {montoPago}</strong></p>
            
            <div className="payment-methods">
              <PayPalScriptProvider options={{
                "client-id": "AUTga9HneLY49lx5K5c5i7PYP9ZvhL0haAB2wnS0dxgfzL11RpB0DaklvouR7_GlsO7z01U5EQINZy9h",
                currency: "USD", intent: "capture", vault: false
              }}>
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", label: "paypal" }}
                  createOrder={(data, actions) => actions.order.create({
                    purchase_units: [{ amount: { value: montoPago.toFixed(2) } }]
                  })}
                  onApprove={async (data) => {
                    try {
                      setLoading(true);
                      const response = await fetch(`http://localhost:8080/api/paypal/capture/${data.orderID}`, { method: "POST" });
                      if (!response.ok) throw new Error("Error en la captura de PayPal");
                      const result = await response.json();
                      
                      const citaRes = await crearCita({
                        ...form, idPaciente: Number(idPaciente), idConsultorio: Number(form.idConsultorio),
                        idOdontologo: Number(form.idOdontologo), idSede: Number(form.idSede),
                        registradoPor: Number(localStorage.getItem("id_usuario")),
                        fechaRegistro: new Date().toISOString()
                      });
                      const citaData = citaRes.data || citaRes;
                      
                      await crearPago({
                        idCita: Number(citaData.idCita), monto: Number(montoPago),
                        metodo: "PAYPAL", transaccionId: result.id
                      });
                      
                      alert("✅ Cita y pago registrados correctamente");
                      setMostrarPago(false);
                      navigate("/paciente/dashboard");
                    } catch (err) {
                      console.error("ERROR:", err);
                      alert(err.response?.data || "Hubo un problema al procesar la cita.");
                    } finally { setLoading(false); }
                  }}
                  onCancel={() => alert("Pago cancelado")}
                  onError={(err) => alert("Error con PayPal")}
                />
              </PayPalScriptProvider>
              
              <button onClick={pagarConYape} className="payment-btn yape-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>
                📱 Pagar con Yape
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL QR YAPE ── */}
      {mostrarQR && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setMostrarQR(false)}>
          <div className="modal-card">
            <button className="modal-close" onClick={() => setMostrarQR(false)}><XIcon /></button>
            <div className="qr-modal">
              <h2 className="modal-title">📱 Pagar con Yape</h2>
              <div className="qr-placeholder">🔲</div>
              <p className="qr-instructions">
                <strong>Pasos:</strong><br/>
                1. Abre tu app Yape<br/>
                2. Escanea el código QR<br/>
                3. Confirma el pago de S/ {montoPago}<br/>
                4. Regresa a esta pantalla
              </p>
              <div className="qr-actions">
                <button className="btn-qr-secondary" onClick={() => setMostrarQR(false)}>Cancelar</button>
                <button className="btn-qr-primary" onClick={() => finalizarReserva("YAPE")}>
                  ✅ Ya realicé el pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}