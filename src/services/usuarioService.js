import api from "./api";

/* ===========================
   🔥 CREAR USUARIO (REGISTER)
=========================== */
export const crearUsuario = async (usuario) => {
  try {
    const res = await api.post("/auth/register", {
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      documentoIdentidad: usuario.documentoIdentidad,
      correo: usuario.correo,
      telefono: usuario.telefono,
      username: usuario.username,
      password: usuario.password,
      nombreRol: usuario.nombreRol || "USER"
    });

    return res.data;

  } catch (err) {
    console.error("❌ Error en crearUsuario:", err.response?.data || err.message);
    throw new Error(
      err.response?.data?.message || "Error al registrar usuario"
    );
  }
};

/* ===========================
   🔥 OBTENER TODOS LOS USUARIOS
=========================== */
export const getUsuarios = async () => {
  try {
    const res = await api.get("/usuarios");
    return res.data;
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    throw new Error("No se pudo obtener usuarios");
  }
};

/* ===========================
   🔥 BUSCAR USUARIO POR USERNAME
=========================== */
export const getUsuarioByUsername = async (username) => {
  try {
    const usuarios = await getUsuarios();

    const usuario = usuarios.find(
      (u) => u.username === username
    );

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    return usuario;

  } catch (error) {
    console.error("❌ Error en getUsuarioByUsername:", error);
    throw error;
  }
};

/* ===========================
   🔥 OBTENER USUARIO POR ID
=========================== */
export const getUsuarioById = async (idUsuario) => {
  try {
    const res = await api.get(`/usuarios/${idUsuario}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error al obtener usuario por ID:", error);
    throw new Error("No se pudo obtener usuario");
  }
};