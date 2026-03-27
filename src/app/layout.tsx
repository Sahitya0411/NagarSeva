import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NagarSeva — Smart City Complaint Portal",
  description:
    "NagarSeva (नगरसेवा) — आपकी आवाज़, आपका शहर. India's intelligent civic complaint management system. Register complaints, track resolution, and earn CityCoins.",
  keywords: "civic complaints, city complaints, government portal, India, smart city, nagarseva",
  authors: [{ name: "NagarSeva" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "NagarSeva — Smart City Complaint Portal",
    description: "आपकी आवाज़, आपका शहर — Your Voice, Your City",
    type: "website",
  },
};

// Moved from metadata to the dedicated viewport export (Next.js 14 requirement)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050d1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
