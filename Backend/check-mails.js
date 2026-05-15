import "dotenv/config";
import "isomorphic-fetch";

import fs from "fs";

import { Client }
from "@microsoft/microsoft-graph-client";

import { getToken }
from "./tokenManager.js";

import { classifyTicket }
from "./ticketClassifier.js";

import { uploadTicket }
from "./supabaseClient.js";

/* =========================
   TOKEN
========================= */

const ACCESS_TOKEN =
  getToken();

if (!ACCESS_TOKEN) {

  throw new Error(
    "No existe accessToken."
  );
}

/* =========================
   GRAPH CLIENT
========================= */

const graphClient =
  Client.init({

    authProvider: (done) => {

      done(
        null,
        ACCESS_TOKEN
      );
    }
  });

/* =========================
   REGEX IDS
========================= */

const ticketRegex =
  /SIR\d{7}|CSIR\d{7}/i;

/* =========================
   IDS PROCESADOS
========================= */

const processedTickets =
  new Set();

/* =========================
   EXTRAER ID TICKET
========================= */

function extractTicketId(
  text = ""
) {

  const match =
    text.match(
      /SIR\d{7}|CSIR\d{7}/i
    );

  if (!match) {
    return null;
  }

  return match[0]
    .toUpperCase();
}

/* =========================
   DETECTAR TICKETS
========================= */

function isTicket(
  mail = {}
) {

  const subject =
    (mail.subject || "")
      .toLowerCase();

  const body =
    (mail.bodyPreview || "")
      .toLowerCase();

  const text =
    `${subject} ${body}`;

  /* =========================
     VALIDAR IDS
  ========================= */

  const hasTicketId =
    ticketRegex.test(text);

  if (hasTicketId) {
    return true;
  }

  /* =========================
     PATRONES REALES
  ========================= */

  const patterns = [

    "id ticket",

    "id ticket sir",

    "id ticket csm",

    "mitre attack",

    "mitre att&ck",

    "waf -",

    "siem",

    "soc",

    "ciberseguridad",

    "splunk",

    "incidente",

    "active scanning",

    "sql injection",

    "xss attack",

    "xpath injection",

    "reconnaissance",

    "t1595",

    "ta0043",

    "security incident",

    "detección",

    "deteccion"
  ];

  const matches =
    patterns.filter(
      k => text.includes(k)
    );

  return matches.length >= 2;
}

/* =========================
   MAIN
========================= */

async function main() {

  try {

    console.log(
      "LEYENDO CORREOS...\n"
    );

    /* =========================
       VALIDAR TOKEN
    ========================= */

    const me =
      await graphClient
        .api("/me")
        .get();

    console.log(
      "USUARIO:",
      me.userPrincipalName
    );

    console.log("");

    /* =========================
       OBTENER CORREOS
    ========================= */

    const mails =
      await graphClient

        .api("/me/messages")

        .top(20)

        .select(
          "id,subject,bodyPreview,receivedDateTime"
        )

        .orderby(
          "receivedDateTime DESC"
        )

        .get();

    if (
      !mails.value?.length
    ) {

      console.log(
        "NO HAY CORREOS"
      );

      return;
    }

    /* =========================
       RECORRER CORREOS
    ========================= */

    for (
      const mail of mails.value
    ) {

      const subject =
        mail.subject || "";

      console.log(
        "REVISANDO:",
        subject
      );

      const fullText =
        `${mail.subject || ""} ${mail.bodyPreview || ""}`;

      /* =========================
         EXTRAER TICKET
      ========================= */

      const ticketId =
        extractTicketId(
          fullText
        );

      /* =========================
         DUPLICADOS
      ========================= */

      if (ticketId) {

        if (
          processedTickets.has(
            ticketId
          )
        ) {

          console.log(
            "TICKET DUPLICADO OMITIDO:",
            ticketId
          );

          console.log("");

          continue;
        }

        processedTickets.add(
          ticketId
        );
      }

      /* =========================
         VALIDAR TICKET
      ========================= */

      if (
        !isTicket(mail)
      ) {

        console.log(
          "IGNORADO\n"
        );

        continue;
      }

      /* =========================
         CLASIFICAR
      ========================= */

      const severity =
        classifyTicket(
          fullText
        );

      console.log(
        "TICKET DETECTADO"
      );

      console.log(
        "SEVERIDAD:",
        severity
      );

      if (ticketId) {

        console.log(
          "ID:",
          ticketId
        );
      }

      console.log(
        "ASUNTO:",
        subject
      );

      /* =========================
         DESCARGAR EML REAL
      ========================= */

      const fileData =
        await graphClient

          .api(
            `/me/messages/${mail.id}/$value`
          )

          .responseType(
            "arraybuffer"
          )

          .get();

      const buffer =
        Buffer.from(
          fileData
        );

      /* =========================
         NOMBRE ARCHIVO
      ========================= */

      const safeName =
        subject

          .replace(
            /[^a-z0-9]/gi,
            "_"
          )

          .substring(
            0,
            80
          );

      const fileName =
        ticketId

          ? `${ticketId}_${safeName}.eml`

          : `${safeName}_${mail.id}.eml`;

      /* =========================
         GUARDAR LOCAL
      ========================= */

      fs.writeFileSync(
        fileName,
        buffer
      );

      console.log(
        "EML DESCARGADO:",
        fileName
      );

      /* =========================
         SUBIR SUPABASE
      ========================= */

      const publicUrl =
        await uploadTicket(
          fileName,
          buffer
        );

      console.log(
        "SUBIDO A SUPABASE:"
      );

      console.log(
        publicUrl
      );

      /* =========================
         ELIMINAR LOCAL
      ========================= */

      fs.unlinkSync(
        fileName
      );

      console.log(
        "ARCHIVO LOCAL ELIMINADO\n"
      );
    }

    console.log(
      "PROCESO FINALIZADO"
    );

  } catch (error) {

    console.error(
      "\nERROR EN CHECK-MAILS:\n"
    );

    console.error(
      error
    );

    console.log(
      "\nTOKEN INVALIDO O EXPIRADO"
    );

    console.log(
      "EJECUTA:"
    );

    console.log(
      "node auth.js"
    );
  }
}

main();