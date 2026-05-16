import PacienteLayout from "../../layouts/PacienteLayout";

export default function Historial() {
  const tratamientos = [
    { fecha: "15 Sep 2026", tipo: "Limpieza Profunda", doc: "Dr. Alberto Ruiz", status: "Completado" },
    { fecha: "02 Ago 2026", tipo: "Extracción Simple", doc: "Dra. Elena Martínez", status: "Completado" }
  ];

  return (
    <PacienteLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-8 tracking-tight">Historial Clínico</h1>
        <div className="space-y-4">
          {tratamientos.map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="bg-emerald-50 text-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center text-xl">📄</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.fecha}</p>
                  <p className="font-bold text-slate-800">{t.tipo}</p>
                  <p className="text-xs text-slate-500 italic">{t.doc}</p>
                </div>
              </div>
              <button className="text-[#0E71CD] font-bold text-xs uppercase tracking-widest hover:underline">Descargar PDF</button>
            </div>
          ))}
        </div>
      </div>
    </PacienteLayout>
  );
}