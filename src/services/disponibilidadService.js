import api from "./api";

export const obtenerDisponibilidad = (odontologoId, fecha) => {
  return api.get(`/disponibilidad?odontologo=${odontologoId}&fecha=${fecha}`);
};