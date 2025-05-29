"use client";

import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "../context/SessionContext";
import Navbar from "../components/Navbar";
import { usePathname } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useEffect, useState } from "react";


const publicRoutes = ['/login', '/register'];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
  
  useEffect(() => {
    if (isPublicRoute || (!isLoading && user)) {
      setAuthorized(true);
    } else if (!isLoading && !user) {
      console.log('Auth guard: redirecting to login');
      window.location.href = '/login';
    }
  }, [isLoading, user, pathname, isPublicRoute]);
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!authorized && !isPublicRoute) {
    return <div className="flex justify-center items-center h-screen">Checking authentication...</div>;
  }
  
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Toaster position="top-right" />
        {children}
      </main>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Tennis Player Management</title>
        <meta name="description" content="Management of tennis players with 2FA security" />
      </head>
      <body className="bg-gray-50 min-h-screen font-sans">
        <SessionProvider>
          <LayoutContent>{children}</LayoutContent>
        </SessionProvider>
      </body>
    </html>
  );
}
