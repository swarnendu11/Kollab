import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kollab | Meet. Collaborate. Get things done.",
  description:
    "AI-first unified communication and collaboration platform. Video meetings, team chat, calendar, documents, whiteboards, recordings, and intelligent assistant.",
  openGraph: {
    title: "Kollab | Meet. Collaborate. Get things done.",
    description:
      "AI-first unified communication and collaboration platform. Video meetings, team chat, calendar, documents, whiteboards, recordings, and intelligent assistant.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060814] text-slate-100 font-sans antialiased">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}