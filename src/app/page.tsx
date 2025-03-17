"use client";

import { useState } from "react";
import { PlayerProvider } from "~/context/PlayerContext";
import PlayerList from "~/components/PlayerList";
import PlayerForm from "~/components/PlayerForm";

export default function Home() {
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  return (
    <PlayerProvider>
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-4xl font-bold">Tennis Players Management</h1>
        
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
