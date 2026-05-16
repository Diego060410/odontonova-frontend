import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex">
      {/* Sidebar fijo */}
      <Sidebar />

      <div className="flex-1">
        {/* Navbar arriba */}
        <Navbar />

        {/* Contenido principal */}
        <div className="p-6 bg-gray-100 min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}