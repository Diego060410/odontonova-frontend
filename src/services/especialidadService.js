import api from "./api";

// Guardar una nueva especialidad
export const guardarEspecialidad = async (especialidad) => {
  const payload = {
    nombreEspecialidad: especialidad.nombreEspecialidad || "",
    descripcion: especialidad.descripcion || "",
    estado: especialidad.estado !== undefined ? especialidad.estado : true
  };
  const res = await api.post("/especialidades", payload);
  return res.data;
};

// Listar todas las especialidades
export const listarEspecialidades = async () => {
  const res = await api.get("/especialidades");
  return res.data;
};

// Obtener especialidad por ID
export const obtenerEspecialidad = async (id) => {
  const res = await api.get(`/especialidades/${id}`);
  return res.data;
};

// Actualizar especialidad
export const actualizarEspecialidad = async (id, especialidad) => {
  const payload = {
    nombreEspecialidad: especialidad.nombreEspecialidad || "",
    descripcion: especialidad.descripcion || "",
    estado: especialidad.estado !== undefined ? especialidad.estado : true
  };
  const res = await api.put(`/especialidades/${id}`, payload);
  return res.data;
};

// Eliminar especialidad
export const eliminarEspecialidad = async (id) => {
  const res = await api.delete(`/especialidades/${id}`);
  return res.data;
};