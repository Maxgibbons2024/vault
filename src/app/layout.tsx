import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VaultBets AI — Find Value Before The Market Does",
  description:
    "AI-powered sports betting intelligence. Educational analysis, statistical insights and value opportunities across football, tennis, UFC and horse racing.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
