import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Seat Reservation Assessment",
  description: "Small seat reservation platform assessment"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
