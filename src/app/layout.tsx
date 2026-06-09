import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import ChatbotWidget from '@/components/ChatbotWidget';
export const metadata: Metadata = {
  title: "CareConnect Health - Digital Healthcare Platform",
  description: "Secure multi-user healthcare platform for patients, doctors, and administrators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>
        </Providers>
        <ChatbotWidget />
      </body>
    </html>
  );
}
