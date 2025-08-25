import Airtable from "airtable";
import PDFDocument from "pdfkit";
import { google } from "googleapis";
import crypto from "crypto";
import stream from "stream";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { partidoId, analista, mail } = req.body;

    if (!partidoId || !analista || !mail) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Airtable
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = "Confirmaciones_de_Entrega";

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    const records = await base(TABLE_NAME).select({ filterByFormula: `RECORD_ID()='${partidoId}'` }).all();

    if (!records || records.length === 0) {
      return res.status(404).json({ error: "Partido no encontrado" });
    }

    const row = records[0].fields;

    // Generar PDF en memoria
    const doc = new PDFDocument();
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBytes = Buffer.concat(buffers);

      // Calcular hash SHA256
      const hash = crypto.createHash("sha256").update(pdfBytes).digest("hex");

      // Autenticación OAuth2 para Google Drive
      const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob"
      );

      oAuth2Client.setCredentials({
        token: process.env.GOOGLE_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        token_uri: process.env.GOOGLE_TOKEN_URI,
      });

      const drive = google.drive({ version: "v3", auth: oAuth2Client });

      const fileMetadata = {
        name: `reporte_${partidoId}.pdf`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };
      const media = {
        mimeType: "application/pdf",
        body: stream.Readable.from(pdfBytes),
      };

      const file = await drive.files.create({ requestBody: fileMetadata, media, fields: "id, webViewLink" });

      // Actualizar Airtable
      await base(TABLE_NAME).update(records[0].id, {
        Analista(Form): analista,
        Mail(Form): mail,
        PDF: [{ url: file.data.webContentLink }],
        Hash_PDF: hash,
      });

      return res.status(200).json({ success: true, url: file.data.webViewLink, hash });
    });

    // Contenido del PDF
    doc.fontSize(20).text("Confirmación de Entrega", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`ID Partido: ${row["ID-partido"]}`);
    doc.text(`Piloto: ${row["Piloto"]}`);
    doc.text(`Fecha: ${row["Fecha partido"]}`);
    doc.text(`Analista: ${analista}`);
    doc.text(`Mail: ${mail}`);
    doc.end();

  } catch (error) {
    console.error("Error en enviar.js:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
