import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000, // ⏱ evita requests colgadas
  headers: {
    "Content-Type": "application/json",
  },
});

/* ───────── INTERCEPTOR REQUEST ───────── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ───────── INTERCEPTOR RESPONSE ───────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API ERROR:", error?.response?.data || error.message);

    // 🔐 Si el token expiró
    if (error.response?.status === 401) {
      console.warn("⚠️ Sesión expirada");
      localStorage.removeItem("token");
      // opcional:
      // window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;