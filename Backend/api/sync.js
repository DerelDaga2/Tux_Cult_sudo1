import "dotenv/config";

import fs from "fs";

import { Client } from "@microsoft/microsoft-graph-client";

import { createClient } from "@supabase/supabase-js";

import "isomorphic-fetch";

/* =========================
   VALIDAR TOKEN
========================= */

if (!fs.existsSync("token.json")) {

    throw new Error(
        "No existe token.json"
    );
}

const tokenData =
    JSON.parse(

        fs.readFileSync(
            "token.json",
            "utf-8"
        )
    );

if (!tokenData.accessToken) {

    throw new Error(
        "No existe accessToken"
    );
}

/* =========================
   SUPABASE
========================= */

const supabase =
    createClient(

        process.env.SUPABASE_URL,

        process.env.SUPABASE_SERVICE_ROLE
    );

/* =========================
   MICROSOFT GRAPH
========================= */

const graphClient =
    Client.init({

        authProvider: (done) => {

            done(
                null,
                tokenData.accessToken
            );
        }
    });

/* =========================
   HANDLER
========================= */

export default async function handler(
    req,
    res
) {

    try {

        console.log(
            "INICIANDO SYNC..."
        );

        /* =========================
           OBTENER EMAILS
        ========================= */

        const emails =
            await graphClient

                .api("/me/messages")

                .top(10)

                .select(

                    "id,subject,receivedDateTime,hasAttachments"
                )

                .orderby(
                    "receivedDateTime DESC"
                )

                .get();

        if (!emails.value.length) {

            return res.status(200).json({

                message:
                    "No hay correos nuevos"
            });
        }

        let uploaded =
            0;

        /* =========================
           RECORRER EMAILS
        ========================= */

        for (const mail of emails.value) {

            try {

                console.log(
                    "EMAIL:",
                    mail.subject
                );

                /* =========================
                   VALIDAR DUPLICADO
                ========================= */

                const {

                    data: existing

                } = await supabase

                    .from(
                        "tickets_emails"
                    )

                    .select("id")

                    .eq(
                        "outlook_id",
                        mail.id
                    )

                    .single();

                if (existing) {

                    console.log(
                        "YA EXISTE"
                    );

                    continue;
                }

                /* =========================
                   OBTENER MIME EMAIL
                ========================= */

                const mime =
                    await graphClient

                        .api(

                            `/me/messages/${mail.id}/$value`
                        )

                        .get();

                /* =========================
                   CREAR BUFFER
                ========================= */

                const buffer =
                    Buffer.from(mime);

                /* =========================
                   NOMBRE ARCHIVO
                ========================= */

                const safeSubject =
                    (mail.subject || "correo")

                        .replace(
                            /[^a-z0-9]/gi,
                            "_"
                        )

                        .substring(0, 50);

                const fileName =

                    `${Date.now()}_${safeSubject}.msg`;

                /* =========================
                   SUBIR A STORAGE
                ========================= */

                const {

                    error: uploadError

                } = await supabase

                    .storage

                    .from(
                        "tickets-msg"
                    )

                    .upload(

                        fileName,

                        buffer,

                        {

                            contentType:
                                "application/vnd.ms-outlook",

                            upsert:
                                false
                        }
                    );

                if (uploadError) {

                    console.error(
                        uploadError
                    );

                    continue;
                }

                /* =========================
                   GUARDAR DB
                ========================= */

                await supabase

                    .from(
                        "tickets_emails"
                    )

                    .insert({

                        outlook_id:
                            mail.id,

                        filename:
                            fileName
                    });

                uploaded++;

                console.log(
                    "SUBIDO:",
                    fileName
                );

            } catch (mailError) {

                console.error(
                    "ERROR EMAIL:",
                    mailError
                );
            }
        }

        /* =========================
           RESPUESTA
        ========================= */

        return res.status(200).json({

            message:
                `${uploaded} correos sincronizados`
        });

    } catch (error) {

        console.error(
            "ERROR SYNC:"
        );

        console.error(error);

        return res.status(500).json({

            error:
                error.message
        });
    }
}