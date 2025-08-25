const partidoSelect = document.getElementById("partidoSelect");
const analistaInput = document.getElementById("analistaInput");
const mailInput = document.getElementById("mailInput");
const submitBtn = document.getElementById("submitBtn");
const statusText = document.getElementById("statusText");

// Mock: lista de partidos
const partidos = [
  { id: "1", piloto: "Juan", fecha: "2025-08-25" },
  { id: "2", piloto: "Ana", fecha: "2025-08-26" }
];

partidos.forEach(p => {
  const option = document.createElement("option");
  option.value = p.id;
  option.textContent = p.id;
  partidoSelect.appendChild(option);
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Función para generar PDF en navegador (PDF-lib, jsPDF u otra librería)
async function generarPDF(analista, partido) {
  // Aquí generas tu PDF y devuelves ArrayBuffer
  // Por ejemplo con jsPDF:
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text(`Analista: ${analista}`, 10, 10);
  doc.text(`Piloto: ${partido.piloto}`, 10, 20);
  doc.text(`Fecha: ${partido.fecha}`, 10, 30);
  const pdfBytes = await doc.arrayBuffer();
  return pdfBytes;
}

// Calcular hash SHA256
async function calcularHash(buffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

submitBtn.addEventListener("click", async () => {
  const selectedId = partidoSelect.value;
  const analista = analistaInput.value.trim();
  const mail = mailInput.value.trim();
  const partido = partidos.find(p => p.id === selectedId);

  if (!analista || !mail) { statusText.textContent = "Completa los campos"; return; }
  if (!isValidEmail(mail)) { statusText.textContent = "Correo inválido"; return; }

  statusText.textContent = "Procesando...";

  try {
    const pdfBytes = await generarPDF(analista, partido);
    const hashSHA256 = await calcularHash(pdfBytes);
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    // Subida a Drive
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: `reporte_${selectedId}.pdf`, pdfBase64 })
    });
    const uploadData = await uploadRes.json();

    // Guardar en Airtable
    await fetch("/api/airtable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partidoId: selectedId, analista, mail, pdfUrl: uploadData.url, pdfHash: hashSHA256 })
    });

    statusText.innerHTML = `Confirmación enviada!<br>Hash: <code>${hashSHA256}</code>`;
  } catch (err) {
    console.error(err);
    statusText.textContent = "Error al procesar la confirmación";
  }
});
