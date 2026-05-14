import fs from "fs";

export function getToken() {
  if (!fs.existsSync("token.json")) {
    throw new Error(
      "No existe token.json. Ejecuta node auth.js"
    );
  }

  const data = JSON.parse(
    fs.readFileSync("token.json", "utf8")
  );

  if (!data.accessToken) {
    throw new Error(
      "token.json no contiene accessToken"
    );
  }

  return data.accessToken;
}