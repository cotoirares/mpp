"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import { type Player, initialPlayers } from "~/types/player";
import toast from "react-hot-toast";

export type PlayerContextType = {
  players: Player[];
  addPlayer: (player: Omit<Player, "id">) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
  sortPlayers: (key: keyof Player) => void;
  filterPlayers: (criteria: Partial<Player>) => void;
  resetFilters: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [originalPlayers, setOriginalPlayers] = useState<Player[]>(initialPlayers);

  const generateUniqueId = () => {
    const maxId = Math.max(...players.map(p => parseInt(p.id)), 0);
    return (maxId + 1).toString();
  };

  const addPlayer = (player: Omit<Player, "id">) => {
    const newPlayer = {
      ...player,
      id: generateUniqueId(),
    };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    setOriginalPlayers(updatedPlayers);
    toast.success(`Successfully added player ${player.name}`);
  };

  const updatePlayer = (updatedPlayer: Player) => {
    const updatedPlayers = players.map((player) =>
      player.id === updatedPlayer.id ? updatedPlayer : player
    );
    setPlayers(updatedPlayers);
    setOriginalPlayers(updatedPlayers);
    toast.success(`Successfully updated player ${updatedPlayer.name}`);
  };

  const deletePlayer = (id: string) => {
    const playerToDelete = players.find(p => p.id === id);
    if (!playerToDelete) return;
    
    const updatedPlayers = players.filter((player) => player.id !== id);
    setPlayers(updatedPlayers);
    setOriginalPlayers(updatedPlayers);
    toast.success(`Successfully deleted player ${playerToDelete.name}`);
  };

  const sortPlayers = (key: keyof Player) => {
    const sorted = [...players].sort((a, b) => {
      if (typeof a[key] === "string" && typeof b[key] === "string") {
        return (a[key] as string).localeCompare(b[key] as string);
      }
      return (a[key] as number) - (b[key] as number);
    });
    setPlayers(sorted);
  };

  const filterPlayers = (criteria: Partial<Player>) => {
    const filtered = originalPlayers.filter((player) => {
      return Object.entries(criteria).every(([key, value]) => {
        if (value === undefined || value === "") return true;
        if (typeof value === "string") {
          return player[key as keyof Player]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        }
        return player[key as keyof Player] === value;
      });
    });
    setPlayers(filtered);
  };

  const resetFilters = () => {
    setPlayers(originalPlayers);
  };

  return (
    <PlayerContext.Provider
      value={{
        players,
        addPlayer,
        updatePlayer,
        deletePlayer,
        sortPlayers,
        filterPlayers,
        resetFilters,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayerContext() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerProvider");
  }
  return context;
} 