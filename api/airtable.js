import Airtable from "airtable";

export default async function handler(req, res) {
  try {
    // Variables de entorno configuradas en Vercel
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = "Confirmaciones_de_Entrega"; // Cambia si tu tabla se llama distinto

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: "Faltan variables de entorno de Airtable" });
    }

    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

    const records = await base(AIRTABLE_TABLE_NAME).select({
      view: "Grid view"
    }).all();

    // Devolver los registros como JSON
    res.status(200).json(records);

  } catch (error) {
    console.error("Error al obtener registros de Airtable:", error);
    res.status(500).json({ error: "No se pudieron obtener los registros" });
  }
}
