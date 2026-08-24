import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCP Docs | Bookchaowalit",
  description: "Document MCP tools and schemas.",
  keywords: ["mcpdocs", "portfolio"],
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  creator: "Bookchaowalit",
  metadataBase: new URL("https://bookchaowalit.com"),
  openGraph: {
    type: "website",
    title: "MCP Docs | Bookchaowalit",
    description: "Document MCP tools and schemas.",
    siteName: "Bookchaowalit",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* THESIS: make an MCP contract readable before it becomes a request.
OWN-WORLD: a dark protocol field log with acid lifecycle marks, rust annotations, and ruled records.
STORY: search the register, describe one tool, assign its lifecycle, then delete or refine the local record.
FIRST VIEWPORT: the contract promise, search/filter controls, new-record form, and first register row appear in one flow.
FORM: field-log sheets, lifecycle marks, monospaced names, and a single registration action define the system.
SEED: 4842828d · assigned direction 7 · operate mode.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance */}
        {children}
      </body>
    </html>
  );
}
