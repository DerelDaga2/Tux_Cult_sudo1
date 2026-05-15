import {
  isConnected
}
from "../backend/auth.js";

export default function handler(
  req,
  res
) {

  return res.status(200).json({

    connected:
      isConnected()
  });
}