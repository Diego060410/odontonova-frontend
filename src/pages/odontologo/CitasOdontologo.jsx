import { useEffect, useState } from "react";
import OdontologoLayout from "../../layouts/OdontologoLayout";
import citaService from "../../services/citaService";

const ESTADOS = {
  PENDIENTE: 1,
  ATENDIDO: 2,
  CANCELADO: 3
};

export default function CitasOdontologo() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Intentamos obtener el ID de 'id_usuario' o 'id_odontologo' para mayor seguridad
  const idOdontologo = localStorage.getItem("id_usuario") || localStorage.getItem("id_odontologo");

  useEffect(() => {
    if (idOdontologo) {
      cargarCitas();
    } else {
      console.error("No se encontró el ID del odontólogo en el almacenamiento local.");
      setLoading(false);
    }
  }, [idOdontologo]);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      console.log("🔍 Consultando citas para ID:", idOdontologo);
      
      const data = await citaService.getCitasOdontologo(Number(idOdontologo));
      setCitas(data || []);
    } catch (error) {
      console.error("❌ Error al cargar citas:", error);
      setCitas([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleEstado = async (id, nombreEstado) => {
    try {
      const estadoId = ESTADOS[nombreEstado];
      await citaService.cambiarEstadoCita(id, estadoId);
      await cargarCitas(); 
    } catch (error) {
      console.error("Error al cambiar estado", error);
    }
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case "PENDIENTE": return "bg-yellow-100 text-yellow-700";
      case "ATENDIDO": return "bg-green-100 text-green-700";
      case "CANCELADO": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <OdontologoLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Sincronizando citas...</p>
        </div>
      </OdontologoLayout>
    );
  }

  return (
    <OdontologoLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Mis Citas 🦷</h1>

        {!idOdontologo ? (
          <div className="bg-red-50 p-4 text-red-700 rounded-lg">
            Error: Sesión no válida. Por favor, vuelva a iniciar sesión.
          </div>
        ) : citas.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500 italic border border-dashed">
            No tienes citas registradas para mostrar 😴.
          </div>
        ) : (
          <div className="grid gap-4">
            {citas.map((c) => {
              const estado = c.estadoCita?.nombreEstado;
              return (
                <div key={c.idCita} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-bold text-lg text-gray-900">
                      {c.paciente?.nombres} {c.paciente?.apellidos}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      📅 {c.fecha} | ⏰ {c.horaInicio?.substring(0, 5)} - {c.horaFin?.substring(0, 5)}
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${getColorEstado(estado)}`}>
                      {estado || "SIN ESTADO"}
                    </span>
                  </div>

                  <div className="mt-4 md:mt-0 flex gap-2">
                    <button
                      onClick={() => handleEstado(c.idCita, "ATENDIDO")}
                      disabled={estado !== "PENDIENTE"}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Atender
                    </button>
                    <button
                      onClick={() => handleEstado(c.idCita, "CANCELADO")}
                      disabled={estado !== "PENDIENTE"}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </OdontologoLayout>
  );
}