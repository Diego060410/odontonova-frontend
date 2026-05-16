import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { crearPaciente } from "../../services/pacienteService";
import { getUsuarioById } from "../../services/usuarioService";

export default function CompletarPerfil() {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    documentoIdentidad: "",
    correo: "",
    telefono: "",
    fechaNacimiento: "",
    sexo: "",
    direccion: "",
    tieneAlergias: "NO",
    alergias: ""
  });

  /* ===============================
     🔥 CARGAR USUARIO
  =============================== */
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const idUsuario = localStorage.getItem("id_usuario");
        const usuario = await getUsuarioById(idUsuario);

        setForm((prev) => ({
          ...prev,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          documentoIdentidad: usuario.documentoIdentidad,
          correo: usuario.correo,
          telefono: usuario.telefono || ""
        }));
      } catch (error) {
        console.error("Error cargando usuario", error);
      }
    };

    cargarUsuario();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  /* ===============================
     🔥 SUBMIT
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const idUsuario = localStorage.getItem("id_usuario");

      const data = {
        idUsuario: Number(idUsuario),
        nombres: form.nombres,
        apellidos: form.apellidos,
        documentoIdentidad: form.documentoIdentidad,
        correo: form.correo,
        telefono: form.telefono,
        fechaNacimiento: form.fechaNacimiento,
        sexo: form.sexo,
        direccion: form.direccion,
        alergias: form.tieneAlergias === "SI" ? form.alergias : "Ninguna",
        observaciones: "",
        estado: true
      };

      await crearPaciente(data);

      alert("✅ Perfil completado correctamente");
      navigate("/paciente/dashboard");

    } catch (error) {
      console.error(error);
      alert("❌ Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     🎨 ESTILOS
  =============================== */

  const label =
    "text-sm font-semibold text-gray-600 mb-1 block";

  const input =
    "w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition";

  const disabled =
    "w-full p-3 rounded-xl bg-gray-200 text-gray-500 cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">

      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-10">

        {/* HEADER */}
        <div className="mb-8">

          <h2 className="text-3xl font-bold text-gray-800">
            Completar Perfil 🧾
          </h2>

          <p className="text-gray-500 mt-2">
            Ingresa la información necesaria para crear tu historial clínico
          </p>

        </div>

        <form onSubmit={handleSubmit}>

          {/* DATOS PERSONALES */}
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Información Personal
          </h3>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className={label}>Nombres</label>
              <input value={form.nombres} className={disabled} disabled />
            </div>

            <div>
              <label className={label}>Apellidos</label>
              <input value={form.apellidos} className={disabled} disabled />
            </div>

          </div>

          <div className="mt-4">
            <label className={label}>Documento de Identidad</label>
            <input value={form.documentoIdentidad} className={disabled} disabled />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">

            <div>
              <label className={label}>Correo</label>
              <input value={form.correo} className={disabled} disabled />
            </div>

            <div>
              <label className={label}>Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className={input}
              />
            </div>

          </div>


          {/* DATOS MÉDICOS */}
          <h3 className="text-lg font-semibold text-gray-700 mt-8 mb-4">
            Información Médica
          </h3>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <label className={label}>Fecha de nacimiento</label>
              <input
                type="date"
                name="fechaNacimiento"
                onChange={handleChange}
                className={input}
                required
              />
            </div>

            <div>
              <label className={label}>Sexo</label>
              <select
                name="sexo"
                onChange={handleChange}
                className={input}
                required
              >
                <option value="">Selecciona</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

          </div>

          <div className="mt-4">
            <label className={label}>Dirección</label>
            <input
              name="direccion"
              onChange={handleChange}
              className={input}
            />
          </div>


          {/* ALERGIAS */}
          <h3 className="text-lg font-semibold text-gray-700 mt-8 mb-4">
            Información de Salud
          </h3>

          <label className={label}>¿Tienes alergias?</label>

          <select
            name="tieneAlergias"
            value={form.tieneAlergias}
            onChange={handleChange}
            className={input}
          >
            <option value="NO">No</option>
            <option value="SI">Sí</option>
          </select>

          {form.tieneAlergias === "SI" && (
            <input
              name="alergias"
              placeholder="Ej: Penicilina, anestesia..."
              onChange={handleChange}
              className={input + " mt-3"}
              required
            />
          )}

          {/* BOTON */}
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold mt-8 hover:bg-blue-700 transition shadow-md"
          >
            {loading ? "Guardando..." : "Guardar Perfil"}
          </button>

        </form>

      </div>
    </div>
  );
}