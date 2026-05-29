import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./sidebar";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300","400","500","600","700","800","900"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400","500","600","700"] });

export const metadata: Metadata = { title: "Content OS", description: "Content OS — capture, draft, score, publish, learn" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full flex">
        <Sidebar />
        <main className="flex-1 p-10 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
