  import axios from "axios";

  // Si ya tienes un archivo api.js configurado, podrías usar: import api from "./api";
  // Pero aquí usaremos la configuración completa para asegurar que no falte nada.
  const API_URL = "http://localhost:8080/api/citas";

  /* ========================= 🔐 TOKEN & HEADERS ========================= */

  const getToken = () => localStorage.getItem("token");

  const authHeader = () => {
    const token = getToken();
    if (!token) {
      throw new Error("❌ No hay token de autenticación");
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  /* ========================= ❌ ERROR HANDLER ========================= */

  const handleError = (error, msg) => {
    // Extraemos el mensaje si viene en un objeto, o el data si es un string directo
    const serverError = error?.response?.data;
    const backendMsg = serverError?.message || (typeof serverError === 'string' ? serverError : null);
    
    const finalMsg = backendMsg || error.message || msg;
    
    console.error("Detalle técnico:", error.response?.data);
    throw new Error(finalMsg);
  };
  /* ========================= 🧱 AUXILIARES ========================= */

  const getIdPacienteFromCita = (c) =>
    c.idPaciente || c.paciente?.idPaciente || c.paciente?.id || null;

  const buildPayload = (cita, override = {}) => {
    return {
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      motivo: cita.motivo || "",
      observaciones: cita.observaciones || "",
      idConsultorio: Number(cita.idConsultorio),
      idOdontologo: Number(cita.idOdontologo),
      idSede: Number(cita.idSede),
      idPaciente: Number(cita.idPaciente || cita.paciente?.idPaciente),
      idEstadoCita: Number(override.idEstadoCita ?? cita.idEstadoCita ?? 1),
    };
  };

  /* ========================= 📌 MÉTODOS CRUD ========================= */

  export const listarCitas = async () => {
    try {
      const res = await axios.get(API_URL, authHeader());
      return res.data || [];
    } catch (e) {
      handleError(e, "Error al listar todas las citas");
    }
  };

  export const obtenerCita = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/${id}`, authHeader());
      return res.data;
    } catch (e) {
      handleError(e, "Error al obtener la cita");
    }
  };

  export const crearCita = async (form) => {
    try {
      const idUsuario = localStorage.getItem("id_usuario");
      if (!idUsuario) throw new Error("Usuario no logueado");

      const payload = {
        ...buildPayload(form),
        fechaRegistro: new Date().toISOString(),
        registradoBy: Number(idUsuario), // Ajustado según tu tabla usuario
      };

      const res = await axios.post(API_URL, payload, authHeader());
      return res.data;
    } catch (e) {
      handleError(e, "Error al crear cita");
    }
  };

  export const actualizarCita = async (id, form) => {
    try {
      const payload = buildPayload(form);
      const res = await axios.put(`${API_URL}/${id}`, payload, authHeader());
      return res.data;
    } catch (e) {
      handleError(e, "Error al actualizar cita");
    }
  };

  export const eliminarCita = async (id) => {
    try {
      const res = await axios.delete(`${API_URL}/${id}`, authHeader());
      return res.data;
    } catch (e) {
      handleError(e, "Error al eliminar cita");
    }
  };

  /* ========================= 🏥 MÉTODOS ESPECÍFICOS ========================= */

  // Obtener mis citas (para Pacientes)
  export const getMisCitas = async (idPaciente) => {
    try {
      const res = await axios.get(API_URL, authHeader());
      return (res.data || []).filter(
        (c) => Number(getIdPacienteFromCita(c)) === Number(idPaciente)
      );
    } catch (e) {
      handleError(e, "Error al obtener mis citas");
    }
  };

  export const cancelarCita = async (id) => {
    try {
      // Enviamos el estado 3 (Cancelada) al endpoint específico
      const res = await axios.put(`${API_URL}/${id}/estado`, { idEstado: 3 }, authHeader());
      return res.data;
    } catch (e) {
      // Aquí handleError lanzará el mensaje: "No se puede cancelar: debe hacerse con 48h..."
      handleError(e, "Error al cancelar cita");
    }
  };

  // Citas por Odontólogo
  export const getCitasOdontologo = async (idOdontologo) => {
    try {
      const res = await axios.get(`${API_URL}/odontologo/${idOdontologo}`, authHeader());
      return res.data;
    } catch (e) {
      handleError(e, "Error al obtener citas del odontólogo");
    }
  };

  // Cambiar estado (Ruta específica)
  export const cambiarEstadoCita = async (id, idEstado) => {
    try {
      const res = await axios.put(`${API_URL}/${id}/estado`, { idEstado }, authHeader());
      return res.data;
    } catch (e) {
      handleError(e, "Error al cambiar estado");
    }
  };

  // Historial del paciente
  export const getHistorial = async (idPaciente) => {
    try {
      const res = await axios.get(`${API_URL}/paciente/${idPaciente}`, authHeader());
      return res.data;
    } catch (e) {
      handleError(e, "Error al obtener historial");
    }
  }

  // Estadísticas del Dashboard
  export const getDashboard = async (idOdontologo) => {
    try {
      const res = await axios.get(`${API_URL}/dashboard/${idOdontologo}`, authHeader());
      return res.data;
    } catch (e) {
      handleError(e, "Error al obtener datos del dashboard");
    }
  };

  /* ========================= 📦 EXPORT DEFAULT ========================= */

  export default {
    listarCitas,
    obtenerCita,
    crearCita,
    actualizarCita,
    eliminarCita,
    getMisCitas,
    cancelarCita,
    getCitasOdontologo,
    cambiarEstadoCita,
    getHistorial,
    getDashboard,
  };