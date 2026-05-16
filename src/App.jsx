import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ================= AUTH ================= */
import Login from "./pages/Login";
import Registro from "./pages/Registro";

/* ================= PACIENTE ================= */
import DashboardPaciente from "./pages/paciente/DashboardPaciente";
import NuevaCita from "./pages/paciente/NuevaCita";
import Historial from "./pages/paciente/Historial";
import MisCitas from "./pages/paciente/MisCitas";
import CompletarPerfil from "./pages/paciente/CompletarPerfil"; 
import PerfilPaciente from "./pages/paciente/PerfilPaciente";

/* ================= ADMIN ================= */
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Usuarios from "./pages/admin/Usuarios";
import Odontologos from "./pages/admin/Odontologos";
import Pacientes from "./pages/admin/Pacientes";
import CitasAdmin from "./pages/admin/CitasAdmin";
import Sedes from "./pages/admin/Sedes";
import Consultorios from "./pages/admin/Consultorios";
import CrearUsuarioOdontologo from "./pages/admin/CrearUsuarioOdontologo";
import CrearPerfilOdontologo from "./pages/admin/CrearPerfilOdontologo";
import CrearSede from "./pages/admin/CrearSede";
import CrearConsultorio from "./pages/admin/CrearConsultorio";
import Especialidades from "./pages/admin/Especialidades";
import CrearEspecialidad from "./pages/admin/CrearEspecialidad";
import CrearUsuario from "./pages/admin/CrearUsuario";
import CrearCitaAdmin from "./pages/admin/CrearCitaAdmin"; 
import PerfilAdmin from "./pages/admin/PerfilAdmin";

/* ================= ODONTOLOGO ================= */
import DashboardOdontologo from "./pages/odontologo/DashboardOdontologo";
import CitasOdontologo from "./pages/odontologo/CitasOdontologo";
import HistorialPaciente from "./pages/odontologo/HistorialPaciente";
import PacientesOdontologo from "./pages/odontologo/PacientesOdontologo";
/* ✅ IMPORTAMOS LOS COMPONENTES QUE ME PASASTE */
import HorarioOdontologo from "./pages/odontologo/HorarioOdontologo"; 
import HorarioForm from "./pages/odontologo/HorarioForm"; 
import MisCitasOdontologo from "./pages/odontologo/MisCitasOdontologo";
import CitasAtendidasOdontologo from "./pages/odontologo/CitasAtendidasOdontologo";
import PerfilOdontologo from "./pages/odontologo/PerfilOdontologo";

/* ================= RECEPCIONISTA ================= */
import DashboardRecepcionista from "./pages/recepcionista/DashboardRecepcionista";
import CrearCitaRecepcionista from "./pages/recepcionista/CrearCitaRecepcionista";
import AgendaCitasRecepcionista from "./pages/recepcionista/AgendaCitasRecepcionista";
import PacienteRecepcion from "./pages/recepcionista/PacienteRecepcion";
import PacienteForm from "./pages/recepcionista/PacienteForm";
import DisponibilidadRecepcion from "./pages/recepcionista/DisponibilidadRecepcion";
import PerfilRecepcionista from "./pages/recepcionista/PerfilRecepcionista";

/* ================= SEGURIDAD ================= */
import PrivateRoute from "./layouts/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PUBLICAS ================= */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* ================= ADMIN ================= */}
        <Route path="/admin/dashboard" element={<PrivateRoute roleRequired="ADMIN"><DashboardAdmin /></PrivateRoute>} />
        <Route path="/admin/usuarios" element={<PrivateRoute roleRequired="ADMIN"><Usuarios /></PrivateRoute>} />
        <Route path="/admin/odontologos" element={<PrivateRoute roleRequired="ADMIN"><Odontologos /></PrivateRoute>} />
        <Route path="/admin/crear-odontologo" element={<PrivateRoute roleRequired="ADMIN"><CrearUsuarioOdontologo /></PrivateRoute>} />
        <Route path="/admin/crear-odontologo/:correo" element={<PrivateRoute roleRequired="ADMIN"><CrearPerfilOdontologo /></PrivateRoute>} />
        <Route path="/admin/editar-odontologo/:id" element={<PrivateRoute roleRequired="ADMIN"><CrearPerfilOdontologo /></PrivateRoute>} />
        <Route path="/admin/pacientes" element={<PrivateRoute roleRequired="ADMIN"><Pacientes /></PrivateRoute>} />
        <Route path="/admin/citas" element={<PrivateRoute roleRequired="ADMIN"><CitasAdmin /></PrivateRoute>} />
        <Route path="/admin/sedes" element={<PrivateRoute roleRequired="ADMIN"><Sedes /></PrivateRoute>} />
        <Route path="/admin/crear-sede" element={<PrivateRoute roleRequired="ADMIN"><CrearSede /></PrivateRoute>} />
        <Route path="/admin/consultorios" element={<PrivateRoute roleRequired="ADMIN"><Consultorios /></PrivateRoute>} />
        <Route path="/admin/crear-consultorio" element={<PrivateRoute roleRequired="ADMIN"><CrearConsultorio /></PrivateRoute>} />
        <Route path="/admin/especialidades" element={<PrivateRoute roleRequired="ADMIN"><Especialidades /></PrivateRoute>} />
        <Route path="/admin/crear-especialidad" element={<PrivateRoute roleRequired="ADMIN"><CrearEspecialidad /></PrivateRoute>} />
        <Route path="/admin/editar-especialidad/:id" element={<PrivateRoute roleRequired="ADMIN"><CrearEspecialidad /></PrivateRoute>} />
        <Route path="/admin/crear-usuario" element={<CrearUsuario />} />
        <Route path="/admin/perfil" element={<PrivateRoute roleRequired="ADMIN"><PerfilAdmin /></PrivateRoute>
  }
/>
        <Route path="/admin/crear-cita" element={<PrivateRoute roleRequired="ADMIN"><CrearCitaAdmin /></PrivateRoute>} />
        

        {/* ================= ODONTOLOGO ================= */}
        
        <Route
          path="/odontologo/citas-atendidas"
          element={<CitasAtendidasOdontologo />}
        />
        <Route
          path="/odontologo/mis-citas"
          element={<MisCitasOdontologo />}
        />
        <Route
          path="/odontologo/dashboard"
          element={
            <PrivateRoute roleRequired="ODONTOLOGO">
              <DashboardOdontologo />
            </PrivateRoute>
          }
        />

        {/* ✅ RUTA CORREGIDA: Ahora muestra la lista de horarios */}
        <Route
          path="/odontologo/horario"
          element={
            <PrivateRoute roleRequired="ODONTOLOGO">
              <HorarioOdontologo />
            </PrivateRoute>
          }
        />

        {/* ✅ NUEVA RUTA: Para el formulario de agregar horario */}
        <Route
          path="/odontologo/nuevo-horario"
          element={
            <PrivateRoute roleRequired="ODONTOLOGO">
              <HorarioForm />
            </PrivateRoute>
          }
        />

        <Route
          path="/odontologo/perfil"
          element={
            <PrivateRoute roleRequired="ODONTOLOGO">
              <PerfilOdontologo />
            </PrivateRoute>
          }
        />

        {/* ✅ AGREGADO: Ruta para EDITAR horario (usa el mismo HorarioForm) */}
        <Route
          path="/odontologo/editar-horario/:id"
          element={
            <PrivateRoute roleRequired="ODONTOLOGO">
              <HorarioForm />
            </PrivateRoute>
          }
        />

        <Route path="/odontologo/citas" element={<PrivateRoute roleRequired="ODONTOLOGO"><CitasOdontologo /></PrivateRoute>} />
        <Route path="/odontologo/pacientes" element={<PrivateRoute roleRequired="ODONTOLOGO"><PacientesOdontologo /></PrivateRoute>} />
        <Route path="/odontologo/historial/:idPaciente" element={<PrivateRoute roleRequired="ODONTOLOGO"><HistorialPaciente /></PrivateRoute>} />

        {/* ================= PACIENTE ================= */}
        <Route path="/paciente/completar-perfil" element={<PrivateRoute roleRequired="USER"><CompletarPerfil /></PrivateRoute>} />
        <Route path="/paciente/dashboard" element={<PrivateRoute roleRequired="USER"><DashboardPaciente /></PrivateRoute>} />
        <Route path="/paciente/nueva-cita" element={<PrivateRoute roleRequired="USER"><NuevaCita /></PrivateRoute>} />
        <Route path="/paciente/mis-citas" element={<PrivateRoute roleRequired="USER"><MisCitas /></PrivateRoute>} />
        <Route path="/paciente/historial" element={<PrivateRoute roleRequired="USER"><Historial /></PrivateRoute>} />
        <Route path="/paciente/reagendar" element={<PrivateRoute roleRequired="USER"><NuevaCita /></PrivateRoute>} />
        <Route
          path="/paciente/perfil"
          element={<PerfilPaciente />}
        />

        {/* ================= RECEPCIONISTA ================= */}
        
        <Route path="/recepcion/crear-cita" element={<CrearCitaRecepcionista />} />
        
        {/* Agenda Global de Citas */}
        <Route 
          path="/recepcion/citas" 
          element={
            <PrivateRoute roleRequired="RECEPCIONISTA">
              <AgendaCitasRecepcionista />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/recepcion/dashboard" 
          element={
            <PrivateRoute roleRequired="RECEPCIONISTA">
              <DashboardRecepcionista />
            </PrivateRoute>
          } 
        />

        <Route
          path="/recepcion/disponibilidad"
          element={<DisponibilidadRecepcion />}
        />

        <Route
          path="/recepcion/perfil"
          element={<PerfilRecepcionista />}
        />
        
        {/* ================= PACIENTES RECEPCION ================= */}

        <Route 
          path="/recepcion/pacientes" 
          element={
            <PrivateRoute roleRequired="RECEPCIONISTA">
              <PacienteRecepcion />
            </PrivateRoute>
          } 
        />

        <Route
          path="/recepcion/pacientes/nuevo"
          element={
            <PrivateRoute roleRequired="RECEPCIONISTA">
              <PacienteForm />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;