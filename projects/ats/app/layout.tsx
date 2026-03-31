import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
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
    <ClerkProvider>
      <html lang="en">
        <body className="bg-neutral-50">{children}</body>
      </html>
    </ClerkProvider>
  );
}
