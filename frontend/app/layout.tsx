import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinTrack | Portfolio & Transactions Tracker — Finnet Technologies",
  description: "Internal investment operations portfolio and holdings tracker by Finnet Technologies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%230B1F3A'/><path d='M8 22L14 15L18 18L24 10' stroke='%230D9488' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>"
        />
      </head>
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}