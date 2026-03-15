import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Atelier",
  description: "ERP Atelier de couture - Smart IT Solutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-neutral-950 text-white">{children}</body>
    </html>
  );
}
