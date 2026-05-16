import api from "./api";

/* ===========================
   🔥 CREAR PACIENTE
=========================== */
export const crearPaciente = async (data) => {
  try {
    const res = await api.post("/pacientes", {
      idUsuario: data.idUsuario,
      nombres: data.nombres,
      apellidos: data.apellidos,
      documentoIdentidad: data.documentoIdentidad,
      fechaNacimiento: data.fechaNacimiento,
      sexo: data.sexo,
      telefono: data.telefono,
      correo: data.correo,
      direccion: data.direccion,
      alergias: data.alergias,
      observaciones: data.observaciones,
      estado: data.estado ?? true
    });

    return res.data;

  } catch (error) {
    console.error("❌ Error al crear paciente:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || "Error al crear paciente"
    );
  }
};

/* ===========================
   🔥 OBTENER TODOS LOS PACIENTES
=========================== */
export const getPacientes = async () => {
  try {
    const res = await api.get("/pacientes");
    return res.data;
  } catch (error) {
    console.error("❌ Error al obtener pacientes:", error);
    throw new Error("No se pudo obtener pacientes");
  }
};

/* ===========================
   🔥 BUSCAR PACIENTE POR idUsuario
=========================== */
export const getPacienteByUsuario = async (idUsuario) => {
  try {
    const pacientes = await getPacientes();

    const paciente = pacientes.find(
      (p) => p.usuario?.idUsuario === Number(idUsuario)
    );

    return paciente || null;

  } catch (error) {
    console.error("❌ Error al buscar paciente:", error);
    return null;
  }
};

/* ===========================
   🔥 OBTENER PACIENTE POR ID
=========================== */
export const getPacienteById = async (idPaciente) => {
  try {
    const res = await api.get(`/pacientes/${idPaciente}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error al obtener paciente:", error);
    throw new Error("No se pudo obtener paciente");
  }
};

/* ===========================
   🔥 ACTUALIZAR PACIENTE
=========================== */
export const actualizarPaciente = async (idPaciente, data) => {
  try {
    const res = await api.put(`/pacientes/${idPaciente}`, data);
    return res.data;
  } catch (error) {
    console.error("❌ Error al actualizar paciente:", error);
    throw new Error("No se pudo actualizar paciente");
  }
};

/* ===========================
   🔥 ELIMINAR PACIENTE
=========================== */
export const eliminarPaciente = async (idPaciente) => {
  try {
    await api.delete(`/pacientes/${idPaciente}`);
  } catch (error) {
    console.error("❌ Error al eliminar paciente:", error);
    throw new Error("No se pudo eliminar paciente");
  }
};