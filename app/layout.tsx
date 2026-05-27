import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receipts — Verifiable AI for ARI",
  description:
    "Every answer cites its sources. Every action needs consent. Every interaction is a tamper-evident receipt.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
