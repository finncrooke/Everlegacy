import QRCode from "qrcode";

/** Generates a QR code as a data URL, styled to sit nicely on the cream/gold palette. */
export async function generateQrDataUrl(url: string) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 512,
    color: {
      dark: "#0f2b21", // deep green
      light: "#fbf8f1", // cream
    },
  });
}

export function tributeUrl(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/t/${slug}`;
}

/** Short, URL-safe, hard-to-guess slug for a tribute page. */
export function generateSlug() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars
  let slug = "";
  for (let i = 0; i < 8; i++) {
    slug += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return slug;
}
