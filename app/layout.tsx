import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./sidebar";
import { getUserLanguage } from "@/lib/get-user-language";
import { dirFor } from "@/lib/i18n-dashboard";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300","400","500","600","700","800","900"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400","500","600","700"] });

export const metadata: Metadata = { title: "Content OS", description: "Content OS — capture, draft, score, publish, learn" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = await getUserLanguage();
  const dir = dirFor(language);
  return (
    <html lang={language} dir={dir} className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full flex">
        <Sidebar language={language} />
        <main className="flex-1 p-10 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
