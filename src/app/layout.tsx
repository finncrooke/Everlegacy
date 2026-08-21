import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Everlegacy — a QR plaque for their headstone",
    template: "%s — Everlegacy",
  },
  description:
    "Order a QR code plaque for a headstone or memorial, and build a tribute page that keeps their story close for anyone who visits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
