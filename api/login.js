export default async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { password } = req.body;
    const correctPassword = process.env.SITE_PASSWORD;

    // Compara la contraseña enviada con la variable de entorno
    if (password === correctPassword) {
      // Éxito: La contraseña es correcta
      return res.status(200).json({ success: true });
    } else {
      // Fallo: La contraseña es incorrecta
      return res.status(200).json({ success: false });
    }
  } catch (error) {
    // Manejo de cualquier otro error
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
