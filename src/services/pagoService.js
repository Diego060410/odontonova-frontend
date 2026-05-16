import api from "./api";

/* ===========================
   💳 CREAR PAGO
=========================== */
export const crearPago = async (data) => {
  try {
    const res = await api.post("/pagos", data);
    return res.data;
  } catch (error) {
    console.error("❌ Error al crear pago:", error.response?.data || error);
    throw error;
  }
};