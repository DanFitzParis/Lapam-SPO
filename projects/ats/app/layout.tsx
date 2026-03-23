import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lapam ATS",
  description: "Applicant tracking system for hospitality groups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
