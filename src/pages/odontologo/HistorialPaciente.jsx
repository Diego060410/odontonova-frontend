import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import OdontologoLayout from "../../layouts/OdontologoLayout";
import citaService from "../../services/citaService";
import horarioService from "../../services/horarioService"; 
import { getUsuarioById } from "../../services/usuarioService";

export default function DashboardOdontologo() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [horarios, setHorarios] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    citasHoy: 0,
    pacientes: 0,
    pendientes: 0,
    atendidas: 0
  });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const idUsuario = localStorage.getItem("id_usuario");
      const idOdontologo = localStorage.getItem("id_odontologo");

      if (!idUsuario) {
        navigate("/login");
        return;
      }

      const [userData, citas, dataHorarios] = await Promise.all([
        getUsuarioById(idUsuario),
        citaService.getCitasOdontologo(idOdontologo),
        horarioService.getByOdontologo(idOdontologo)
      ]);

      setUsuario(userData);
      
      // ✅ MEJORA: Validar si dataHorarios es un array directamente o viene dentro de .data
      const rawHorarios = Array.isArray(dataHorarios) ? dataHorarios : (dataHorarios?.data || []);
      
      // ✅ ORDENAR: Del más cercano al más lejano (comparando fechas)
      const horariosOrdenados = [...rawHorarios].sort((a, b) => {
        return new Date(a.fecha) - new Date(b.fecha);
      });
      
      setHorarios(horariosOrdenados);

      const listaCitas = Array.isArray(citas) ? citas : [];
      const hoy = new Date().toISOString().split("T")[0];
      const citasHoyData = listaCitas.filter(c => c?.fecha === hoy);
      
      const pacientesUnicos = new Set(
        listaCitas.map(c => c?.paciente?.idPaciente).filter(id => id !== undefined)
      );
      
      setStats({
        citasHoy: citasHoyData.length,
        pacientes: pacientesUnicos.size,
        pendientes: listaCitas.filter(c => c?.estadoCita?.nombreEstado === "PENDIENTE").length,
        atendidas: listaCitas.filter(c => c?.estadoCita?.nombreEstado === "ATENDIDO").length
      });
      setCitasHoy(citasHoyData);

    } catch (error) {
      console.error("Error al cargar los datos:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  if (loading) return <div className="p-10 text-center">Cargando dashboard...</div>;

  return (
    <OdontologoLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* HEADER */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">👨‍⚕️ Dr. {usuario?.nombres}</h1>
            <p className="text-gray-500">Panel de Control General</p>
          </div>
          <button
            onClick={() => navigate("/odontologo/horario")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
          >
            ⚙️ Gestionar Horarios
          </button>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard title="Citas Hoy" value={stats.citasHoy} color="blue" />
          <StatCard title="Pacientes" value={stats.pacientes} color="green" />
          <StatCard title="Pendientes" value={stats.pendientes} color="yellow" />
          <StatCard title="Atendidas" value={stats.atendidas} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECCIÓN IZQUIERDA: CITAS DE HOY */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📅 Citas de Hoy
            </h2>
            <div className="space-y-4">
              {citasHoy.length === 0 ? (
                <p className="bg-white p-6 rounded-lg border text-gray-500">No hay citas programadas para hoy.</p>
              ) : (
                citasHoy.map(c => (
                  <div key={c.idCita} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{c.paciente?.nombres} {c.paciente?.apellidos}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        🕒 {c.horaInicio ? c.horaInicio.substring(0,5) : "--:--"}
                      </p>
                    </div>
                    <span className="text-xs font-bold uppercase bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                      {c.estadoCita?.nombreEstado}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* SECCIÓN DERECHA: MIS HORARIOS DE ATENCIÓN */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              ⏰ Mi Horario de Atención
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {horarios.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-gray-400 italic">No has registrado disponibilidad aún.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase">Día</th>
                      <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Horario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((h, index) => (
                      <tr key={h.idHorario || h.id_horario || index} className="border-t border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="p-3 text-sm text-gray-600 font-medium">{h.fecha || "---"}</td>
                        <td className="p-3 text-sm font-bold text-blue-700">{h.diaSemana}</td>
                        <td className="p-3 text-sm text-gray-600 text-center bg-gray-50 font-mono">
                          {h.horaInicio ? h.horaInicio.substring(0,5) : "--:--"} - {h.horaFin ? h.horaFin.substring(0,5) : "--:--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </OdontologoLayout>
  );
}

function StatCard({ title, value, color }) {
  const colors = { 
    blue: "text-blue-600 border-blue-100", 
    green: "text-green-600 border-green-100", 
    yellow: "text-yellow-600 border-yellow-100", 
    purple: "text-purple-600 border-purple-100" 
  };
  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border ${colors[color]}`}>
      <p className={`text-3xl font-black ${colors[color].split(' ')[0]}`}>{value}</p>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
    </div>
  );
}