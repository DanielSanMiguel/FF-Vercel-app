import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { fileName, pdfBase64 } = req.body;
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDS_JSON),
      scopes: ["https://www.googleapis.com/auth/drive"]
    });
    const drive = google.drive({ version: "v3", auth });
    const buffer = Buffer.from(pdfBase64, "base64");

    const file = await drive.files.create({
      requestBody: { name: fileName, parents: [process.env.DRIVE_FOLDER_ID] },
      media: { mimeType: "application/pdf", body: buffer }
    });

    // Hacer público
    await drive.permissions.create({ fileId: file.data.id, requestBody: { role: "reader", type: "anyone" } });
    const url = `https://drive.google.com/uc?id=${file.data.id}&export=download`;
    res.json({ url });
  }
}
