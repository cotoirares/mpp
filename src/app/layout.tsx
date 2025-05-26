"use client";

import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "../context/SessionContext";
import Navbar from "../components/Navbar";
import { usePathname } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useEffect, useState } from "react";
import Head from "next/head";

// Unprotected routes - no auth needed
const publicRoutes = ['/login', '/register'];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
  
  useEffect(() => {
    // If on public route, or logged in, allow access
    if (isPublicRoute || (!isLoading && user)) {
      setAuthorized(true);
    } else if (!isLoading && !user) {
      // If not on public route and not logged in, redirect to login
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
      <Head>
        <title>tennis player management</title>
        <meta name="description" content="management of tennis players" />
      </Head>
      <body className="bg-gray-50 min-h-screen font-sans">
        <SessionProvider>
          <LayoutContent>{children}</LayoutContent>
        </SessionProvider>
      </body>
    </html>
  );
}
