import Airtable from "airtable";
import { google } from "googleapis";
import PDFDocument from "pdfkit";
import stream from "stream";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { partidoId, analista, mail } = req.body;

    if (!partidoId || !analista || !mail) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // --- Conectar Airtable ---
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const record = await base("Confirmaciones_de_Entrega").find(partidoId);

    if (!record) return res.status(404).json({ error: "Partido no encontrado" });

    const piloto = record.fields.Piloto;
    const fecha = record.fields["Fecha partido"];

    // --- Generar PDF en memoria ---
    const doc = new PDFDocument();
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {});

    doc.fontSize(18).text("Confirmación de Entrega", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`ID-Partido: ${partidoId}`);
    doc.text(`Analista: ${analista}`);
    doc.text(`Mail: ${mail}`);
    doc.text(`Piloto: ${piloto}`);
    doc.text(`Fecha Partido: ${fecha}`);
    doc.moveDown();

    // Logo opcional
    // doc.image("static/LogoFLY-FUT.png", { width: 150, align: "center" });

    doc.end();

    const pdfBuffer = Buffer.concat(buffers);

    // --- Autenticar Google Drive ---
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob"
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const drive = google.drive({ version: "v3", auth });

    // --- Subir PDF a Drive ---
    const fileMetadata = {
      name: `reporte_${partidoId}.pdf`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: "application/pdf",
      body: stream.Readable.from(pdfBuffer)
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink"
    });

    // Hacer el archivo público
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: "reader", type: "anyone" }
    });

    res.status(200).json({ url: file.data.webViewLink });
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ error: "Error interno" });
  }
}
