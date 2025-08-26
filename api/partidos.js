import Airtable from "airtable";

// Configuración de Airtable desde variables de entorno
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE = "Confirmaciones_de_Entrega";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
    const records = [];

    await new Promise((resolve, reject) => {
      base(AIRTABLE_TABLE)
        .select({ view: "Grid view" })
        .eachPage(
          (pageRecords, fetchNextPage) => {
            records.push(...pageRecords);
            fetchNextPage();
          },
          (err) => {
            if (err) {
              console.error(err);
              reject(err);
              return;
            }
            resolve();
          }
        );
    });

    res.status(200).json(records);
  } catch (error) {
    console.error("Error al obtener partidos de Airtable:", error);
    res.status(500).json({ error: "No se pudieron obtener los partidos" });
  }
}
