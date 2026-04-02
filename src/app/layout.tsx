import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memory — remember someone you love",
  description:
    "A quiet space to create a gentle reflection of someone you miss — voice, story, and chat on Cloudflare.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${lora.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full font-sans text-stone-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
