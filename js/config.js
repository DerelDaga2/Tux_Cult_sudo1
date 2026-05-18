

const Config = {
    MSAL: {
        CLIENT_ID: "831e8f41-1d3a-4048-bf74-b6f4ff7d08b3",
        AUTHORITY: "https://login.microsoftonline.com/consumers",
        REDIRECT_URI: window.location.origin,
        SCOPES: [
            "openid",
            "profile",
            "offline_access",
            "User.Read",
            "Mail.Read",
            "Mail.ReadWrite"
        ]
    }
};