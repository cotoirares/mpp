"use client";

import { useState } from "react";
import { PlayerProvider } from "~/context/PlayerContext";
import PlayerList from "~/components/PlayerList";
import PlayerForm from "~/components/PlayerForm";
import RealTimeCharts from "~/components/RealTimeCharts";

export default function Home() {
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [showRealTimeStats, setShowRealTimeStats] = useState(true);

  return (
    <PlayerProvider>
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Tennis Players Management</h1>
        
        {/* Toggle for real-time stats */}
        <div className="mb-4 flex items-center">
          <label className="mr-2 flex items-center">
            <input
              type="checkbox"
              checked={showRealTimeStats}
              onChange={() => setShowRealTimeStats(!showRealTimeStats)}
              className="mr-2 h-4 w-4"
            />
            <span>Show Real-Time Statistics</span>
          </label>
        </div>
        
        {/* Real-time charts */}
        {showRealTimeStats && <RealTimeCharts />}
        
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsAddingPlayer(true)}
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Add New Player
          </button>
        </div>

        {isAddingPlayer && (
          <div className="mb-8">
            <PlayerForm onClose={() => setIsAddingPlayer(false)} />
          </div>
        )}

        <PlayerList />
      </main>
    </PlayerProvider>
  );
}
