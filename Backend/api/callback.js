import {
  getTokenFromCode
}
from "../backend/auth.js";

export default async function handler(
  req,
  res
) {

  try {

    const code =
      req.query.code;

    if (!code) {

      return res.status(400).send(
        "Falta code"
      );
    }

    await getTokenFromCode(
      code
    );

    return res.send(`

      <html>

      <body style="
        background:#0f172a;
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        height:100vh;
        font-family:Arial;
      ">

      <div>

      <h1>
      Microsoft conectado
      </h1>

      <p>
      Ya puedes cerrar esta ventana
      </p>

      </div>

      </body>

      </html>
    `);

  } catch (error) {

    console.error(error);

    return res.status(500).send(
      error.message
    );
  }
}