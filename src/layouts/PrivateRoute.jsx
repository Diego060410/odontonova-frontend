import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, roleRequired }) {

  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // quitar ROLE_
  const rolLimpio = rol?.replace("ROLE_", "");

  if (roleRequired && rolLimpio !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
}