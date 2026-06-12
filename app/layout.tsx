import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"]
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "WEIRDO",
  description: "Modern premium guitar brand website."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} bg-canvas text-white antialiased`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(214,167,79,0.12),transparent_30%),linear-gradient(180deg,#050505_0%,#090909_55%,#040404_100%)]">
          {children}
        </div>
      </body>
    </html>
  );
}
