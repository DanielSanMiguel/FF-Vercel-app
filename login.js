document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const appContainer = document.getElementById("app-container");
    const passwordInput = document.getElementById("passwordInput");
    const loginBtn = document.getElementById("loginBtn");
    const loginError = document.getElementById("login-error");

    loginForm.addEventListener("submit", async (event) => {
        // Prevenir el envío tradicional del formulario
        event.preventDefault(); 
        
        const password = passwordInput.value;
        loginError.textContent = ""; // Limpiar errores
        loginBtn.disabled = true; // Deshabilitar botón
        loginBtn.textContent = "Verificando...";

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (data.success) {
                // Ocultar login y mostrar la app
                loginForm.parentElement.classList.add("hidden");
                appContainer.classList.remove("hidden");
            } else {
                loginError.textContent = "Contraseña incorrecta. Inténtalo de nuevo.";
                loginError.classList.add("status-error");
                passwordInput.value = "";
            }
        } catch (error) {
            loginError.textContent = "Error al conectar con el servidor.";
            loginError.classList.add("status-error");
        } finally {
            // Volver a habilitar el botón
            loginBtn.disabled = false;
            loginBtn.textContent = "Entrar";
        }
    });
});
