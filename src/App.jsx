function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="p-10 bg-slate-800 rounded-3xl shadow-2xl border border-blue-500/30 text-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
          ¡CONECTADO!
        </h1>
        <p className="text-slate-400 text-lg font-medium">
          Jeison, Tailwind CSS ya está funcionando.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20">React</span>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm border border-emerald-500/20">Tailwind</span>
          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm border border-purple-500/20">Vite</span>
        </div>
      </div>
    </div>
  )
}

export default App