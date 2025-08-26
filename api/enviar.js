import Airtable from "airtable";
import PDFDocument from "pdfkit";
import { google } from "googleapis";
import crypto from "crypto";
import stream from "stream";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { partidoId, analista, mail } = req.body;

    if (!partidoId || !analista || !mail) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // --- Conectar Airtable y obtener el registro ---
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = "Confirmaciones_de_Entrega";

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    // Usa find() que es más directo si ya tienes el ID del registro
    const record = await base(TABLE_NAME).find(partidoId);

    if (!record) {
      return res.status(404).json({ error: "Partido no encontrado" });
    }

    const row = record.fields;

    // --- Generar PDF en memoria de forma asíncrona ---
    const pdfBuffer = await new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const buffer = Buffer.concat(buffers);
        resolve(buffer);
      });

      // Agrega la imagen del logo
const logoPath = path.resolve("./assets/LogoFLY-FUT.png");
doc.image(logoPath, { width: 150, align: "center" });

doc.moveDown();
// Título principal en negrita y color personalizado
doc.fontSize(20).fillColor('#2c3e50').text("Confirmación de Entrega", { align: "center" });
doc.moveDown();

// Añadir un separador visual
doc.strokeColor('#bdc3c7'); // Color gris para la línea
doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown();

// Títulos de campo con color y tamaño de fuente diferentes
doc.fontSize(14).fillColor('#34495e').text(`ID-partido: ${row["ID-partido"]}`);
doc.text(`Analista: ${analista}`);
doc.text(`Piloto: ${row.Piloto}`);
doc.text(`Fecha Partido: ${row["Fecha partido"]}`);
doc.moveDown();

// Texto legal en un color más neutro
doc.fontSize(10).fillColor('#7f8c8d').text("La confirmación de su recepción constituyen una aceptación expresa de la entrega física del material identificado en este documento, así como la asunción de su custodia.", { align: "justify" });
doc.moveDown();
doc.text("Esta confirmación constituye una firma electrónica simple y queda asociada a la identidad del receptor, la fecha y hora de confirmación y la descripción del material entregado.");
doc.moveDown();
doc.text("El registro se conserva para fines de auditoría y resolución de disputas.");

doc.end();

    // --- Autenticación y subida a Google Drive ---
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob"
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const drive = google.drive({ version: "v3", auth: oAuth2Client });

    const fileMetadata = {
      name: `reporte_${partidoId}.pdf`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: "application/pdf",
      body: stream.Readable.from(pdfBuffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink, webContentLink",
    });

    // Hacer el archivo público
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: "reader", type: "anyone" },
    });

    // --- Actualizar el registro de Airtable ---
    const hash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

    await base(TABLE_NAME).update(record.id, {
      "Analista(Form)": analista,
      "Mail(Form)": mail,
      "PDF": [{ url: file.data.webContentLink }],
      "Hash_PDF": hash,
    });

    // --- Enviar la respuesta final ---
    res.status(200).json({ success: true, url: file.data.webViewLink, hash });

  } catch (error) {
    console.error("Error en el proceso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
