import { v4 as uuidv4 } from 'uuid';
document.addEventListener("DOMContentLoaded", () => {
    const partidoSelect = document.getElementById("partidoSelect");
    const analistaInput = document.getElementById("analistaInput");
    const mailInput = document.getElementById("mailInput");
    const enviarBtn = document.getElementById("enviarBtn");
    const statusDiv = document.getElementById("status");

    let partidosRecords = []; // Variable para guardar los registros de Airtable

    // Cargar partidos desde la Serverless Function
    async function fetchPartidos() {
        try {
            const res = await fetch("/api/partidos");
            if (!res.ok) throw new Error("No se pudo cargar los partidos");
            const records = await res.json();
            
            // Almacenar los registros en la variable
            partidosRecords = records;

            partidoSelect.innerHTML = "";
            records.forEach(r => {
                const option = document.createElement("option");
                option.value = r.id;
                option.textContent = `${r.fields["ID-partido"]} - ${r.fields.Piloto} (${r.fields["Fecha partido"]})`;
                partidoSelect.appendChild(option);
            });

            // Pre-seleccionar el primer partido y rellenar los campos
            if (partidosRecords.length > 0) {
                const primerRecord = partidosRecords[0];
                analistaInput.value = primerRecord.fields.Analista || "";
                mailInput.value = primerRecord.fields.Mail || "";
            }

        } catch (error) {
            console.error("Error al obtener partidos:", error);
            statusDiv.textContent = "Error al cargar los partidos.";
            statusDiv.style.color = "red";
        }
    }

    // Evento para precargar los campos al seleccionar un partido
    partidoSelect.addEventListener("change", () => {
        const selectedId = partidoSelect.value;
        const selectedRecord = partidosRecords.find(r => r.id === selectedId);

        if (selectedRecord) {
            // Rellenar los campos con los datos del registro seleccionado
            analistaInput.value = selectedRecord.fields.Analista || "";
            mailInput.value = selectedRecord.fields.Mail || "";
        }
    });

    // Enviar formulario
    enviarBtn.addEventListener("click", async () => {
        const partidoId = partidoSelect.value;
        const analista = analistaInput.value.trim();
        const mail = mailInput.value.trim();
        // Patrón para validar un formato de email simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const Numero_unico = uuidv4();

        if (!partidoId || !analista || !mail || !Numero_unico) {
            statusDiv.textContent = "Todos los campos son obligatorios.";
            statusDiv.style.color = "orange";
            return;
        }

        if (!emailRegex.test(mail)) {
        statusDiv.textContent = "Por favor, introduce un formato de correo electrónico válido.";
        statusDiv.style.color = "orange";
        return;
        }

        statusDiv.textContent = "Procesando...";
        statusDiv.style.color = "blue";

        try {
          const res = await fetch("/api/enviar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partidoId, analista, mail, Numero_unico  })
          });
        
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
            await fetchPartidos();
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


