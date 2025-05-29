"use client";

import { useState, useEffect } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import PlayerList from "@/components/PlayerList";
import PlayerForm from "@/components/PlayerForm";
import RealTimeCharts from "@/components/RealTimeCharts";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isLoading && !user) {
        console.log("User not authenticated, redirecting to login");
        window.location.href = "/login";
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, isLoading]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="mb-4 text-xl font-semibold">Checking authentication...</div>
        <div className="text-sm text-gray-500">Redirecting to login if not authenticated</div>
      </div>
    );
  }

  return (
    <PlayerProvider>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tennis Player Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {isFormVisible ? (
              <PlayerForm onClose={() => setIsFormVisible(false)} />
            ) : (
              <button
                onClick={() => setIsFormVisible(true)}
                className="mb-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
              >
                Add New Player
              </button>
            )}
            <PlayerList />
          </div>
          <div>
            <RealTimeCharts />
          </div>
        </div>
      </main>
    </PlayerProvider>
  );
}

