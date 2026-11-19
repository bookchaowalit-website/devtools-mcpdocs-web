import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// The font variables sit on <html>: the App shell tokens live on :root and read them from there.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const description = "A small register for MCP tools and schemas, kept in your browser: name, details and lifecycle.";

export const metadata: Metadata = {
  title: "MCP Docs | Bookchaowalit",
  description,
  keywords: ["MCP", "Model Context Protocol", "tool schemas"],
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  creator: "Bookchaowalit",
  metadataBase: new URL("https://mcpdocs.bookchaowalit.com"),
  alternates: { canonical: "/" },
  openGraph: { type: "website", title: "MCP Docs | Bookchaowalit", description, siteName: "Bookchaowalit" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geistSans.variable + " " + geistMono.variable}>
      <body>{children}</body>
    </html>
  );
}
