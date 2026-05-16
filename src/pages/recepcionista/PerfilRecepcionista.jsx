import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../services/api";

export default function PerfilRecepcionista() {
  const navigate = useNavigate();

  // ── Estados ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(false);
  
  const [perfil, setPerfil] = useState({
    idUsuario: "",
    nombres: "",
    apellidos: "",
    correo: "",
    telefono: "",
    dni: "",
    username: "",
    nuevaPassword: ""
  });

  // ── Typing Animation para "OdontoNova" ──
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

  // ── Cargar perfil ──
  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    try {
      const idUsuario = localStorage.getItem("id_usuario");
      if (!idUsuario) { navigate("/login"); return; }

      const res = await api.get(`/usuarios/${idUsuario}`);
      const data = res.data;

      setPerfil({
        idUsuario: data.idUsuario,
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
        correo: data.correo || "",
        telefono: data.telefono || "",
        dni: data.documentoIdentidad || "",
        username: data.username || "",
        nuevaPassword: ""
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No se pudo cargar tu perfil. Intenta nuevamente.",
        confirmButtonColor: "#0e71cd"
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Cierre de dropdowns al hacer click fuera ──
  useEffect(() => {
    const handleClick = (e) => { if (!e.target.closest('.dropdown')) setMenuOpen(null); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("id_usuario");
    localStorage.removeItem("id_recepcionista");
    navigate("/login", { replace: true });
  };

  const handleChange = (e) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  // ── Validación de formulario ──
  const validarFormulario = () => {
    const errors = [];
    if (!perfil.correo.trim()) {
      errors.push("El correo electrónico es obligatorio");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.correo)) {
      errors.push("Formato de correo inválido");
    }
    if (perfil.nuevaPassword && perfil.nuevaPassword.length < 6) {
      errors.push("La contraseña debe tener al menos 6 caracteres");
    }
    return errors;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    
    const errors = validarFormulario();
    if (errors.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Campos inválidos",
        html: errors.map(err => `• ${err}`).join("<br>"),
        confirmButtonColor: "#0e71cd"
      });
      return;
    }

    setSaving(true);
    
    try {
      const payload = {
        idRol: 4, // RECEPCIONISTA
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        documentoIdentidad: perfil.dni,
        correo: perfil.correo,
        telefono: perfil.telefono,
        username: perfil.username,
        estado: true,
        // ✅ CORRECCIÓN DE SEGURIDAD: Solo enviamos password si el usuario escribió algo nuevo
        // ❌ ANTES: password: perfil.nuevaPassword.trim() !== "" ? perfil.nuevaPassword : "123456"
        password: perfil.nuevaPassword.trim() !== "" ? perfil.nuevaPassword : undefined
      };

      await api.put(`/usuarios/${perfil.idUsuario}`, payload);

      Swal.fire({
        icon: "success",
        title: "✅ Perfil actualizado",
        text: "Los cambios se guardaron correctamente",
        confirmButtonColor: "#16a34a",
        timer: 2000,
        timerProgressBar: true
      });

      setPerfil({ ...perfil, nuevaPassword: "" });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.response?.data?.message || "Verifica tu conexión e intenta nuevamente",
        confirmButtonColor: "#dc2626"
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Módulos de navegación (Recepción) ──
  const navModules = [
    { to: "/recepcion/citas", label: "Agenda de Citas", icon: <CalendarIcon /> },
    { to: "/recepcion/pacientes", label: "Pacientes", icon: <UsersIcon /> },
    { to: "/recepcion/disponibilidad", label: "Ver Horarios", icon: <ClockIcon /> },
    { to: "/recepcion/perfil", label: "Mi Perfil", icon: <ProfileIcon /> },
  ];

  // ── Acciones rápidas ──
  const quickActions = [
    { to: "/recepcion/pacientes/nuevo", label: "Nuevo Paciente", accent: "#0e71cd" },
    { to: "/recepcion/citas/nueva", label: "Nueva Cita", accent: "#059669" },
    { to: "/recepcion/reportes", label: "Reportes", accent: "#7c3aed" },
  ];

  // ── Iconos SVG ──
  function CalendarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
  function UsersIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; }
  function ClockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
  function ProfileIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
  function MailIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>; }
  function PhoneIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>; }
  function LockIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
  function CheckIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
  function EyeIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>; }
  function EyeOffIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.92-2.19 2.5-4.1 4.46-5.5"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.05 11.05 0 0 1-4.08 5.19"/><path d="M1 1l22 22"/><path d="M9.53 9.53a3 3 0 0 0 4.24 4.24"/></svg>; }
  function DeskIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/><path d="M15 21V9"/></svg>; }

  // ── Loading State ──
  if (loading) {
    return (
      <>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        <div style={{ minHeight: "100vh", background: "var(--surface-50)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', system-ui" }}>
          <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease" }}>
            <div style={{ width: 48, height: 48, border: "3px solid var(--border-light)", borderTopColor: "var(--primary-600)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.25rem" }} />
            <p style={{ color: "var(--text-500)", fontSize: "0.9rem", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Cargando perfil...</p>
          </div>
        </div>
      </>
    );
  }

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
        body{font-family:'Manrope',system-ui,sans-serif;background:var(--surface-50);-webkit-font-smoothing:antialiased}
        
        /* ── ROOT & TOPBAR ── */
        .perfil-root{min-height:100vh;background:linear-gradient(180deg,#fafafa 0%,#f8fafc 100%)}
        .perfil-topbar{background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(226,232,240,0.7);padding:0 clamp(1.25rem,4vw,2.5rem);height:72px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;box-shadow:var(--shadow)}
        .topbar-brand{display:flex;align-items:center;gap:1rem;cursor:pointer;transition:var(--transition)}.topbar-brand:hover{transform:scale(1.02)}
        .topbar-name{font-family:'Cormorant Garamond',serif;font-size:2.5rem;font-weight:500;font-style:italic;color:var(--text-elegant);line-height:1.1}
        .typing-wrapper{display:inline-flex;gap:0.02em}.typing-char.nova{color:var(--primary-600);font-weight:700;font-style:italic;background:linear-gradient(135deg,var(--primary-600),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}.typing-cursor{width:2.5px;height:2.2rem;background:var(--primary-600);margin-left:3px;border-radius:2px;opacity:0;vertical-align:baseline}.typing-cursor.active{opacity:1;animation:blink 1s step-end infinite}@keyframes blink{50%{opacity:0}}
        
        .topbar-nav{display:flex;align-items:center;gap:0.35rem}.dropdown{position:relative}
        .dropdown-btn{display:flex;align-items:center;gap:0.5rem;padding:0.55rem 1.1rem;border-radius:12px;font-size:0.87rem;font-weight:600;color:var(--text-500);background:transparent;border:1px solid transparent;cursor:pointer;transition:var(--transition)}.dropdown-btn:hover,.dropdown-btn.active{color:var(--primary-600);background:var(--primary-50);border-color:var(--primary-100);box-shadow:0 4px 16px rgba(14,113,205,0.1)}
        .dropdown-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:240px;background:var(--surface);border:1px solid var(--border-light);border-radius:var(--radius-sm);box-shadow:var(--shadow-lg);padding:0.75rem;opacity:0;visibility:hidden;transform:translateY(-10px) scale(0.98);transition:var(--transition);z-index:101;animation:menuElegant 0.25s ease forwards}.dropdown.active .dropdown-menu{opacity:1;visibility:visible;transform:translateY(0) scale(1)}@keyframes menuElegant{from{opacity:0;transform:translateY(-10px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .dropdown-item{display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1.1rem;border-radius:10px;font-size:0.87rem;font-weight:500;color:var(--text-elegant);text-decoration:none;transition:var(--transition);position:relative;overflow:hidden}.dropdown-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:var(--transition)}.dropdown-item:hover{background:var(--primary-50);color:var(--primary-600);transform:translateX(6px);padding-left:1.4rem}.dropdown-item:hover::before{background:var(--primary-600)}
        .dropdown-label{padding:0.45rem 1.1rem;font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;color:var(--text-400);text-transform:uppercase;letter-spacing:0.12em}
        .btn-action{display:flex;align-items:center;gap:0.55rem;padding:0.65rem 1.35rem;border-radius:14px;font-size:0.87rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;border:1px solid transparent;position:relative;overflow:hidden}.btn-action::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);transition:left 0.5s ease}.btn-action:hover::before{left:100%}.btn-profile{background:var(--primary-50);color:var(--primary-600);border-color:var(--primary-100)}.btn-logout{background:#fff1f2;color:var(--danger);border-color:#fecdd3}.btn-action:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,0,0,0.12)}
        .topbar-badge{background:var(--primary-100);color:var(--primary-600);font-family:'Cormorant Garamond',serif;font-size:0.72rem;font-weight:600;font-style:italic;letter-spacing:0.08em;text-transform:uppercase;padding:0.4rem 0.95rem;border-radius:100px}
        
        /* ── CONTENT ── */
        .perfil-content{padding:clamp(2rem,5vw,3rem);max-width:800px;margin:0 auto;animation:fadeInUp 0.5s ease}@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .perfil-header{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:2rem;flex-wrap:wrap}
        .perfil-title-group{display:flex;flex-direction:column;gap:0.35rem}.perfil-eyebrow{font-family:'Cormorant Garamond',serif;font-size:0.75rem;font-weight:600;font-style:italic;letter-spacing:0.18em;text-transform:uppercase;color:var(--primary-600);display:flex;align-items:center;gap:0.5rem}.perfil-eyebrow::before{content:'';width:28px;height:1px;background:linear-gradient(90deg,var(--primary-600),transparent);border-radius:1px}.perfil-title{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;color:var(--text-elegant);line-height:1.1}
        .btn-back{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.25rem;background:var(--text-elegant);color:#fff;border:none;border-radius:12px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none}.btn-back:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(15,23,42,0.25)}
        
        /* ── PROFILE CARD ── */
        .perfil-card{background:var(--surface);border-radius:var(--radius);border:1px solid var(--border-light);box-shadow:var(--shadow);padding:clamp(1.5rem,4vw,2.5rem);animation:fadeInUp 0.5s ease 0.1s both}
        .perfil-header-card{display:flex;align-items:center;gap:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border-light);margin-bottom:2rem}
        .perfil-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--primary-100),var(--primary-50));display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0;box-shadow:0 4px 20px rgba(14,113,205,0.15);border:3px solid var(--surface);color:var(--primary-600)}
        .perfil-info h2{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--text-elegant);margin-bottom:0.25rem}.perfil-info p{font-size:0.85rem;color:var(--text-500)}
        .perfil-role{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.72rem;font-weight:600;color:var(--primary-600);background:var(--primary-50);padding:0.3rem 0.75rem;border-radius:100px;margin-top:0.5rem}
        
        /* ── FORM GRID ── */
        .form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem}
        .form-group{display:flex;flex-direction:column;gap:0.5rem}.form-label{font-size:0.8rem;font-weight:600;color:var(--text-500);display:flex;align-items:center;gap:0.4rem}.form-label svg{color:var(--text-400)}
        .form-input{width:100%;padding:0.9rem 1.1rem;background:var(--surface-100);border:1.5px solid var(--border-light);border-radius:12px;font-family:'Manrope',sans-serif;font-size:0.9rem;color:var(--text);transition:var(--transition);outline:none}.form-input:focus{border-color:var(--primary-600);box-shadow:0 0 0 4px rgba(14,113,205,0.12);background:var(--surface)}.form-input:disabled{background:var(--surface-100);color:var(--text-400);cursor:not-allowed;border-style:dashed}
        .form-hint{font-size:0.72rem;color:var(--text-400);margin-top:0.25rem}
        .form-input.readonly{background:var(--surface-100);color:var(--text-400);cursor:not-allowed}
        
        /* ── PASSWORD FIELD ── */
        .password-wrap{grid-column:1 / -1;position:relative}
        .password-input{padding-right:3rem}
        .password-toggle{position:absolute;right:12px;top:50%;transform:translateY(-50%);border:none;background:transparent;cursor:pointer;color:var(--text-400);display:flex;align-items:center;justify-content:center;padding:4px;border-radius:8px;transition:var(--transition)}.password-toggle:hover{color:var(--primary-600);background:var(--primary-50)}.password-toggle svg{width:18px;height:18px}
        
        /* ── SUBMIT BUTTON ── */
        .btn-submit{grid-column:1 / -1;padding:1rem 1.5rem;background:linear-gradient(135deg,var(--primary-600),var(--primary));color:#fff;border:none;border-radius:14px;font-family:'Manrope',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;transition:var(--transition);display:flex;align-items:center;justify-content:center;gap:0.6rem;box-shadow:0 4px 20px rgba(14,113,205,0.25);position:relative;overflow:hidden;margin-top:0.5rem}.btn-submit::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);transition:left 0.5s ease}.btn-submit:hover::before{left:100%}.btn-submit:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(14,113,205,0.35)}.btn-submit:active{transform:translateY(0)}.btn-submit:disabled{opacity:0.7;cursor:not-allowed;transform:none;box-shadow:none}.btn-submit .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        
        /* ── FOOTER HELP ── */
        .perfil-footer{margin-top:2rem;padding-top:1.5rem;border-top:1px dashed var(--border-light);text-align:center;font-size:0.8rem;color:var(--text-500)}.perfil-footer a{color:var(--primary-600);text-decoration:none;font-weight:600}.perfil-footer a:hover{text-decoration:underline}
        
        /* ── SWEETALERT2 CUSTOMIZATION ── */
        .swal2-popup{font-family:'Manrope',sans-serif!important;border-radius:var(--radius-sm)!important}.swal2-title{font-family:'Cormorant Garamond',serif!important;color:var(--text-elegant)!important;font-size:1.25rem!important}.swal2-html-container{color:var(--text-500)!important}.swal2-confirm{background:var(--primary-600)!important;border-radius:12px!important;font-weight:600!important}.swal2-icon.swal2-success{border-color:var(--success)!important}.swal2-icon.swal2-success [class^='swal2-success-line']{background:var(--success)!important}.swal2-icon.swal2-success .swal2-success-ring{border-color:rgba(22,163,74,0.3)!important}
        
        /* ── RESPONSIVE ── */
        @media(max-width:768px){.perfil-header{flex-direction:column;align-items:stretch}.btn-back{width:100%;justify-content:center}.perfil-header-card{flex-direction:column;text-align:center}.form-grid{grid-template-columns:1fr}}
        @media(max-width:600px){.topbar-brand span{display:none}.dropdown-menu{position:fixed;top:76px;left:1rem;right:1rem;min-width:auto;border-radius:16px}.perfil-title{font-size:1.6rem}.perfil-avatar{width:64px;height:64px;font-size:1.5rem}}
      `}</style>

      <div className="perfil-root">
        {/* ── TOPBAR CONSISTENTE ── */}
        <header className="perfil-topbar">
          <div className="topbar-brand" onClick={() => navigate("/recepcion/dashboard")}>
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
                <span className="dropdown-label">Navegación</span>
                {navModules.map((m) => (
                  <Link key={m.to} to={m.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)}>{m.icon}{m.label}</Link>
                ))}
              </div>
            </div>

            {/* Dropdown: Acciones Rápidas */}
            <div className={`dropdown ${menuOpen === 'actions' ? 'active' : ''}`}>
              <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === 'actions' ? null : 'actions'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Acciones
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="dropdown-menu" role="menu">
                <span className="dropdown-label">Acciones rápidas</span>
                {quickActions.map((q) => (
                  <Link key={q.to} to={q.to} className="dropdown-item" role="menuitem" onClick={() => setMenuOpen(null)} style={{ borderLeft: `3px solid ${q.accent}`, paddingLeft: '0.65rem' }}>{q.label}</Link>
                ))}
              </div>
            </div>

            <Link to="/recepcion/perfil" className="btn-action btn-profile">Perfil</Link>
            <span className="topbar-badge">Recepción</span>
            <button onClick={handleLogout} className="btn-action btn-logout">Salir</button>
          </nav>
        </header>

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="perfil-content">
          <div className="perfil-header">
            <div className="perfil-title-group">
              <p className="perfil-eyebrow">Cuenta & Acceso</p>
              <h1 className="perfil-title">Mi Perfil</h1>
            </div>
            <button onClick={() => navigate("/recepcion/dashboard")} className="btn-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Volver al Dashboard
            </button>
          </div>

          <div className="perfil-card">
            {/* Header del perfil */}
            <div className="perfil-header-card">
              <div className="perfil-avatar" aria-label="Avatar de recepcionista">
                <DeskIcon />
              </div>
              <div className="perfil-info">
                <h2>{perfil.nombres} {perfil.apellidos}</h2>
                <p>Recepcionista de OdontoNova</p>
                <span className="perfil-role">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  Rol: Recepcionista
                </span>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardar} className="form-grid">
              {/* Campos de solo lectura */}
              <div className="form-group">
                <label className="form-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Nombres
                </label>
                <input type="text" value={perfil.nombres} disabled className="form-input readonly" aria-readonly="true" />
                <span className="form-hint">No editable</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Apellidos
                </label>
                <input type="text" value={perfil.apellidos} disabled className="form-input readonly" aria-readonly="true" />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
                  DNI
                </label>
                <input type="text" value={perfil.dni} disabled className="form-input readonly" aria-readonly="true" />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
                  Usuario
                </label>
                <input type="text" value={perfil.username} disabled className="form-input readonly" aria-readonly="true" />
              </div>

              {/* Campos editables */}
              <div className="form-group">
                <label className="form-label" htmlFor="correo">
                  <MailIcon />
                  Correo electrónico *
                </label>
                <input
                  id="correo"
                  type="email"
                  name="correo"
                  value={perfil.correo}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="tu@email.com"
                  required
                  aria-required="true"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="telefono">
                  <PhoneIcon />
                  Teléfono
                </label>
                <input
                  id="telefono"
                  type="tel"
                  name="telefono"
                  value={perfil.telefono}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+51 999 999 999"
                  pattern="[+0-9\s\-()]{7,20}"
                />
                <span className="form-hint">Formato internacional recomendado</span>
              </div>

              {/* Nueva contraseña con toggle */}
              <div className="form-group password-wrap">
                <label className="form-label" htmlFor="nuevaPassword">
                  <LockIcon />
                  Nueva Contraseña
                </label>
                <input
                  id="nuevaPassword"
                  type={showPassword ? "text" : "password"}
                  name="nuevaPassword"
                  value={perfil.nuevaPassword}
                  onChange={handleChange}
                  className="form-input password-input"
                  placeholder="•••••••• (dejar vacío para mantener la actual)"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                <span className="form-hint">Mínimo 6 caracteres. Solo completa si deseas cambiarla.</span>
              </div>

              {/* Botón submit */}
              <button type="submit" className="btn-submit" disabled={saving} aria-busy={saving}>
                {saving ? (
                  <>
                    <span className="spinner" />
                    Guardando cambios...
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Guardar Cambios
                  </>
                )}
              </button>
            </form>

            {/* Footer help */}
            <div className="perfil-footer">
              ¿Necesitas ayuda? <a href="#soporte">Contacta al equipo de soporte OdontoNova</a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}