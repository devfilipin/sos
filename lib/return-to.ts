export function safeReturnTo(value: string | null, fallback = "/painel") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://resolveu.local");
    return url.origin === "https://resolveu.local" ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
