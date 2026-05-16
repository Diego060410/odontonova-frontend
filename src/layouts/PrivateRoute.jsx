import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, roleRequired }) {

  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");

  if (!token) {
    return <Navigate to="/" />;
  }

  if (roleRequired && rol !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;

}