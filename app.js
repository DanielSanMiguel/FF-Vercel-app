async function cargarPartidos() {
  try {
    const response = await fetch("/api/partidos");
    if (!response.ok) throw new Error("Error en la API");

    const partidos = await response.json();

    const dropdown = document.getElementById("partidoDropdown");
    partidos.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${p.piloto} - ${p.fecha}`;
      dropdown.appendChild(option);
    });

    dropdown.addEventListener("change", e => {
      const seleccionado = partidos.find(p => p.id === e.target.value);
      if (!seleccionado) return;

      document.getElementById("analista").value = seleccionado.analista;
      document.getElementById("mail").value = seleccionado.mail;
      document.getElementById("piloto").value = seleccionado.piloto;
      document.getElementById("fecha").value = seleccionado.fecha;
    });

  } catch (err) {
    console.error("Error al cargar partidos:", err);
  }
}

document.addEventListener("DOMContentLoaded", cargarPartidos);

