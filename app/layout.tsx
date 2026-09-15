import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JOURDAIN EMPLOI",
  description: "Portail de publication et de consultation d'offres d'emploi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
