import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "NYC Subway Accessibility Explorer",
  description: "Map-based data explorer for NYC Subway accessibility data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div />}>{children}</Suspense>
      </body>
    </html>
  );
}
