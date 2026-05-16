import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import citaService from "../../services/citaService";
import { getPacienteByUsuario } from "../../services/pacienteService";
import { getUsuarioById } from "../../services/usuarioService";
import { listarOdontologos } from "../../services/odontologoService";
import { listarConsultorios } from "../../services/consultorioService";
import { listarSedes } from "../../services/sedeService";

export default function DashboardPaciente() {
  const navigate = useNavigate();

  // ── Estados ─
  const [usuario, setUsuario] = useState(null);
  const [proximaCita, setProximaCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados para animación del logo ──
  const [typedLogo, setTypedLogo] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  /* =========================
     🧠 HELPERS
  ========================= */

  const getEstado = (c) => {
    return (
      c.estadoCita?.nombreEstado ||
      c.estado?.nombre ||
      c.estado ||
      (c.idEstadoCita === 1 && "Pendiente") ||
      (c.idEstadoCita === 2 && "Confirmada") ||
      (c.idEstadoCita === 3 && "Cancelada") ||
      "Desconocido"
    ).toString().trim().toLowerCase();
  };

  // ✅ CORRECCIÓN: Parseo seguro de fecha/hora LOCAL (no UTC)
  const parseFechaHoraLocal = (fecha, horaInicio) => {
    if (!fecha || !horaInicio) return null;
    
    try {
      const [year, month, day] = fecha.split('-').map(Number);
      
      // Manejar hora en formato HH:MM o HH:MM:SS
      const horaParts = horaInicio.split(':');
      const hour = parseInt(horaParts[0], 10);
      const minute = parseInt(horaParts[1] || '0', 10);
      
      // Validar que los valores sean números válidos
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
        return null;
      }
      
      // Crear fecha en hora LOCAL del navegador (no UTC)
      const fechaHora = new Date(year, month - 1, day, hour, minute, 0);
      return fechaHora.getTime();
    } catch (err) {
      console.error("Error parseando fecha:", err);
      return null;
    }
  };

  // ✅ CORRECCIÓN: Verificar si es fecha futura o de hoy (no pasada)
  const esCitaFutura = (cita) => {
    const timestamp = parseFechaHoraLocal(cita.fecha, cita.horaInicio);
    if (timestamp === null) return false;
    
    const ahora = new Date();
    const ahoraTimestamp = ahora.getTime();
    
    // DEBUG: Ver en consola
    console.log("📅 Verificando cita:", {
      fecha: cita.fecha,
      hora: cita.horaInicio,
      timestamp: timestamp,
      ahora: ahoraTimestamp,
      diferencia: timestamp - ahoraTimestamp,
      esFutura: timestamp >= ahoraTimestamp
    });
    
    return timestamp >= ahoraTimestamp;
  };

  // ✅ CORRECCIÓN: Formateo de fecha SIN timezone issues
  const formatFecha = (fechaString) => {
    if (!fechaString) return "-";
    const [year, month, day] = fechaString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${dias[date.getDay()]}, ${day} de ${meses[date.getMonth()]}`;
  };

  const formatHora = (hora) => {
    if (!hora) return "--:--";
    return hora.substring(0, 5);
  };

  const estadoStyle = (estado) => {
    const map = {
      pendiente:  { bg: "#fffbeb", color: "#d97706", border: "#fcd34d", text: "Pendiente" },
      confirmada: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac", text: "Confirmada" },
      cancelada:  { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5", text: "Cancelada" },
    };
    return map[estado] || { bg: "#f8fafc", color: "#475569", border: "#e2e8f0", text: estado };
  };

  /* =========================
     🔥 CARGAR DATOS - SOLO PRÓXIMA CITA
  ========================= */

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const idUsuario = localStorage.getItem("id_usuario");
        if (!idUsuario) throw new Error("No hay usuario logueado");

        const userData = await getUsuarioById(idUsuario);
        setUsuario(userData);

        const paciente = await getPacienteByUsuario(idUsuario);
        if (!paciente?.idPaciente) throw new Error("No existe paciente");

        const citasData = await citaService.getMisCitas(paciente.idPaciente);
        const odontologos = (await listarOdontologos())?.data || [];
        const consultorios = (await listarConsultorios())?.data || [];
        const sedes = await listarSedes();
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

        console.log("📊 Total de citas cargadas:", citasFinal.length);
        
        // ✅ FILTRAR: Solo NO canceladas + FUTURAS O DE HOY (no pasadas)
        const futuras = citasFinal.filter(c => {
          const estado = getEstado(c);
          const esFutura = esCitaFutura(c);
          
          console.log("Filtrando cita:", {
            fecha: c.fecha,
            hora: c.horaInicio,
            estado: estado,
            esFutura: esFutura,
            seMuestra: estado !== "cancelada" && esFutura
          });
          
          return estado !== "cancelada" && esFutura;
        });

        console.log("✅ Citas futuras encontradas:", futuras.length);

        // ✅ ORDENAR: Por fecha/hora más cercana PRIMERO (ascendente)
        futuras.sort((a, b) => {
          const timeA = parseFechaHoraLocal(a.fecha, a.horaInicio);
          const timeB = parseFechaHoraLocal(b.fecha, b.horaInicio);
          
          if (timeA === null) return 1;
          if (timeB === null) return -1;
          
          return timeA - timeB;
        });

        // ✅ SOLO LA PRIMERA (la más próxima)
        console.log("🎯 Próxima cita a mostrar:", futuras[0]);
        setProximaCita(futuras.length > 0 ? futuras[0] : null);

      } catch (err) {
        console.error(err);
        setError("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

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

  // ── Cierre de dropdowns ──
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.dropdown')) setMenuOpen(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  /* =========================
     ❌ CANCELAR / LOGOUT
  ========================= */

  const handleCancelar = async (id) => {
    if (!window.confirm("¿Estás seguro de cancelar esta cita?")) return;
    try {
      await citaService.cancelarCita(id);
      alert("✅ Cita cancelada exitosamente");
      window.location.reload();
    } catch {
      alert("❌ Error al cancelar la cita. Intente nuevamente.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  /* =========================
     🎨 UI (MISMO CÓDIGO DE ANTES)
  ========================= */

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
          <div style={{ width: 52, height: 52, border: "3px solid #e5e7eb", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ color: "#6b7280", fontSize: "0.95rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando dashboard...</p>
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
        .btn-action{display:flex;align-items:center;gap:0.5rem;padding:0.6rem 1.2rem;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent}
        .btn-profile{background:var(--primary-50);color:var(--primary-600);border-color:var(--primary-100)}
        .btn-profile:hover{background:var(--primary-100);border-color:var(--primary-600)}
        .btn-logout{background:#fff1f2;color:var(--danger);border-color:#fecdd3}
        .btn-logout:hover{background:#ffe4e6;border-color:var(--danger)}
        .topbar-badge{background:var(--primary-100);color:var(--primary-600);font-family:'Cormorant Garamond',serif;font-size:0.7rem;font-weight:600;font-style:italic;padding:0.35rem 0.85rem;border-radius:100px;border:1px solid #93c5fd}
        
        /* ── CONTENIDO ── */
        .dash-content{
          padding:clamp(1.5rem,4vw,2.5rem);
          max-width:720px;
          margin:0 auto;
          animation:fadeInUp 0.5s ease 0.1s both;
        }
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        
        .page-greeting{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.25rem}
        .page-subtitle{font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-500);margin-bottom:1.75rem}
        
        /* Botones de acción */
        .action-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0.75rem;margin-bottom:2rem}
        .action-btn{
          display:flex;align-items:center;justify-content:center;gap:0.5rem;
          padding:0.9rem 1rem;border:none;border-radius:14px;
          font-family:'Manrope',sans-serif;font-size:0.88rem;font-weight:600;
          cursor:pointer;transition:var(--transition);text-decoration:none;
          box-shadow:0 3px 12px rgba(0,0,0,0.06);position:relative;overflow:hidden
        }
        .action-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.1)}
        .action-primary{background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff}
        .action-secondary{background:linear-gradient(135deg,#64748b,#475569);color:#fff}
        
        /* ── TARJETA DE CITA (MEJORADA) ── */
        .cita-card{
          background:var(--surface);
          border-radius:var(--radius);
          border:1px solid var(--border-light);
          box-shadow:var(--shadow-lg);
          padding:1.75rem;
          animation:fadeInUp 0.45s ease 0.15s both;
          position:relative;
          overflow:hidden;
        }
        /* Decoración superior */
        .cita-card::before{
          content:'';
          position:absolute;
          top:0;left:0;right:0;
          height:3px;
          background:linear-gradient(90deg,var(--primary-100),var(--primary-600),var(--accent));
          opacity:0.8;
        }
        
        .cita-card-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:1.5rem;
          padding-bottom:1rem;
          border-bottom:1px solid var(--border-light);
        }
        .cita-card-title{
          font-family:'Cormorant Garamond',serif;
          font-size:1.25rem;
          font-weight:600;
          color:var(--text-elegant);
          display:flex;
          align-items:center;
          gap:0.5rem;
        }
        .cita-status{
          font-family:'Manrope',sans-serif;
          font-size:0.72rem;
          font-weight:700;
          padding:0.35rem 0.85rem;
          border-radius:100px;
          text-transform:uppercase;
          letter-spacing:0.04em;
          border:1px solid;
          display:inline-flex;
          align-items:center;
          gap:0.4rem;
        }
        .cita-status::before{
          content:'';
          width:6px;height:6px;
          border-radius:50%;
          background:currentColor;
          opacity:0.7;
        }
        
        /* Detalles de cita - GRID para mejor alineación */
        .cita-details{
          display:grid;
          grid-template-columns:1fr;
          gap:0;
          border-left:4px solid transparent;
          padding-left:1.25rem;
        }
        .cita-row{
          display:grid;
          grid-template-columns:110px 1fr;
          align-items:center;
          padding:0.65rem 0;
          border-bottom:1px dashed var(--border-light);
          gap:0.75rem;
        }
        .cita-row:last-child{border-bottom:none;padding-bottom:0}
        .cita-label{
          font-family:'Manrope',sans-serif;
          font-size:0.82rem;
          color:var(--text-500);
          font-weight:500;
          display:flex;
          align-items:center;
          gap:0.4rem;
        }
        .cita-value{
          font-family:'Manrope',sans-serif;
          font-size:0.93rem;
          font-weight:600;
          color:var(--text-elegant);
          text-align:right;
          word-break:break-word;
        }
        
        .btn-cancel{
          margin-top:1.25rem;
          width:100%;
          background:linear-gradient(135deg,#fef2f2,#fee2e2);
          color:var(--danger);
          border:1px solid #fecdd3;
          padding:0.75rem;
          border-radius:12px;
          font-family:'Manrope',sans-serif;
          font-size:0.88rem;
          font-weight:600;
          cursor:pointer;
          transition:var(--transition);
          display:flex;
          align-items:center;
          justify-content:center;
          gap:0.5rem;
        }
        .btn-cancel:hover{
          background:linear-gradient(135deg,#fee2e2,#fecaca);
          border-color:var(--danger);
          transform:translateY(-1px);
        }
        
        /* Empty state */
        .empty-state{
          text-align:center;
          padding:2.5rem 1.5rem;
          background:var(--surface);
          border-radius:var(--radius);
          border:1px dashed var(--border);
          color:var(--text-500);
          animation:fadeInUp 0.45s ease 0.15s both;
        }
        .empty-icon{font-size:2.8rem;margin-bottom:0.85rem;display:block;animation:float 3s ease-in-out infinite}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .empty-title{font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.4rem}
        .empty-text{font-family:'Manrope',sans-serif;font-size:0.88rem}
        
        /* Footer */
        .dash-footer{text-align:center;padding:1.5rem;color:var(--text-400);font-family:'Manrope',sans-serif;font-size:0.83rem}
        .dash-footer a{color:var(--primary-600);text-decoration:none;font-weight:500}
        .dash-footer a:hover{text-decoration:underline}
        
        /* Responsive */
        @media(max-width:600px){
          .dash-topbar{padding:0 1rem;height:66px}
          .topbar-name{font-size:1.7rem}
          .action-grid{grid-template-columns:1fr}
          .cita-row{grid-template-columns:100px 1fr;font-size:0.9rem}
          .cita-value{text-align:right;font-size:0.9rem}
          .page-greeting{font-size:1.35rem}
          .cita-card{padding:1.4rem}
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
          <div>
            <h1 className="page-greeting">👋 Hola, {usuario?.nombres || "Paciente"}</h1>
            <p className="page-subtitle">Tu próxima cita dental</p>
          </div>

          {/* ── BOTONES DE ACCIÓN ── */}
          <div className="action-grid">
            <button onClick={() => navigate("/paciente/nueva-cita")} className="action-btn action-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva Cita
            </button>
            <button onClick={() => navigate("/paciente/mis-citas")} className="action-btn action-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Ver Todas
            </button>
          </div>

          {/* ── PRÓXIMA CITA (SOLO LA MÁS INMEDIATA) ── */}
          <div className="cita-card">
            <div className="cita-card-header">
              <h2 className="cita-card-title">📅 Próxima Cita</h2>
              {proximaCita && (
                <span className="cita-status" style={estadoStyle(getEstado(proximaCita))}>
                  {estadoStyle(getEstado(proximaCita)).text}
                </span>
              )}
            </div>

            {!proximaCita ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p className="empty-title">Sin citas próximas</p>
                <p className="empty-text">¡Agenda tu primera cita para comenzar!</p>
              </div>
            ) : (
              <div className="cita-details" style={{ borderLeftColor: estadoStyle(getEstado(proximaCita)).color }}>
                <div className="cita-row">
                  <span className="cita-label">👨‍⚕️ Odontólogo</span>
                  <span className="cita-value">
                    {proximaCita.odontologo?.usuario
                      ? `Dr. ${proximaCita.odontologo.usuario.nombres}`
                      : "No disponible"}
                  </span>
                </div>
                <div className="cita-row">
                  <span className="cita-label">📅 Fecha</span>
                  <span className="cita-value">{formatFecha(proximaCita.fecha)}</span>
                </div>
                <div className="cita-row">
                  <span className="cita-label">⏰ Hora</span>
                  <span className="cita-value">{formatHora(proximaCita.horaInicio)}</span>
                </div>
                <div className="cita-row">
                  <span className="cita-label">🏥 Consultorio</span>
                  <span className="cita-value">{proximaCita.consultorio?.nombreConsultorio || "No disponible"}</span>
                </div>
                <div className="cita-row">
                  <span className="cita-label">🏢 Sede</span>
                  <span className="cita-value">{proximaCita.sede?.nombre || proximaCita.sede?.nombreSede || "No disponible"}</span>
                </div>
                <div className="cita-row">
                  <span className="cita-label">📝 Motivo</span>
                  <span className="cita-value">{proximaCita.motivo || "-"}</span>
                </div>

                {getEstado(proximaCita) === "pendiente" && (
                  <button onClick={() => handleCancelar(proximaCita.idCita)} className="btn-cancel">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Cancelar Cita
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="dash-footer">
          <p>¿Necesitas ayuda? <Link to="/soporte">Contacta a soporte</Link></p>
        </footer>
      </div>
    </>
  );
}