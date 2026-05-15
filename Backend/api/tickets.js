import fs from "fs";
import { getToken } from "../tokenManager.js";
import { Client } from "@microsoft/microsoft-graph-client";

const ACCESS_TOKEN = getToken();

const graphClient = Client.init({
  authProvider: (done) => done(null, ACCESS_TOKEN)
});

export default async function handler(req, res) {
  try {
    const mails = await graphClient
      .api("/me/messages")
      .top(10)
      .select("id,subject,bodyPreview")
      .get();

    const keywords = ["ticket", "incidente", "soc", "alerta", "siem", "waf"];

    const tickets = mails.value
      .filter(m =>
        keywords.some(k =>
          `${m.subject} ${m.bodyPreview}`.toLowerCase().includes(k)
        )
      )
      .map(m => ({
        id: m.id,
        subject: m.subject,
        preview: m.bodyPreview
      }));

    res.status(200).json(tickets);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}