// src/layouts/OdontologoLayout.jsx
import { useNavigate } from "react-router-dom";

export default function OdontologoLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px", backgroundColor: "#f4f7fe" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Panel Odontólogo</h2>
        
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 15px",
            backgroundColor: "#e11d48",
            color: "white",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Cerrar Sesión
        </button>
      </header>
      <main>{children}</main>
    </div>
  );
}