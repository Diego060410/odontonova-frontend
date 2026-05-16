import api from "./api"; // tu axios con token

// Guardar una nueva sede
export const guardarSede = async (sede) => {
  const res = await api.post("/sedes", sede);
  return res.data;
};

// Listar todas las sedes
export const listarSedes = async () => {
  const res = await api.get("/sedes");
  return res.data;
};

// Obtener sede por ID
export const obtenerSede = async (id) => {
  const res = await api.get(`/sedes/${id}`);
  return res.data;
};

// Actualizar sede
export const actualizarSede = async (id, sede) => {
  const res = await api.put(`/sedes/${id}`, sede);
  return res.data;
};

// Eliminar sede
export const eliminarSede = async (id) => {
  const res = await api.delete(`/sedes/${id}`);
  return res.data;
};