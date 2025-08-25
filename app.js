// app.js

// Espera a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("partidoDropdown");
  const pilotoSpan = document.getElementById("piloto");
  const fechaSpan = document.getElementById("fecha");

  // Función para obtener partidos desde la serverless API
  async function fetchPartidos() {
    try {
      const response = await fetch("/api/partidos");
      const partidos = await response.json();
      return partidos;
    } catch (error) {
      console.error("Error al obtener partidos:", error);
      return [];
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
