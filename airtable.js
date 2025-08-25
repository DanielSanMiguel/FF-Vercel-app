import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { partidoId, analista, mail, pdfUrl, pdfHash } = req.body;

    const records = await base("Confirmaciones_de_Entrega").select({ filterByFormula: `{ID-partido}="${partidoId}"` }).firstPage();
    if (records.length > 0) {
      await base("Confirmaciones_de_Entrega").update([
        { id: records[0].id, fields: { "Analista(Form)": analista, "Mail(Form)": mail, "PDF": [{ url: pdfUrl }], "Hash_PDF": pdfHash } }
      ]);
    }
    res.json({ success: true });
  }
}
