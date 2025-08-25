import Airtable from "airtable";

export default async function handler(req, res) {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!apiKey || !baseId) {
      return res.status(500).json({ error: "Variables de entorno no definidas" });
    }

    const base = new Airtable({ apiKey }).base(baseId);
    const records = await base("Confirmaciones_de_Entrega").select({ view: "Grid view" }).all();

    const partidos = records.map(r => ({
      id: r.id,
      piloto: r.fields.Piloto,
      fecha: r.fields["Fecha partido"],
      analista: r.fields.Analista || "",
      mail: r.fields.Mail || ""
    }));

    res.status(200).json(partidos);
  } catch (error) {
    console.error("Error al obtener partidos:", error);
    res.status(500).json({ error: "Error al obtener datos de Airtable" });
  }
}
