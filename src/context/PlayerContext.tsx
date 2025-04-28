"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Player, type PlayerFilter } from "~/types/player";
import { api } from "~/services/api";
import toast from "react-hot-toast";

export type PlayerContextType = {
  players: Player[];
  addPlayer: (player: Omit<Player, "id">) => Promise<void>;
  updatePlayer: (player: Player) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  sortPlayers: (key: keyof Player) => Promise<void>;
  filterPlayers: (criteria: PlayerFilter) => Promise<void>;
  resetFilters: () => Promise<void>;
  loadMore: () => Promise<void>;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isInfiniteMode: boolean;
  toggleInfiniteMode: () => Promise<void>;
  currentSort: {
    key?: keyof Player;
    sortOrder?: 'asc' | 'desc';
  };
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<{
    key?: keyof Player;
    sortOrder?: 'asc' | 'desc';
  }>({});
  const [currentFilters, setCurrentFilters] = useState<PlayerFilter>({});
  const [cursor, setCursor] = useState<number>(0);
  const [hasMore, setHasMore] = useState(false);
  const [isInfiniteMode, setIsInfiniteMode] = useState(false);

  // Fetch initial data
  useEffect(() => {
    void fetchPlayers({ reset: true });
  }, [isInfiniteMode]);

  const fetchPlayers = async (params?: {
    sortBy?: keyof Player;
    sortOrder?: 'asc' | 'desc';
    filters?: PlayerFilter;
    reset?: boolean;
  }) => {
    try {
      setLoading(true);
      setError(null);

      if (params?.reset) {
        setCursor(0);
        setPlayers([]);
      }

      const response = await api.getPlayers({
        cursor: params?.reset ? 0 : cursor,
        limit: isInfiniteMode ? 20 : 20,
        sortBy: params?.sortBy ?? currentSort.key,
        sortOrder: params?.sortOrder ?? currentSort.sortOrder,
        filters: params?.filters ?? currentFilters,
        infinite: isInfiniteMode
      });

      if (params?.reset) {
        setPlayers(response.players);
      } else if (isInfiniteMode) {
        setPlayers(prev => [...prev, ...response.players]);
      } else {
        setPlayers(response.players);
      }

      setCursor(response.nextCursor ?? cursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
      toast.error('Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  const toggleInfiniteMode = async () => {
    setIsInfiniteMode(prev => !prev);
  };

  const loadMore = async () => {
    if (!hasMore || loading || !isInfiniteMode) return;
    await fetchPlayers();
  };

  const sortPlayers = async (key: keyof Player) => {
    if (isInfiniteMode) return; // Disable sorting in infinite mode
    const newOrder = currentSort.key === key && currentSort.sortOrder === 'asc' ? 'desc' : 'asc';
    setCurrentSort({ key, sortOrder: newOrder });
    await fetchPlayers({
      sortBy: key,
      sortOrder: newOrder,
      reset: true
    });
  };

  const filterPlayers = async (criteria: PlayerFilter) => {
    if (isInfiniteMode) return; // Disable filtering in infinite mode
    setCurrentFilters(criteria);
    await fetchPlayers({
      filters: criteria,
      reset: true
    });
  };

  const resetFilters = async () => {
    setCurrentFilters({});
    setCurrentSort({});
    await fetchPlayers({ reset: true });
  };

  const addPlayer = async (player: Omit<Player, "id">) => {
    if (isInfiniteMode) return; // Disable adding in infinite mode
    try {
      setLoading(true);
      setError(null);
      await api.createPlayer(player);
      await fetchPlayers({ reset: true });
      toast.success(`Successfully added player ${player.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
      toast.error('Failed to add player');
    } finally {
      setLoading(false);
    }
  };

  const updatePlayer = async (updatedPlayer: Player) => {
    if (isInfiniteMode) return; // Disable updating in infinite mode
    try {
      setLoading(true);
      setError(null);
      await api.updatePlayer(updatedPlayer.id, updatedPlayer);
      await fetchPlayers({ reset: true });
      toast.success(`Successfully updated player ${updatedPlayer.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update player');
      toast.error('Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  const deletePlayer = async (id: string) => {
    if (isInfiniteMode) return; // Disable deleting in infinite mode
    try {
      setLoading(true);
      setError(null);
      await api.deletePlayer(id);
      await fetchPlayers({ reset: true });
      toast.success('Successfully deleted player');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete player');
      toast.error('Failed to delete player');
    } finally {
      setLoading(false);
    }
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
        loadMore,
        loading,
        error,
        hasMore,
        isInfiniteMode,
        toggleInfiniteMode,
        currentSort
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