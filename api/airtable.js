import Airtable from "airtable";

export default async function handler(req, res) {
  try {
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const records = await base("Confirmaciones_de_Entrega").select({ view: "Grid view" }).all();

    const partidos = records.map(r => ({
      id: r.id,
      piloto: r.fields.Piloto,
      fecha: r.fields["Fecha partido"]
    }));

    res.status(200).json(partidos);

  } catch (error) {
    console.error("Error en la función:", error);
    res.status(500).json({ error: "Error al obtener datos de Airtable" });
  }
}
