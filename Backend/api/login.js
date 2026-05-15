import {
  getAuthUrl
}
from "../backend/auth.js";

export default async function handler(
  req,
  res
) {

  try {

    const authUrl =
      await getAuthUrl();

    return res.status(200).json({

      authUrl
    });

  } catch (error) {

    return res.status(500).json({

      error:
        error.message
    });
  }
}