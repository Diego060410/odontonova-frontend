import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  listarOdontologos,
  actualizarOdontologo,
  eliminarOdontologo
} from "../../services/odontologoService";

export default function Odontologos() {
  const navigate = useNavigate();

  // ── Estados principales ──
  const [odontologos, setOdontologos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOdontologo, setEditingOdontologo] = useState(null); // null = panel cerrado
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  
  // ── Estados para typing animation del logo (aislados) ──
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);

  const [form, setForm] = useState({
    idUsuario: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    idEspecialidad: "",
    numeroColegiatura: "",
    estado: true
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

  // ── Carga de odontólogos ──
  useEffect(() => {
    fetchOdontologos();
  }, []);

  const fetchOdontologos = async () => {
    setLoading(true);
    try {
      const res = await listarOdontologos();
      const data = res.data?.data || res.data || [];
      setOdontologos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando odontólogos:", error);
      setOdontologos([]);
    } finally {
      setLoading(false);
    }
  };

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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.idUsuario) newErrors.idUsuario = "Requerido";
    if (!form.numeroColegiatura?.trim()) newErrors.numeroColegiatura = "Requerido";
    else if (form.numeroColegiatura.length < 4) newErrors.numeroColegiatura = "Mínimo 4 caracteres";
    if (!form.idEspecialidad) newErrors.idEspecialidad = "Selecciona una especialidad";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleActualizar = async () => {
    if (!editingOdontologo) return;
    if (!validateForm()) {
      const firstError = document.querySelector('.odo-input.error');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        idUsuario: Number(form.idUsuario),
        idEspecialidad: Number(form.idEspecialidad),
        numeroColegiatura: form.numeroColegiatura.trim(),
        estado: Boolean(form.estado)
      };
      await actualizarOdontologo(editingOdontologo.idOdontologo, payload);
      setEditingOdontologo(null); // ← Cierra el panel tras guardar
      fetchOdontologos();
    } catch (error) {
      console.error("Error actualizando:", error);
      alert(error.response?.data?.message || "❌ Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Deseas eliminar este odontólogo?\n\nEsta acción no se puede deshacer.")) return;
    try {
      await eliminarOdontologo(id);
      if (editingOdontologo?.idOdontologo === id) setEditingOdontologo(null);
      fetchOdontologos();
    } catch (error) {
      console.error("Error eliminando:", error);
      alert(error.response?.data?.message || "❌ Error eliminando");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  // ── Abrir panel de edición (nueva función) ──
  const abrirPanelEdicion = (odontologo) => {
    setForm({
      idUsuario: odontologo.usuario?.idUsuario || "",
      nombres: odontologo.usuario?.nombres || "",
      apellidos: odontologo.usuario?.apellidos || "",
      email: odontologo.usuario?.email || "",
      telefono: odontologo.usuario?.telefono || "",
      idEspecialidad: odontologo.especialidad?.idEspecialidad || "",
      numeroColegiatura: odontologo.numeroColegiatura || "",
      estado: odontologo.estado ?? true
    });
    setEditingOdontologo(odontologo);
    setErrors({});
    
    // Scroll suave al panel con pequeño offset
    setTimeout(() => {
      const panel = document.querySelector('.odo-edit-panel');
      if (panel) {
        const headerOffset = 90; // Altura del topbar + margen
        const elementPosition = panel.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  // ── Cerrar panel de edición (nueva función) ──
  const cerrarPanelEdicion = () => {
    setEditingOdontologo(null);
    setErrors({});
    setForm({
      idUsuario: "", nombres: "", apellidos: "", email: "",
      telefono: "", idEspecialidad: "", numeroColegiatura: "", estado: true
    });
  };

  const avatarColor = (id) => {
    const colors = ["#1e40af", "#7c3aed", "#059669", "#d97706", "#db2777", "#0891b2"];
    return colors[(id || 0) % colors.length];
  };

  const initials = (nombres, apellidos) =>
    ((nombres?.[0] || "") + (apellidos?.[0] || "")).toUpperCase() || "?";

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return odontologos.filter((o) => (
      o.usuario?.nombres?.toLowerCase().includes(q) ||
      o.usuario?.apellidos?.toLowerCase().includes(q) ||
      o.usuario?.email?.toLowerCase().includes(q) ||
      o.usuario?.telefono?.toLowerCase().includes(q) ||
      o.especialidad?.nombreEspecialidad?.toLowerCase().includes(q) ||
      o.numeroColegiatura?.toLowerCase().includes(q)
    ));
  }, [odontologos, search]);

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
        .odo-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 50%,#f1f5f9 100%);background-attachment:fixed}
        
        /* ── TOPBAR ELEGANTE ── */
        .odo-topbar{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(226,232,240,0.6);padding:0 clamp(1.5rem,4vw,3rem);height:76px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow);animation:slideDown 0.5s ease}
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
        .odo-content{padding:clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,3rem);max-width:1300px;margin:0 auto;animation:fadeInUp 0.6s ease 0.15s both}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        
        /* ── HEADER DE PÁGINA ── */
        .odo-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;margin-bottom:2rem;animation:fadeInUp 0.5s ease 0.2s both}
        .odo-header-left{display:flex;flex-direction:column;gap:0.5rem}
        .odo-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);display:flex;align-items:center;gap:0.5rem}
        .odo-eyebrow::before{content:'';width:28px;height:1px;background:linear-gradient(90deg,var(--primary-600),transparent);border-radius:1px}
        .odo-title{font-family:'Cormorant Garamond',serif;font-size:2.2rem;font-weight:600;color:var(--text-elegant);letter-spacing:-0.02em;line-height:1.1}
        .odo-count-badge{display:inline-flex;align-items:center;gap:0.45rem;background:linear-gradient(135deg,var(--primary-50),#dbeafe);border:1px solid var(--primary-100);color:var(--primary-600);font-family:'Manrope',sans-serif;font-size:0.75rem;font-weight:600;padding:0.45rem 1rem;border-radius:100px;box-shadow:0 2px 10px rgba(30,64,175,0.1);animation:pulse 2.5s infinite}
        
        /* ── ACTION BUTTONS ── */
        .odo-actions{display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap}
        
        /* 🔙 BOTÓN VOLVER AL DASHBOARD - DESTACADO */
        .btn-dashboard{
          display:inline-flex;align-items:center;gap:0.5rem;
          padding:0.7rem 1.25rem;
          background:linear-gradient(135deg,var(--text-elegant),#0f172a);
          color:#fff;border:none;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          cursor:pointer;transition:var(--transition);
          box-shadow:0 4px 16px rgba(15,23,42,0.2);
          text-decoration:none;position:relative;overflow:hidden
        }
        .btn-dashboard::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
          transition:left 0.5s ease
        }
        .btn-dashboard:hover::before{left:100%}
        .btn-dashboard:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,0.3)}
        .btn-dashboard:active{transform:translateY(0)}
        .btn-dashboard svg{transition:transform 0.2s}
        .btn-dashboard:hover svg{transform:translateX(-2px)}
        
        .btn-create{
          display:inline-flex;align-items:center;gap:0.5rem;
          padding:0.75rem 1.5rem;
          background:linear-gradient(135deg,var(--success),#047857);
          color:#fff;border:none;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.87rem;font-weight:600;
          cursor:pointer;transition:var(--transition);
          box-shadow:0 4px 18px rgba(5,150,105,0.25);
          text-decoration:none;position:relative;overflow:hidden
        }
        .btn-create::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-create:hover::before{left:100%}
        .btn-create:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(5,150,105,0.4);filter:brightness(1.05)}
        .btn-create:active{transform:translateY(0)}
        
        /* ── SEARCH ── */
        .odo-search-wrap{position:relative;min-width:280px}
        .odo-search-icon{position:absolute;left:1.1rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-400);pointer-events:none;transition:var(--transition)}
        .odo-search{
          width:100%;padding:0.85rem 1.1rem 0.85rem 2.75rem;
          background:var(--surface);border:1.5px solid var(--border-light);
          border-radius:14px;font-family:'Manrope',sans-serif;
          font-size:0.87rem;color:var(--text-elegant);outline:none;transition:var(--transition)
        }
        .odo-search::placeholder{color:var(--text-400);font-weight:400}
        .odo-search:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface-100)}
        .odo-search:focus + .odo-search-icon,.odo-search-wrap:hover .odo-search-icon{color:var(--primary-600)}
        
        /* ── EDIT PANEL (CORREGIDO: Oculto por defecto) ── */
        .odo-edit-panel{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          overflow:hidden;margin-bottom:2rem;
          max-height:0;opacity:0;visibility:hidden;
          transform:translateY(-12px);
          transition:max-height 0.35s ease,opacity 0.25s ease,transform 0.25s ease,visibility 0s 0.35s
        }
        .odo-edit-panel.active{
          max-height:800px;opacity:1;visibility:visible;transform:translateY(0);
          transition:max-height 0.4s ease,opacity 0.3s ease,transform 0.3s ease,visibility 0s 0s;
          border-color:var(--primary-600);box-shadow:var(--shadow-lg),0 0 0 1px var(--primary-100)
        }
        .odo-edit-header{
          padding:1.25rem 1.75rem;border-bottom:1px solid var(--border-light);
          display:flex;align-items:center;gap:1rem;background:linear-gradient(135deg,var(--surface-100),var(--surface))
        }
        .odo-edit-icon{
          width:40px;height:40px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;transition:var(--transition)
        }
        .odo-edit-panel.active .odo-edit-icon{background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff;transform:rotate(-3deg)}
        .odo-edit-title{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:600;color:var(--text-elegant)}
        .odo-edit-sub{font-family:'Manrope',sans-serif;font-size:0.75rem;color:var(--text-500);margin-top:0.15rem}
        .odo-edit-body{padding:1.5rem 1.75rem}
        
        .odo-form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem}
        .odo-field-group{display:flex;flex-direction:column;gap:0.4rem}
        .odo-field-label{
          font-family:'Manrope',sans-serif;font-size:0.7rem;font-weight:600;
          color:var(--text-500);text-transform:uppercase;letter-spacing:0.08em;
          display:flex;align-items:center;gap:0.3rem
        }
        .odo-field-label .required{color:var(--danger);font-size:0.9rem}
        .odo-field-wrap{position:relative}
        .odo-field-icon{
          position:absolute;left:0.9rem;top:50%;transform:translateY(-50%);
          width:14px;height:14px;color:var(--text-400);pointer-events:none;transition:var(--transition)
        }
        .odo-field-wrap:focus-within .odo-field-icon{color:var(--primary-600)}
        .odo-input{
          width:100%;padding:0.75rem 1rem 0.75rem 2.3rem;
          background:var(--surface-100);border:1.5px solid var(--border-light);
          border-radius:10px;font-family:'Manrope',sans-serif;
          font-size:0.85rem;color:var(--text-elegant);outline:none;transition:var(--transition)
        }
        .odo-input:disabled{background:var(--surface-50);color:var(--text-400);cursor:not-allowed}
        .odo-input:not(:disabled):focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(30,64,175,0.12);background:var(--surface)}
        .odo-input.error{border-color:var(--danger);animation:shake 0.3s ease}
        .odo-input.error:focus{box-shadow:0 0 0 4px rgba(220,38,38,0.12)}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        .odo-error{font-family:'Manrope',sans-serif;font-size:0.7rem;color:var(--danger);font-weight:500;padding-left:0.3rem}
        .odo-hint{font-family:'Manrope',sans-serif;font-size:0.7rem;color:var(--text-400);padding-left:0.3rem}
        
        .odo-edit-actions{display:flex;gap:0.75rem;flex-wrap:wrap}
        .btn-save{
          display:flex;align-items:center;gap:0.5rem;
          padding:0.75rem 1.5rem;
          background:linear-gradient(135deg,var(--primary-600),var(--primary));
          color:#fff;border:none;border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          cursor:pointer;transition:var(--transition);position:relative;overflow:hidden
        }
        .btn-save::before{
          content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          transition:left 0.5s ease
        }
        .btn-save:hover::before{left:100%}
        .btn-save:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(30,64,175,0.35)}
        .btn-save:disabled{background:var(--text-400);cursor:not-allowed;transform:none;box-shadow:none}
        .btn-save:disabled::before{display:none}
        .btn-cancel{
          display:flex;align-items:center;gap:0.4rem;
          padding:0.75rem 1.25rem;
          background:var(--surface-100);color:var(--text-500);
          border:1.5px solid var(--border-light);border-radius:12px;
          font-family:'Manrope',sans-serif;font-size:0.85rem;font-weight:600;
          cursor:pointer;transition:var(--transition)
        }
        .btn-cancel:hover{background:var(--surface);border-color:var(--primary-600);color:var(--primary-600)}
        
        /* ── TABLE CARD ── */
        .odo-card{
          background:var(--surface);border-radius:var(--radius);
          border:1px solid var(--border-light);box-shadow:var(--shadow);
          overflow:hidden;animation:fadeInUp 0.5s ease 0.35s both
        }
        .odo-table-wrap{overflow-x:auto}
        .odo-table{width:100%;border-collapse:collapse;min-width:900px}
        .odo-table thead{background:linear-gradient(135deg,var(--surface-100),var(--surface));border-bottom:1px solid var(--border-light)}
        .odo-table thead th{
          padding:1rem 1.5rem;text-align:left;
          font-family:'Cormorant Garamond',serif;font-size:0.7rem;
          font-weight:600;font-style:italic;color:var(--text-500);
          text-transform:uppercase;letter-spacing:0.1em;white-space:nowrap
        }
        .odo-table tbody tr{border-bottom:1px solid var(--surface-100);transition:var(--transition);position:relative}
        .odo-table tbody tr::before{
          content:'';position:absolute;left:0;top:0;bottom:0;
          width:3px;background:transparent;transition:var(--transition);border-radius:0 4px 4px 0
        }
        .odo-table tbody tr:hover{background:linear-gradient(135deg,var(--surface-100),var(--surface));transform:translateX(4px)}
        .odo-table tbody tr:hover::before{background:var(--primary-600)}
        .odo-table tbody tr.editing{background:linear-gradient(135deg,var(--primary-50),var(--surface))!important;border-left:3px solid var(--primary-600)}
        .odo-table tbody tr:last-child{border-bottom:none}
        .odo-table td{padding:1.1rem 1.5rem;font-size:0.85rem;color:var(--text);vertical-align:middle;font-family:'Manrope',sans-serif;font-weight:400}
        .td-id{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;color:var(--text-400);background:var(--surface-100);padding:0.3rem 0.65rem;border-radius:8px}
        .td-user{display:flex;align-items:center;gap:0.85rem}
        .td-avatar{
          width:40px;height:40px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:700;
          color:#fff;flex-shrink:0;letter-spacing:0.02em;
          box-shadow:0 3px 12px rgba(0,0,0,0.12);transition:var(--transition)
        }
        .odo-table tbody tr:hover .td-avatar{transform:scale(1.08) rotate(3deg)}
        .td-name{font-family:'Manrope',sans-serif;font-weight:600;color:var(--text-elegant);font-size:0.88rem}
        .td-email{color:var(--text-500);font-size:0.8rem;font-family:'Manrope',sans-serif}
        .td-colegiatura{font-family:monospace;font-size:0.8rem;color:var(--text-elegant);background:var(--surface-100);padding:0.35rem 0.7rem;border-radius:6px}
        .td-especialidad{font-family:'Manrope',sans-serif;font-size:0.82rem;font-weight:500;color:var(--text-elegant)}
        .estado-badge{
          display:inline-flex;align-items:center;gap:0.4rem;
          font-family:'Manrope',sans-serif;font-size:0.7rem;font-weight:600;
          padding:0.35rem 0.85rem;border-radius:100px;
          letter-spacing:0.04em;text-transform:uppercase;
          white-space:nowrap;transition:var(--transition);border:1px solid currentColor
        }
        .estado-badge:hover{transform:scale(1.05)}
        .estado-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;animation:blink 2s infinite}
        @keyframes blink{50%{opacity:0.5}}
        
        .td-actions{display:flex;align-items:center;gap:0.5rem}
        .btn-table-edit{
          display:flex;align-items:center;gap:0.35rem;
          padding:0.45rem 0.9rem;
          background:var(--primary-50);color:var(--primary-600);
          border:1px solid var(--primary-100);border-radius:8px;
          font-family:'Manrope',sans-serif;font-size:0.72rem;font-weight:600;
          cursor:pointer;transition:var(--transition)
        }
        .btn-table-edit:hover{background:var(--primary-100);transform:translateY(-1px)}
        .btn-table-delete{
          display:flex;align-items:center;gap:0.35rem;
          padding:0.45rem 0.9rem;
          background:#fff1f2;color:var(--danger);
          border:1px solid #fecdd3;border-radius:8px;
          font-family:'Manrope',sans-serif;font-size:0.72rem;font-weight:600;
          cursor:pointer;transition:var(--transition)
        }
        .btn-table-delete:hover{background:#ffe4e6;transform:translateY(-1px)}
        
        /* Empty state */
        .odo-empty{padding:4rem 2rem;text-align:center}
        .odo-empty-icon{
          width:56px;height:56px;background:linear-gradient(135deg,var(--surface-100),var(--surface));
          border-radius:16px;display:flex;align-items:center;justify-content:center;
          margin:0 auto 1.25rem;color:var(--text-400);
          box-shadow:0 4px 20px rgba(0,0,0,0.06);animation:float 3s ease-in-out infinite
        }
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        .odo-empty-title{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.4rem}
        .odo-empty-sub{font-family:'Manrope',sans-serif;font-size:0.82rem;color:var(--text-500)}
        
        /* Loading */
        .odo-loading{padding:4rem 2rem;display:flex;flex-direction:column;align-items:center;gap:1.25rem;animation:fadeIn 0.4s ease}
        .odo-spinner{width:40px;height:40px;border:3px solid var(--border-light);border-top-color:var(--primary-600);border-radius:50%;animation:spin 1s linear infinite;box-shadow:0 0 0 4px rgba(30,64,175,0.08)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .odo-loading-text{font-family:'Cormorant Garamond',serif;font-size:0.9rem;color:var(--text-500);font-style:italic}
        
        /* Footer */
        .odo-footer{
          padding:0.85rem 1.5rem;background:linear-gradient(135deg,var(--surface-100),var(--surface));
          border-top:1px solid var(--border-light);
          font-family:'Manrope',sans-serif;font-size:0.72rem;color:var(--text-500);
          font-weight:500;display:flex;align-items:center;gap:0.4rem
        }
        .odo-footer svg{color:var(--primary-600)}
        
        /* Loading Overlay */
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
        .loading-text{font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--text-elegant);font-style:italic;font-weight:500}
        
        /* Responsive */
        @media(max-width:900px){
          .topbar-nav{gap:0.15rem}.dropdown-menu{min-width:220px;right:-10px}.btn-action{padding:0.55rem 1rem;font-size:0.83rem}
          .odo-title{font-size:1.8rem}.odo-actions{width:100%;justify-content:space-between}
        }
        @media(max-width:768px){
          .odo-header{flex-direction:column;align-items:stretch}.odo-search-wrap{min-width:100%}
          .odo-table td,.odo-table th{padding:0.9rem 1rem;font-size:0.8rem}.td-avatar{width:36px;height:36px;font-size:0.7rem}
        }
        @media(max-width:600px){
          .topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}
          .odo-title{font-size:1.5rem}.odo-actions{flex-direction:column;align-items:stretch}
          .btn-dashboard,.btn-create{width:100%;justify-content:center}
          .odo-table thead{display:none}.odo-table tbody tr{display:block;padding:1rem;border-bottom:1px solid var(--border-light)}
          .odo-table td{display:flex;justify-content:space-between;padding:0.6rem 1rem;font-size:0.78rem}
          .odo-table td::before{
            content:attr(data-label);font-family:'Cormorant Garamond',serif;
            font-weight:600;font-style:italic;color:var(--text-500);
            text-transform:uppercase;font-size:0.68rem;letter-spacing:0.08em
          }
          .odo-edit-actions{flex-direction:column}.btn-save,.btn-cancel{width:100%}
        }
      `}</style>

      <div className="odo-root">

        {/* ── TOPBAR CON TYPING ANIMATION ── */}
        <header className="odo-topbar">
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
        <main className="odo-content">

          {/* Header de Página + Acciones */}
          <div className="odo-header">
            <div className="odo-header-left">
              <p className="odo-eyebrow">Gestión de personal</p>
              <h1 className="odo-title">Odontólogos</h1>
              {!loading && (
                <div className="odo-count-badge">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  {odontologos.length} registrados
                </div>
              )}
            </div>

            <div className="odo-actions">
              {/* 🔙 BOTÓN VOLVER AL DASHBOARD - DESTACADO */}
              <button onClick={() => navigate("/admin/dashboard")} className="btn-dashboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Volver al Dashboard
              </button>
              
              <Link to="/admin/crear-odontologo" className="btn-create">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nuevo Odontólogo
              </Link>

              <div className="odo-search-wrap">
                <svg className="odo-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input className="odo-search" placeholder="Buscar odontólogo..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── PANEL DE EDICIÓN (CORREGIDO: Solo visible al editar) ── */}
          <div className={`odo-edit-panel ${editingOdontologo ? 'active' : ''}`}>
            <div className="odo-edit-header">
              <div className="odo-edit-icon" style={{ background: editingOdontologo ? 'transparent' : 'var(--surface-100)', color: editingOdontologo ? '#fff' : 'var(--text-400)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div>
                <p className="odo-edit-title">
                  {editingOdontologo ? `✏️ Editando: ${form.nombres} ${form.apellidos}` : "Panel de edición"}
                </p>
                <p className="odo-edit-sub">
                  {editingOdontologo ? `ID #${editingOdontologo.idOdontologo} • Modifica los campos y guarda los cambios` : "Selecciona un odontólogo de la tabla para editar"}
                </p>
              </div>
            </div>

            <div className="odo-edit-body">
              <div className="odo-form-grid">
                {/* Campos de solo lectura */}
                <div className="odo-field-group">
                  <label className="odo-field-label">Nombres</label>
                  <div className="odo-field-wrap">
                    <svg className="odo-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input className="odo-input" value={form.nombres} disabled placeholder="Nombres" />
                  </div>
                </div>

                <div className="odo-field-group">
                  <label className="odo-field-label">Apellidos</label>
                  <div className="odo-field-wrap">
                    <svg className="odo-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input className="odo-input" value={form.apellidos} disabled placeholder="Apellidos" />
                  </div>
                </div>

                <div className="odo-field-group">
                  <label className="odo-field-label">Correo electrónico</label>
                  <div className="odo-field-wrap">
                    <svg className="odo-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <input className="odo-input" value={form.email} disabled placeholder="correo@ejemplo.com" />
                  </div>
                </div>

                <div className="odo-field-group">
                  <label className="odo-field-label">Teléfono</label>
                  <div className="odo-field-wrap">
                    <svg className="odo-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.37 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <input className="odo-input" value={form.telefono} disabled placeholder="+51 987 654 321" />
                  </div>
                </div>

                {/* Campos editables */}
                <div className="odo-field-group">
                  <label className="odo-field-label">ID Usuario <span className="required">*</span></label>
                  <div className="odo-field-wrap">
                    <svg className="odo-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <input name="idUsuario" className={`odo-input ${errors.idUsuario ? 'error' : ''}`} placeholder="Ej. 123" value={form.idUsuario} onChange={handleChange} inputMode="numeric" />
                  </div>
                  {errors.idUsuario && <span className="odo-error">{errors.idUsuario}</span>}
                </div>

                <div className="odo-field-group">
                  <label className="odo-field-label">ID Especialidad <span className="required">*</span></label>
                  <div className="odo-field-wrap">
                    <svg className="odo-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <input name="idEspecialidad" className={`odo-input ${errors.idEspecialidad ? 'error' : ''}`} placeholder="Ej. 5" value={form.idEspecialidad} onChange={handleChange} inputMode="numeric" />
                  </div>
                  {errors.idEspecialidad && <span className="odo-error">{errors.idEspecialidad}</span>}
                </div>

                <div className="odo-field-group">
                  <label className="odo-field-label">Nº Colegiatura <span className="required">*</span></label>
                  <div className="odo-field-wrap">
                    <svg className="odo-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    <input name="numeroColegiatura" className={`odo-input ${errors.numeroColegiatura ? 'error' : ''}`} placeholder="Ej. COL-2024-0856" value={form.numeroColegiatura} onChange={handleChange} />
                  </div>
                  {errors.numeroColegiatura ? (
                    <span className="odo-error">{errors.numeroColegiatura}</span>
                  ) : (
                    <span className="odo-hint">Formato sugerido: COL-AÑO-NÚMERO</span>
                  )}
                </div>
              </div>

              <div className="odo-edit-actions">
                <button onClick={handleActualizar} disabled={saving} className="btn-save">
                  {saving ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:'spin 1s linear infinite'}}><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                      Guardar cambios
                    </>
                  )}
                </button>
                <button onClick={cerrarPanelEdicion} className="btn-cancel">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          {/* ── TABLA DE ODONTÓLOGOS ── */}
          <div className="odo-card">
            {loading ? (
              <div className="odo-loading">
                <div className="odo-spinner" />
                <span className="odo-loading-text">Cargando odontólogos...</span>
              </div>
            ) : (
              <>
                <div className="odo-table-wrap">
                  <table className="odo-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Odontólogo</th>
                        <th>Contacto</th>
                        <th>Colegiatura</th>
                        <th>Especialidad</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan="7"><div className="odo-empty"><div className="odo-empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg></div><p className="odo-empty-title">{search ? "Sin resultados" : "No hay odontólogos registrados"}</p><p className="odo-empty-sub">{search ? `Ningún resultado para "${search}"` : "Los odontólogos aparecerán aquí una vez creados."}</p></div></td></tr>
                      ) : (
                        filtered.map((o) => {
                          const isEditing = editingOdontologo?.idOdontologo === o.idOdontologo;
                          return (
                            <tr key={o.idOdontologo} className={isEditing ? 'editing' : ''}>
                              <td data-label="ID"><span className="td-id">#{o.idOdontologo}</span></td>
                              <td data-label="Odontólogo">
                                <div className="td-user">
                                  <div className="td-avatar" style={{ background: avatarColor(o.idOdontologo) }}>{initials(o.usuario?.nombres, o.usuario?.apellidos)}</div>
                                  <span className="td-name">{o.usuario?.nombres} {o.usuario?.apellidos}</span>
                                </div>
                              </td>
                              <td data-label="Contacto">
                                <p className="td-email">{o.usuario?.email || "—"}</p>
                                <p style={{fontSize:'0.75rem',color:'var(--text-400)'}}>{o.usuario?.telefono || "—"}</p>
                              </td>
                              <td data-label="Colegiatura"><span className="td-colegiatura">{o.numeroColegiatura || "—"}</span></td>
                              <td data-label="Especialidad"><span className="td-especialidad">{o.especialidad?.nombreEspecialidad || <span style={{color:'var(--text-400)'}}>Sin asignar</span>}</span></td>
                              <td data-label="Estado">
                                <span className="estado-badge" style={o.estado ? {background:'#f0fdf4',color:'#16a34a',borderColor:'#bbf7d0'}:{background:'#f1f5f9',color:'#94a3b8',borderColor:'#e2e8f0'}}>
                                  <span className="estado-dot" />{o.estado ? "Activo" : "Inactivo"}
                                </span>
                              </td>
                              <td data-label="Acciones">
                                <div className="td-actions">
                                  <button className="btn-table-edit" onClick={() => abrirPanelEdicion(o)}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                  </button>
                                  <button className="btn-table-delete" onClick={() => handleEliminar(o.idOdontologo)}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 0 && (
                  <div className="odo-footer">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Mostrando {filtered.length} de {odontologos.length} odontólogos{search && <span style={{marginLeft:'0.5rem',opacity:0.7}}>• Filtrado</span>}
                  </div>
                )}
              </>
            )}
          </div>

        </main>

        {/* ── Loading Overlay al guardar ── */}
        {saving && (
          <div className="loading-overlay" role="status" aria-live="polite">
            <div className="loading-card">
              <div className="loading-spinner" />
              <span className="loading-text">Actualizando odontólogo...</span>
            </div>
          </div>
        )}

      </div>
    </>
  );
}