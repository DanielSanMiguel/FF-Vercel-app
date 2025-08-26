document.addEventListener("DOMContentLoaded", () => {
    const partidoSelect = document.getElementById("partidoSelect");
    const analistaInput = document.getElementById("analistaInput");
    const mailInput = document.getElementById("mailInput");
    const enviarBtn = document.getElementById("enviarBtn");
    const statusDiv = document.getElementById("status");

    // Cargar partidos desde la Serverless Function
    async function fetchPartidos() {
        try {
            const res = await fetch("/api/partidos");
            if (!res.ok) throw new Error("No se pudo cargar los partidos");
            const records = await res.json();

            partidoSelect.innerHTML = "";
            records.forEach(r => {
                const option = document.createElement("option");
                option.value = r.id;
                option.textContent = `${r.fields["ID-partido"]} - ${r.fields.Piloto} (${r.fields["Fecha partido"]})`;
                partidoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al obtener partidos:", error);
            statusDiv.textContent = "Error al cargar los partidos.";
            statusDiv.style.color = "red";
        }
    }

    // Enviar formulario
    enviarBtn.addEventListener("click", async () => {
        const partidoId = partidoSelect.value;
        const analista = analistaInput.value.trim();
        const mail = mailInput.value.trim();

        if (!partidoId || !analista || !mail) {
            statusDiv.textContent = "Todos los campos son obligatorios.";
            statusDiv.style.color = "orange";
            return;
        }

        statusDiv.textContent = "Procesando...";
        statusDiv.style.color = "blue";

        try {
          const res = await fetch("/api/enviar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partidoId, analista, mail })
          });
        
          // Leer la respuesta como texto primero
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            console.error("Respuesta no JSON:", text);
            statusDiv.textContent = "Error inesperado del servidor.";
            statusDiv.style.color = "red";
            return;
          }
        
          if (res.ok) {
            statusDiv.innerHTML = `PDF generado correctamente: <a href="${data.url}" target="_blank">Ver PDF</a><br>Hash: ${data.hash}`;
            statusDiv.style.color = "green";
          } else {
            throw new Error(data.error || "Error desconocido");
          }
        } catch (error) {
          console.error("Error al enviar:", error);
          statusDiv.textContent = "Error al procesar el envío.";
          statusDiv.style.color = "red";
        }
    });

    // Inicializar
    fetchPartidos();
});
