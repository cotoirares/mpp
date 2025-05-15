import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Tennis Players Management",
  description: "A simple tennis players management system",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="font-sans bg-gray-50 min-h-screen">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
