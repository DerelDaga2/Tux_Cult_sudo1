/**
 * SIGOD - Configuración Global
 */
const Config = {
    // Microsoft Entra ID (Azure AD) - Para inicio de sesión
    MSAL: {
        CLIENT_ID: "831e8f41-1d3a-4048-bf74-b6f4ff7d08b3",
        // El Authority se forma usando tu TENANT_ID
        AUTHORITY: "https://login.live.com/oauth20_remoteconnect.srf",
        REDIRECT_URI: window.location.origin,
        SCOPES: ["openid", "profile", "offline_access", "User.Read", "Mail.Read", "Mail.ReadWrite"]
        // Nota: CLIENT_SECRET no se utiliza en el frontend por seguridad. 
        // MSAL.js utiliza PKCE para flujos de navegador.
    }
};
