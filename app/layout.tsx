import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strategic Sourcing — Stamping Services",
  description:
    "AI-assisted supplier discovery prototype: define your stamped-part need and find the right suppliers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Tailoft design system, vendored from xometry/tailoft (standalone = components + utilities) */}
        <link rel="stylesheet" href="/tailoft/tailoft.standalone.css" />
        {/* Tailoft spacing/typography/color helpers (mar-*, pad-*, txt-*, …) ship separately. */}
        <link rel="stylesheet" href="/tailoft/utility-classes.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
