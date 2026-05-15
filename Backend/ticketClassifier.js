export function isTicket(text = "") {
  const keywords = [
    "ticket",
    "incidente",
    "soc",
    "siem",
    "waf",
    "mitre",
    "ciberseguridad",
    "sql injection",
    "xss",
    "active scanning",
    "reconnaissance",
    "splunk",
    "alerta",
    "maliciosa",
    "vpn",
    "alienvault",
    "greynoise",
    "cisco talos",
    "scilabs",
    "otx",
    "file injection",
    "xpath injection",
    "vulnerability scanning",
    "scan",
    "ataque",
    "threat",
    "ioc",
    "detección",
    "seguridad"
  ];

  text = text.toLowerCase();

  return keywords.some(keyword =>
    text.includes(keyword.toLowerCase())
  );
}

/* =========================
   CLASIFICAR SEVERIDAD
========================= */

export function classifyTicket(text = "") {
  text = text.toLowerCase();

  /* =========================
     HIGH
  ========================= */

  if (
    text.includes("critical") ||
    text.includes("critico") ||
    text.includes("crítico") ||
    text.includes("alto") ||
    text.includes("high") ||
    text.includes("ransomware") ||
    text.includes("credential dumping") ||
    text.includes("remote code execution") ||
    text.includes("sql injection") ||
    text.includes("active scanning")
  ) {
    return "HIGH";
  }

  /* =========================
     MEDIUM
  ========================= */

  if (
    text.includes("media") ||
    text.includes("medium") ||
    text.includes("waf") ||
    text.includes("xss") ||
    text.includes("mitre") ||
    text.includes("siem") ||
    text.includes("reconnaissance") ||
    text.includes("vpn")
  ) {
    return "MEDIUM";
  }

  /* =========================
     LOW
  ========================= */

  return "LOW";
}