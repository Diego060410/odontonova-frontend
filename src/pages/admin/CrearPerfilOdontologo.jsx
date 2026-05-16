import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function CrearPerfilOdontologo() {
  const { correo } = useParams();
  const navigate = useNavigate();

  // ── Estados principales ──
  const [idUsuario, setIdUsuario] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados para typing animation del logo (aislados) ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  const [form, setForm] = useState({
    idEspecialidad: "",
    numeroColegiatura: ""
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

  // ── Buscar usuario por correo ──
  useEffect(() => {
    const buscarUsuario = async () => {
      try {
        const res = await api.get("/usuarios");
        const usuarios = res.data;
        const usuario = usuarios.find(
          u => u.correo?.toLowerCase() === correo?.toLowerCase()
        );
        if (usuario) {
          setIdUsuario(usuario.idUsuario);
        } else {
          console.error("Usuario no encontrado");
        }
      } catch (error) {
        console.error("Error buscando usuario", error);
      }
    };
    if (correo) buscarUsuario();
  }, [correo]);

  // ── Cargar especialidades ──
  useEffect(() => {
    const cargarEspecialidades = async () => {
      try {
        const res = await api.get("/especialidades");
        setEspecialidades(res.data || []);
      } catch (error) {
        console.error("Error cargando especialidades:", error);
      }
    };
    cargarEspecialidades();
  }, []);

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
    setForm(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo al modificar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.idEspecialidad) newErrors.idEspecialidad = "Selecciona una especialidad";
    if (!form.numeroColegiatura?.trim()) newErrors.numeroColegiatura = "Requerido";
    else if (form.numeroColegiatura.length < 4) newErrors.numeroColegiatura = "Mínimo 4 caracteres";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const finalizarRegistro = async () => {
    if (!idUsuario) {
      alert("No se encontró el usuario asociado");
      return;
    }
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post("/odontologos", {
        idUsuario: Number(idUsuario),
        idEspecialidad: Number(form.idEspecialidad),
        numeroColegiatura: form.numeroColegiatura.trim(),
        estado: true
      });
      
      // Feedback visual antes de navegar
      alert("✅ Odontólogo creado correctamente");
      navigate("/admin/odontologos");
      
    } catch (error) {
      console.error("Error al crear odontólogo:", error);
      alert(error.response?.data?.message || "Error al crear el perfil profesional");
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
  const navModules = [
    { to: "/admin/usuarios", label: "Usuarios", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { to: "/admin/odontologos", label: "Odontólogos", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> },
    { to: "/admin/pacientes", label: "Pacientes", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { to: "/admin/citas", label: "Citas", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { to: "/admin/sedes", label: "Sedes", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { to: "/admin/consultorios", label: "Consultorios", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { to: "/admin/especialidades", label: "Especialidades", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  ];

  const quickCreate = [
    { to: "/admin/crear-usuario", label: "Nuevo Usuario", accent: "#6366f1" },
    { to: "/admin/crear-odontologo", label: "Nuevo Odontólogo", accent: "#1e40af" },
    { to: "/admin/crear-cita", label: "Nueva Cita", accent: "#db2777" },
    { to: "/admin/crear-sede", label: "Nueva Sede", accent: "#059669" },
    { to: "/admin/crear-consultorio", label: "Nuevo Consultorio", accent: "#d97706" },
    { to: "/admin/crear-especialidad", label: "Nueva Especialidad", accent: "#0891b2" },
  ];

  // Estado de usuario no encontrado
  if (correo && !idUsuario && !loading && especialidades.length > 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem", background: "#fff", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", maxWidth: "400px" }}>
          <div style={{ width: "64px", height: "64px", margin: "0 auto 1rem", background: "linear-gradient(135deg, #fef2f2, #fff)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#1e293b", marginBottom: "0.5rem" }}>Usuario no encontrado</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>No existe una cuenta asociada al correo: <b>{correo}</b></p>
          <button onClick={() => navigate("/admin/odontologos")} style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, #1e40af, #2563eb)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>Volver a Odontólogos</button>
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
        .cpo-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%);background-attachment:fixed}
        
        /* ── TOPBAR ELEGANTE (Reutilizada) ── */
        .cpo-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow);animation:slideDown 0.5s ease}
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
        .cpo-content{padding:clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,3rem);max-width:650px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── HEADER DE PÁGINA ── */
        .cpo-header{margin-bottom:2rem;animation:fadeInUp 0.5s ease 0.2s both;text-align:center}
        .cpo-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);margin-bottom:0.75rem;display:flex;align-items:center;justify-content:center;gap:0.6rem}
        .cpo-eyebrow::before,.cpo-eyebrow::after{content:'';width:32px;height:1px;background:linear-gradient(90deg,transparent,var(--primary-600));border-radius:1px;opacity:0.6}
        .cpo-eyebrow::after{background:linear-gradient(90deg,var(--primary-600),transparent)}
        .cpo-title{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.02em;line-height:1.15;margin-bottom:0.5rem}
        .cpo-subtitle{font-family:'Manrope',sans-serif;font-size:0.95rem;color:var(--text-500);font-weight:400}
        .cpo-user-badge{display:inline-flex;align-items:center;gap:0.5rem;margin-top:0.75rem;padding:0.5rem 1rem;background:linear-gradient(135deg,var(--primary-50),#dbeafe);border:1px solid var(--primary-100);border-radius:100px;font-family:'Manrope',sans-serif;font-size:0.8rem;color:var(--primary-600);font-weight:500}
        .cpo-user-badge svg{flex-shrink:0}
        
        /* ── PROGRESS STEPS ── */
        .progress-steps{display:flex;align-items:center;justify-content:center;gap:0.5rem;margin:1.5rem 0 2.5rem}
        .progress-step{display:flex;align-items:center;gap:0.5rem;font-family:'Manrope',sans-serif;font-size:0.8rem;font-weight:500;color:var(--text-500)}
        .progress-step.active{color:var(--primary-600);font-weight:600}
        .progress-step.completed{color:var(--success)}
        .progress-dot{width:8px;height:8px;border-radius:50%;background:var(--border);transition:var(--transition);position:relative}
        .progress-step.active .progress-dot{background:var(--primary-600);box-shadow:0 0 0 4px var(--primary-100)}
        .progress-step.completed .progress-dot{background:var(--success);box-shadow:0 0 0 4px #bbf7d0}
        .progress-step.completed .progress-dot::after{content:'✓';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:0.6rem;color:#fff;font-weight:700}
        .progress-line{width:24px;height:2px;background:var(--border);border-radius:1px}
        .progress-step.active + .progress-line,.progress-step.completed + .progress-line{background:var(--primary-600)}
        .progress-step.completed + .progress-line{background:var(--success)}
        
        /* ── FORM CARD ── */
        .cpo-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);padding:2rem;animation:fadeInUp 0.5s ease 0.3s both}
        .form-grid{display:grid;grid-template-columns:1fr;gap:1.25rem;margin-bottom:1.5rem}
        .form-group{display:flex;flex-direction:column;gap:0.4rem}
        .form-label{font-family:'Manrope',sans-serif;font-size:0.8rem;font-weight:600;color:var(--text-elegant);display:flex;align-items:center;gap:0.35rem}
        .form-label .required{color:var(--danger);font-size:1rem;line-height:1}
        .form-select,.form-input{width:100%;padding:0.85rem 1.1rem;background:var(--surface-100);border:1.5px solid var(--border-light);border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text-elegant);outline:none;transition:var(--transition);appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 1rem center;background-size:16px}
        .form-select::-ms-expand{display:none}
        .form-select:focus,.form-input:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background-color:var(--surface)}
        .form-select.error,.form-input.error{border-color:var(--danger);animation:shake 0.3s ease}
        .form-select.error:focus,.form-input.error:focus{box-shadow:0 0 0 4px rgba(220,38,38,0.12)}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        .form-error{font-family:'Manrope',sans-serif;font-size:0.72rem;color:var(--danger);font-weight:500;padding-left:0.3rem}
        .form-hint{font-family:'Manrope',sans-serif;font-size:0.72rem;color:var(--text-400);padding-left:0.3rem;display:flex;align-items:center;gap:0.3rem}
        .form-hint svg{flex-shrink:0;color:var(--primary-600)}
        
        /* ── ESPECIALIDAD CARD ── */
        .especialidad-preview{display:flex;align-items:center;gap:0.85rem;padding:1rem 1.25rem;background:linear-gradient(135deg,var(--primary-50),var(--surface));border:1px solid var(--primary-100);border-radius:12px;margin-top:0.5rem;animation:fadeIn 0.3s ease}
        .especialidad-icon{width:36px;height:36px;background:linear-gradient(135deg,var(--primary-600),var(--accent));border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
        .especialidad-info{flex:1}
        .especialidad-name{font-family:'Cormorant Garamond',serif;font-size:0.95rem;font-weight:600;color:var(--text-elegant)}
        .especialidad-desc{font-family:'Manrope',sans-serif;font-size:0.75rem;color:var(--text-500)}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── BUTTONS ── */
        .btn-group{display:flex;gap:0.75rem;margin-top:1.5rem}
        .btn-back{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;padding:0.85rem 1.25rem;background:var(--surface-100);color:var(--text-elegant);border:1.5px solid var(--border-light);border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none}
        .btn-back:hover{background:var(--surface);border-color:var(--primary-600);color:var(--primary-600);transform:translateY(-2px)}
        .btn-back:active{transform:translateY(0)}
        .btn-finish{flex:1.5;display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;padding:0.85rem 1.25rem;background:linear-gradient(135deg,var(--success),#047857);color:#fff;border:none;border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;position:relative;overflow:hidden}
        .btn-finish::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);transition:left 0.5s ease}
        .btn-finish:hover::before{left:100%}
        .btn-finish:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(5,150,105,0.35);filter:brightness(1.05)}
        .btn-finish:active{transform:translateY(0)}
        .btn-finish:disabled{background:var(--text-400);cursor:not-allowed;transform:none;box-shadow:none}
        .btn-finish:disabled::before{display:none}
        
        /* ── LOADING OVERLAY ── */
        .loading-overlay{position:fixed;inset:0;background:rgba(255,255,255,0.92);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;animation:fadeIn 0.2s ease}
        .loading-card{background:var(--surface);border-radius:var(--radius-sm);padding:2rem 3rem;display:flex;flex-direction:column;align-items:center;gap:1rem;box-shadow:var(--shadow-lg),var(--shadow-glow);animation:scaleIn 0.3s ease}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        .loading-spinner{width:48px;height:48px;border:3px solid var(--border-light);border-top-color:var(--success);border-radius:50%;animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading-text{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--text-elegant);font-style:italic;font-weight:500}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        
        /* ── RESPONSIVE ── */
        @media(max-width:900px){.topbar-nav{gap:0.15rem}.dropdown-menu{min-width:220px;right:-10px}.btn-action{padding:0.55rem 1rem;font-size:0.83rem}.cpo-title{font-size:1.6rem}}
        @media(max-width:600px){.topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}.cpo-title{font-size:1.4rem}.btn-group{flex-direction:column}.btn-back,.btn-finish{width:100%}}
      `}</style>

      <div className="cpo-root">

        {/* ── TOPBAR CON TYPING ANIMATION ── */}
        <header className="cpo-topbar">
          <div className="topbar-brand" onClick={() => navigate("/admin/dashboard")}>
            <span className="topbar-name">
              <span className="typing-wrapper" aria-label="OdontoNova">
                {typedText.split("").map((char, index) => (
                  <span 
                    key={index} 
                    className={`typing-char ${index >= 6 ? 'nova' : ''}`}
                  >
                    {char}
                  </span>
                ))}
              </span>
              <span className={`typing-cursor ${cursorVisible ? 'active' : ''}`} aria-hidden="true" />
            </span>
          </div>

          <nav className="topbar-nav">
            {/* Dropdown: Módulos */}
            <div className={`dropdown ${menuOpen === 'modules' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'modules' ? null : 'modules'); }} aria-haspopup="true" aria-expanded={menuOpen === 'modules'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Módulos
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Crear
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Nuevo registro</span>
                {quickCreate.map((q) => (
                  <Link key={q.to} to={q.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)} style={{ borderLeft: `3px solid ${q.accent}`, paddingLeft: '0.65rem' }}>{q.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/admin/perfil" className="btn-action btn-profile">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Perfil
            </Link>
            <span className="topbar-badge">Admin</span>
            <button onClick={handleLogout} className="btn-action btn-logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Salir
            </button>
          </nav>
        </header>

        {/* ── CONTENT ── */}
        <main className="cpo-content">

          {/* Header de Página */}
          <div className="cpo-header">
            <p className="cpo-eyebrow">Paso 2 de 2</p>
            <h1 className="cpo-title">Perfil Profesional</h1>
            <p className="cpo-subtitle">Completa la información profesional del odontólogo</p>
            {correo && (
              <div className="cpo-user-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {correo}
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="progress-steps" aria-label="Progreso del registro">
            <span className="progress-step completed">
              <span className="progress-dot" />
              <span>Cuenta</span>
            </span>
            <span className="progress-line" />
            <span className="progress-step active">
              <span className="progress-dot" />
              <span>Perfil Profesional</span>
            </span>
          </div>

          {/* Form Card */}
          <div className="cpo-card">
            <div className="form-grid">
              
              {/* Especialidad */}
              <div className="form-group">
                <label className="form-label" htmlFor="idEspecialidad">
                  Especialidad Profesional <span className="required">*</span>
                </label>
                <select
                  id="idEspecialidad"
                  name="idEspecialidad"
                  className={`form-select ${errors.idEspecialidad ? 'error' : ''}`}
                  value={form.idEspecialidad}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar especialidad...</option>
                  {especialidades.length === 0 ? (
                    <option disabled>Cargando especialidades...</option>
                  ) : (
                    especialidades.map((esp) => (
                      <option key={esp.idEspecialidad} value={esp.idEspecialidad}>
                        {esp.nombreEspecialidad}
                      </option>
                    ))
                  )}
                </select>
                {errors.idEspecialidad ? (
                  <span className="form-error">{errors.idEspecialidad}</span>
                ) : (
                  <span className="form-hint">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Esta especialidad aparecerá en el perfil público del odontólogo
                  </span>
                )}
                
                {/* Preview de especialidad seleccionada */}
                {form.idEspecialidad && (
                  <div className="especialidad-preview">
                    <div className="especialidad-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    </div>
                    <div className="especialidad-info">
                      <div className="especialidad-name">
                        {especialidades.find(e => e.idEspecialidad == form.idEspecialidad)?.nombreEspecialidad}
                      </div>
                      <div className="especialidad-desc">Especialidad seleccionada ✓</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Número de Colegiatura */}
              <div className="form-group">
                <label className="form-label" htmlFor="numeroColegiatura">
                  Número de Colegiatura <span className="required">*</span>
                </label>
                <input
                  id="numeroColegiatura"
                  name="numeroColegiatura"
                  className={`form-input ${errors.numeroColegiatura ? 'error' : ''}`}
                  placeholder="Ej. COL-2024-0856"
                  value={form.numeroColegiatura}
                  onChange={handleChange}
                  autoComplete="off"
                />
                {errors.numeroColegiatura ? (
                  <span className="form-error">{errors.numeroColegiatura}</span>
                ) : (
                  <span className="form-hint">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                    Verificado por el colegio profesional correspondiente
                  </span>
                )}
              </div>

            </div>

            {/* Botones de Acción */}
            <div className="btn-group">
              <button 
                type="button" 
                className="btn-back"
                onClick={() => navigate(-1)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Atrás
              </button>
              <button 
                type="button" 
                className="btn-finish"
                onClick={finalizarRegistro}
                disabled={loading || !form.idEspecialidad || !form.numeroColegiatura}
              >
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:'spin 1s linear infinite'}}><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                    Registrando...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Finalizar Registro
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Card Adicional */}
          <div style={{ marginTop: "1.5rem", padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #f0fdf4, #fff)", border: "1px solid #bbf7d0", borderRadius: "16px", display: "flex", gap: "0.85rem", alignItems: "flex-start", animation: "fadeInUp 0.5s ease 0.4s both" }}>
            <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #16a34a, #059669)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: "0" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", marginBottom: "0.25rem" }}>Registro casi completo</p>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: "0.8rem", color: "#64748b", lineHeight: "1.5" }}>
                Al finalizar, el odontólogo podrá iniciar sesión con sus credenciales y gestionar sus citas, pacientes y horarios desde su panel personalizado.
              </p>
            </div>
          </div>

        </main>

        {/* ── Loading Overlay ── */}
        {loading && (
          <div className="loading-overlay" role="status" aria-live="polite">
            <div className="loading-card">
              <div className="loading-spinner" />
              <span className="loading-text">Registrando odontólogo...</span>
            </div>
          </div>
        )}

      </div>
    </>
  );
}