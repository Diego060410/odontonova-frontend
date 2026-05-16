import { Link } from "react-router-dom";

export default function Sidebar() {

const rol = localStorage.getItem("rol");

return(

<div className="w-64 bg-blue-900 text-white min-h-screen p-5">

<h2 className="text-2xl font-bold mb-6">
Clínica Aura Dental
</h2>

<nav className="flex flex-col gap-4">

{rol === "ADMIN" && (

<>
<Link to="/admin">Dashboard</Link>
<Link to="/pacientes">Pacientes</Link>
<Link to="/odontologos">Odontólogos</Link>
</>

)}

{rol === "USER" && (

<>
<Link to="/paciente">Inicio</Link>
<Link to="/citas">Mis Citas</Link>
</>

)}

</nav>

</div>

)

}