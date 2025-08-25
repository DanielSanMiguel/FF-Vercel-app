import axios from "axios";

export default async function handler(req, res) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!apiKey || !baseId || !tableName) {
    return res.status(500).json({ error: "Variables de entorno no configuradas" });
  }

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    const partidos = response.data.records.map(record => ({
      id: record.id,
      piloto: record.fields.Piloto || "N/A",
      fecha: record.fields["Fecha partido"] || "N/A"
    }));

    res.status(200).json(partidos);
  } catch (error) {
    console.error("Error fetching Airtable:", error);
    res.status(500).json({ error: "Error al obtener datos de Airtable" });
  }
}
