import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import citaService from "../../services/citaService";
import OdontologoLayout from "../../layouts/OdontologoLayout";

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      const data = await citaService.getPacientes();
      setPacientes(data || []);
    } catch (error) {
      console.error("Error cargando pacientes", error);
    }
  };

  return (
    <OdontologoLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Mis Pacientes</h2>

        {pacientes.length === 0 ? (
          <p>No hay pacientes</p>
        ) : (
          pacientes.map((p) => (
            <div
              key={p.idUsuario || p.idPaciente || p.id_paciente}
              className="bg-white p-4 mb-3 rounded shadow flex justify-between items-center"
            >
              <p>
                {p.nombres || "Paciente"} {p.apellidos || ""}
              </p>

              <button
                onClick={() =>
                  navigate(
                    `/odontologo/historial/${
                      p.idUsuario || p.idPaciente || p.id_paciente
                    }`
                  )
                }
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Ver Historial
              </button>
            </div>
          ))
        )}
      </div>
    </OdontologoLayout>
  );
}