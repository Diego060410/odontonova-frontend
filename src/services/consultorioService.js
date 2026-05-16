import api from "./api";

// 🔹 Listar todos los consultorios
export const listarConsultorios = () => api.get("/consultorios");

// 🔹 Obtener consultorio por ID
export const obtenerConsultorio = (id) => api.get(`/consultorios/${id}`);

// 🔹 Crear nuevo consultorio
export const crearConsultorio = (data) =>
  api.post("/consultorios", data); // data debe incluir: idSede, nombreConsultorio, piso, descripcion, estado

// 🔹 Actualizar consultorio
export const actualizarConsultorio = (id, data) =>
  api.put(`/consultorios/${id}`, data); // data debe incluir: idSede, nombreConsultorio, piso, descripcion, estado

// 🔹 Eliminar consultorio
export const eliminarConsultorio = (id) => api.delete(`/consultorios/${id}`);