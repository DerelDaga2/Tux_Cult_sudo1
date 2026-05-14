import "dotenv/config";

import { createClient }
from "@supabase/supabase-js";

/* =========================
   CLIENTE SUPABASE
========================= */

const supabase =
  createClient(

    process.env.SUPABASE_URL,

    process.env.SUPABASE_SERVICE_ROLE
  );

/* =========================
   SUBIR ARCHIVO
========================= */

export async function uploadTicket(
  fileName,
  buffer
) {

  const { error } =
    await supabase.storage

    .from("tickets")

    .upload(

      fileName,

      buffer,

      {
        upsert: true,

          contentType:

          
  "message/rfc822"
      }
    );

  if (error) {
    throw error;
  }

  const { data } =
    supabase.storage

    .from("tickets")

    .getPublicUrl(fileName);

  return data.publicUrl;
}