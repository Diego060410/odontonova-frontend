import api from "./api";

/* =========================
   OBTENER POR ID DE USUARIO (LA QUE FALTABA)
========================= */
export const getOdontologoByUsuario = async (idUsuario) => {
  try {
    // Ajusta la URL según tu backend, comúnmente es /odontologos/usuario/${idUsuario}
    const res = await api.get(`/odontologos/usuario/${idUsuario}`);
    return res.data;
  } catch (error) {
    console.error("Error obteniendo odontólogo por usuario", error);
    return null;
  }
};

/* =========================
   LISTAR ODONTÓLOGOS POR CONSULTORIO
========================= */
export const listarOdontologosPorConsultorio = async (idConsultorio) => {
  try {
    const res = await api.get(
      `/odontologos/consultorio/${idConsultorio}`
    );

    return {
      success: true,
      data: res.data
    };

  } catch (error) {

    console.error(
      "Error obteniendo odontólogos por consultorio",
      error
    );

    return {
      success: false,
      data: []
    };
  }
};

/* =========================
   LISTAR ODONTÓLOGOS
========================= */
  export const listarOdontologos = async () => {
    try {

      const res = await api.get("/odontologos");

      return {
        success: true,
        data: res.data
      };

    } catch (error) {

      console.error(
        "Error obteniendo odontólogos",
        error
      );

      return {
        success: false,
        data: []
      };
    }
  };

/* =========================
   CREAR PERFIL ODONTÓLOGO
========================= */
export const crearPerfilOdontologo = async (data) => {
  try {
    const res = await api.post("/odontologos", {
      idUsuario: Number(data.idUsuario),
      idEspecialidad: Number(data.idEspecialidad),
      numeroColegiatura: data.numeroColegiatura,
      estado: true
    });
    return {
      success: true,
      data: res.data
    };
  } catch (error) {
    console.error("Error creando odontólogo", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error al crear odontólogo"
    };
  }
};

/* =========================
   ACTUALIZAR ODONTÓLOGO
========================= */
export const actualizarOdontologo = async (id, data) => {
  try {
    const res = await api.put(`/odontologos/${id}`, {
      idUsuario: data.idUsuario,
      idEspecialidad: Number(data.idEspecialidad),
      numeroColegiatura: data.numeroColegiatura,
      estado: data.estado ?? true
    });
    return {
      success: true,
      data: res.data
    };
  } catch (error) {
    console.error("Error actualizando odontólogo", error);
    return {
      success: false,
      message: error.response?.data?.message || "Error al actualizar"
    };
  }
};

/* =========================
   ELIMINAR ODONTÓLOGO
========================= */
export const eliminarOdontologo = async (id) => {
  try {
    await api.delete(`/odontologos/${id}`);
    return {
      success: true
    };
  } catch (error) {
    console.error("Error eliminando odontólogo", error);
    return {
      success: false,
      message: "Error al eliminar odontólogo"
    };
  }
};