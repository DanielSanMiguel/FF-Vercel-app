// app.js

// Espera a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("partidoDropdown");
  const pilotoSpan = document.getElementById("piloto");
  const fechaSpan = document.getElementById("fecha");

  // Función para obtener partidos desde la serverless API
  async function cargarPartidos() {
  try {
    const response = await fetch("/api/partidos");
    if (!response.ok) throw new Error("Error en la API");

    const partidos = await response.json();
    console.log("Partidos:", partidos);

    const dropdown = document.getElementById("partidoDropdown");
    partidos.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${p.piloto} - ${p.fecha}`;
      dropdown.appendChild(option);
    });

  } catch (err) {
    console.error("Error al cargar partidos:", err);
  }
}

  // Llenar dropdown con partidos
  fetchPartidos().then(partidos => {
    partidos.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${p.id} - ${p.piloto} (${p.fecha})`;
      dropdown.appendChild(option);
    });

    // Selección por defecto
    if (partidos.length > 0) {
      dropdown.value = partidos[0].id;
      mostrarDatosPartido(partidos[0]);
    }
  });

  // Mostrar datos del partido seleccionado
  function mostrarDatosPartido(partido) {
    pilotoSpan.textContent = partido.piloto;
    fechaSpan.textContent = partido.fecha;
  }

  // Evento cuando cambia la selección
  dropdown.addEventListener("change", async (e) => {
    const partidos = await fetchPartidos();
    const partidoSeleccionado = partidos.find(p => p.id === e.target.value);
    if (partidoSeleccionado) {
      mostrarDatosPartido(partidoSeleccionado);
    }
  });
});
