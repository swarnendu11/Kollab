import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kollab | Meet. Collaborate. Get things done.",
  description:
    "AI-first unified communication and collaboration platform. Video meetings, team chat, calendar, documents, whiteboards, recordings, and intelligent assistant.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

import { FirebaseAuthProvider } from "@/context/firebase-auth-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
        <FirebaseAuthProvider>
          {children}
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
