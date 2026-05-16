import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import citaService from "../../services/citaService";
import { getPacienteByUsuario } from "../../services/pacienteService";
import { getUsuarioById } from "../../services/usuarioService";
import { listarOdontologos } from "../../services/odontologoService";
import { listarConsultorios } from "../../services/consultorioService";
import { listarSedes } from "../../services/sedeService";

export default function MisCitas() {
  const navigate = useNavigate();

  // ── Estados ──
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState(null);
  const [filtro, setFiltro] = useState("todas"); // "todas" | "proximas" | "pasadas" | "canceladas" | "completadas"
  const [busqueda, setBusqueda] = useState("");
  
  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  /* ========================= 🧠 HELPERS ========================= */

  const getEstado = (c) => {
    let estado =
      c.estadoCita?.nombreEstado ||
      c.estado?.nombre ||
      c.estado ||
      (c.idEstadoCita === 1 && "Pendiente") ||
      (c.idEstadoCita === 2 && "Confirmada") ||
      (c.idEstadoCita === 3 && "Cancelada") ||
      "";
    return estado.toString().trim().toLowerCase();
  };

  const citaYaPaso = (cita) => {
    if (!cita.fecha || !cita.horaInicio) return false;
    const [year, month, day] = cita.fecha.split("-").map(Number);
    const [hour, minute] = cita.horaInicio.split(":").map(Number);
    const fechaHoraCita = new Date(year, month - 1, day, hour, minute);
    return fechaHoraCita < new Date();
  };

  // ✅ CORRECCIÓN: Formateo de fecha SIN timezone issues
  const formatFecha = (fechaString) => {
    if (!fechaString) return "-";
    const [year, month, day] = fechaString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${dias[date.getUTCDay()]}, ${day} de ${meses[date.getUTCMonth()]}`;
  };

  const formatHora = (hora) => hora?.substring(0, 5) || "--:--";

  const estadoStyle = (estado) => {
    const map = {
      pendiente:  { bg: "#fffbeb", color: "#d97706", border: "#fcd34d", text: "Pendiente" },
      confirmada: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac", text: "Confirmada" },
      cancelada:  { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5", text: "Cancelada" },
      completada: { bg: "#eff6ff", color: "#1e40af", border: "#93c5fd", text: "Completada" },
    };
    return map[estado] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0", text: estado };
  };

  /* ========================= 🔥 CARGAR ========================= */

  const cargarCitas = async () => {
    try {
      setLoading(true);
      setError("");

      const idUsuario = Number(localStorage.getItem("id_usuario"));
      if (!idUsuario) throw new Error("No hay usuario logueado");

      const paciente = await getPacienteByUsuario(idUsuario);
      if (!paciente?.idPaciente) throw new Error("No existe paciente");

      const citasData = await citaService.getMisCitas(paciente.idPaciente);
      const odontologos = (await listarOdontologos())?.data || [];
      const consultorios = (await listarConsultorios())?.data || [];
      const sedes = (await listarSedes())?.data || [];
      const usuariosCache = {};

      const citasFinal = await Promise.all(
        (citasData || []).map(async (c) => {
          const odontologo = odontologos.find(
            (o) => Number(o.idOdontologo) === Number(c.idOdontologo)
          );
          let usuarioOdontologo = null;
          if (odontologo?.idUsuario) {
            if (!usuariosCache[odontologo.idUsuario]) {
              try {
                usuariosCache[odontologo.idUsuario] = await getUsuarioById(odontologo.idUsuario);
              } catch { usuariosCache[odontologo.idUsuario] = null; }
            }
            usuarioOdontologo = usuariosCache[odontologo.idUsuario];
          }
          if (!usuarioOdontologo && c.odontologo?.usuario) {
            usuarioOdontologo = c.odontologo.usuario;
          }
          const consultorio = consultorios.find(
            (co) => Number(co.idConsultorio) === Number(c.idConsultorio)
          );
          const sede = sedes.find((s) => Number(s.idSede) === Number(c.idSede));
          return {
            ...c,
            odontologo: odontologo ? { ...odontologo, usuario: usuarioOdontologo } : c.odontologo || null,
            consultorio: consultorio || c.consultorio || null,
            sede: sede || c.sede || null,
          };
        })
      );

      citasFinal.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setCitas(citasFinal);

    } catch (err) {
      console.error(err);
      setError(err.message || "Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  /* ========================= ❌ CANCELAR ========================= */

  const handleCancelar = async (cita) => {
    const [year, month, day] = cita.fecha.split("-").map(Number);
    const [hour, minute] = cita.horaInicio.split(":").map(Number);
    const fechaHoraCita = new Date(year, month - 1, day, hour, minute);
    const ahora = new Date();
    const diferenciaHoras = (fechaHoraCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diferenciaHoras < 48) {
      alert("❌ No puedes cancelar una cita con menos de 48 horas de anticipación.");
      return;
    }

    const confirmar = window.confirm("¿Seguro que deseas cancelar esta cita?");
    if (!confirmar) return;

    setCancelando(cita.idCita);
    try {
      const citaActualizada = await citaService.cancelarCita(cita.idCita);
      setCitas((prev) =>
        prev.map((c) => (c.idCita === cita.idCita ? { ...c, ...citaActualizada } : c))
      );
       alert(
          "✅ Cita cancelada correctamente.\n\n💰 Para el desembolso o devolución correspondiente, por favor acérquese a la clínica."
        );
    } catch (err) {
      console.error("ERROR CANCELANDO:", err);
      const mensaje = err.response?.data?.message || err.response?.data || err.message || "Error al cancelar la cita";
      alert(mensaje);
    } finally {
      setCancelando(null);
    }
  };

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
    const startBlink = () => { cursorTimer = setInterval(() => setCursorVisible(v => !v), 530); };
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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => { cargarCitas(); }, []);

  // ── Filtro de citas + Búsqueda ──
  const citasFiltradas = useMemo(() => {
    let resultado = citas.filter(c => {
      const estadoOriginal = getEstado(c);
      const yaPaso = citaYaPaso(c);
      
      // Filtro por categoría
      if (filtro === "todas") return true;
      if (filtro === "proximas") return !yaPaso && estadoOriginal !== "cancelada";
      if (filtro === "pasadas") return yaPaso && estadoOriginal !== "cancelada";
      if (filtro === "canceladas") return estadoOriginal === "cancelada";
      if (filtro === "completadas") return yaPaso && estadoOriginal !== "cancelada";
      return true;
    });

    // Filtro por búsqueda (odontólogo, motivo, sede, consultorio)
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      resultado = resultado.filter(c => {
        const odontologo = c.odontologo?.usuario 
          ? `${c.odontologo.usuario.nombres} ${c.odontologo.usuario.apellidos || ""}`.toLowerCase()
          : "";
        const motivo = (c.motivo || "").toLowerCase();
        const sede = (c.sede?.nombre || c.sede?.nombreSede || "").toLowerCase();
        const consultorio = (c.consultorio?.nombreConsultorio || "").toLowerCase();
        
        return odontologo.includes(term) || 
               motivo.includes(term) || 
               sede.includes(term) || 
               consultorio.includes(term);
      });
    }

    return resultado;
  }, [citas, filtro, busqueda]);

  // ── Contadores para badges ──
  const conteos = useMemo(() => {
    return {
      todas: citas.length,
      proximas: citas.filter(c => !citaYaPaso(c) && getEstado(c) !== "cancelada").length,
      pasadas: citas.filter(c => citaYaPaso(c) && getEstado(c) !== "cancelada").length,
      canceladas: citas.filter(c => getEstado(c) === "cancelada").length,
      completadas: citas.filter(c => citaYaPaso(c) && getEstado(c) !== "cancelada").length,
    };
  }, [citas]);

  /* ========================= 🎨 UI ========================= */

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ width: 52, height: 52, border: "3px solid #e5e7eb", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando citas...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-root">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          :root{--primary:#1e40af;--primary-600:#2563eb;--surface:#ffffff;--border:#e2e8f0;--text:#0f172a;--text-500:#64748b;--danger:#dc2626;--shadow:0 4px 20px rgba(0,0,0,0.04);--radius:20px;--transition:all 0.3s cubic-bezier(0.16,1,0.3,1)}
          body{font-family:'Manrope',system-ui,sans-serif;background:#fafafa}
          .error-card{max-width:500px;margin:4rem auto;padding:2rem;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);box-shadow:var(--shadow);text-align:center}
          .error-icon{font-size:3rem;margin-bottom:1rem;display:block}
          .error-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:600;color:var(--danger);margin-bottom:0.5rem}
          .error-text{color:var(--text-500);margin-bottom:1.5rem}
          .btn-retry{background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff;padding:0.7rem 1.5rem;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-weight:600;cursor:pointer;transition:var(--transition)}
          .btn-retry:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(30,64,175,0.25)}
        `}</style>
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <p className="error-title">Error de conexión</p>
          <p className="error-text">{error}</p>
          <button className="btn-retry" onClick={() => window.location.reload()}>🔄 Reintentar</button>
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
          --radius:20px;--radius-sm:14px;--transition:all 0.3s cubic-bezier(0.16,1,0.3,1)
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
        
        .dash-content{padding:clamp(2rem,5vw,3rem);max-width:900px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
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
        
        /* Barra de búsqueda */
        .search-box{
          position:relative;margin-bottom:1.5rem
        }
        .search-input{
          width:100%;padding:0.85rem 1rem 0.85rem 2.8rem;
          border:1.5px solid var(--border);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.9rem;
          color:var(--text-elegant);background:var(--surface);
          transition:var(--transition);outline:none
        }
        .search-input:focus{
          border-color:var(--primary-600);
          box-shadow:0 0 0 4px rgba(30,64,175,0.1);
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
        
        /* Tabs de filtro */
        .filter-tabs{
          display:flex;gap:0.4rem;margin-bottom:2rem;
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
          box-shadow:0 4px 12px rgba(30,64,175,0.25)
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
        
        /* Tarjeta de cita */
        .cita-card{
          background:var(--surface);border-radius:var(--radius-sm);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          padding:1.25rem 1.5rem;margin-bottom:1rem;
          transition:var(--transition);position:relative;overflow:hidden
        }
        .cita-card:hover{
          transform:translateY(-3px);box-shadow:var(--shadow-lg);
          border-color:var(--primary-100)
        }
        .cita-card::before{
          content:'';position:absolute;left:0;top:0;bottom:0;
          width:4px;background:var(--primary-600);
          border-radius:4px 0 0 4px;transition:var(--transition)
        }
        .cita-card.cancelada::before{background:var(--danger)}
        .cita-card.completada::before{background:var(--success)}
        .cita-card:hover::before{width:5px;box-shadow:0 0 12px currentColor}
        
        .cita-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
        .cita-odontologo{
          display:flex;align-items:center;gap:0.75rem;
          font-family:'Cormorant Garamond',serif;
          font-size:1.05rem;font-weight:600;color:var(--text-elegant)
        }
        .cita-odontologo-icon{
          width:34px;height:34px;border-radius:9px;
          background:linear-gradient(135deg,var(--primary-50),#dbeafe);
          display:flex;align-items:center;justify-content:center;
          color:var(--primary-600);flex-shrink:0
        }
        .cita-status{
          font-family:'Manrope',sans-serif;font-size:0.73rem;font-weight:600;
          padding:0.3rem 0.8rem;border-radius:100px;
          text-transform:uppercase;letter-spacing:0.05em;border:1px solid
        }
        
        .cita-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.85rem}
        .cita-detail{display:flex;flex-direction:column;gap:0.25rem}
        .cita-label{
          font-family:'Manrope',sans-serif;font-size:0.75rem;
          color:var(--text-500);font-weight:500
        }
        .cita-value{
          font-family:'Manrope',sans-serif;font-size:0.92rem;
          font-weight:600;color:var(--text-elegant)
        }
        .cita-motivo{grid-column:1/-1}
        .cita-motivo .cita-value{font-style:italic;color:var(--text-500);font-weight:400}
        
        .btn-cancel{
          margin-top:1rem;width:100%;
          background:linear-gradient(135deg,#fef2f2,#fee2e2);
          color:var(--danger);border:1px solid #fecdd3;
          padding:0.65rem;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;
          cursor:pointer;transition:var(--transition)
        }
        .btn-cancel:hover{
          background:linear-gradient(135deg,#fee2e2,#fecaca);
          border-color:var(--danger);transform:translateY(-2px)
        }
        .btn-cancel:disabled{opacity:0.6;cursor:not-allowed;transform:none}
        
        .empty-state{
          text-align:center;padding:3rem 2rem;
          background:var(--surface);border-radius:var(--radius);
          border:1px dashed var(--border);color:var(--text-500)
        }
        .empty-icon{font-size:3rem;margin-bottom:1rem;display:block;animation:float 3s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .empty-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.2rem;font-weight:600;color:var(--text-elegant);
          margin-bottom:0.5rem
        }
        .empty-text{font-family:'Manrope',sans-serif;font-size:0.9rem}
        
        .results-count{
          font-family:'Manrope',sans-serif;
          font-size:0.85rem;color:var(--text-500);
          margin-bottom:1rem;text-align:right
        }
        
        @media(max-width:700px){
          .filter-tabs{flex-wrap:wrap}
          .cita-header{flex-direction:column;align-items:flex-start;gap:0.75rem}
          .cita-details{grid-template-columns:1fr}
          .dash-topbar{padding:0 1rem;height:68px}
          .topbar-name{font-size:1.8rem}
          .page-title{font-size:1.5rem}
          .search-input{font-size:0.87rem}
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
          <div className="page-header">
            <h1 className="page-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
               Mis Citas
            </h1>
            <p className="page-subtitle">Gestiona y consulta tu historial de citas</p>
          </div>

          <button onClick={() => navigate("/paciente/dashboard")} className="btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver al Dashboard
          </button>

          {/* ── BARRA DE BÚSQUEDA ── */}
          <div className="search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por odontólogo, motivo, sede o consultorio..."
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

          {/* ── TABS DE FILTRO ── */}
          <div className="filter-tabs">
            <button className={`filter-tab ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>
              Todas
              <span className="filter-badge">{conteos.todas}</span>
            </button>
            <button className={`filter-tab ${filtro === 'proximas' ? 'active' : ''}`} onClick={() => setFiltro('proximas')}>
              Próximas
              <span className="filter-badge">{conteos.proximas}</span>
            </button>
            <button className={`filter-tab ${filtro === 'pasadas' ? 'active' : ''}`} onClick={() => setFiltro('pasadas')}>
              Pasadas
              <span className="filter-badge">{conteos.pasadas}</span>
            </button>
            <button className={`filter-tab ${filtro === 'canceladas' ? 'active' : ''}`} onClick={() => setFiltro('canceladas')}>
              Canceladas
              <span className="filter-badge">{conteos.canceladas}</span>
            </button>
            <button className={`filter-tab ${filtro === 'completadas' ? 'active' : ''}`} onClick={() => setFiltro('completadas')}>
              Completadas
              <span className="filter-badge">{conteos.completadas}</span>
            </button>
          </div>

          {/* Contador de resultados */}
          {busqueda && (
            <p className="results-count">
              {citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? 's' : ''} para "{busqueda}"
            </p>
          )}

          {/* ── LISTA DE CITAS ── */}
          {citasFiltradas.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p className="empty-title">
                {busqueda 
                  ? `No se encontraron citas para "${busqueda}"`
                  : filtro === 'todas' ? 'No tienes citas registradas'
                  : filtro === 'proximas' ? 'No tienes citas próximas'
                  : filtro === 'pasadas' ? 'No tienes citas pasadas'
                  : filtro === 'canceladas' ? 'No tienes citas canceladas'
                  : 'No tienes citas completadas'}
              </p>
              <p className="empty-text">
                {filtro === 'proximas' && !busqueda && '¡Agenda tu primera cita para comenzar!'}
                {(filtro !== 'proximas' || busqueda) && 'Las citas aparecerán aquí una vez programadas.'}
              </p>
            </div>
          ) : (
            citasFiltradas.map((c) => {
              const estadoOriginal = getEstado(c);
              const yaPaso = citaYaPaso(c);
              const estado = yaPaso && estadoOriginal !== "cancelada" ? "completada" : estadoOriginal;
              const { bg, color, border, text } = estadoStyle(estado);
              
              return (
                <div key={c.idCita} className={`cita-card ${estado}`}>
                  <div className="cita-header">
                    <div className="cita-odontologo">
                      <div className="cita-odontologo-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      {c.odontologo?.usuario
                        ? `Dr. ${c.odontologo.usuario.nombres}`
                        : "Odontólogo no disponible"}
                    </div>
                    <span className="cita-status" style={{ background: bg, color, borderColor: border }}>
                      {text}
                    </span>
                  </div>

                  <div className="cita-details">
                    <div className="cita-detail">
                      <span className="cita-label">📅 Fecha</span>
                      <span className="cita-value">{formatFecha(c.fecha)}</span>
                    </div>
                    <div className="cita-detail">
                      <span className="cita-label">⏰ Hora</span>
                      <span className="cita-value">{formatHora(c.horaInicio)} - {formatHora(c.horaFin)}</span>
                    </div>
                    <div className="cita-detail">
                      <span className="cita-label">🏥 Consultorio</span>
                      <span className="cita-value">{c.consultorio?.nombreConsultorio || "No disponible"}</span>
                    </div>
                    <div className="cita-detail">
                      <span className="cita-label">🏢 Sede</span>
                      <span className="cita-value">{c.sede?.nombre || c.sede?.nombreSede || "No disponible"}</span>
                    </div>
                    <div className="cita-detail cita-motivo">
                      <span className="cita-label">📝 Motivo</span>
                      <span className="cita-value">{c.motivo || "Sin especificar"}</span>
                    </div>
                  </div>

                  {/* Botón Cancelar - Solo para citas activas futuras */}
                  {estado !== "cancelada" && estado !== "completada" && !yaPaso && (
                    <button
                      onClick={() => handleCancelar(c)}
                      disabled={cancelando === c.idCita}
                      className="btn-cancel"
                    >
                      {cancelando === c.idCita ? "⏳ Cancelando..." : "❌ Cancelar Cita"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>
    </>
  );
}