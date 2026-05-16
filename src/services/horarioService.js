import axios from "axios";

// URL corregida según tu @RequestMapping("/api/horarios-odontologos")
const API = "https://odontologobackend.onrender.com/api/horarios-odontologos";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Coincide con @GetMapping
const listar = async () => {
  const res = await axios.get(API, getAuthHeaders());
  return res.data;
};

// Coincide con @GetMapping("/{id}")
const obtenerPorId = async (id) => {
  const res = await axios.get(`${API}/${id}`, getAuthHeaders());
  return res.data;
};

// Coincide con @GetMapping("/odontologo/{idOdontologo}")
const getByOdontologo = async (idOdontologo) => {
  const res = await axios.get(`${API}/odontologo/${idOdontologo}`, getAuthHeaders());
  return res.data;
};

// Coincide con @PostMapping
const crear = async (data) => {
  const res = await axios.post(API, data, getAuthHeaders());
  return res.data;
};

// Coincide con @PutMapping("/{id}")
const actualizar = async (id, data) => {
  const res = await axios.put(`${API}/${id}`, data, getAuthHeaders());
  return res.data;
};

// Coincide con @DeleteMapping("/{id}")
const eliminar = async (id) => {
  const res = await axios.delete(`${API}/${id}`, getAuthHeaders());
  return res.data;
};

export default {
  listar,
  obtenerPorId,
  getByOdontologo,
  crear,
  actualizar,
  eliminar
};