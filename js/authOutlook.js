/**
 * SIGOD - MSAL.js Auth Module
 * Maneja la autenticación de Microsoft en el cliente
 */
const AuthOutlook = (() => {
    let msalInstance;
    let accessToken = null;
    let account = null;

    const msalConfig = {
        auth: {
            clientId: Config.MSAL.CLIENT_ID,
            authority: Config.MSAL.AUTHORITY,
            redirectUri: Config.MSAL.REDIRECT_URI
        },
        cache: {
            cacheLocation: "sessionStorage", 
            storeAuthStateInCookie: false,
        }
    };

    const loginRequest = {
        scopes: Config.MSAL.SCOPES
    };

    /**
     * Inicializa la instancia de MSAL
     */
    async function init() {
        if (!window.msal) {
            console.error("MSAL.js no está cargado.");
            return false;
        }

        msalInstance = new window.msal.PublicClientApplication(msalConfig);
        await msalInstance.initialize();

        // Verificar si ya hay una cuenta en caché
        const currentAccounts = msalInstance.getAllAccounts();
        if (currentAccounts.length > 0) {
            account = currentAccounts[0];
            await acquireTokenSilent();
            return true;
        }
        return false;
    }

    /**
     * Inicia el flujo de Popup de Microsoft
     */
    async function login() {
        try {
            const loginResponse = await msalInstance.loginPopup(loginRequest);
            if (loginResponse !== null) {
                account = loginResponse.account;
                accessToken = loginResponse.accessToken;
                console.log("Login exitoso con Microsoft");
                return true;
            }
        } catch (error) {
            console.error("Error en loginPopup: ", error);
            return false;
        }
    }

    /**
     * Obtiene el token silenciosamente
     */
    async function acquireTokenSilent() {
        if (!account) return null;
        
        const request = {
            scopes: Config.MSAL.SCOPES,
            account: account
        };

        try {
            const response = await msalInstance.acquireTokenSilent(request);
            accessToken = response.accessToken;
            return accessToken;
        } catch (error) {
            console.warn("Fallo token silencioso, intentando popup...", error);
            if (error instanceof window.msal.InteractionRequiredAuthError) {
                try {
                    const popupResponse = await msalInstance.acquireTokenPopup(request);
                    accessToken = popupResponse.accessToken;
                    return accessToken;
                } catch (popupError) {
                    console.error("Error obteniendo token (popup): ", popupError);
                }
            }
        }
        return null;
    }

    function logout() {
        if (account) {
            msalInstance.logoutPopup({
                account: account
            });
            accessToken = null;
            account = null;
        }
    }

    function getToken() {
        return accessToken;
    }

    function isConnected() {
        return accessToken !== null;
    }

    return {
        init,
        login,
        logout,
        getToken,
        isConnected,
        acquireTokenSilent
    };
})();
