import "dotenv/config";
import fs from "fs";

import { PublicClientApplication } from "@azure/msal-node";

/* =========================
   VALIDAR VARIABLES
========================= */

if (!process.env.CLIENT_ID) {
  throw new Error(
    "Falta CLIENT_ID en .env"
  );
}

/* =========================
   CONFIG MSAL
========================= */

const msalConfig = {
  auth: {

    clientId:
      process.env.CLIENT_ID,

    /* =========================
       CUENTAS PERSONALES
    ========================= */

    authority:
      "https://login.microsoftonline.com/consumers"
  }
};

const pca =
  new PublicClientApplication(
    msalConfig
  );

/* =========================
   LOGIN
========================= */

async function main() {

  try {

    console.log(
      "LOGIN MICROSOFT\n"
    );

    const response =
      await pca.acquireTokenByDeviceCode({

        scopes: [

          "openid",

          "profile",

          "offline_access",

          "User.Read",

          "Mail.Read",

          "Mail.ReadWrite"
        ],

        deviceCodeCallback:
          (deviceCode) => {

          console.log(
            "ABRE ESTE LINK:"
          );

          console.log(
            deviceCode.verificationUri
          );

          console.log(
            "\nCODIGO:"
          );

          console.log(
            deviceCode.userCode
          );

          console.log(
            "\nESPERANDO AUTENTICACION...\n"
          );
        }
      });

    /* =========================
       VALIDAR TOKEN
    ========================= */

    if (!response?.accessToken) {

      throw new Error(
        "Microsoft no devolvió accessToken"
      );
    }

    /* =========================
       DEBUG TOKEN
    ========================= */

    console.log(
      "TOKEN RECIBIDO:"
    );

    console.log(
      response.accessToken.substring(0, 60)
    );

    /* =========================
       GUARDAR TOKEN
    ========================= */

    const tokenData = {

      accessToken:
        response.accessToken,

      account:
        response.account || null,

      expiresOn:
        response.expiresOn || null
    };

    fs.writeFileSync(
      "token.json",

      JSON.stringify(
        tokenData,
        null,
        2
      )
    );

    console.log(
      "\nTOKEN GUARDADO EN token.json"
    );

  } catch (error) {

    console.error(
      "\nERROR EN AUTH:\n"
    );

    console.error(error);
  }
}

main();